# Observability

## Rule

Expose two health routes with `@nestjs/terminus`. Liveness reports that the process is up and checks
no dependency. Readiness checks that dependencies answer, the database included. Mark both `@Public()`
and exclude them from request logging.

Connect the ORM explicitly at bootstrap, before the application listens.

Do not install an error-reporting or tracing service by default. A project has structured logs and
these two routes, and nothing else, until its owner chooses otherwise.

When Sentry is chosen, wire it exactly as follows and not otherwise.

Import `instrument.ts` as the first line of the bootstrap, before `NestFactory` and before every other
import. Register `SentryModule` in the root module. Add `@SentryExceptionCaptured()` to the existing
global exception filter's `catch()` method. Do not register `SentryGlobalFilter`.

Send an event for any 5xx response: an unhandled exception and a deliberately thrown 5xx alike. Never
send one for a 4xx, and never make a `logger.error` call create one by itself.

Attach the request id as a **tag**, and the user's identifier when a session exists. Leave PII sending
off. Never attach a request body.

## Rationale

Liveness and readiness answer opposite questions (*should I restart this process* and *should I send
it traffic*) and a single endpoint forces one answer to both. The failure that causes is routine: the
endpoint checks the database, the database wobbles, and the orchestrator restarts a healthy process.
Restarting does not fix a database, and the wobble becomes an outage.

**MikroORM 7's `init` no longer connects**, and the readiness check asks whether a connection exists. Without
the explicit connect, readiness reports the database down until a first query, and an orchestrator sends no
query to an instance that is not ready. The instance never becomes ready. Connecting at bootstrap also means
an unreachable database fails the boot instead of a request.

Error reporting is not installed because it requires a commercial account. Installing a service that
needs an account, a DSN and eventually a bill decides something commercial on the owner's behalf,
inside a project that is theirs. Free tooling can simply be deleted; a SaaS dependency is different in
kind. So the wiring is written down and ready, and absent until wanted.

`Sentry.init` must run before other modules load, because the instrumentation patches them as they are
imported. Nothing enforces that ordering, which makes it the most fragile line in the project.

The 5xx boundary is the status, not the exception type: a deliberately thrown `ServiceUnavailableException`
is a real failure somebody must see, and treating it as routine because it was explicit would hide the
case that matters most. Sending everything instead turns the issue list into a stream of invalid client
input until somebody mutes the project.

**What reaches Sentry leaves your perimeter.** A log stays in infrastructure you control; a third-party
service does not, and is readable by anyone with access to that project. That is why the bar here is
higher than for logs, and why the body never goes: on an authentication route it is the password, on a
payment route it is the card. Reproduction is a convenience; a leak into someone else's system is an
incident.

## Applies to

The bootstrap, the health module, and the global exception filter.

## Examples

Health routes:

```
✅  GET /api/health/live    → process is up, checks nothing
    GET /api/health/ready   → database answers
❌  GET /api/health         → used for both
```

Wiring Sentry into the existing filter:

```
✅  @Catch()
    export class ProblemFilter implements ExceptionFilter {
      @SentryExceptionCaptured()
      catch(exception: unknown, host: ArgumentsHost) {}
    }

❌  app.useGlobalFilters(new SentryGlobalFilter(), new ProblemFilter())
```

## Enforcement

**Boot.** The health routes and the filter are registered once.

**Review only, and this is the weakest line in the project:** that `instrument.ts` stays the first
import. Reordering imports for tidiness, or a formatter doing it unasked, silently stops the
instrumentation, and nothing fails.

Also review: that no event carries a body, and that a 4xx never becomes one.
