# Tooling

## Rule

Base the TypeScript configuration on `nestjs/typescript-starter`: `module` and `moduleResolution` both
`nodenext`, `target` `ES2023`, `strict` on, `strictPropertyInitialization` off.

Add `noUncheckedIndexedAccess`. Do not add `exactOptionalPropertyTypes`.

Use `bundler` for `moduleResolution` in a client app (`web`, `mobile`, `site`) where a bundler resolves
modules.

Run Biome's recommended preset, configured in `biome.jsonc`. Write a one-line reason in the configuration
for any rule added or disabled.

In `api`, enable `javascript.parser.unsafeParameterDecoratorsEnabled` and turn `style.useImportType` off.

In a client using shadcn, turn `a11y.noLabelWithoutControl` and `a11y.useSemanticElements` off for
`components/ui/` only, through an override. Keep both on everywhere else.

**Never import a class with `import type` where Nest reads its type at runtime**: a constructor
dependency, or a DTO received through a decorated handler parameter.

Run `biome check --staged --write` in `.githooks/pre-commit`. Run `tsc --noEmit` in `.githooks/pre-push`.
Wire both with `"prepare": "node .githooks/install.mjs"`, which sets `core.hooksPath` inside a Git repository,
does nothing outside one, and fails when Git is present and the setting cannot be written.

## Rationale

Following Nest's starter is not deference: it is what keeps the generator and the convention in agreement,
so a freshly generated project needs no correction afterwards. `nodenext` also happens to be one of the
three values MikroORM v7 accepts, so the ORM and the framework ask for the same thing.

`strictPropertyInitialization` is off because a DTO's properties are filled by validation rather than by a
constructor, so the flag reports an error about something correct. The cost is real and wider than DTOs:
with it off, **any** class may declare a property that is never assigned and the compiler stays quiet.

`noUncheckedIndexedAccess` is added because `rows[0]` treated as present is the most common source of a
runtime `undefined`. `exactOptionalPropertyTypes` is left out because it is the one strictness flag whose
friction lands in library types rather than in your own code.

**The hooks are split by cost.** Most of this project's guarantees are compiler guarantees, so a hook that
only formats lets through the class of error the rules most rely on. But `tsc` takes five to thirty
seconds, and a slow hook is one somebody bypasses with `--no-verify`, after which Biome does not run
either. Formatting is instant and belongs on every commit; type checking needs to run before code leaves
the machine, which is what pre-push is.

`biome.jsonc` rather than `biome.json`, because the reason has to live beside the rule and JSON cannot hold
a comment.

**Biome cannot parse Nest without the parser option.** Decorators on constructor and handler parameters
(`@Inject()`, `@Body()`, `@CurrentUser()`) belong to the legacy proposal, and Biome reports every one as a
syntax error, not a lint warning, until the option is on.

**`useImportType` breaks injection, and nothing reports it.** Nest resolves a dependency from the type the
compiler emits into the constructor's metadata. `import type` is erased from the output, so the emitted type
becomes `Function` and the application refuses to boot. The rule's autofix makes that rewrite across the
codebase in one pass; in this template it did, and lint, typecheck, build and every service test still
passed. **On a DTO it is worse:** `ValidationPipe` receives `Object`, validates nothing, and raises nothing,
so `whitelist` and `forbidNonWhitelisted` silently stop existing. Written by hand, the same `import type`
does the same damage, which is why the rule forbids the import and not only the lint rule.

**The shadcn override is scoped because both rules are right in application code.** A generated `Label`
receives `htmlFor` through props the rule cannot see, and shadcn's `Field` uses `role="group"` deliberately.
Turning them off project-wide would remove the protection from the screens, where a label without a control is
a real defect.

**The hooks are wired by a script, not by `git config` directly,** because `prepare` runs on every install and
`git config` exits 128 outside a repository: an install inside a container, or from an archive, failed outright. A
shell guard was refused: pnpm runs scripts in the system shell, which on Windows is `cmd`, and `|| true` would also
swallow the real failure of a repository that could not be configured.

A short lint configuration is one somebody reads before disagreeing with it. The written reason stops
nobody from adjusting and guarantees the configuration explains itself a year later.

## Applies to

Every project, of every type. Client apps differ only in `moduleResolution`.

## Examples

Configuration changes:

```
✅  // disabled: our DTOs are validated at runtime, not constructed
    "noUnusedVariables": "off"
❌  "noUnusedVariables": "off"
```

Importing what Nest reads at runtime:

```
✅  import { UsersService } from './users.service'
    import { UpdateProfileDto } from './dto/update-profile.dto'
❌  import type { UsersService } from './users.service'        // boot fails: Function
❌  import type { UpdateProfileDto } from './dto/update-profile.dto' // nothing is validated
```

Reading an array:

```
✅  const first = rows[0]; if (!first) return
❌  const first = rows[0]!
```

## Enforcement

**Compiler.** `strict` and `noUncheckedIndexedAccess` are enforced on every build and by the pre-push hook.

**The hooks.** Formatting cannot reach a commit unformatted, and a type error cannot reach the remote,
unless somebody uses `--no-verify`, or never ran an install and so never got `core.hooksPath` configured.

**Boot, partially.** A constructor dependency imported as a type fails at boot. **A DTO imported as a type
does not fail anywhere**, not at boot and not in a service test, so it is caught only by a request test
that sends an invalid body, or by review.

**Review only.** That a disabled rule carries its reason, and that `strictPropertyInitialization` being
off did not leave an uninitialised property somewhere outside a DTO.
