# Configuration

## Rule

Validate the environment with `@nestjs/config`'s `validate` function, using class-validator. Do not
add Joi.

Register the validated class as a provider and inject it with its type. Do not call
`ConfigService.get()` with a string key.

Fail the boot when validation fails. Report every invalid variable at once, ignore unknown ones, and
name the variable without printing its value.

Keep `.env` in `.gitignore`. Commit `.env.example` with every variable and a safe sample value. Do not
read an env file in production.

Load `.env` outside production with Node's `process.loadEnvFile`, in the environment module, before
validating. Give `ConfigModule` `ignoreEnvFile: true` and that loading function as its `validate`.

Read `process.env` in exactly one place: the environment module. Nowhere else.

## Rationale

class-validator is already installed for DTOs, so using it here means one validation vocabulary
instead of two doing the same kind of work. Joi is genuinely better at configuration schemas
(coercion and defaults read more naturally there) but not enough to justify a second grammar in the
same project.

Injecting the validated class rather than calling `ConfigService.get()` keeps the type honest. `get()`
returns `string | undefined`, so every call site needs a `!` or a guard for a value that was already
proven present at boot, and the key is a string nothing checks: rename the variable, miss one call,
and it compiles and breaks in production. A class property breaks the build instead.

Reporting every failure at once turns eight missing variables into one cycle rather than eight. The
value is never printed because most of these are secrets and a boot error goes to the orchestrator's
log, which usually has more readers than the database.

**Unknown variables are ignored here, and that is deliberate.** Rejecting the unknown is the rule for
request bodies and query parameters; a process environment legitimately carries `PATH`, `HOME` and
whatever the CI runner sets, so the same rule would make the application impossible to start. This
exception is written down so nobody harmonises it later.

**The file is loaded by the environment module rather than by `ConfigModule`** because the application is not
the only entry point. The ORM's CLI and Better Auth's CLI both import the configuration long before any Nest
module exists, so `ConfigModule`'s own loading reaches the application and neither CLI. Node's `--env-file`
would do it without code, but it has to be typed on every command, and Node refuses it inside
`NODE_OPTIONS`. One function every entry point calls keeps one policy, including *never in production*.

## Applies to

The configuration module and every consumer of a setting.

## Examples

Reading a setting:

```
✅  constructor(private readonly config: AppConfig) {}
    this.config.databaseUrl

❌  this.configService.get<string>('DATABASE_URL')!
```

Reporting a bad value:

```
✅  DATABASE_URL is not a valid URL
❌  DATABASE_URL is not a valid URL: postgres://admin:hunter2@prod-db/app
```

Reaching the environment:

```
✅  // only inside the environment module
❌  const url = process.env.DATABASE_URL
```

## Enforcement

**Boot.** The application does not start with an invalid environment, so a missing variable cannot
reach a request.

**Review only.** That `.env.example` gained the variable someone added to the config class, and that
no error message quotes a value. A drifted example is caught the next time somebody clones, because
boot lists everything missing.
