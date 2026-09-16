# Errors

## Rule

Throw Nest's built-in exceptions: `NotFoundException`, `ForbiddenException`, `BadRequestException`
and the rest. Do not define an exception hierarchy of your own, and do not construct a problem
document anywhere but in the filter.

Register one global exception filter, declared with a bare `@Catch()` so it receives everything.

Respond with `application/problem+json` per RFC 9457: `type`, `title`, `status`, `detail`, `instance`.

Carry validation failures in an `errors` extension member, keyed by field name. Use a dotted key for a
nested field. Produce it from the `ValidationPipe`'s `exceptionFactory`.

Give an unhandled exception a generic 500 problem document carrying nothing from the exception, in
every environment. Send the exception itself to the log and to Sentry.

Generate a request id at the start of every request, propagate it with `AsyncLocalStorage`, return it
in an `X-Request-Id` header on every response, and include it in every problem document. Reuse an
inbound `X-Request-Id` rather than replacing it.

## Rationale

Nest's own error bodies are not consistent: an `HttpException` produces `{ statusCode, message }` with
`message` a string, while the `ValidationPipe` produces `{ statusCode, error, message }` with `message`
an array. The field set and the type of a field both change, and every client that displays an error
pays for it. Fixing that already requires a filter, and once a filter is being written a documented
standard costs exactly what a bespoke shape costs, with the difference that clients, libraries and
assistants already know the standard.

The filter catches everything because otherwise the least predictable failures get the least
predictable shape. A 500 says nothing because an unhandled exception's message carries whatever was
nearby: a file path, a fragment of SQL, sometimes a connection string. It says the same thing in every
environment because the error path is the least tested code in the system and does not need two
versions of itself.

That silence is only supportable because the request id makes it findable. The id covers the whole
request rather than the moment of failure, since most investigations begin with what the request did
before it threw.

## Applies to

Every route. The filter, the `exceptionFactory` and the request-id middleware are registered once at
bootstrap.

## Examples

A validation failure:

```
✅  { "type": "about:blank", "title": "Bad Request", "status": 400,
      "errors": { "email": ["must be an email"] },
      "requestId": "01J..." }

❌  { "statusCode": 400, "error": "Bad Request",
      "message": ["email must be an email"] }
```

Raising an error:

```
✅  throw new NotFoundException()
❌  throw new ProblemDetails({ status: 404, title: 'Not Found' })
```

An unhandled exception:

```
✅  { "type": "about:blank", "title": "Internal Server Error", "status": 500,
      "requestId": "01J..." }

❌  { "status": 500, "detail": "null value in column \"tenant_id\" of relation \"orders\"" }
```

## Enforcement

**Boot.** The filter, the `exceptionFactory` and the request-id middleware are registered once, so no
route can produce a different shape by accident.

**Review only.** That handlers throw Nest's exceptions rather than building responses by hand, and
that no `detail` written by hand quotes something internal. Nothing checks either.
