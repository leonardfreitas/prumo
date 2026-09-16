# Tasks and configuration

## Rule

Give the root `package.json` three scripts (`lint`, `typecheck` and `test`), each running through
`pnpm -r`.

**Do not add a `dev` script at the root.** Start development with `pnpm --filter <app> dev`.

Keep compiler options in `tsconfig.base.json` at the workspace root. Extend it by relative path from each
app and package, overriding only what differs.

Do not use project references.

Keep Biome's shared settings (formatter and preset) in `biome.jsonc` at the root. Give each app that needs more
its own `biome.jsonc` with `"extends": "//"`, holding only what differs.

## Rationale

`pnpm -r` runs in topological order, so the orchestration usually credited to a task runner already exists.
What does not exist is caching, and caching pays once a build hurts, which a freshly generated workspace
does not.

The missing `dev` script is deliberate. `pnpm dev` in a workspace with four apps would start four
processes, one of them interactive, when whoever typed it expected the app they are working on. **Its
absence is what teaches that `dev` is per app**; if it existed, nobody would learn.

The other three belong at the root because that is what the pre-push hook calls. Leaving them out would
mean each person assembling their own `--filter`, and several versions of one command.

A single base config keeps five files from starting identical and diverging silently: one gains a flag,
another does not, and nobody notices until behaviour differs between apps. It is a root file rather than a
package because turning configuration into a package adds a `package.json`, a workspace entry and a
declared dependency in order to deliver one JSON file.

Biome follows the same shape because the two apps genuinely differ (decorator parsing in `api`, the shadcn
exceptions in `web`) while formatting and the preset must not. `"extends": "//"` is Biome's own syntax for
*inherit from the root, wherever it is*, and running `biome` from the root respects every nested file. One
configuration with per-directory overrides was refused because every new app would edit the shared file, and
because composing it would mean merging JSON rather than moving a file.

**Project references are refused for the same reason the shared package ships source:** they need
`composite: true` and produce a build order with intermediate artefacts, which brings back the failure of
changing something and not seeing the effect.

## Applies to

The workspace root, and every `tsconfig.json` beneath it.

## Examples

Starting work:

```
✅  pnpm --filter web dev
❌  pnpm dev                    // four apps, one of them interactive
```

Extending the base:

```
✅  { "extends": "../../tsconfig.base.json", "compilerOptions": { "jsx": "react-jsx" } }
❌  a complete compilerOptions block per app
```

## Enforcement

**The hook.** Pre-push runs the root `typecheck`, so a type error in any package stops the push.

**Review only.** That a new app extends the base rather than copying it, and that a root `dev` script has
not appeared.

**The reversal condition, stated so it is measurable rather than a feeling:** without caching,
`pnpm -r typecheck` runs `tsc` in every package from scratch every time. Turborepo belongs on the table the
day that becomes annoying enough for somebody to stop running it before pushing, not when the repository
merely feels large.
