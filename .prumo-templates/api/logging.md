# Logging

## Rule

Log through `nestjs-pino`. Do not use Nest's default logger directly and do not add a second logging
library.

Write JSON to stdout. Render it with `pino-pretty` in development only, as a dev dependency. Never
write a log file.

Keep automatic request logging on. Put the request id on every line, taken from `nestjs-pino`'s
per-request context, the same id returned in `X-Request-Id`. Exclude the health route by name, and
the documentation route outside production.

Never log a request or response body. Configure pino's `redact` for `authorization`, `cookie`,
`set-cookie`, `password`, `token` and `secret`.

Set the level from `LOG_LEVEL`, defaulting to `info`:

- `error`: it broke and somebody has to look
- `warn`: it degraded and continued: a retry, a fallback, a limit reached
- `info`: an event that matters to the business
- `debug`: off in production

A handled 4xx is not an error. Log it at `info`.

## Rationale

pino emits structured JSON natively, which is what an aggregator expects, and Nest's default logger
prints prose for a human terminal. It also carries per-request context, so the request id needs no
second storage mechanism alongside it.

Pretty-printing in development changes only how bytes are rendered for a person: the fields, values
and structure are identical, and nothing in the system depends on the output format. That is why this
environment difference is allowed where the error-response one is not; there, the content sent to a
client changed.

Automatic logging exists because *did this request even arrive* is the first question in half of all
investigations, and without it a successful request leaves no trace. Health checks are excluded
because a probe every five seconds is seventeen thousand lines a day saying nothing is wrong, and that
drowns search results and costs money at ingestion.

The two secrecy rules cover different holes: bodies are the largest surface, and the automatic request
log touches headers, where the session cookie lives.

Levels carry a written rule because the names look self-explanatory and are not. When a 400 from a
careless client is logged as `error`, the service's error rate stops measuring health, the alert fires
constantly, and someone silences the alert that mattered.

## Applies to

Every module. The logger, redaction and route exclusions are configured once at bootstrap.

## Examples

Choosing a level:

```
✅  warn   payment retried after gateway timeout
❌  error  validation failed: email must be an email
```

Logging an object:

```
✅  logger.info({ userId: user.id }, 'subscription activated')
❌  logger.info({ user }, 'subscription activated')   // whatever user carries goes too
```

## Enforcement

**Configuration.** Redaction and the route exclusions are set once and cannot be bypassed per call
site.

**Review only.** That no one logs a whole object whose contents are unknown; `redact` covers named
paths, so `{ user }` with a token inside defeats it entirely. And that a 4xx is not raised to `error`.

Access to the logs is a security boundary: an unhandled exception is sent there in full, so stack
traces, SQL fragments and parameter values are legitimately present.
