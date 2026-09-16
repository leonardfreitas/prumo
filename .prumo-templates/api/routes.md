# Routes

## Rule

Set a global prefix of `api` and enable `VersioningType.URI`. Every route is reachable at
`/api/v<n>/<resource>`.

Name resources in the plural, kebab-case for compound words. Use REST verbs and Nest's default status
codes.

Put input DTOs in `dto/`, named as the generator names them: `CreateUserDto`, `UpdateUserDto`.

Configure the global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true` and
`transform: true`. Leave `enableImplicitConversion` off; convert a field that needs it with `@Type()`.

Return the entity. Serialize it with `ClassSerializerInterceptor`, marking with `@Exclude` every
property that must not leave. Where the value arrives as a plain object, add
`@SerializeOptions({ type: Entity })`. Do not write a response DTO per route.

A controller receives the request, calls the service and returns. Everything else on it is a
decorator.

Enable the `@nestjs/swagger` CLI plugin. Decorate by hand only what it cannot infer: error responses,
non-obvious status codes, route descriptions.

Serve the documentation UI outside production only.

## Rationale

The global prefix makes Better Auth's `/api/auth/*` fall out of the ordinary convention instead of
becoming the one route with an exception in its path.

Versioning costs five characters today and a coordinated migration of every consumer later, including
a published mobile app that does not update when you want it to. It goes in the URI rather than a
header because a version in the URL appears in logs, caches, a `curl` line and a Sentry report:
exactly where you look when v1 breaks.

`forbidNonWhitelisted` is what makes an unexpected property visible. Stripping it silently returns 200
to a client that sent `role: "admin"`, which looks like success and hides the honest bug and the
malicious attempt equally.

Serialization is declared once on the entity rather than repeated in every response DTO that touches
it. Three DTOs over one entity would each have to remember to omit `tenant_id`, and so would the
fourth someone adds later.

The swagger plugin reads the class-validator decorators that already exist. Declaring the same field a
third time by hand produces the copy nobody updates, and API documentation that lies is worse than
none, because consumers trust it.

## Applies to

Every controller under `src/`, and the application bootstrap where the prefix, versioning, pipe and
documentation are configured.

## Examples

Resource naming and versioning:

```
✅  @Controller({ path: 'billing-accounts', version: '1' })
❌  @Controller('billingAccount')
```

Keeping a property out of a response:

```
✅  @Exclude() tenantId!: string
❌  tenantId!: string
```

A controller that delegates:

```
✅  findOne(@Param('id') id: string) { return this.users.findById(id) }
❌  findOne(@Param('id') id: string) {
      const u = await this.users.findById(id)
      if (u.plan === 'trial' && u.createdAt < cutoff) u.plan = 'expired'
      return u
    }
```

## Enforcement

**Boot.** The prefix, versioning, `ValidationPipe` and serializer are configured once at bootstrap, so
a route cannot opt out of them by accident.

**Review only.** Resource naming, controller thinness, and (most importantly) whether a new
sensitive column carries `@Exclude`. Nothing checks that, and a column added without it is published
to every client of that route.
