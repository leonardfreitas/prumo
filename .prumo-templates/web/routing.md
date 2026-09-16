# Routing

## Rule

Define routes as files and let TanStack Router's Vite plugin generate the route tree. **Commit the
generated tree.**

Wrap everything requiring a session in an authenticated layout route that redirects in its `beforeLoad`.
A public route is one placed outside that layout.

Validate every search param with a Zod schema in the route's `validateSearch`. Let path params take the
types the router derives from the file name.

Let TanStack Query own the cache. Use a route loader only to call `ensureQueryData`, and read the data in
the component through the Query hook. Never pass loader data down as props.

**After signing in, signing up or signing out, `await` a `refetchQueries` of the session before navigating.**
Never `invalidateQueries` for it.

## Rationale

The generated route tree is committed because application code imports it, so without it `tsc` fails on a
clean clone, breaking CI and the editor of whoever just cloned, and making *run the dev server first* a
prerequisite for any task. The cost is merge conflicts on a generated file, always resolved by
regenerating. A broken clone is worse than a predictable conflict.

The authenticated layout means **protection is expressed by where a file lives**. For a route to be born
unprotected, somebody has to place it outside the layout deliberately; forgetting is not enough.

**Client-side protection is not security.** The API refuses through its own guard, so a forgotten
redirect leaks nothing; it costs a flash of broken interface while the page mounts, fires a request and
receives 401. This is stated so nobody treats the client as the boundary and relaxes on the server.

A search param is untrusted input that does not pass through the API on its way in. Left unvalidated, a
component feeding `?limit` into a request becomes the path by which a junk value reaches the server,
which refuses it, but only after a round trip and with an error the user cannot read.

The loader prefetches rather than fetches because two caches holding the same data is how *why did the
screen not update* becomes unanswerable. Data handed down as props sits in no cache, so invalidating
after a mutation never reaches it.

**The session is the one query where invalidating fails silently.** The authenticated layout reads it
with `ensureQueryData`, which fetches only when the cache is empty, and a visitor without a session leaves
`null` there, which is not empty. `invalidateQueries` only marks it stale and refetches what a component
observes, and nothing observes the session. So the sign-in succeeds, the server holds a session, and the
layout reads the cached `null` and sends the visitor back to sign in. `refetchQueries` includes queries
nobody observes and resolves once the new value is cached. Following the loader rule above and the
invalidation rule in `data.md` to the letter is exactly how this defect is written.

## Applies to

Every file under `routes/`.

## Examples

Protection by placement:

```
✅  routes/_authenticated/orders.tsx     → protected
    routes/login.tsx                      → public
❌  routes/orders.tsx with an if (!user) inside the component
```

Search params:

```
✅  validateSearch: z.object({ limit: z.number().max(100).default(20) })
❌  validateSearch: (s) => s as { limit: number }
```

Loading data:

```
✅  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery())
    // component: useSuspenseQuery(ordersQuery())
❌  loader: () => fetchOrders()
    // component: props.orders
```

After the session changes:

```
✅  await queryClient.refetchQueries({ queryKey: sessionQuery(auth).queryKey })
    await navigate({ to: redirect ?? '/' })
❌  await queryClient.invalidateQueries({ queryKey: sessionQuery(auth).queryKey })
    // the layout still reads the cached null
```

## Enforcement

**Structural.** A route inside the authenticated layout cannot skip the redirect, because the layout runs
first.

**Compiler.** `validateSearch` makes the search params' types reflect what survived validation, so a
component cannot read a field the schema does not produce.

**Tests.** A test that renders the app at a protected route, signs in, and expects the protected page. It
must start from the protected route: starting on the sign-in page never caches the `null`, and passes with
the defect in place.

**Review only.** That the loader prefetches rather than returning data the component consumes, that a
route needing a session was not placed outside the layout, and that every form changing the session
refetches it.

**A tie worth knowing:** the query key is shared between the loader and the component. If they differ, the
prefetch fills one cache entry and the component reads another, paying for the request twice and gaining
nothing. Where that key lives is settled in `data.md`.
