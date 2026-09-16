# Routing

## Rule

Hold the native splash screen until the session has been read from `expo-secure-store`. Only then let the
router render the authenticated group or redirect to login.

Express protection with an authenticated layout group. Do not check for a session inside a screen.

When a deep link targets a protected route without a session, keep the intended destination **in memory**
and navigate to it after a successful login. Do not persist it.

Enable `experiments.typedRoutes`. Use absolute paths in every navigation.

Let the navigation shape (how many tabs, which stacks) follow the product. It is not a convention.

## Rationale

On the web the cookie travels with every request and the server decides, so the client is never in doubt.
On mobile the session lives in secure storage and reading it is asynchronous, so every cold start has a
moment where nothing is known yet.

**MMKV persists across launches, which makes that moment dangerous rather than merely untidy.** A
protected screen rendering before the decision can show cached data from the **previous user** for a
fraction of a second. Holding the splash costs nothing in perception (it is already a native, expected
moment) while the alternative flash reads as a defect and can show somebody else's data.

Checking inside each screen fails differently: the screen written tomorrow does not check.

A dropped deep-link destination is the most common reason a notification link "does not work": the person
taps a specific order, signs in, and lands on the home screen with the order to find by hand. Keeping the
destination in memory rather than on disk matters because `orders/123` describes intent: it says the order
exists and that this person wanted it. That value is useful for seconds and should not outlive the
process. Somebody who closed the app midway through login is not returning expecting to resume.

Typed routes are beta, and are enabled because the gain is correctness rather than appearance: a wrong
`href` is broken navigation, not an untidy string. The web app gained end-to-end route typing from its own
router; without this, the same typo compiles here and fails there.

## Applies to

Every file under `app/`, and the bootstrap that controls the splash.

## Examples

Protection:

```
✅  app/(app)/_layout.tsx        → resolves the session, then renders or redirects
    app/(app)/orders.tsx
❌  app/orders.tsx               → if (!session) router.replace('/login')
```

Navigation:

```
✅  router.push('/orders/123')
❌  router.push('../orders/123')   // relative paths are not typed
```

## Enforcement

**Structural.** A screen inside the authenticated group cannot skip the check, because the layout resolves
before it renders.

**Compiler.** Typed routes reject a misspelled path and a missing or wrongly typed param.

**Review only.** That the splash is released only after the session resolves, and that a deep-link
destination is not written to storage.

**An asymmetry with the web area, recorded so nobody corrects it:** there, the generated route tree is
committed, because without it a clean clone does not typecheck. Here `expo-env.d.ts` is generated and
gitignored, which is Expo's own convention. That file is the framework's territory, and fighting its
default `.gitignore` creates friction on every upgrade.
