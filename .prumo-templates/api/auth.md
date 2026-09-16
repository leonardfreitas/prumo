# Authentication

## Rule

Mount Better Auth on a Nest controller: a catch-all route `@All('*path')` under `auth`, declared
`version: VERSION_NEUTRAL`, passing the request and response to `toNodeHandler(auth)`. With the global `api`
prefix this resolves to `/api/auth/*`. Mark that controller `@Public()`. It is the one controller that takes
`@Req()` and `@Res()`.

Register the authentication guard globally. Every route is protected.

Declare a route that does not require a session with `@Public()`. There is no third state: the guard
always attempts to resolve the session, and `@Public()` means only *do not return 401*.

Read the session with a `@CurrentUser()` parameter decorator. Pass it to the service as an ordinary
argument. Do not inject a request-scoped session provider, do not take `@Req()`, and do not read the
session from ambient context inside a service.

Keep Better Auth's tables in their own Postgres schema, on their own connection, migrated by its own
CLI. Point that CLI at the **compiled** configuration, and run its migrations **before** ours.

Set `advanced.database.generateId` to `'uuid'`.

Better Auth's tables follow Better Auth's conventions, not `database/entities.md`. Reference `auth.user(id)`
from an application table with a real foreign key and `ON DELETE RESTRICT`.

Create what the application keeps about a user in `databaseHooks.user.create.after`. Pass that hook into the
factory that builds Better Auth, so the factory does not depend on Nest.

## Rationale

`VERSION_NEUTRAL` keeps the auth routes out of the version segment, because you version what you own
and the shape of these endpoints is Better Auth's contract, not this project's. Mounting inside Nest
rather than as middleware ahead of the router means the logging and the request id apply to the
authentication flow, the path where investigating matters most. **The exception filter does not:**
`toNodeHandler` writes Better Auth's own responses, so an authentication error arrives as
`{ message, code }`, not as problem+json. The client converts it; the server does not rewrite another
library's responses.

`toNodeHandler` rather than `auth.handler(req)`, because `handler` expects a Fetch API `Request` and Nest
hands the controller an Express one; `toNodeHandler` is Better Auth's own adapter between the two. Running it
after Nest's body parser was expected to break sign-up and does not: verified with a real sign-up through the
controller.

The CLI reads the compiled file because it loads TypeScript through its own transpiler, which cannot handle
the legacy property decorators the validated environment class uses. Migrations before ours, because an
application table references Better Auth's.

**Its ids are `text` by default**, which no application column typed `uuid` can reference. `generateId:
'uuid'` makes them `uuid` columns. What remains different is deliberate and not ours to fix: camelCase column
names, and `gen_random_uuid()` (version 4) rather than `uuidv7()`. Rewriting another library's schema is
a migration fighting its CLI on every upgrade.

The foreign key into `auth.user` exists because between the database guaranteeing and the application
remembering, this project chooses the database. **What it costs:** deleting a user fails while rows reference
it, so the application removes them first, deliberately.

The hook is Better Auth's extension point for work that must follow sign-up, and it is the only place where a
client never learns that identity and profile are two tables. **It is not atomic:** the user and the
application's row are written over two connections, so a failure between them leaves a user with no row. The
result is a visible 404, not corrupted data.

The guard is global because of the asymmetry between the two possible mistakes. A forgotten guard
leaves an endpoint open: nothing errors, nothing breaks, and the route test still passes, because
route tests rarely assert refusal. A forgotten `@Public()` returns 401 on the first call and is fixed
in seconds.

The session resolves even on public routes so that "works signed out, shows more signed in" needs no
third decorator. With no cookie there is no lookup, so an anonymous request to a public endpoint pays
nothing.

The session arrives as an argument so that a service's signature says what it needs. Ambient context
would hide the dependency and force every test to construct a context before it can run.

## Applies to

Every controller and every service. The guard, the Better Auth controller and its connection are
registered once at bootstrap.

## Examples

Declaring access:

```
✅  @Public() @Get('health') health() {}
❌  @Get('health') health() {}          // 401, because protected is the default
```

Mounting the handler:

```
✅  @Public() @All('*path') handle(@Req() req: Request, @Res() res: Response) {
      return toNodeHandler(this.auth)(req, res)
    }
❌  @All('*') handle(@Req() req: Request) { return this.auth.handler(req) }
```

Referencing a user from an application table:

```
✅  foreign key ("user_id") references "auth"."user" ("id") on delete restrict
❌  "user_id" uuid not null           // nothing stops an orphan
```

Receiving the session:

```
✅  findMine(@CurrentUser() user: SessionUser) { return this.orders.forUser(user.id) }
❌  findMine(@Req() req: Request)          { return this.orders.forUser(req.session.user.id) }
```

Inside a service:

```
✅  forUser(userId: string) {}
❌  forUser() { const userId = context.get('userId') }
```

## Enforcement

**Boot.** The guard is global, so a route cannot be unprotected by omission, only by an explicit
`@Public()`.

**The database.** A row referencing a user that does not exist is refused.

**The migration script.** One command runs Better Auth's migrations and then ours, so the order cannot be
forgotten.

**Review only.** That each `@Public()` is deliberate. It is the one decorator in the system whose
mistaken use is invisible at runtime: the route works, and it works for everyone.
