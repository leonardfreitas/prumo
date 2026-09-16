# Testing

## Rule

Run tests with Vitest, **except in `mobile`, which runs Jest with the `jest-expo` preset.** Put a test beside the
file it tests, named `*.spec.ts`.

**Do not mock the database.** Test code that touches it against the real one. Write a test without a
database only for code without a database.

Do not mock `EntityManager`, a repository, or any concrete class from a library.

**In a client, replace the network through the injected transport**: pass a fake `fetch` to `createClient`.
Do not add a request-mocking library. Test a component that shows an error by rendering it and asserting
**where** the error appears.

Measure coverage and report it. Do not block a merge on a coverage threshold.

Assert behaviour, not execution. A test that calls a function without asserting anything is not a test.

## Rationale

A mirrored test tree has to be moved when the code moves, and nobody moves it, so the old path survives
as an orphan that still passes. Co-located, a test travels with its file without anyone thinking about it.
`.spec.ts` follows the generator, so no rename step is needed after generating a module.

**There are no interfaces to mock.** The architecture has no ports, so a service talks to MikroORM's
concrete `EntityManager`. Mocking it means imitating identity map, unit of work and flush: the hardest
thing in a suite to write and the least trustworthy. Each time the imitation is wrong, the test passes and
production does not, and **a test that passes for the wrong reason is worse than no test, because it grants
permission not to look.**

A real Postgres is already provided, one per worker, with its schema built from the migrations. That also
dissolves the *unit or integration* argument every project has and nobody wins: the answer is mechanical;
the code touches the database or it does not.

A client has no database, and a `web` generated `alone` has no API beside it to test against. The transport is
already a parameter (the integration layer takes it from the app) so a fake `fetch` needs no library and
imitates nothing internal. **What it costs:** the fake responses are written by hand and can drift from what the
API really returns, unnoticed. That is the same cost already accepted for hand-written contract types. The rules
worth testing in a client are the silent ones: an `errors` map reaching the right field, and an authentication
error becoming a form-level message.

**`mobile` is the one exception, and only the runner changes.** Expo's testing guide installs Jest with `jest-expo`,
`@testing-library/react-native` peers `jest >=29`, and the community Vitest integration for React Native has not
been published since January 2024. Every other rule here (placement, no database mocks, no threshold, asserting
behaviour) holds unchanged. **What it costs:** two runners in one workspace with near-identical APIs, so `vi.fn`
written in a mobile test is a mistake an assistant will make.

**Three things a mobile test meets, verified with Expo SDK 57:** `render` from `@testing-library/react-native` 14
is **asynchronous** and its matchers need no setup. `jest-expo` leaves the app manifest empty, which Better Auth's
Expo plugin needs to build an origin, so a component test uses a Better Auth client without that plugin, which is
why a form asks only for the auth methods it calls. And Better Auth ships ESM, partly as `.mjs`, so Jest extends
`jest-expo`'s own transform settings to include it rather than restating them.

A coverage threshold turns a proxy into a target. Whoever is below writes tests to raise the number rather
than to check anything; whoever is above stops thinking. With no database mocks a test costs more to write,
which pushes even harder towards the cheap way of raising coverage: the test that asserts nothing.
Measuring without a threshold still answers the useful question, which is *where is there nothing at all*.

## Applies to

Every type. Anything specific to running tests against a database (containers, isolation between tests,
factories) belongs to the database area, not here.

## Examples

Placement:

```
✅  features/orders/order-list.tsx
    features/orders/order-list.spec.tsx
❌  tests/features/orders/order-list.test.tsx
```

What a service test uses:

```
✅  const em = await testEntityManager()      // real Postgres
❌  const em = { findOne: vi.fn(), flush: vi.fn() }
```

Asserting:

```
✅  expect(await service.activate(id)).toMatchObject({ status: 'active' })
❌  await service.activate(id)                 // covers the line, checks nothing
```

## Enforcement

**Structural.** With no mock of the database available as a convention, a service test has to use the real
one.

**Review only.** That a test asserts something, that a new module arrived with tests at all, and that
nobody introduced a mock of a library class.

**The known gap:** with no threshold, coverage can fall and CI stays green. Review is the only defence, and
review tires. If a floor is ever added, the honest form is on the diff (new code arrives tested) rather
than an average the existing code sustains.
