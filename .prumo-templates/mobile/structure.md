# Structure

## Rule

Organise by feature. Put a feature's components, hooks and queries together in `features/<name>/`.

Keep files under `app/` thin: a route file renders a feature and holds no screen implementation. Let
`app/` carry only navigation: route files, `_layout.tsx`, and groups such as `(tabs)` and `(auth)`.

**Do not organise by type.** There is no root `components/`, `hooks/` or `screens/` holding every feature's
files.

Put shared code in one of four places and nowhere else:

- `components/ui/`: visual primitives, written by hand
- `api-contract/`: the wire contract with the API, as `client/data.md` describes
- `lib/`: pure functions, with no state and no React
- a named feature: anything with behaviour

Do not create a `shared/` or `common/` folder.

Keep client state in React context, one context per subject, living in the feature that owns it. Do not
create a single application context.

Resolve `@/` to the app's own `src/`.

## Rationale

`app/` is a URL namespace: everything in it has a public path attached. Putting a screen's implementation
there mixes *how you reach this screen* with *what this screen does*, and the first changes for navigation
reasons while the second changes for product reasons. Keeping route files thin also matches the web area,
which matters in a monorepo: the same feature exists in two apps, and if one puts the screen in the route
while the other puts it in the feature, comparing them becomes translation.

`components/ui/` exists here for the same reason it does on the web, holding the same kind of thing. Only
its origin differs: on the web those files come from the shadcn CLI, and here they are written by hand
from the start. Dropping the folder would force naming a button as a feature, and a feature is a slice of
product: a button can be named, it simply is not one.

A `shared/` folder has no admission criterion: *is this shared?* answers yes for anything used twice, so
it only grows. Not everything shared is a component either: formatting a date is a function in a file.
**If it uses React, it does not belong in `lib/`.**

One context per subject exists because context re-renders **every** consumer when its value changes. A
context bundling theme, session and the current tab makes a theme toggle re-render the whole tree:
invisible with three components, expensive when the app grows, and never an error.

## Applies to

Every file under `src/` and `app/`.

## Examples

A screen:

```
✅  app/orders.tsx            → renders <OrderList/>
    features/orders/order-list.tsx
❌  app/orders.tsx            → the whole screen, 200 lines
```

Shared code:

```
✅  components/ui/button.tsx
    lib/format-currency.ts
    features/notifications/
❌  shared/components/button.tsx
    features/button/
```

## Enforcement

**Review only.** Nothing prevents a screen from growing inside `app/`, a `shared/` folder from appearing,
or two contexts from being merged for tidiness.

**Worth knowing rather than discovering:** the web area's `components/ui/` is maintained by the shadcn
CLI, which overwrites on reinstall. Here there is no CLI, so nothing overwrites, and equally nothing
brings improvements from upstream.
