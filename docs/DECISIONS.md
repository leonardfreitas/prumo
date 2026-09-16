# Decisions

Running log of every approved decision. Append one entry per decision, newest last.
Update this file in the same turn the decision is made.

Entry format:

```
## YYYY-MM-DD — <decision name>

**Decision:** <what was decided, one sentence>

**Options considered:**
- A) <option> — <consequence>
- B) <option> — <consequence>

**Reasoning:** <why this option won>

**Affects:** <files, layers or documents this decision governs>
```

---


> **Live decisions only.** This file starts at the Nest restart of 2026-09-09.
> The hexagonal / Fastify era that preceded it is not in this repository. It was tagged
> `v0-hexagonal-fastify` (`732ad69`) in the history discarded on 2026-09-16, and survives only in the
> archive bundle kept outside the repository. Nothing from that era is in force.

---

## 2026-09-09 — The CLI asks what you are building, not which clients you have

**Decision:** the first question is the **shape**. v1 ships four: `api`, `web`, `app`, `site`.

**Reasoning:** the old first question was *"which clients?"*, which assumed every project is a
monorepo with a backend. Measured on `examples/saas`, an API-only project received **12
`package.json`, 11 `tsconfig.json`, six packages, Turborepo, syncpack and knip** — including
`packages/api-client`, a typed HTTP client with no client to serve.

That was never chosen. It fell out of a question that had the shape baked in.

**The shape question also generalises**, which the old one could not: a worker, a lambda or a CLI
are more shapes, not special cases. The monorepo becomes a consequence of having more than one
artefact rather than a premise.

---

## 2026-09-09 — The API is NestJS, in every shape

**Decision:** NestJS, whether the project is API-only or the `apps/api` of a fullstack one. The
same context governs both.

**Reasoning:** the argument that decided it is about **what Prumo is for**. Prumo exists so an
assistant reads `.context/` and knows the rules — and with an opinionated, popular framework the
assistant already knows most of them. Hand-rolled Fastify had to document everything, because
nothing was standard: how a route registers, where composition happens, how auth is declared, what
the seam is. That was eight documents written for lack of a convention to point at.

**Nest makes Prumo smaller.** It stops documenting how to assemble a backend and documents only
what Nest does not decide.

**The costs, accepted with eyes open and measured rather than assumed:**

| | |
|---|---|
| Node 24 cannot run decorators | `node dec.ts` → `SyntaxError: Invalid or unexpected token`, and `constructor(private readonly x: X)` → `TypeScript parameter property is not supported in strip-only mode` |
| So the build step returns | which reverses "source plus `node_modules`, no `dist`, no bundle" |
| Nest injects by runtime token | TypeScript interfaces do not exist at runtime, so depending on an interface needs `@Inject('TOKEN')` with a symbol — more ceremony than the old port rule, not less |

**One architecture, many shapes.** Shapes × architectures is combinatorial documentation, and it
would make "always the same patterns" untrue. The API-only project and a fullstack `apps/api` are
the same code, with or without a workspace around them.

---

## 2026-09-09 — No architectural depth: Nest's own best practices

**Decision:** follow NestJS conventions. No hexagonal layering, no ports as a default, no
reinvention.

**Reasoning:** measured on the frozen example, one feature with two use cases cost **13 files and
280 lines**, and **five of the thirteen carried no guarantee at all** — the errors file that exists
to satisfy `no-circular`, a use case wrapping `findById`, the module factory, a trivial mapper, and
the status table. That is ceremony, and it is what made the system feel heavy.

**What this gives up, stated so it is a choice and not a discovery later:** the compile-time error
table that stops building when a domain error appears, the enumerable test floor that came from the
exhaustive `Result` union, and the port rule that made "swapping Resend for SES is a file swap"
literal. Each was worth something. None was worth what it cost per feature.

---

## 2026-09-09 — Restart rather than migrate, and freeze rather than delete

**Decision:** the new project is built from scratch. The old one is frozen at
`v0-hexagonal-fastify`, not deleted.

**Reasoning:** migration was the cheaper path on paper — eight documents change, twenty-five
survive with renamed paths. It was rejected deliberately: a document edited into a new architecture
carries assumptions from the old one, and this repository spent an entire day finding exactly that
class of defect. A clean derivation, with the frozen tree as raw material, is worth the repetition.

**What is meant to survive is the method, not the files:** plant the failure before trusting the
check, measure before asserting, read the package rather than the memory. That found two checks
that lied, one rule that never fired and eleven pointers to nothing, in a single day.

**Affects:** everything below `v0-hexagonal-fastify`.

---

## 2026-09-09 — Prumo is assistant-agnostic, at the depth of the entry file

**Decision:** the `.context/` folder is the single source of truth and stays neutral. The
scaffolder generates the entry file each assistant loads, and nothing more. Assistant-specific
tooling — skills, subagents, slash commands, rule types — is not generated.

**Options considered:**
- A) Nothing changes; only `CLAUDE.md` is written — zero cost, and Prumo is locked to one vendor.
- B) Pointer layer; `.context/` is the source of truth and the entry file per assistant is
  generated — cheap, solves loading, does not exploit glob scoping.
- C) B plus native path scoping, generated from per-document metadata.
- D) C plus each assistant's own tooling.

**Reasoning:** B. The content of `.context/` is already neutral — a document stating a naming
convention is markdown and contains nothing vendor-specific. What binds a project to one assistant
is the entry file: its name, its location, and whether the tool loads it automatically. That is the
only part that genuinely must be generated.

C and D were rejected on timing, not on merit. V1 has zero context documents written; building an
adaptation layer over an empty set is the wrong order, and both C and D target formats that change
every quarter. D is the one that looks most valuable and rots fastest.

**C stays reachable on purpose.** Three of the four mechanisms scope rules by path — `.claude/rules/`
via `paths:`, `.cursor/rules/*.mdc` via `globs:`, `.github/instructions/*.instructions.md` via
`applyTo:` — with different syntax over the same concept, a list of globs. If every context document
declares the paths it governs, C is a mechanical translation. If documents are written without it,
C means rewriting all of them. That makes it a constraint on the document template, decided in 0.3,
not a later addition.

**Affects:** `CLAUDE.md` (step 0.1), the `.context/` structure (0.2), the document template (0.3),
the CLI question set (6.1)

---

## 2026-09-09 — `AGENTS.md` is the canonical entry file

**Decision:** the pointer into `.context/` lives in `AGENTS.md`. `CLAUDE.md` holds an `@AGENTS.md`
import plus anything Claude-specific. Copilot inside the editor gets
`.github/copilot-instructions.md`. Cursor, Codex, Gemini CLI, Windsurf and Zed need nothing
generated — they read `AGENTS.md` natively.

**Options considered:**
- A) `AGENTS.md` canonical, the rest are shims — one source, two short generated files.
- B) A complete pointer per assistant from one mould — self-contained, and duplicates content
  across N files that `prumo update` must keep in sync.
- C) `CLAUDE.md` canonical, the others import from it — A inverted.

**Reasoning:** A. `AGENTS.md` stopped being an emerging convention: the specification was formalised
in August 2025 by OpenAI with Google, Cursor, Amp and Factory, donated in December 2025 to the Linux
Foundation's Agentic AI Foundation, and is read by more than twenty tools across 60,000+
repositories. It is the only option that puts the content where most tools already look with no
adapter at all.

Claude Code does not read `AGENTS.md` and reads only `CLAUDE.md`, so it is the single exception —
and its cost is one line, in a pattern Anthropic's own documentation prescribes.

C is A inverted with the wrong denominator: it would point a Linux Foundation standard at a
vendor-specific file. B duplicates the thing Prumo exists to stop duplicating.

**Verified before deciding, not assumed.** The prior turn asserted that Claude Code cannot scope
rules by path. That was wrong — `.claude/rules/` takes a `paths:` glob list. The claim was checked
against `agents.md`, `code.claude.com/docs/en/memory` and GitHub's Copilot documentation before this
entry was written.

**Import, not symlink.** `ln -s AGENTS.md CLAUDE.md` requires Administrator or Developer Mode on
Windows; Anthropic's documentation recommends the `@AGENTS.md` import for that reason. Prumo cannot
generate a project that breaks on half the machines that run it.

**Reversibility, stated so it is a choice:** A assumes `AGENTS.md` keeps its cross-tool reach. If
that stops being true, the fallback is B, and the change is confined to the scaffolder.

**Affects:** the generated project root, the CLI (6.1)

---

## 2026-09-09 — The brief re-locks the stack, one line at a time

**Decision:** section 5 of the brief is rebuilt, not emptied. Every entry of the old locked list is
re-confirmed with the user before it survives. Questions are asked per line, not per package —
except for three packages that lost their original justification in the Nest restart, which are
asked on their own.

**Options considered:**
- A) Empty section 5; the brief becomes pure process and every technical decision lives in the
  document of the area that owns it.
- B) Minimal core; keep only what crosses areas and is already decided — roughly PostgreSQL and
  TypeScript strict.
- C) Rebuild; re-confirm each entry now and lock a new stack in the brief.

**Reasoning:** the user chose C. The recommendation on the table was B, and the argument against C
was stated before the choice: the previous era locked a full stack in the brief before any document
existed, and the result was a 434-line brief contradicting the repository. C was chosen with that
argument in view.

**Granularity:** per line, because that is the level at which the choice is actually made — nobody
picks TanStack Query independently of TanStack Router. Three exceptions are asked individually,
because the restart removed the reason each was installed: `neverthrow` and `ts-pattern` existed to
carry and exhaustively match the `Result` union, and `dependency-cruiser` existed to enforce the
hexagonal layering. None is dead by consequence, and none arrives with its original justification
intact.

**Three entries are settled, not asked:** the `Result` type, the Fastify backend line, and the
porting rule were all removed by the Nest restart.

**Eighteen questions:** five structural, ten stack lines, three individual packages.

**Affects:** section 5 of `CLAUDE.md` (step 0.1)

---

## 2026-09-09 — Multi-tenancy stays `tenant_id`, and its guarantee becomes an open question

**Decision:** `tenant_id` on every tenant-scoped table survives into the new brief. No
schema-per-tenant, no RLS variant at this level. **The strategy is locked; the enforcement is not.**

**Options considered:**
- A) Keep as it stands — `tenant_id`, with discipline and review as the guarantee.
- B) `tenant_id` plus RLS as a backstop — Postgres refuses the row when the filter is missing; costs
  `SET LOCAL` inside a transaction, which affects pooling.
- C) Reopen the strategy, schema-per-tenant included.

**Reasoning:** A. `tenant_id` still wins for the reasons it always did — one migration, one pool, one
backup. Schema-per-tenant has not become cheaper to operate.

**What changed under it, recorded rather than carried silently:** in the frozen era this rule was
safe because tenant filtering was bound at repository construction — see *Tenant filtering stays
bound at construction, guarded by review* (2026-09-08). Plain Nest with no architectural depth
removes that binding. The rule is unchanged; the guarantee behind it is gone, and it now rests on a
service remembering to filter on every query.

Carrying A into the new brief without saying so would import a rule whose safety net was removed —
the exact defect class that made the restart preferable to a migration. So **how tenant filtering is
guaranteed without the old seam** is an explicit question for phase 2, answered with the `database/`
document in hand. B is one of the candidate answers there, with its cost measured rather than
assumed now.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — The database generates the primary key

**Decision:** UUID v7 stays. The column carries `DEFAULT uuidv7()` and Postgres generates the value.
The application does not.

**Options considered:**
- A) The application generates — a library call in the service; the id exists before the insert.
- B) The database generates — `DEFAULT uuidv7()`, no dependency, no code, monotonic within a session.
- C) Reopen UUID v7 itself.

**Reasoning:** B, chosen on simplicity. The recommendation on the table was A, argued on knowing the
id before the insert — building a graph of entities that reference each other inside one
transaction, emitting an event that already carries the id, unit-testing without a database. The
user chose B and stated the governing criterion: **we are trying to simplify.** B is less code, one
fewer dependency, and closer to *no architectural depth* than instantiating id generation in the
application.

UUID v7 itself was not reopened. It won against `bigserial` and v4 for the original reasons, and
Postgres adopting it natively confirms rather than challenges that.

**The cost this accepts, recorded so it is not discovered later:** B sets **Postgres 18 as a
version floor** — `uuidv7()` shipped in September 2025 and does not exist before it. No project
generated by Prumo controls that version; the client's managed provider does. And an entity's id is
unknown until after the insert, so writes that need it back require `RETURNING`.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — Hard delete is the default; `deleted_at` needs a reason

**Decision:** the rule inverts. Hard delete is the default. A table carries `deleted_at` only when
there is a stated reason — audit, user-facing recovery, legal retention.

**Options considered:**
- A) Keep it — `deleted_at` by default, hard delete justified.
- B) Invert it — hard delete by default, `deleted_at` justified.
- C) Keep A and fix the guarantee: mandatory partial unique indexes, filter forced at the ORM.

**Reasoning:** B, on simplicity. Soft-delete-everywhere pays its cost on every table to earn a
benefit on a few. Each query carries an implicit `WHERE deleted_at IS NULL` whose omission fails
silently; `UNIQUE(email)` stops working and every table needs a partial unique index; a foreign key
lets a live row point at a deleted one while the domain would not; tables grow forever.

**Where the risk actually compounds:** the filter used to be applied by the repository seam the
restart removed — the same structural loss recorded for `tenant_id` earlier today. Together, every
query would carry **two** implicit filters that nothing enforces. Inverting removes one of them from
most tables outright.

**What this gives up, stated plainly:** a wrong delete does not come back. The old rule was a safety
net against the operator, and without it the net is the backup. And *which tables need it* becomes a
per-table judgement someone has to make correctly, at the moment the table is created.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — UTC, and every time column is `timestamptz`

**Decision:** UTC in the database, conversion at the edge only — unchanged. The column type is now
stated: **`timestamptz` on every time column, without exception.**

**Options considered:**
- A) Keep UTC and lock `timestamptz`.
- B) Keep UTC and leave the type to phase 2.
- C) Reopen.

**Reasoning:** A. The UTC rule had no serious alternative and the restart never touched it. What was
never stated is the choice that actually causes bugs: `timestamptz` stores UTC and converts on
output per session, while `timestamp` stores the number it was given and does not know which zone it
came from — the classic that surfaces during another country's daylight saving, six months later.

One line in the brief makes the error impossible instead of something every table author must
remember. B defers a decision with no real trade-off, and a deferred one means tables created with
the wrong type before phase 2 arrives.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — PostgreSQL stays, and the brief declares a version floor of 18

**Decision:** PostgreSQL is not a variable — unchanged. The brief now also states the minimum
version: **Postgres 18 or later.**

**Options considered:**
- A) Keep PostgreSQL locked and declare the floor.
- B) Keep PostgreSQL locked without declaring it — the requirement stays real, just unwritten.
- C) Reopen the database.

**Reasoning:** A. The floor was created earlier today by the decision to let the database generate
the key: `uuidv7()` shipped in Postgres 18, September 2025. The choice here was never whether the
requirement exists — it exists either way — but whether it lives in the brief or becomes a surprise
in the terminal of whoever scaffolded against Postgres 16 and hit it on their first migration.

**Size of what it excludes, measured rather than assumed:** Postgres 18 is a year old and RDS,
Aurora, Supabase and Neon all serve it. Not an aggressive floor in 2026 — but a floor, and the
version is chosen by the client's provider, not by the project.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — pnpm workspaces, without Turborepo

**Decision:** when the architecture is `monorepo`, the workspace is pnpm workspaces alone. No
Turborepo.

**Options considered:**
- A) pnpm workspaces + Turborepo — keep.
- B) pnpm workspaces alone; `pnpm -r` already runs in topological order.
- C) Reopen the package manager — npm, yarn or bun workspaces.

**Reasoning:** B, on simplicity. What Turborepo actually delivers is caching, local and remote, and
caching pays once the build hurts. A freshly generated Prumo monorepo has two or three packages and
does not hurt. Turborepo would arrive with a `turbo.json`, a task graph to maintain and a second way
to run a script, to solve a problem the project does not yet have.

**Two things changed in this line before it was even asked.** Its scope: with the roadmap's
Architecture axis (`alone` / `monorepo`), this is no longer "installed in every project" but the
stack of one of two architectures. And the restart had already measured the damage of the old
framing — an API-only project received 12 `package.json` and 11 `tsconfig.json` because monorepo was
a premise rather than a choice.

**Where Turborepo wins, stated so the reversal is informed:** once the repo grows and CI rebuilds
everything on every commit, it is the difference between two minutes and twenty seconds. Adding it
later costs touching each package's scripts and the CI — tedious, not expensive.

C was not opened: bun workspaces have matured, but changing the package manager drags the runtime
with it, and that is experimentation in a place where the aim is to remove parts, not swap them.

**Affects:** section 5 of `CLAUDE.md`, `monorepo/` (phase 4)

---

## 2026-09-09 — `strict` and `noUncheckedIndexedAccess`, without `exactOptionalPropertyTypes`

**Decision:** TypeScript `strict: true` plus `noUncheckedIndexedAccess`.
`exactOptionalPropertyTypes` is dropped.

**Options considered:**
- A) Keep all three.
- B) `strict` + `noUncheckedIndexedAccess`.
- C) `strict` only.
- D) Follow Nest — use the `tsconfig.json` that `nest new` generates, with strict off.

**Reasoning:** B. The distinction that decided it: **compiler strictness is not machinery.** It is not
a file, not a dependency, not a thing to maintain. Simplifying means removing parts that cost work;
a tsconfig flag costs friction while writing. Dropping `strict` would not remove a file or a
dependency — it would move bugs from compile time to production. D is the extreme of that, and
inheriting Nest's default because it is the default is the *deciding something because it is
standard* anti-pattern.

**Why the two flags split, which is the real content of this decision:**
`noUncheckedIndexedAccess` changes what you can **read** without checking — the error lands on your
line and the fix is on your line. `exactOptionalPropertyTypes` changes **assignability** — the error
lands when your object is passed to a library's type, and the fix is not in your file. The Nest DTO
stack (class-validator + `@nestjs/swagger`) already has recorded trouble with `strictNullChecks`, so
that flag would spend the friction budget on noise the developer cannot fix.

**Checked rather than asserted.** The claim that the friction is local was challenged and verified:
no Nest-specific issue exists for `noUncheckedIndexedAccess` in `nest-cli`, `@nestjs/swagger` or
class-validator. Every documented complaint is a **migration** cost — hundreds of missing bounds
checks surfaced in existing code, teams silencing them with `as`. Prumo only generates new projects,
where the flag is on from line zero and there is nothing to clean up. In a Nest app it lands mainly
on `rows[0]` from a query, which is the most common source of a runtime `undefined` in a service.

Known limit, recorded so the guarantee is not overstated: indexed access in some array positions does
not receive `undefined` (TypeScript #46273). The flag narrows the bug class; it does not remove it.

**Consequence carried, not decided:** `strict` enables `strictPropertyInitialization`, which fights
Nest DTOs whose properties are filled by validation rather than the constructor. The accepted idiom
is `name!: string`. Turning that sub-flag off instead remains available and was not chosen.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — Biome, and a git hook with no dependencies

**Decision:** Biome stays. `syncpack`, `knip`, `husky` and `lint-staged` are all dropped. The
pre-commit hook is a `.githooks/pre-commit` script running `biome check --staged --write`, wired by a
one-line `"prepare": "git config core.hooksPath .githooks"` in `package.json`.

**Options considered:**
- A) Keep all four.
- B) Biome plus a hand-written hook; four dependencies become zero.
- C) Biome only, no hook at all — everything in CI.

**Reasoning:** B. Of the four tools, one does work nothing else does, two were replaced by native
capability that did not exist when the line was locked, and one delivers value a day-zero project
does not have yet.

- **Biome** stays, and is the simplification itself: one binary and one config replacing ESLint,
  Prettier and both plugin ecosystems.
- **syncpack** goes. pnpm now has native **catalogs** — the version is declared once in
  `pnpm-workspace.yaml` and each package references `catalog:`. What remains for syncpack is forcing
  packages to use `catalog:` instead of a literal version, and the scaffolder is what writes those
  `package.json` files. It would police a rule the generator already satisfies, and only under the
  `monorepo` architecture at that.
- **knip** goes. It finds unused files, exports and dependencies; a freshly generated project has
  none, because nothing has had time to become orphaned. It earns its place after months of drift,
  which is exactly when the developer can install it unaided.
- **husky + lint-staged** go. Biome's `--staged` flag finds the staged files itself, which was
  lint-staged's only reason to exist. husky is `core.hooksPath` pointing at a directory, and a
  one-line `prepare` script does that on `pnpm install` the same way husky does, without being a
  dependency.

**Against C, the simplest option of the three:** with no hook you find out after the push, and a red
CI over formatting is the most expensive possible way to fix a comma. The hook costs two small files.

**Risk accepted:** `core.hooksPath` is per-clone configuration. `prepare` covers it because it runs
on install, but someone who clones and commits before installing has no hook. husky has the same
hole.

**Affects:** section 5 of `CLAUDE.md`, quality tooling in every template

---

## 2026-09-09 — class-validator, the Nest way, duplication accepted

**Decision:** DTOs are classes validated by `class-validator` + `class-transformer`, through Nest's
`ValidationPipe`. Zod is dropped from the API. `@nestjs/swagger` reads the same decorators.

**Options considered:**
- A) class-validator + class-transformer — Nest's own path, no bridge.
- B) Zod + `nestjs-zod` — `createZodDto` serves as both DTO and Swagger model.
- C) Zod with no bridge — a hand-written pipe, losing automatic OpenAPI.

**Reasoning:** A. The recommendation on the table was B, argued on duplication: with class-validator
every DTO declares the same fact twice — the TypeScript type and the validation rule are separate
declarations and nothing checks that they agree, so changing one and forgetting the other compiles.
`z.infer` makes that impossible.

The user chose A. The conflict was surfaced before the choice: the restart locked *follow Nest's
conventions, no reinvention*, and class-validator is that convention. A resolves the conflict in
favour of the framework, and removes a third-party bridge from the critical path between a DTO and
the API documentation.

**The cost this accepts:** the duplication is not once, it is in every DTO for the life of the
project, and `class-transformer` plus `reflect-metadata` come along. Combined with
`strictPropertyInitialization` from decision 7, DTO fields carry `!`.

**Consequence, parked rather than decided:** `@t3-oss/env-core` was Zod-based and no longer fits.
`@nestjs/config` is the obvious loader; which validator runs inside it — Joi or class-validator — is
a phase 1 question.

Zod is not dead repository-wide. It may return for `web` and `site` in phase 3, where a shared
schema has a client to be shared with.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — Drizzle, chosen over MikroORM on ecosystem size

**Decision:** Drizzle ORM + drizzle-kit + the `postgres` driver. The line is kept as it stood.

**Options considered:**
- A) TypeORM — official `@nestjs/typeorm`, Nest does the wiring.
- B) Drizzle + drizzle-kit + `postgres` driver.
- C) Prisma — its own schema language, generated client.
- D) MikroORM v7 — Data Mapper, Unit of Work, Identity Map.

**Reasoning:** the user chose B: a visibly larger project, far more content and coverage, and more
current. On upgrades — *when Drizzle ships a new version we upgrade, like any library that must be
kept current.*

The recommendation on the table was D. What was argued for it, recorded so the choice is traceable:
MikroORM has the healthier backlog (~1.7 open issues per 100 stars against Drizzle's ~4.8), has
honoured semver through majors since 2018, and its patterns carry twenty-five years of Hibernate and
Doctrine behind them. Drizzle has spent its entire life on 0.x, which by definition offers no
compatibility guarantee.

**The user's strongest argument is one this repository already accepted in another form.** Coverage
was the exact ground on which MikroORM was argued *against* Drizzle earlier in the same session:
Prumo exists so an assistant reads `.context/` and already knows the rules, and the option with more
material in the world is the option the assistant gets right unaided.

**Verified at the registry rather than from search snippets:**

| | Stable line, 2026-09-09 |
|---|---|
| `drizzle-orm` | `latest` 0.45.2; `rc` 1.0.0-rc.4; rc.5 snapshots publishing daily |
| `drizzle-kit` | `latest` 0.31.10 |
| `@mikro-orm/nestjs` | `latest` 7.1.0, published 2026-08-31, peers `@nestjs/core ^11.0.5 \|\| ^12.0.0` |

**A correction made during this decision, kept because the method matters more than the outcome:**
MikroORM was first argued against on the claim that its Nest integration was dev-only. That was
wrong. It came from a search snippet quoting an undated tweet from when v7 support *began*; the
registry showed a stable 7.1.0 ten days old. The user caught it. Search snippets are not a source —
the registry is.

**What B costs, accepted with the choice:** Drizzle has no official Nest integration, so the module
and provider are hand-written — roughly twenty lines, and the one place hand-wiring returns after the
restart set out to remove it. And v1 is unreleased with a documented breaking upgrade ahead, so a
project scaffolded before it ships carries that migration.

**What B buys beyond ecosystem size:** migrations are SQL that is read and committed rather than
diffed from entities, which matters because all four database decisions taken today — `DEFAULT
uuidv7()`, `timestamptz` everywhere, no `deleted_at`, the Postgres 18 floor — are expressed at SQL
level. And nothing persists that was not written: no Unit of Work, no implicit flush.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2)

---

## 2026-09-09 — Amendment: the ORM is MikroORM v7, not Drizzle

**Amends the entry above,** *Drizzle, chosen over MikroORM on ecosystem size*. That entry is left
standing rather than rewritten: the path to this decision is part of the record.

**Decision:** MikroORM v7 with `@mikro-orm/postgresql`, `@mikro-orm/migrations` and
`@mikro-orm/nestjs`. Drizzle and `drizzle-kit` are out.

**What changed:** the user checked Nest's own documentation and found Drizzle absent from it.
Verified:

| Where in the Nest docs | What is there |
|---|---|
| Techniques → Database | TypeORM and Sequelize, with dedicated packages |
| Recipes | Prisma and **MikroORM** |
| In passing | Knex, Mongoose |
| Drizzle | nowhere |

**Why that signal mattered here, when it would not matter for an ordinary application:** Nest was
chosen because *an opinionated, popular framework means the assistant already knows most of the
rules*. There is no canonical Nest + Drizzle wiring for an assistant to reproduce, so it invents the
module shape, and two assistants invent two shapes. Prumo would have to **invent** that convention
rather than point at one.

It also separated something the previous decision had conflated. Drizzle was chosen for volume of
content, and that volume is real — but it is **general** content. What governs a generated Prumo
project is **Nest-with-an-ORM** content, and that is precisely what the absence signals is thin.

**Weight of the signal, not overstated:** Nest's list is historical, not curated. Sequelize holds
first-class treatment and is the weakest of everything listed, and Drizzle's absence partly reflects
its being pre-1.0. Alone it would not decide. It decided because it was the fourth item on a list
that already held: `latest` still on 0.x, an unreleased breaking v1, and hand-written wiring.

**TypeORM stayed eliminated**, though the user offered it as an alternative. It is the weakest of the
four on typing, and decision 7 had just paid friction for `strict` and `noUncheckedIndexedAccess`;
being in the documentation does not offset losing inference in the data layer.

**The price, restated rather than softened now that it won:** Unit of Work, Identity Map and implicit
flush. A managed entity persists on `em.flush()` with no `save()` call, and that failure mode is
silent. It is teachable — one rule in `.context/`, read every session — which is the argument that
made it acceptable, not a claim that it is free.

**Two more version floors, stacking on the Postgres 18 floor from decision 5:** Node 22.17+ and
TypeScript 5.8+.

**Entities use `defineEntity`,** the v7 primary path: full inference, no decorators, no
`reflect-metadata` for the ORM's own sake.

**Affects:** section 5 of `CLAUDE.md`, `database/` (phase 2), and the open decision 11/18 on
authentication, whose Drizzle adapter reference no longer applies

---

## 2026-09-09 — Better Auth, mounted directly, with no bridge package

**Decision:** Better Auth stays. It is mounted on a Nest controller with
`@All('/api/auth/*')` calling `auth.handler(req)`, with a hand-written guard. No community Nest
module. Its tables live in their own Postgres schema on their own connection, migrated by its own
CLI. The httpOnly cookie on both web and mobile, kept in `expo-secure-store`, carries over unchanged
from the 2026-08-31 correction.

**Options considered:**
- A) Better Auth mounted directly — no third-party package between it and Nest.
- B) Better Auth plus a community Nest module — `@Session()`, `@AllowAnonymous()` and a global guard
  ready-made, at the cost of an unofficial dependency chosen from three competitors with none
  blessed.
- C) Passport + `@nestjs/jwt` — Nest's documented path.

**Reasoning:** A, on the same logic that decided decision 9. A third-party bridge was refused there
between application code and the framework; the bridge here has the same shape and what it
intermediates is larger. The difference is that here the alternative costs nothing — ten lines,
with all of Better Auth still in the project.

**On C, and the question that reopened it:** Passport and Better Auth are not the same category.
Passport is strategy-dispatch middleware — verify a credential, populate `req.user`. It does not
store users, hash passwords, manage sessions, verify email, reset passwords, do 2FA, link accounts
or refresh OAuth tokens. Choosing it is choosing to build the auth system by hand around it.

The registry settled it:

| Package | latest | published |
|---|---|---|
| `passport` | 0.7.0 | 2023-11-27, still 0.x |
| `passport-local` | 1.0.0 | **2014-03-08** |
| `passport-google-oauth20` | 2.0.0 | 2019-03-08 |
| `@nestjs/passport` | 12.0.0 | 2026-08-27 |
| `better-auth` | 1.7.3 | 2026-09-06 |

Nest's wrapper is alive; everything it wraps is frozen. The most basic strategy in existence,
email and password, has not shipped since 2014.

**A symmetry worth keeping, because it calibrates a tool this session used twice.** The ORM was
changed on the signal *Nest's documentation does not mention Drizzle*. Here the same signal points
the other way: Nest documents Passport, and what it documents is abandoned. The signal measures
**what Nest wrote documentation for**, not what is alive. On the ORM the two coincided; on
authentication they diverge. It is a weight, never a decision on its own — and on the ORM it was the
fourth item on a list, not the first.

**Where Passport still wins:** an exotic enterprise strategy — SAML, LDAP, a vendor-specific SSO —
that exists only as a Passport strategy. That returns it to the table for lack of an alternative,
not on merit.

**What Better Auth costs:** it owns the user and session tables, so leaving it later means migrating
user data, the most unpleasant migration there is. 928 published versions in about two years is
vitality and churn in equal measure. And the project now runs **two migration systems** — MikroORM's
for application tables, Better Auth's CLI for its own. The separate schema keeps the split clean;
it is still two commands in a deploy, not one.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — `neverthrow` is dropped

**Decision:** `neverthrow` leaves the stack. Errors are exceptions, handled Nest's way —
`HttpException` and exception filters.

**Options considered:**
- A) Drop it.
- B) Keep it for specific cases where a typed error pays.
- C) Keep it generally, as before.

**Reasoning:** A. `neverthrow` was installed to carry the `Result` type, and the restart removed
`Result` explicitly. Without that rule it has no work to do. C would undo the restart.

**B was pulled out as its own question precisely to be refused.** "Keep it for specific cases"
creates the boundary without buying the consistency: every developer, and every assistant, then
decides function by function whether a failure is an exception or a `Result`. Two competing
conventions are worse than either alone — the *documents that contradict each other* anti-pattern,
relocated into the code.

**The real loss, not glossed:** with exceptions, what a function can fail with is not in its
signature. You find out by reading the body or the filter. That visibility is what `Result` bought,
and it is genuinely gone.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — `ts-pattern` is dropped

**Decision:** `ts-pattern` leaves the stack. Exhaustiveness is obtained from the compiler, with a
`switch` whose `default` branch assigns to `const _exhaustive: never`.

**Options considered:**
- A) Drop it.
- B) Keep it.

**Reasoning:** A. It was installed to match exhaustively over the `Result` union, and the union is
gone. What remains — matching over discriminated unions in general — is far rarer than when every
operation returned one, and TypeScript already enforces it: adding a member to a union without
adding its case stops compiling. That is the same guarantee `.exhaustive()` provides, with no
dependency.

**Where `ts-pattern` genuinely wins:** nested and conditional matching reads far better than chained
switches. If a project develops that kind of logic it comes back. It does not need to be installed
before anyone needs it.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — `dependency-cruiser` is dropped

**Decision:** `dependency-cruiser` leaves the stack. No import-graph rules are enforced by tooling.

**Options considered:**
- A) Drop it.
- B) Keep it with the `no-circular` rule only.
- C) Keep it with module-boundary rules.

**Reasoning:** A. It was installed to enforce the hexagonal layering, which no longer exists. More
than deduction, the restart **measured** its effect: a feature cost 13 files and 280 lines, five of
which carried no guarantee at all, and the first named was *the errors file that exists to satisfy
`no-circular`*. The tool was producing files, not preventing defects.

C is the closest thing to rebuilding the hexagonal layering under another name — module-boundary
rules are what dependency-cruiser enforced before, and they are what produced the useless file.

**What dropping it costs, stated rather than discovered:** nothing detects import cycles any more.
Nest complains at runtime about cycles between modules and `forwardRef` resolves those, but a cycle
between files inside one module goes unnoticed until it surfaces as strange import behaviour. B
remains the honest fallback — one rule and about ten lines of config, far less than what it was.

**Affects:** section 5 of `CLAUDE.md`, `61-ci-and-quality` equivalent (phase 6 of the old order)

---

## 2026-09-09 — `@sentry/nestjs` alone; OpenTelemetry is not installed separately

**Decision:** `@sentry/nestjs` on the server. OpenTelemetry is not a separate stack entry — Sentry
sets it up underneath and accepts native OTel APIs.

**Options considered:**
- A) Keep both — Sentry plus a separately configured OTel.
- B) `@sentry/nestjs` alone.
- C) Drop both until the project reaches production.

**Reasoning:** B. A installs two things to get one. A hand-built OTel setup is the SDK,
instrumentation packages, an exporter and a backend to send to, and in a freshly generated project
with no backend configured that is dead weight still requiring maintenance. Sentry delivers error
capture and tracing with one dependency, and does not close the door: `skipOpenTelemetrySetup: true`
plus manual assembly is documented by Sentry itself for the day another backend is needed. Native
OTel APIs work meanwhile, with spans collected automatically.

**Against C:** an error nobody sees is an error nobody fixes, and adding this later means touching
the bootstrap of a project already in production. It is the cheapest thing to have ready on day zero.

**What B ties:** Sentry becomes the tracing path, not only the error path. Replacing it later is not
a one-line change — it is reassembling OTel.

Sentry for web and mobile belongs to the client lines, not this one.

**Affects:** section 5 of `CLAUDE.md`, `api/` (phase 1)

---

## 2026-09-09 — Vitest, Testcontainers and Testing Library; MSW and Playwright wait

**Decision:** Vitest as the runner, Testcontainers for integration tests against a real Postgres,
Testing Library for components. MSW and Playwright are not installed at scaffold time.

**Options considered:**
- A) Keep all five.
- B) Vitest + Testcontainers + Testing Library.
- C) Jest instead of Vitest, the rest unchanged — Nest's default.

**Reasoning:** B, and two decisions taken earlier today pushed this line before it was asked.

**Vitest is now technical, not stylistic.** MikroORM v7 is a native ESM package, and the MikroORM
team, porting the Nest integration to v7, announced they had switched to Vitest — in their own words,
for lack of appetite to fight Jest over ESM. C is the option this decision most discourages: taking
Jest because `nest new` generates it means buying the exact fight the maintainer of our own ORM gave
up on.

**Testcontainers became mandatory rather than optional.** Decision 2 put `DEFAULT uuidv7()` on the
column and decision 5 fixed the floor at Postgres 18. No fake database has `uuidv7()`, so an
integration test needs a real Postgres 18. Testcontainers raises an isolated one per run; the
alternative is a `docker-compose` somebody has to remember to start and stop.

**Testing Library stays** — the component-testing standard, with no lighter equivalent.

**MSW and Playwright wait.** Both are good and neither has work on day zero: MSW mocks a network that
does not exist yet, and Playwright downloads a browser to walk screens that do not exist yet. They
are the two pieces whose installation can wait until there is something to test.

**Against B, honestly:** E2E that is not born with the project often is never born at all. If that
matches experience, A is defensible — the cost is a browser downloaded in the CI of a project with
no screens.

**Affects:** section 5 of `CLAUDE.md`, testing conventions (phase 1 onward)

---

## 2026-09-09 — The `web` stack, minus Zustand, with Zod returning as the form resolver

**Decision:** Vite, React, TanStack Router, TanStack Query, Tailwind, shadcn/ui and react-hook-form,
with **Zod** as the react-hook-form resolver. **Zustand is dropped.**

**Options considered:**
- A) Keep all eight.
- B) Keep, minus Zustand.
- C) Swap TanStack Router for React Router.

**Reasoning:** B.

**Zustand goes** because TanStack Query already owns server state, which is most of the state in any
real application. What remains of global client state is usually a theme and an open sidebar —
things React context handles. This is the same day-zero test that removed knip, MSW, Playwright and
ts-pattern: it has no work on day one. It is tiny, so installing it the day real global state appears
costs nothing.

**Zod returns on the client side.** Decision 9 removed it from the API in favour of class-validator
and recorded that it could return where there is a client. This is that place: react-hook-form needs
a resolver, the candidates are Zod, Valibot and Yup, and Zod is the one the project already knows.

**C refused:** TanStack Router was chosen for end-to-end route typing — typed params and search
params, and a link that does not compile when the route does not exist. React Router v7 became a
framework and grew in scope; swapping would trade away the guarantee that motivated the choice in
exchange for popularity. That is the trade decision 7 already refused.

**shadcn/ui is not a dependency** — components are copied into the project. The frozen era's decision
that the template ships shadcn's plumbing and not its components carries over unchanged.

This line covers the `web` type. The `site` type is Next and belongs to phase 3.

**Affects:** section 5 of `CLAUDE.md`, `web/` (phase 3)

---

## 2026-09-09 — The `mobile` stack, minus FlashList

**Decision:** Expo with prebuild, Expo Router, NativeWind, Reanimated, MMKV and expo-secure-store.
**FlashList is dropped.**

**Options considered:**
- A) Keep all seven.
- B) Keep, minus FlashList.
- C) Trim further — drop FlashList and MMKV, using FlatList and AsyncStorage.

**Reasoning:** B, on a criterion that emerged across the eighteen questions and is worth stating
because it decided this one.

**The day-zero test — does this have work on the day the project is born? — cut knip, MSW,
Playwright, ts-pattern and Zustand. It does not apply uniformly, and the discriminator is the cost of
arriving late:**

- Replacing a component later is a **swap**. FlatList becomes FlashList in an afternoon and nothing
  outside that file changes.
- Replacing storage later is a **migration**. Moving from AsyncStorage to MMKV means moving data that
  is already on the user's device.

This is the same logic that kept Better Auth despite its owning the user tables: **whatever owns data
is decided at the start; whatever draws a screen can wait.**

- **Expo prebuild, Expo Router, Reanimated** stay. Reanimated is not really a choice — the navigation
  stack depends on it.
- **NativeWind** stays for a reason beyond mobile: with Tailwind on web and NativeWind here, one
  styling language crosses both clients. For whoever writes — person or assistant — that is one
  convention instead of two.
- **expo-secure-store** stays and became mandatory through decision 11: it is where Better Auth's
  httpOnly cookie lives on mobile.
- **MMKV** stays, by the criterion above. It is the only item on the line whose late adoption costs a
  data migration rather than a file swap.
- **FlashList** goes. FlatList is built in and handles small lists, and the swap is local when lists
  grow.

**Against C:** it applies the day-zero test to MMKV, which is where the test fails.

**Affects:** section 5 of `CLAUDE.md`, `mobile/` (phase 3)

---

## 2026-09-09 — The brief targets 200 lines, with the overflow behind pointers

**Decision:** `CLAUDE.md` targets 200 lines. What does not fit moves into files the brief points at,
rather than being deleted.

**Options considered:**
- A) A 200-line target, overflow behind pointers.
- B) No target — the brief is as long as it needs to be.
- C) A 200-line target with nothing pointed at: what does not fit is cut.

**Reasoning:** A. The current brief is 434 lines and enters context every session. Claude Code's own
documentation targets under 200 lines and states that longer files consume more context and reduce
adherence — the vendor describing its own product, not a blog opinion. It applies beyond Claude too:
the `AGENTS.md` this project decided to generate has the same problem in any assistant.

The rules that must be read every session are few — the language rule, the prime directive, where
things live. The rest is reference: the eighteen-item stack is a lookup, not a rule of conduct, and
nobody needs it loaded to answer *which document are we writing next?*

**C refused:** it confuses *does not fit in context* with *not worth existing*. The stack does not fit
in the brief and must exist.

**A consequence that comes with it:** this repository now has an index and pointed-at files — Prumo
adopts internally the same structure it generates. That is a real change to the repository layout,
decided in D6.

**Affects:** `CLAUDE.md` (step 0.1), repository layout (D6)

---

## 2026-09-09 — The brief points; it does not describe what another step owns

**Decision:** `CLAUDE.md` carries one line and a path for anything a later step owns, and never a
description of it. Applied to the three places where the old brief did otherwise:

- **Build order** — lives only in `_plan/00-ROADMAP.md`.
- **Document template** — lives only in whatever step 0.3 produces.
- **`.context/` structure** — lives only in whatever step 0.2 produces.

**Options considered:**
- A) The brief points, never describes.
- B) The brief describes everything and later steps confirm it.
- C) A summary in the brief, detail with the owner.

**Reasoning:** A. It is the only option that makes contradiction impossible rather than unlikely.

This is how the previous era contradicted itself: the brief asserted the numbered `.context/`
structure, the documents evolved, and the brief kept asserting the old version for months. Section 11
of that brief lists the failure it caused — *context files that contradict each other: the AI picks
one at random.*

**C looks like the sensible middle and is the worst of the three.** Two sources of one truth always
diverge, and it is the short version that goes stale, because nobody remembers to update a summary.
C is precisely what the previous era practised.

**B inverts the order of work:** the brief would decide 0.2 and 0.3 before either is reached, turning
both steps into rubber stamps.

**What A costs:** the roadmap lives in `_plan/`, which says *delete when V1 ships*. If the build order
lives only there, it goes with it. That is correct — a build order is scaffolding, not an artefact,
and has no function once Prumo exists. Should it need to survive, its home is `DECISIONS.md`, not the
brief.

**Affects:** `CLAUDE.md` sections 7, 8 and 9 (step 0.1)

---

## 2026-09-09 — Prumo's own documents live in `docs/`, separate from the knowledge base

**Decision:** what leaves the brief goes to a `docs/` directory at the repository root, with an index
the brief points at. The knowledge base that ships to generated projects is built later, from step
0.2 onward, and derives from these documents.

**Options considered:**
- A) A Prumo `docs/` directory; the knowledge base built later, deriving from it.
- B) Inside the knowledge base, alongside what ships to generated projects.
- C) Keep it in the brief and accept going past 200 lines.

**Reasoning:** A.

**The distinction that decided it:** the locked stack list is **not** `.context/` content. A generated
project's `.context/api/` will say *the ORM is MikroORM, an entity is declared like this* — prose
written per area, in phase 1. The list of eighteen is Prumo's record of what is locked, and those
documents **derive** from it. One is source, the other is derived artefact.

B mixes source with derived artefact in one directory and, worse, requires guessing now the structure
step 0.2 owns — exactly what the previous decision forbade. C undoes the 200-line target.

**A side effect counted as a benefit:** Prumo gains an index and pointed-at documents, which is the
shape it generates. The tool eats its own cooking before serving it.

**Left out of this decision deliberately:** the shape of `templates/` under the type model, and the
name and organisation of the knowledge base. Those belong to phase 5 and step 0.2. The brief will
point at both without describing either.

**Affects:** repository layout, `CLAUDE.md` (step 0.1)

---

## 2026-09-09 — The brief states the type × architecture model, and nothing of the CLI's mechanics

**Decision:** `CLAUDE.md` states what Prumo produces — **type** (`api`, `web`, `mobile`, `site`) and
**architecture** (`alone`, `monorepo`) — and describes none of the scaffolder's mechanics. Questions,
execution steps, command table and script requirements belong to phase 6.

**Options considered:**
- A) The brief states the model, nothing of the mechanics.
- B) The brief states neither, pointing at the roadmap for both.
- C) The brief describes the whole CLI, as before.

**Reasoning:** A. The model is not *what phase 6 owns*. Phase 6 owns **how the CLI asks**; what the
answers mean is a premise every earlier phase depends on — phase 1 documents the `api` type, phase 4
the `monorepo` architecture, phase 5 builds one skeleton per type.

A brief that does not say what a type is forces every session to open the roadmap to follow its own
conversation, and the roadmap is the file marked *delete when V1 ships*.

Same reasoning that keeps PostgreSQL in the brief and the migration scheme out: one is a premise, the
other a consequence.

C is excluded by the pointing rule. **B carries the principle too far:** applied that way the brief
would assert nothing, and a brief that only points is not a brief.

**Affects:** `CLAUDE.md` section 10 (step 0.1)

---

## 2026-09-09 — The frozen era moves out of `DECISIONS.md`

**Decision:** the hexagonal / Fastify entries move to `docs/decisions-v0-hexagonal-fastify.md`.
`DECISIONS.md` begins at the Nest restart and carries a pointer to the archive at the top.

**Options considered:**
- A) One line in the brief pointing at the tag and the divider.
- B) A, plus moving the frozen era to its own file.
- C) Nothing — readers deal with the divider.

**Reasoning:** B. `DECISIONS.md` was 5,852 lines with the restart divider at 4,861: **83% of the file
was the frozen era, and it came first.** A session opening the file and reading down met three
thousand lines deciding Fastify, ports, `Result` and hexagonal layering before reaching anything in
force.

That is not untidy history, it is an active trap. Several of those entries are well argued and none
announces itself as dead — *Tenant filtering stays bound at construction* was cited as valid context
earlier in this very session, and it belongs to a world that no longer exists.

**A makes the mistake unlikely; B makes it impossible** — the same criterion applied to the pointing
rule. A depends on the warning being read before the content, and nobody reads a brief before
grepping a file. After the split the live file holds 30 entries in about 1,000 lines and contains
only decisions in force; the archive holds 206.

**Cost accepted:** it rewrites where history lives, and a link to a specific line of `DECISIONS.md`
in an old entry may break. Nothing external points here, so the cost is close to zero.

**Affects:** `DECISIONS.md`, `docs/`

---

## 2026-09-10 — `OPEN-QUESTIONS.md` is the only home for an open question

**Decision:** every open question lives in `OPEN-QUESTIONS.md`, with a `Blocks:` field naming the
step it belongs to. The roadmap's *Open questions carried across phases* table is removed and
replaced by a pointer.

**Options considered:**
- A) `OPEN-QUESTIONS.md` is the only home; the roadmap points at it.
- B) The roadmap is the only home until V1 ships; `OPEN-QUESTIONS.md` is deleted for now.
- C) Split by nature — the roadmap holds what blocks a step, `OPEN-QUESTIONS.md` holds parked ideas
  that block nothing.

**Reasoning:** A. This was the pointing rule violated on the day it was decided: two sources of one
truth. The asymmetry was worse than the duplication — the full house was the roadmap, which is marked
*delete when V1 ships*, and the empty one was the permanent file the brief cites in three places.

A is the only option where a question outlives the file hosting it. The roadmap is scaffolding and
goes; an open question has no deadline and some will outlast V1.

**C is the one that looks most organised and is the least trustworthy.** It requires someone to
classify each question correctly at the moment it is raised, and a misclassification means a question
in the wrong house, which in practice is a question lost. Same reason *keep neverthrow for specific
cases* was refused in decision 12/18: a boundary that depends on case-by-case judgement becomes two
competing conventions.

**Conversion was free:** `OPEN-QUESTIONS.md`'s existing format already has a `Blocks:` field, which
is the roadmap's `Needed by` column under another name.

**Q3 was closed rather than migrated** — *what replaces the locked-decisions section* was answered by
step 0.1. Ten questions moved; each gained the `Why it matters` the roadmap's one-line table had no
room for.

**Affects:** `OPEN-QUESTIONS.md`, `_plan/00-ROADMAP.md`, `CLAUDE.md` section 9

---

## 2026-09-10 — The generated project's folder is `.prumo/`

**Decision:** the folder written into a generated project is `.prumo/`, not `.context/`.

**Options considered:**
- A) `.context/` — the inherited name.
- B) `context/` — visible and generic.
- C) `.prumo/` — namespaced, dotted, matching the `~/.prumo/` cache already in the naming table.
- D) `prumo/` — namespaced, undotted.

**Reasoning:** C, proposed by the user against a recommendation of B.

**Collision is the argument.** `context` is a generic word that means several things, and a developer
may reasonably create a `context/` of their own with no bad faith. There is also no established
*directory* convention in the ecosystem to align with: `AGENTS.md` uses nesting rather than a folder,
and `.cursor/`, `.claude/` and `.github/` are all vendor-namespaced. Taking `context/` risks
colliding with a future standard that claims the name. `.prumo/` cannot collide with anything.

**A recommendation was withdrawn here, and the reason is worth keeping.** B was argued on the claim
that a dotted folder "rots in the basement" because it is hidden. That was overstated: VS Code,
JetBrains and most editors show dotfolders by default, so the hiding is limited to `ls`. The argument
was weaker than it was presented as.

**The dot tells the truth here, unlike in `context/`:** the folder is maintained by tooling —
`prumo add` writes into it, `prumo update` refreshes it. Marking that is accurate, not concealment.
D was the alternative; C won on consistency with `~/.prumo/`, the same name and shape on both sides of
the tool.

**A consequence that falls out for free:** namespacing the root gives the CLI's stored answers a
natural home inside `.prumo/`, rather than a loose `.prumorc` at the project root. That is E9's
question and is not decided here.

**What C costs:** naming the folder after the tool suggests the tool owns the content, and it does
not. The conventions inside belong to the team, written by them, and stay valid on the day someone
stops using Prumo — leaving a directory named after an abandoned tool.

**Affects:** `CLAUDE.md`, `_plan/00-ROADMAP.md`, every later reference to the generated folder

---

## 2026-09-10 — Six areas, and `site` is one of them

**Decision:** `.prumo/` holds six areas — `api/`, `web/`, `mobile/`, `site/`, `database/` and
`monorepo/`. `site` stays a type of its own.

**Options considered:**
- A) The roadmap's six.
- B) Five — `site` folded into `web` behind an SEO switch.
- C) Five — `site` deferred past V1, and the type leaves the brief for now.

**Reasoning:** A. **Areas deliberately do not mirror types.** `database/` is not a type: it is
separate so a future worker or lambda can take it without being an API. `monorepo/` is not a type
either — it is the architecture. The remaining four coincide with the four types.

**On Q4, now closed:** `web` and `site` share React and Tailwind and nothing else that matters.
Decision 17 locked TanStack Router and TanStack Query for `web`, and neither exists in Next, which
has the App Router and server-side data fetching. Routing, data fetching, build and deploy target
differ end to end. A single document would have to say *if Next do X, if Vite do Y* in nearly every
rule — the wrong-platform-advice anti-pattern, relocated inside the file instead of between files.
B is worse than it looks because the switch would not separate two values of one rule; it would
separate two stacks that do not touch.

**C was named as available and not taken.** It is a scope reduction — `site/` is one area to write in
phase 3 and one skeleton to maintain in phase 5 — and scope is the user's call, not the drafter's.

**Affects:** `.prumo/` structure, phases 3 and 5. Closes Q4.

---

## 2026-09-10 — The `api` type implies `database/`

**Decision:** every project of type `api` receives `database/`. The CLI does not ask, and it is not
opt-in.

**Options considered:**
- A) The type implies it.
- B) The CLI asks — an extra question, making an API without a database a first-class shape.
- C) Not shipped by default; `prumo add database` brings it when needed.

**Reasoning:** A. Nearly every API persists something. C inverts the common case: most projects
would start without the conventions that matter most, depending on someone remembering a command. B
spends one of the CLI's two questions to serve a rare shape — a gateway, a proxy, a webhook relay.

**A distinction drawn before deciding, because the anti-pattern does not cover this case.**
*Shipping conditional context unconditionally* is about **wrong** advice: React Native primitives in
a DOM component make an assistant write broken code. Database conventions in an API with no database
produce no wrong code — they produce **unused** context, costing token budget each session and
nothing else. Different orders of damage, and the anti-pattern was not used to settle a case outside
its scope.

**What A accepts:** an API without persistence receives a folder it does not use, and deleting it is
trivial.

**What A does not deliver, recorded so it is not claimed later:** if only `api` brings `database/`,
the separation buys nothing today — it is entirely a bet on future types. Legitimate, and different
from *the separation already pays for itself*.

**Affects:** `.prumo/` inclusion rules, phase 6. Closes Q2.

---

## 2026-09-10 — `core/` exists, and it is the only unconditional area

**Decision:** `.prumo/core/` is included in every generated project, whatever its type or
architecture. It holds what crosses every type: TypeScript configuration, Biome and the pre-commit
hook, Vitest, file naming and code style.

**Options considered:**
- A) A common area, always included.
- B) No common area — each area repeats what it needs.
- C) No common area — what crosses lives inside `AGENTS.md`, which every project has by definition.

**Reasoning:** A. It is the only option where a rule has one home. B means four copies of the
TypeScript rule across `api`, `web`, `mobile` and `site`, and four copies diverge — the
contradicting-documents anti-pattern, where the stale copy is always the one somebody forgot.

**A useful side effect:** being the only unconditional area, `core/` is the first thing the index
points at, so an assistant has ground under it even in a single-type project.

**C looks economical and breaks something else:** `AGENTS.md` is the pointer, and the 200-line
decision fixed that a pointer has a budget — roughly fifteen lines, not a document. Putting
TypeScript, Biome and testing rules inside it turns the pointer into the content, which is exactly
what step 0.1 dismantled in the brief.

**What A costs:** an always-included area is always-loaded context. It has to stay small, and the bar
for entering `core/` is **crossing every type in fact**, not seeming general. If it bloats, every
project pays on every session.

**Affects:** `.prumo/` structure, phase 6 inclusion rules

---

## 2026-09-10 — One file per subject, decided by a test rather than a quota

**Decision:** an area holds one file per subject, where *subject* is settled by a test: **would an
assistant ever need this without the rest?** If the answer is no, the two subjects are one file.

**Options considered:**
- A) Many small files, one per subject — the frozen era's model, ~33 documents.
- B) Few large files — one or two per area.
- C) One file per subject, with the test above deciding what a subject is.

**Reasoning:** C. A and B both pick a number before knowing what there is to write, and the right
number is a consequence of the content, not a premise. The test makes granularity verifiable file by
file, at the moment of writing, instead of a quota fixed today in the dark.

**It also encodes what the frozen era got wrong in both directions.** With 33 documents, this
repository found four asserting things absent from the tree and three disagreeing with each other; it
also found five files per feature carrying no guarantee at all. A file only ever read alongside
another does not justify existing, and that is the ruler that would have caught them.

**What C does not solve:** it is a judgement, and judgements err. The difference from *keep
neverthrow for specific cases*, refused in decision 12, is frequency and locus — that judgement was
per function, thousands of times, by different people. This one is once per document, by the two
people at this table. Rare, centralised judgement is acceptable; frequent, distributed judgement is
not.

**Affects:** every area under `.prumo/`, phases 1 through 4

---

## 2026-09-10 — Plain file names, no numbering

**Decision:** files inside an area are named for what they hold — `modules.md`, `routes.md` — with no
numeric prefix.

**Options considered:**
- A) Numbered within the area — `10-modules.md`, `20-routes.md`.
- B) Plain names.
- C) Numbered only where reading order genuinely matters.

**Reasoning:** B. The number used to do two jobs: group by subject and impose reading order. **The
folder now does the grouping** — `database/` already says the file is about the database, so `30-` is
redundancy. Reading order is the index's job.

**Numbers age badly, and this repository has seen how.** Inserting between 10 and 20 works until the
third file, and renumbering to tidy up breaks every link — including, once Q6 is decided, every
path-scoped rule glob, which points at file names. A stable name is worth more than an ordered one
once something else depends on it.

**C is the worst of the three despite looking balanced:** a folder holding `10-modules.md` beside
`routes.md` communicates neither order nor its absence — it communicates that someone gave up
halfway.

**What A delivers and B loses:** opening the folder in a file tree and seeing the order without
consulting an index. Worth something to a human, nothing to an assistant, which reads the index
anyway.

**Affects:** every area under `.prumo/`

---

## 2026-09-10 — `INDEX.md` is generated; `AGENTS.md` points at it and stays still

**Decision:** the CLI generates `.prumo/INDEX.md`, one line per file across the areas the project
received. `AGENTS.md` points at it in a single line.

**Options considered:**
- A) A generated `.prumo/INDEX.md`, with `AGENTS.md` pointing at it.
- B) No separate index — `AGENTS.md` lists the areas and files itself.
- C) Fixed indexes, one pre-written per combination of type and architecture.

**Reasoning:** A, and the deciding argument is ownership rather than size.

**`AGENTS.md` is where the team writes its own things** — the file someone opens to add *our deploy
works like this*, *do not touch X*. If `prumo add database` has to rewrite `AGENTS.md` to update the
list, it rewrites a file containing human edits. A tool that rewrites a hand-edited file loses
content sooner or later.

A separates on exactly that line: `INDEX.md` is the tool's territory, nobody edits it, and
regenerating is safe. `AGENTS.md` is the team's territory and stays still after generation.

**Size comes free:** the 200-line decision gave `AGENTS.md` a pointer's budget, and one line per file
across six areas exceeds it on its own.

**C is combinatorial:** four types and two architectures produce more combinations than are worth
maintaining by hand, and every new file in any area would mean editing all of them.

**Affects:** `.prumo/INDEX.md`, `AGENTS.md`, phase 6

---

## 2026-09-10 — The inclusion rule is one explicit table in the CLI

**Decision:** which area ships with which project is a single explicit table, living in the CLI.

| Area | Ships when |
|---|---|
| `core/` | always |
| `api/` | type is `api` |
| `database/` | type is `api` |
| `web/` | type is `web` |
| `mobile/` | type is `mobile` |
| `site/` | type is `site` |
| `monorepo/` | architecture is `monorepo` |

**Options considered:**
- A) One explicit table in the CLI.
- B) Each area declares in its own manifest which type it applies to; the CLI reads the manifests, so
  adding an area is a data change rather than a code change.
- C) Convention by name — the area called `api` ships with type `api` — with `core` and `database` as
  exceptions in code.

**Reasoning:** A. Seven rows, and at that size explicit beats implicit without argument. **C hides two
exceptions inside a convention**, and an exception hidden in a convention is what rots first: a reader
sees the rule and does not see the two that escape it.

**Against B, which most resembles "correct architecture":** it spreads one rule across six files to
buy flexibility no user has today — the day-zero test again, and the opposite of the single-home
principle applied throughout this session. A rule in six places is six places to diverge.

**What A costs:** on the day a `worker` type arrives, someone edits the CLI. One line, in one file,
with a test around it.

**Affects:** phase 6, `.prumo/` inclusion

---

## 2026-09-10 — The CLI's stored answers live inside `.prumo/`

**Decision:** what the project answered — type, architecture — is stored inside `.prumo/`, beside the
areas it describes. Not at the project root.

**Options considered:**
- A) Inside `.prumo/`, beside the areas.
- B) At the project root, as its own file.
- C) No file — the CLI asks again when it needs to know.

**Reasoning:** A. The answers describe what is inside `.prumo/`, and keeping the descriptor away from
the described is like keeping a book's index in another drawer. A project root already competes for
attention with `AGENTS.md`, `CLAUDE.md`, `package.json`, `tsconfig.json` and the rest; one more tool
dotfile there is noise.

**C is refused:** with no record, `prumo add` cannot know whether the project is a monorepo, and
asking again invites an answer that diverges from the original — producing a project half one shape
and half another.

**A consequence put on the table rather than discovered:** `.prumo/` now holds two natures — prose a
human edits and maintains, and state only the tool writes. That is acceptable, and it has to be
**visible in the structure** rather than found out by someone who edited the wrong file.

**Format is not decided here.** JSON, YAML or key=value depends on what the CLI is written in, which
phase 6 owns. Parked as an open question.

**Affects:** `.prumo/` structure, phase 6

---

## 2026-09-10 — One document template, not two

**Decision:** every document under `.prumo/` uses the same template. There is no second shape.

**Options considered:**
- A) One template.
- B) Two — a convention template (a rule, in the imperative) and a reference template (fact without
  imperative: what is installed, what the area covers).
- C) No fixed template — mandatory frontmatter fields, free body.

**Reasoning:** A. The template exists so an assistant applies it without supervision — **the
consistency is the product.** Two templates mean somebody chooses, and choosing wrong is how the
frozen era produced capability files that skipped the port. One shape removes the choice.

**The factual argument:** no document that is not a rule can be named today. Across all seven areas —
TypeScript, Biome, testing, naming, modules, routes, errors, authentication, migrations, queries,
workspace organisation — every one is a rule. If a genuine second kind appears in phase 1, with an
example in hand rather than imagined, it is decided then. The day-zero test applied to the template
itself.

**C is refused:** a free body means every document has a different shape, and then an assistant can
rely on no structure at all — which is exactly what the template buys.

**What A costs:** when a reference document does appear, it will be squeezed into a rule-shaped
format and sit awkwardly until the second template is decided.

**Affects:** every document in phases 1 through 4

---

## 2026-09-10 — No `reviewed:` field; age comes from git

**Decision:** documents carry no `reviewed:` date. When a document last changed is answered by git.

**Options considered:**
- A) `reviewed: YYYY-MM` in frontmatter, maintained by hand.
- B) No field — age comes from git.
- C) The field plus an automated check that fails past N months.

**Reasoning:** B, on evidence from this repository rather than principle.

The frozen era carried `reviewed:` on all 33 documents. In a single day this repository found **four
documents asserting things absent from the tree**, three disagreeing with each other, one check that
never fired and eleven pointers to nothing. The dates were there the whole time.

The reason is structural, not carelessness: **`reviewed:` is self-reported. It measures attention,
not truth.** It records when someone claims to have looked, and someone who edits without bumping it
— or bumps it without checking — produces exactly the same field. Git answers *when did this last
change* for free, automatically, and cannot lie.

**C is worse than A**, and this is the part worth keeping: a check that fails on age trains people to
bump the date to make it green. That does not fix the field's failure mode — it automates it.

**What B does not solve, stated because none of the three options does:** git says a document has not
changed in a year and cannot say whether that is a stable, correct convention or a rotten document.
What would answer it is a check that verifies what a document **asserts** against the repository —
the kind of check that found the four lying documents. That is later work and is not promised here;
it is only recorded that the answer lives there and not in frontmatter.

**Affects:** the document template. Closes Q5.

---

## 2026-09-10 — No `applies-to:` globs in frontmatter

**Decision:** documents do not declare the paths they govern in frontmatter. Whether to generate
path-scoped assistant rules is decided later, with the source layout in hand.

**Options considered:**
- A) A mandatory field from the start.
- B) No field — decide if and when path-scoped rule generation is built.
- C) An optional field — whoever knows the path declares it.

**Reasoning:** B, and two things asserted earlier in this session had to be corrected to reach it.

**First, this overturns an earlier "now or never".** The assistant-layer decision recorded that
without the field, generating path-scoped rules later would mean *rewriting all of them*. That was
overstated. Adding one frontmatter line to N files is a scriptable edit, not a content rewrite. The
cost of deferring is far smaller than it was presented as.

**Second, and this is what decides it:** a glob describes the **generated project's source layout** —
something like `src/modules/**/*.controller.ts`. That layout is decided in phase 5, with the
templates. Writing globs now means guessing paths that do not exist yet, and a glob pointing at a
non-existent path produces a rule that never fires — literally one of the defects this repository
catalogued in the frozen era.

**C is the worst of the three:** optional metadata is half-populated metadata, and no generator can
rely on a field only half the files carry. It costs what A costs and delivers none of A's guarantee.

**What B defers, honestly:** on the day path-scoped generation is built, someone walks the existing
documents and adds the field. With the layout decided that is one pass; without it, it would be
guesswork now and correction later.

**Affects:** the document template. Closes Q6.

---

## 2026-09-10 — Five sections, no frontmatter

**Decision:** every document is a title plus five sections — **Rule, Rationale, Applies to, Examples,
Enforcement**. There is no frontmatter.

**Options considered:**
- A) The five sections, no frontmatter at all.
- B) Rule, Rationale and Enforcement only — dropping Applies to and Examples.
- C) The five, keeping frontmatter with `scope:`.

**Reasoning:** A.

**Frontmatter had nothing left to carry.** `reviewed:` was dropped in the previous decision and
`applies-to:` was never adopted. `scope:` says what the *Applies to* section says — two homes for one
truth, refused consistently throughout this session.

- **Rule and Rationale** are not in question. A rule without its reason is misapplied at the edges;
  an assistant needs the why to generalise correctly.
- **Applies to** answers *where does this bite*, and in prose it is more robust than a glob: "every
  entity class" does not depend on a path that does not exist yet.
- **Examples**, as ✅/❌ contrast, are the highest value per line for a reader that is a machine. Their
  size is governed separately.
- **Enforcement** is the one most worth keeping, for a specific reason: it forces the writer to admit
  *review only* when nothing verifies the rule. With dependency-cruiser dropped, many rules will land
  there — and a repository that has already found two checks lying and one rule that never fired has
  cause to make that explicit rather than implicit.

**What A costs:** five headings in a document about file naming is visible ceremony — Rule one line,
Rationale one line, Enforcement one word. Predictable ceremony is what lets an assistant stop
thinking about form. But it is ceremony, and **a document that ends up with three one-line sections
is a signal it should be merged with another** under the subject test.

**Affects:** every document in phases 1 through 4

---

## 2026-09-10 — Code in a document shows shape, never a program

**Decision:** examples show **form**, not working code. The test: **could this be copied into a file
and run?** If yes, it is too much.

**Options considered:**
- A) A line limit — no block longer than N.
- B) A test of nature: shape, never a program.
- C) No code at all — examples in prose.

**Reasoning:** B. A is measurable and arbitrary. Ten lines of dense code rot worse than twenty of
trivial contrast, and a number invites squeezing a bad example under the limit instead of removing
it.

**B attacks the cause.** What rots is code that **claims to work** — it carries imports, versions and
API signatures, and all of those change underneath it without warning. A fragment of shape claims
none of that:

```
✅  name!: string
❌  name: string
```

That cannot break with the next release of any library, because it depends on none.

**The test also organises:** the day someone genuinely needs to show running code, the answer is not
*make it shorter* — it is *this belongs somewhere a compiler looks at it*. Which place that is
belongs to phase 5 or 7 and is not decided here.

**C is refused:** the ✅/❌ contrast is the highest yield per line for an assistant, and prose
describing code is worse than the code.

**Affects:** the Examples section of every document

---

## 2026-09-10 — No line budget per document

**Decision:** documents carry no size limit. A large document is a symptom that the subject was badly
separated, not an infraction.

**Options considered:**
- A) A number — no document longer than N lines.
- B) No number; the subject test already bounds it.
- C) A number for `core/` only, the always-loaded area.

**Reasoning:** B. **A limit on a document is a workaround waiting to happen.** Whoever exceeds it does
not cut content — they split the subject across two files to fit, and then there are two documents
only ever read together, which is precisely what the subject test exists to prevent. The limit would
manufacture the defect the other rule fights.

Two rules already bound size without a number: **one file per subject**, and `core/`'s admission bar
— *crossing every type in fact*, not seeming general.

**C has real merit**, since `core/` is structurally different in being unconditional. It was not taken
because `core/` is already governed by its admission bar, which is the better control: it limits what
gets in rather than how much is written about what is already in.

**What B does not give:** nothing fires on its own when a document bloats. It stays a review concern,
and review forgets. If an alarm is wanted later, C is the more defensible of the two numeric options —
it puts the alarm only where the cost is paid every session.

**Affects:** every document in phases 1 through 4

---

## 2026-09-10 — Imperative in the Rule section; exceptions are named, never hedged

**Decision:** the **Rule** section is written in the imperative. Other sections use whatever voice
fits. An exception to a rule is **stated by name**; hedging words — *should*, *generally*, *prefer*,
*usually* — do not appear in a Rule.

**Options considered:**
- A) Imperative throughout the document.
- B) Imperative required in Rule; other sections free.
- C) No rule — the writer's taste.

**Reasoning:** B.

**What is at stake is not style.** Hedged language grants explicit permission not to comply. An
assistant reading *tables should generally have `tenant_id`* is authorised, by the sentence itself,
to create one without. That is not misreading — it is what the sentence says.

**Why B and not A:** the Rationale section exists to explain, and explanation is not an imperative.
*This exists because indexes on UUID v4 fragment* is correct as written and would read worse forced
into a command. A would apply the rule where it does not fit, and a rule that does not fit gets
ignored — teaching that the template is a suggestion.

**The corollary is what stops the imperative from becoming a lie:** if a rule has exceptions, the
document names them. *Every table has `tenant_id`, except those in Better Auth's schema* is both
imperative and true. *Tables generally have one* is false and permissive at once — it hides the
exception and dissolves the rule in the same breath.

**C is refused:** without a rule, voice varies by document and by day, and the assistant has to judge
how much of a sentence is obligation. That is precisely the judgement the template exists to remove.

**Affects:** every document in phases 1 through 4

---

## 2026-09-10 — Everything touching data lives in `database/`

**Decision:** `api/` documents no data access. How a service reads and writes — the EntityManager,
queries, transactions — is `database/`'s. The `api/` documents point at it.

**Options considered:**
- A) Everything touching data lives in `database/`; `api/` points and repeats nothing.
- B) `api/` documents how a service uses data; `database/` keeps schema, migrations and performance.
- C) Pull `database/` forward into phase 1 and write both areas together.

**Reasoning:** A. It is the only option that keeps standing the reason the areas were separated:
`database/` is apart so a future `worker` or `lambda` can receive it without being an API. Under B,
the day that type arrives someone has to extract from `api/` the part that serves it — and extracting
a rule from inside a document is the kind of operation that leaves a copy behind.

The single-home principle settles the rest: *how data is fetched* is one rule, and it does not become
two by being read from two places.

**C was refused on ordering, not merit:** writing two areas at once is the opposite of *one document
at a time, never start the second before the first is approved*. Phase 2 exists for it and follows
immediately.

**What A costs:** the API documents carry a pointer where a reader wanted an answer, which is one hop
more. No reader is left short — decision E3 guarantees an `api` project receives both areas.

**Affects:** `api/` (phase 1), `database/` (phase 2)

---

## 2026-09-10 — `api/` holds eight documents

**Decision:** the `api/` area contains `modules.md`, `routes.md`, `errors.md`, `pagination.md`,
`auth.md`, `config.md`, `logging.md` and `observability.md`.

**How the list was derived:** starting from the frozen era's eight and cutting what Nest now decides.
`20-layers`, `21-dependency-rules` and `22-module-anatomy` go, because there is no hexagonal layering
left to describe; `23-code-style` moved to `core/`. Four survive — routes, errors, pagination, auth.
The rest of the list is what never had an owner.

**Merges made under the subject test:** `routes.md` holds controllers, DTOs and the OpenAPI
decorators together, because the three are written in one act. Nobody writes a controller without its
DTO, and `@nestjs/swagger` reads the same class-validator decorators. Splitting them would produce
three documents only ever read together — the defect the subject test exists to prevent.

**Two boundaries decided rather than assumed:**

- **`pagination.md` stays separate** from `routes.md`. Someone writing a POST does not need it, and
  the shape of a paginated response is a contract with the client, like the error format. Contracts
  earn their own document.
- **`config.md`, `logging.md` and `observability.md` stay separate** rather than becoming one
  `runtime.md`. Adding an environment variable does not require Sentry, and logging is not only a
  boot concern. **If each lands with three one-line sections, the template itself says they should
  have been merged** — that is a signal to act on when writing, not a decision to pre-empt now.

`config.md` answers Q10 and `logging.md` answers Q11.

**Affects:** phase 1

---

## 2026-09-10 — One module per resource

**Decision:** a module exists per resource — `users`, `orders`, `invoices`. Not per aggregate, and
not by judgement.

**Options considered:**
- A) One module per resource.
- B) One per aggregate, on the transactional boundary: entities that always change in one transaction
  are one module.
- C) No rule — a module when it feels right.

**Reasoning:** A, and not in the weak sense of *it is the default*. `nest g resource users` generates
a module, controller and service under that name; Nest's documentation is organised that way; and
every example an assistant has seen has that shape. Choosing anything else means the assistant writes
the wrong form out of habit and the document has to fight it every session.

**Against B, the technically stronger criterion:** a transactional boundary is the right rule in a
rich domain, and it is vocabulary the restart removed along with the hexagonal layering. It also
requires knowing the boundary before the first module is written, which is exactly when nobody knows
it.

**C is not an option:** with no rule, two developers produce two designs and the assistant picks one
at random.

**What A costs, and where it is answered:** a resource is not an aggregate. Cases will arise where two
entities belong to one transaction and sit in different modules, and someone will inject one
module's service into the other. That is M4's question, not a gap.

**Affects:** `api/modules.md`

---

## 2026-09-10 — A module's anatomy is what `nest g resource` produces

**Decision:** a module contains exactly what Nest's generator emits — `*.module.ts`,
`*.controller.ts`, `*.service.ts`, `dto/`, `entities/` and the co-located spec files. Nothing is
added, and nothing is trimmed by case.

**Options considered:**
- A) The anatomy is exactly what `nest g resource` produces.
- B) That, minus whatever does not justify itself case by case.
- C) An anatomy of our own design.

**Reasoning:** A, and the argument is not *it is the default*: with A the **generator and the
convention never disagree**. Someone runs `nest g resource` and receives a conforming module with no
post-editing. Any other choice creates a correction step after every generation, and a correction
step is the thing people forget.

**C is the measured mistake.** Designing an anatomy is what produced the frozen era's 13 files and 280
lines per feature, five of which carried no guarantee at all — the errors file existing only to
satisfy `no-circular`, a use case wrapping `findById`, the module factory, a trivial mapper and the
status table.

**B is the recurring trap:** *the convention, minus exceptions* turns a convention into a judgement
made per module. The cost it avoids is one unused DTO file, deleted in two seconds.

**A boundary declared here, following from the data-access decision:** the entity **file lives** in
the module, and this document says so. **How** an entity is declared — `defineEntity`, `tenant_id`,
`timestamptz` — is `database/`'s. Where the file sits is anatomy; what is inside it is the database.

**A consequence recorded so it does not vanish:** the generated `.spec.ts` files arrive Jest-shaped,
and the project runs Vitest. The anatomy is unchanged; the contents differ. That belongs to
`core/testing.md`.

**Affects:** `api/modules.md`, `core/testing.md`

---

## 2026-09-10 — A module exports its service; internals are `private`

**Decision:** a module exports its service. What is internal to the service is `private` on the
class. There is no reduced interface and no injection token.

**Options considered:**
- A) Export the service whole, with no rule about its surface.
- B) Export the service, with internal methods `private` — the boundary is TypeScript visibility, not
  a second layer.
- C) Export a reduced interface behind a separate injection token.

**Reasoning:** B. It does not deviate from Nest: exporting the service **is** the documented
convention, and `private` is plain TypeScript discipline inside the class rather than a new layer.
C was the option that departed from Nest.

**C is the port returning through the back door.** It brings `@Inject` with a token, an interface to
maintain and another file per module — exactly what *no architectural depth* refused. Nest injects by
runtime token precisely because TypeScript interfaces do not exist at runtime, so the ceremony is
real and the restart already priced it.

**A and B produce the same `@Module`.** The difference is that B gives the person writing the service
a rule: a method serving only its own module is `private`, and the compiler then prevents the leak
with no ceremony. Free enforcement, which is the criterion that kept `strict` in decision 7.

**What B does not solve:** `private` guards against accidental injection, not against someone making
the method public next week to reach it. Nothing verifies that — it belongs under **review only** in
the Enforcement section, and it is better written there than assumed.

**Affects:** `api/modules.md`

---

## 2026-09-10 — Modules do not depend on each other in a cycle

**Decision:** a module reaches another through `imports: [OtherModule]` and injection of what it
exports. Referencing another module's entity is allowed, because ORM relations require it and an
entity is not a provider. **Cycles do not exist:** when two modules need each other, the common part
moves to a third module. `forwardRef` is not used. **Barrel files inside a module are not used.**

**Options considered:**
- A) Cycles are acceptable, resolved with `forwardRef` — the path Nest documents.
- B) Cycles do not exist; the common part is extracted.
- C) Free.

**Reasoning:** B, following Nest rather than against it. **Nest's own recommendation is to avoid
them** — its circular-dependency page says they "should be avoided where possible" and presents
`forwardRef` as the escape hatch, alongside three caveats. Adopting the escape hatch as the
convention is reading that page backwards.

**The caveats are expensive in this specific stack.** Nest documents that the order of instantiation
becomes indeterminate; in a project with a Sentry bootstrap and a database connection, that is the
class of bug that appears once in production and does not reproduce. Nest also warns that cycles with
`Scope.REQUEST` providers can yield undefined dependencies.

**What B costs, plainly:** at the moment a cycle appears somebody restructures — extracting the common
piece into a third module — where `forwardRef` would have resolved it in thirty seconds. B buys design
at the cost of speed, and that is the trade.

**Barrel files are refused on Nest's own warning:** importing through an `index.ts` in the same
directory creates cycles nobody can see, and Nest names this specifically. Unlike the rest of this
decision, it is verifiable by lint rather than review.

**Verified before deciding**, at Nest's documentation, rather than recalled.

**Affects:** `api/modules.md`

---

## 2026-09-10 — No shared module; shared things get a name

**Decision:** there is no `SharedModule`. Anything serving more than one module becomes a module named
for what it does — `notifications`, `pdf`, `storage`. A pure function is a function in a file,
imported directly, with no module at all.

**Options considered:**
- A) No shared module; shared things get their own named module.
- B) A `SharedModule` for what does not deserve its own name.
- C) `CoreModule` plus `CommonModule`, the Angular split.

**Reasoning:** A.

**The distinction that settles half the question: not everything shared is a provider.** A pure
function — formatting a date, building a slug — is a function in a file. It needs no module, no
injection, no decorator. A module is for what has dependencies or a lifecycle.

**`SharedModule` has no admission criterion.** *Is this shared?* answers yes for anything used twice,
so it only grows — the junk drawer, which is that pattern's known destination. Requiring a name forces
the question *what is this, actually*, and that question is what keeps the boundary honest. **A module
nobody can name is a module that should not exist.**

A remains Nest's own pattern: the documented "shared module" is just *a module that exports
providers*, which is what every module under A already is.

**C imports Angular vocabulary into Nest**, and its distinction — core for singletons imported once,
common for reusable — has no function here, since every Nest module is a singleton by default.

**What A costs:** something with an injected dependency, too small to deserve a name, forces a name to
be invented — and a bad name is worse than none.

**Affects:** `api/modules.md`

---

## 2026-09-10 — The knowledge base lives in `.prumo-templates/`

**Decision:** the source documents the scaffolder copies into a generated project's `.prumo/` live in
`.prumo-templates/` at this repository's root, one directory per area.

**Options considered:**
- A) `context/` at the root.
- B) `.prumo-templates/` — the name says where the content goes.
- C) `templates/context/` — inside `templates/`, since everything there is what gets copied.

**Reasoning:** B, chosen by the user against a recommendation of A.

**C is refused on both:** `templates/` holds code that runs and that CI can verify. The knowledge base
is prose that nothing compiles. Two natures with different verification stories, and mixing them gives
`templates/` two internal rules. The frozen era kept them as siblings and that part worked.

Between A and B, B removes a translation step: a reader seeing `.prumo-templates/` here and `.prumo/`
in a generated project needs no explanation of which becomes which. A's collision argument from the
folder-naming decision does not apply in this repository, since this is not a generated project — so
what remained was clarity, and B is clearer at the cost of a longer name.

**A gap this closed:** step 0.2 settled the structure a generated project receives and never said
where the sources live here. The brief's layout section had deferred it to 0.2, and 0.2 addressed only
the generated side. It surfaced as a blocker the moment the first document had to be written.

**Affects:** repository layout, `CLAUDE.md` section 8, phase 6

---

## 2026-09-10 — Global `api` prefix, plural resources, kebab-case

**Decision:** the application sets a global prefix of `api`. Resources are plural, kebab-case for
compound words. REST verbs, with Nest's default status codes.

**Options considered:**
- A) Global `api` prefix, plural, kebab-case.
- B) No global prefix — a proxy separates the API from anything else.
- C) A prefix configurable by environment variable.

**Reasoning:** A, and one concrete interaction with the authentication decision settled part of it.
Better Auth mounts at `/api/auth/*` by its own convention. With `setGlobalPrefix('api')` and a
`@Controller('auth')`, the resulting path is exactly `/api/auth/*` — no exception required. Without a
global prefix, the auth controller would have to carry `/api` in its own path and would become the
one route outside the pattern, and an exception inside a convention is what this project has refused
since the inclusion rule.

Plural and kebab-case have no strong technical argument either way. What matters is that a rule
exists: without one, half the routes are born `/user` and the other half `/users`.

**C is refused:** a route path that changes per environment breaks the generated client, breaks the
published OpenAPI document, and turns *what is the URL* into a question with no fixed answer.

**B is defensible only if every deployment has a proxy in front**, and Prumo cannot assume that,
because it does not know where the project will run.

**Affects:** `api/routes.md`, `api/auth.md`

---

## 2026-09-10 — URI versioning from day zero

**Decision:** the API versions by URI, using Nest's `VersioningType.URI`. Routes are `/api/v1/...`
from the first commit.

**Options considered:**
- A) No versioning; a breaking change becomes a new route under another name.
- B) URI versioning from day zero.
- C) Header versioning — a clean URL with the version in `Accept-Version` or similar.

**Reasoning:** B. The day-zero test would cut this outright — a fresh project has one version and no
consumers. It does not apply here for the reason recorded with the mobile stack: **the test does not
hold where arriving late costs a migration rather than a swap.** A URL is a contract with consumers.
Changing `/api/users` to `/api/v1/users` in year two breaks every client at once, including a
published mobile app, which does not update when you want it to.

Today it costs five characters. Later it costs a coordinated migration of every consumer — the same
asymmetry that kept MMKV and dropped FlashList.

**URI rather than header, for a practical reason:** a version in the URL shows up in logs, in caches,
in a `curl` line and in a Sentry error report. A version in a header disappears from all of those
exactly when you are debugging why v1 broke.

**What B costs:** a `v1` that never becomes `v2` is noise, and worse, implies a versioning policy
nobody maintains. For an API consumed only by its own first-party clients, A is honest — you control
both sides and migrate together.

**Affects:** `api/routes.md`

---

## 2026-09-10 — `ValidationPipe` rejects unknown properties

**Decision:** the global `ValidationPipe` runs with `whitelist: true`, `forbidNonWhitelisted: true`
and `transform: true`. `enableImplicitConversion` stays off. Input DTOs keep the generator's names —
`CreateUserDto`, `UpdateUserDto` — in `dto/`.

**Options considered:**
- A) `whitelist` + `forbidNonWhitelisted` + `transform`; an undeclared field fails with 400.
- B) `whitelist` + `transform`; an extra field is stripped silently.
- C) Nest's default — validate what is decorated, pass the rest through.

**Reasoning:** A. This is a security choice, not a style one.

**C is the classic mass-assignment failure.** Without `whitelist`, a property nobody decorated crosses
the pipe and reaches the service. A client sends `{ "email": "...", "role": "admin" }` to a DTO
declaring only `email`, and `role` survives; any spread of that object into an entity downstream is
privilege escalation through an extra field.

**Between A and B, the deciding difference is silence.** Under B the client sends `role: admin`,
receives 200, and nothing indicates the field was discarded — it looks like success. That hides the
honest bug and the malicious attempt equally. Under A the client gets a 400 naming the unexpected
property, and both situations become visible.

**`transform` on, `enableImplicitConversion` off.** Implicit conversion coerces primitives by
inference and its coercions surprise — an empty string becoming zero, `"false"` becoming `true`.
Explicit `@Type()` on the field that needs it is predictable; the implicit form adds a class of silent
bug.

**What A costs:** a client sending a harmless extra field now breaks, and a form library attaching
metadata to the payload is the common case. Loosening later is one line; tightening later means
finding every client that has come to rely on the slack.

**Affects:** `api/routes.md`

---

## 2026-09-10 — Routes return the entity, serialized by `ClassSerializerInterceptor`

**Decision:** a route returns the entity. `ClassSerializerInterceptor` serializes it, with `@Exclude`
on the entity class marking what must not leave. Where the value arrives as a plain object,
`@SerializeOptions({ type: Entity })` converts it. There are no per-route response DTOs.

**Options considered:**
- A) An explicit response DTO per route.
- B) The entity, serialized by `ClassSerializerInterceptor` with `@Exclude`.
- C) The raw entity.

**Reasoning:** B, after the recommendation on the table was A and the user asked which Nest prefers.
Nest's serialization page is built entirely around `ClassSerializerInterceptor` with class-transformer
decorators on the entity class — its canonical example is `UserEntity` with `@Exclude() password` —
and it frames that as *"a measure of centralized enforcement of this business rule"*.

**An objection raised against B was wrong and is withdrawn.** B was argued to depend on unproven
behaviour, since MikroORM entities are POJOs at runtime and `ClassSerializerInterceptor` needs a class
instance. Nest documents exactly that case and supplies the answer: `@SerializeOptions({ type })`
converts a plain object to an instance and applies the decorators. It was documented, not unproven.

**And A's advantage was overstated.** B was criticised for failing open — a new column appears in
responses unless somebody remembers `@Exclude`. True, but A fails open elsewhere: exclusion in A is
not declared, it is a consequence of each DTO being built correctly. Three response DTOs over one
entity each have to remember to omit `tenant_id`, and so does the fourth someone adds tomorrow. B
declares it once, on the entity, for every route — which is what Nest means by centralized.

**The standing direction settled the rest:** follow Nest's best practices. The same conflict was
resolved the same way in decision 9, when class-validator won over Zod.

**C is refused:** with nothing in between, `tenant_id` and every future column become part of the
public API by accident.

**What B costs, recorded so it is not discovered later:** adding a sensitive column without `@Exclude`
leaks it. Nothing verifies that — it belongs under **review only** in Enforcement, which is what that
section exists for.

**Verified at Nest's and MikroORM's documentation before deciding, not recalled.**

**Affects:** `api/routes.md`

---

## 2026-09-10 — A controller only delegates

**Decision:** a controller receives the request, calls the service and returns. Beyond that it carries
only decorators — route, version, guard, OpenAPI.

**Options considered:**
- A) Delegate only.
- B) The controller may hold simple presentation logic.
- C) Free.

**Reasoning:** A. It is Nest's own convention — controllers handle HTTP and delegate the rest to
providers — and the serialization decision narrowed it further: with the entity leaving through
`ClassSerializerInterceptor`, there is not even a response transformation left for a controller to
perform.

**"Simple presentation logic" has no definition**, and in practice it is the door through which
business rules enter the controller one line at a time. A rule in a controller is a rule that cannot
be tested without HTTP.

**What A does not forbid:** extracting the tenant or the current user from the request is not
controller logic. That is a guard plus a parameter decorator, and belongs to `api/auth.md`.

**Affects:** `api/routes.md`

---

## 2026-09-10 — The `@nestjs/swagger` CLI plugin generates the document

**Decision:** the `@nestjs/swagger` CLI plugin is enabled. Only what it cannot infer is decorated by
hand — error responses, non-obvious status codes, route descriptions.

**Options considered:**
- A) Plugin on; manual decorators only where inference fails.
- B) Everything by hand, for full control over the generated document.
- C) OpenAPI not required.

**Reasoning:** A. The plugin reads the TypeScript types and the class-validator decorators that are
already there, so the contract, the validation and the documentation come from one declaration and
cannot drift.

**This interacts with the validation decision.** class-validator was chosen knowing it declares the
type and the rule separately. The plugin does not ask for a third declaration — it reads the two that
exist. B would add that third copy, and the third copy is the one nobody updates: the field changes in
the DTO and `@ApiProperty` keeps describing what it used to be. **API documentation that lies is worse
than none, because consumers trust it.**

**C is refused:** with no document, a consumer learns the contract by reading server code, and the
project's own `web`, `mobile` and `site` lose the only formal description of what the API accepts.

**Affects:** `api/routes.md`

---

## 2026-09-10 — The documentation UI does not exist in production

**Decision:** the OpenAPI UI is served outside production only. In production there is no
documentation route.

**Options considered:**
- A) UI outside production only.
- B) UI in production, behind authentication.
- C) UI public in production.

**Reasoning:** A. The OpenAPI document describes every route, every field and every validation rule.
Published, it is a map — not a vulnerability in itself, and a large saving of effort for anyone
looking for one.

A is a one-line conditional with nothing to misconfigure. **B looks like the careful middle and
arrives with a new question attached** — behind which authentication? A Better Auth session? Basic
auth with a password in an environment variable? Every answer is another surface, and an improvised
authentication surface protecting documentation is a poor trade.

**C is legitimate for a public API** with external developers consuming it. Prumo generates
first-party APIs by default — consumed by the project's own `web` and `mobile` — and for those there
is nobody outside who needs the map.

**What A costs:** debugging the contract against what is actually deployed becomes more awkward. You
read the staging document and trust that the deploy is the same code. Turning B on later is trivial
if the need appears.

**This supersedes a frozen-era decision** that put the Scalar reference behind authentication in
production; that decision belonged to the Fastify line.

**Affects:** `api/routes.md`

---

## 2026-09-10 — Errors are RFC 9457 on the wire, and idiomatic Nest in the code

**Decision:** error responses are `application/problem+json` per RFC 9457. **The code stays Nest's:**
handlers throw Nest's built-in `HttpException` subclasses — `NotFoundException`,
`ForbiddenException`, `BadRequestException` — and a single global exception filter translates them at
the edge. No custom exception hierarchy, and nothing throws a problem-details object directly.

**Options considered:**
- A) Nest's format as it comes.
- B) RFC 9457, with an extension for field errors.
- C) A lean custom format.

**Reasoning:** B, with the user's constraint that it must not stray from Nest's pattern — which is
what fixes the shape at the boundary rather than in the code.

**Nest's default is not free, which is what decided it.** Verified at Nest's documentation:

| Source | Body |
|---|---|
| `HttpException` | `{ "statusCode": 403, "message": "Forbidden" }` |
| `ValidationPipe` | `{ "statusCode": 400, "error": "Bad Request", "message": ["email must be an email"] }` |

The field set changes — an `error` appears — and `message` **changes type**, a string in one case and
an array of strings in the other. Every client that displays an error pays for that, on every screen.
Fixing it already requires `exceptionFactory` and a filter.

**Once the filter is being written, the standard costs what a bespoke shape costs.** The difference is
that one is a format HTTP clients, libraries and assistants already know, and the other is a shape
every consumer learns from scratch. That is the argument that chose Nest itself: an opinionated
framework because the assistant already knows the rules.

**What B costs:** problem+json is verbose, and its `type` field — meant to be a URI documenting the
error kind — becomes in practice a placeholder nobody dereferences. Ceremony the standard asks for and
the world ignores.

**Affects:** `api/errors.md`

---

## 2026-09-10 — Field errors go in an `errors` extension keyed by field

**Decision:** validation failures carry an `errors` extension member on the problem document, mapping
field name to its messages: `"errors": { "email": ["must be an email"] }`. Nested fields use a dotted
key — `"address.city"`. It is produced by the `ValidationPipe`'s `exceptionFactory`, touching no
controller.

**Options considered:**
- A) `errors` as an object keyed by field.
- B) `errors` as a list of objects carrying a JSON pointer — `[{ "pointer": "/email", "detail": ... }]`.
- C) No extension; `detail` carries everything in one sentence.

**Reasoning:** A. It is the shape a client consumes directly: `errors[field]` is a lookup, and that is
what react-hook-form and its peers expect in order to mark a field — and react-hook-form is in the
`web` stack. B is more formally correct, with JSON pointers working properly for nested fields, and it
makes every client walk a list looking for its own field.

**C is refused:** it throws away the structured information class-validator already has and sends the
front end back to parsing strings.

**Where A is weakest:** a DTO containing an object produces a path like `address.city`. The dotted key
is used, which is what class-validator generates internally and what react-hook-form already
understands.

RFC 9457 defines `type`, `title`, `status`, `detail` and `instance` and does not define field-level
errors, so any shape here is an extension. This one is chosen for the consumer, not for formal
purity.

**Affects:** `api/errors.md`

---

## 2026-09-10 — The filter catches everything, and a 500 reveals nothing

**Decision:** the global exception filter is a catch-all. Anything that is not an `HttpException`
becomes a generic 500 problem document carrying nothing from the exception — **in every environment**.
The detail lives in the log and in Sentry.

**Options considered:**
- A) Catch-all; a generic 500 everywhere.
- B) The same, but outside production the body includes the message and stack.
- C) Filter only `HttpException`; everything else falls to Nest's default.

**Reasoning:** A.

**C is refused** because it leaves the least predictable case with the least predictable shape — the
inconsistency the error format was chosen to fix, returning through the door nobody watched.

**Between A and B, what decides is not having two behaviours.** B creates a divergence between
environments on the code path that only runs once something has already gone wrong — so the least
tested path in the system acquires two versions. It is also the kind of flag someone turns on in
production "just to debug" and forgets.

**What B would buy is local convenience**, and locally the stack is already in the terminal, because A
sends it to the log regardless. The gain is close to zero; the risk is not.

**An unhandled exception's message carries whatever was nearby** — a file path, a fragment of SQL,
sometimes a connection string. None of that reaches a client.

**A depends on the next decision to be usable:** a bare "internal error" with nothing attached is
impossible to support unless the client receives an identifier that finds that specific failure in
the log.

**Affects:** `api/errors.md`

---

## 2026-09-10 — A request id correlates the response with the log

**Decision:** a request id is generated at the start of every request, propagated through
`AsyncLocalStorage`, written on every log line of that request, returned in an `X-Request-Id` header
on **every** response, and included in the problem document when the response is an error. An incoming
`X-Request-Id` is reused rather than replaced.

**Options considered:**
- A) A request id, as above.
- B) Sentry's event id from `captureException`, echoed in the error body.
- C) No correlation — support searches by timestamp.

**Reasoning:** A. It correlates the **whole request**, not only the moment it broke. Half of any
investigation starts at *what did this request do before it threw*, and B cannot answer that.

**B looked free and is not sufficient:** Sentry's event id exists only for errors that reached Sentry.
It does not exist in development without a DSN, does not exist if delivery fails, and correlates
nothing but the throw itself.

**Reusing an inbound header is what makes the chain survive** a proxy and, later, the `worker`: the id
is born at the edge and travels.

`AsyncLocalStorage` is Node's own and Nest documents the pattern as a recipe, so this adds no
dependency.

**C is refused:** searching production logs by timestamp under concurrency finds ten similar requests
and cannot say which one.

**This decision crosses two documents, recorded so it does not go missing:** `logging.md` must put the
id on every line, and `observability.md` must send it to Sentry as a tag. Without both, the id exists
and is useless.

**Affects:** `api/errors.md`, `api/logging.md`, `api/observability.md`

---

## 2026-09-10 — Cursor pagination, not offset

**Decision:** list endpoints paginate by cursor. The UUID v7 primary key is the cursor.

**Options considered:**
- A) Offset and limit.
- B) Cursor.
- C) Both, chosen per route.

**Reasoning:** B, and the key decision made it cheap. UUID v7 is time-ordered, so the id itself serves
as the cursor and `WHERE id > :cursor ORDER BY id` needs no extra sort column and no new index. With a
random key this would not be free, and A would probably have won.

**What each one breaks:**

- **Offset** — under concurrent inserts, page 2 repeats an item from page 1 or skips one. It does not
  error; it returns a wrong list silently. It also degrades at high offsets, because the database
  counts and discards the skipped rows.
- **Cursor** — no jumping to page 7, and no "page 4 of 12".

**The silent failure is what decided it.** This project has weighted that heavily and consistently —
it is the argument that chose `forbidNonWhitelisted` over silent stripping, and the one that made a
500 reveal nothing. A list with a duplicated or missing item raises no alarm; somebody notices when
the numbers stop adding up.

**Not in play:** a total count. `total` is a separate query and works identically either way — cursor
does not prevent totalling, it prevents navigating by page number.

**C is the recurring trap:** two competing conventions with someone choosing per route and the client
having to know which is which. Refused for `neverthrow` and for the area structure on the same
grounds.

**What B costs, concretely:** an admin table showing "page 4 of 12" with a jump to the last page
becomes impossible. If that is a real requirement for a product, A is the honest answer and the
concurrency failure becomes an accepted, recorded risk.

**Affects:** `api/pagination.md`

---

## 2026-09-10 — The list envelope is `data` and `nextCursor`, nothing else

**Decision:** a list response is `{ "data": [...], "nextCursor": "01J..." | null }`. No `hasMore`, no
`total`, no nested `meta`.

**Options considered:**
- A) `{ data, nextCursor }` and nothing more.
- B) `{ data, meta: { nextCursor, total } }`, with `total` always present.
- C) A, plus an optional `total` switched on by a query parameter.

**Reasoning:** A. It is the smallest thing that works, and adding `total` to a specific route later is
additive — it breaks no client.

**Two fields were refused before the options were put:**

- **`hasMore` is derivable** — a null `nextCursor` means the end. A field computed from another field
  is a field that can disagree with it.
- **`total` costs a `COUNT`.** On a large table it is the most expensive part of an otherwise cheap
  endpoint, and B makes every list endpoint pay it to serve the few screens that display a total.

**C avoids the cost and creates a different problem:** the response shape starts varying by request,
and the client's type becomes `total?: number` forever. A field that sometimes exists is a field
nobody trusts.

`data` over `items` carries no technical argument — only consistency, decided once.

**Affects:** `api/pagination.md`

---

## 2026-09-10 — `limit` and `after`, with the maximum enforced as validation

**Decision:** the query parameters are `limit` and `after`. `limit` defaults to 20 and carries
`@Max(100)` on the query DTO, so exceeding it returns 400 naming the field.

**Options considered:**
- A) `@Max(100)`; asking for 500 returns 400.
- B) The same parameters, with an over-limit value silently clamped to 100.
- C) No maximum.

**Reasoning:** A.

**The pagination parameters are a query DTO like any other**, so the `ValidationPipe` already decided
for routes handles them and a `@Max(100)` decorator produces the 400 with no new machinery. B would
cost *more* code, since somebody has to write the clamping.

**C is refused:** `?limit=1000000` is a way to take the API down with nothing but a browser.

**Between A and B this is the `forbidNonWhitelisted` argument again**, and it recurs because it is the
same defect. Under B the client asks for 500, receives 100, and nothing in the response says the
request was altered — it reads the 100, advances its own offset as though it had consumed 500, and the
bug surfaces far from here.

**On the names:** `limit` and `after` rather than Relay's `first`/`after`. `first` only makes sense
beside `last`, and backward pagination is not in this decision. A name promising a pair that does not
exist misleads.

**Affects:** `api/pagination.md`

---

## 2026-09-10 — List order is fixed at id descending; filtering needs nothing

**Decision:** lists are ordered by id descending — newest first — and `after` means *older than this*.
Sorting by another column is not supported, and the document says so. Filtering is a query DTO and is
already governed by the routes document; it gets no rule of its own.

**Options considered:**
- A) Fixed order, id descending.
- B) Fixed order, id ascending.
- C) Sort order configurable per route.

**Reasoning:** A. **Choosing a cursor over the id already fixed the order.**
`WHERE id > :cursor ORDER BY id` only works if the list is ordered by id, so accepting `?sort=name`
would break the cursor silently — the second page would arrive from a differently ordered universe.
That has to be written down, or someone adds column sorting believing it is additive and pagination
starts lying without erroring.

**Descending, because that is what nearly every list screen shows** — recent orders, notifications,
messages. Ascending would serve export and batch processing better, which is the rarer case and
usually does not go through the public API.

**C is not a configuration option; it is a silent break of the cursor decision.** Supporting arbitrary
ordering would need a composite cursor — the column value plus the id as a tiebreaker — and that is a
much larger decision that does not pay to make in advance.

**Filtering is not a gap:** `?status=open` is a query DTO field, already covered, and it does not
fight the cursor — `WHERE status = 'open' AND id > :cursor ORDER BY id` is correct. It needs no
document and no section.

**What A costs:** the day someone genuinely needs to list by price or by name, the answer is *not
through here*, and the way out is a dedicated endpoint with a composite cursor. A "no" the document
states rather than hides.

**Affects:** `api/pagination.md`

---

## 2026-09-10 — Better Auth mounts on a `VERSION_NEUTRAL` controller

**Decision:** Better Auth is mounted on a Nest controller with a catch-all route under `auth`, marked
`version: VERSION_NEUTRAL`, calling `auth.handler(req)`. With the global `api` prefix, the resulting
path is `/api/auth/*` — what Better Auth expects, with no improvised exception.

**Options considered:**
- A) A Nest controller, `VERSION_NEUTRAL`.
- B) Middleware mounted ahead of Nest's router, outside the routing system.
- C) Version the auth routes too — `/api/v1/auth/*` — pointing Better Auth's client `basePath` there.

**Reasoning:** A.

**Verified at Nest's documentation before deciding:** path order is `prefix/v{version}/route`, and
`VERSION_NEUTRAL` removes the version segment entirely under URI versioning. The URI versioning
decision therefore created no conflict with the authentication decision.

**C is refused on ownership: you version what you own.** The shape of Better Auth's endpoints is its
contract, not ours — we cannot change them. Putting `v1` on them implies a version we will never
increment, and forces every client to deviate from the library's default.

**B is refused because middleware ahead of the router escapes the global exception filter.** An error
inside the authentication flow would leave in a different shape and without the `X-Request-Id`,
precisely on the path where investigating matters most. A keeps it inside Nest, so the filter, the
logging and the request id all apply.

**Deliberately not fixed in the document:** the exact wildcard syntax. Express 5 changed the pattern,
and writing `@All('*')` into prose is exactly the fragment that rots with nothing verifying it. The
document says *a catch-all route under `auth`*; the syntax that compiles lives in the phase 5
template, where a compiler looks at it.

**Affects:** `api/auth.md`

---

## 2026-09-10 — The auth guard is global

**Decision:** the authentication guard is registered globally. Every route is protected, and a public
route declares itself.

**Options considered:**
- A) Global — everything protected; public routes declare themselves.
- B) Per route, with `@UseGuards()` where needed.
- C) Global within selected modules.

**Reasoning:** A. It is the difference between the two possible mistakes.

**Forgetting the guard under B leaves an endpoint open.** Nobody gets an error, nothing breaks, and
the test passes — because a route test does not usually assert that it refuses someone who should not
be there. You find out when an outsider finds out.

**Forgetting `@Public()` under A returns 401.** The developer sees it on the first call and fixes it in
seconds.

This is the criterion applied throughout: between failing closed and failing open, this project has
chosen closed every time. Here the asymmetry is the widest of all of them, because the cost of the
mistake is exposed data.

**C is the worst of the three:** it creates the question *is this module on the list?*, with the answer
living far from the file someone is editing. A new module is born unprotected while looking protected.

**Affects:** `api/auth.md`

---

## 2026-09-10 — Two states, with the guard always resolving the session

**Decision:** a route is either protected (the default) or `@Public()`. The guard **always** attempts
to resolve the session; `@Public()` means only *do not return 401*. A public route therefore has the
session available when a cookie is present. The Better Auth controller is `@Public()`.

**Options considered:**
- A) Two states, with `@Public()` switching the guard off entirely and leaving no session.
- B) Three states: `@Public()`, `@OptionalAuth()`, and protected by default.
- C) Two states, with the guard always resolving the session.

**Reasoning:** C. There is a real third case beyond public and protected — the route that works
without a login and shows more with one. **C delivers that case without a third concept.** A public
route that wants to enrich for a signed-in visitor just reads the session and sees whether it is
there; a genuinely public route ignores it. Nobody chooses between three decorators, and nobody
reimplements session resolution by hand as they would under A.

**The cost is smaller than it looks:** with no cookie there is no lookup at all — the guard returns
immediately. A session is fetched only when a cookie exists, which is when the user is signed in
anyway. A public endpoint consumed anonymously pays nothing.

B is not wrong, only one more concept for the same result, and three decorators means someone
eventually picks the middle one by mistake.

The decorator itself follows Nest's documented pattern: `SetMetadata` read by the guard through
`Reflector`. That part was never in question.

**Affects:** `api/auth.md`

---

## 2026-09-10 — The session reaches a handler through a parameter decorator

**Decision:** a `@CurrentUser()` parameter decorator reads the session the guard resolved. The
controller receives it and passes it on as an ordinary argument to the service.

**Options considered:**
- A) A parameter decorator, passed down explicitly.
- B) A request-scoped provider exposing the session.
- C) `@Req()` in the handler, reading the request directly.
- D) The session travelling through the `AsyncLocalStorage` already installed for the request id.

**Reasoning:** A.

**C is refused:** it couples the handler to Express's request object and makes the test depend on
HTTP. Passing `@Req()` down to a service leaks HTTP into it, against the rule that a controller only
delegates.

**B is refused:** a request-scoped provider propagates upward — anything injecting it becomes
request-scoped too. Nest warns about this on the same circular-dependency page read earlier:
`Scope.REQUEST` combined with a cycle yields undefined dependencies. It is the heaviest option for the
smallest gain.

**D was tempting and is refused twice.** The machinery already exists for the request id. But implicit
context inside a service hides what it depends on: the signature does not say the method needs a user,
and the test has to build a context to run at all. A keeps the dependency in the signature.

**The second reason matters more than the first:** D is half an answer to the open question of how
tenant filtering is guaranteed without the frozen era's repository seam. If the tenant starts
travelling implicitly, that question gets decided as a side effect, here, instead of in phase 2 with
the `database/` documents in hand. It is left open on purpose.

**Affects:** `api/auth.md`

---

## 2026-09-10 — Environment is validated with class-validator

**Decision:** `@nestjs/config` validates the environment through its `validate` function, using
class-validator and class-transformer. Not Joi.

**Options considered:**
- A) class-validator, through `validate`.
- B) Joi, through `validationSchema`.
- C) No validation — read `process.env` directly.

**Reasoning:** A. class-validator is already installed for DTOs and is the vocabulary every DTO in the
project uses. Choosing Joi means two validation libraries doing the same kind of work in one project
with different syntaxes, and whoever adds the next variable has to remember which one applies where.

**Joi is genuinely better at configuration schemas** — coercion and defaults are more natural there
than in decorators — but not enough to justify a second grammar.

**C is refused, and its failure mode is worth naming:** with no validation a missing variable becomes
`undefined`, passes boot silently and throws on the first request that needs it — in production, far
from the deploy that caused it. A missing `DATABASE_URL` is not even the bad case; the bad case is the
one with a wrong value that works almost correctly.

This closes Q10.

**Affects:** `api/config.md`

---

## 2026-09-10 — The validated config class is injected; `ConfigService.get` is not used

**Decision:** the class returned by `validate` is registered as a provider and injected with its type.
`ConfigService.get()` with string keys is not used.

**Options considered:**
- A) Inject the validated class.
- B) `ConfigService.get<string>('DATABASE_URL')` at each use.
- C) Namespaced configuration with `registerAs` and `ConfigType`.

**Reasoning:** A, on the argument from the TypeScript decision. Friction was paid for `strict` and
`noUncheckedIndexedAccess` so that types would tell the truth. **`ConfigService.get()` returns
`string | undefined`**, so every call site needs a `!` or a guard for a value that **was already
validated at boot**. The type throws away a certainty the program has.

**The key is also a string nothing checks.** Renaming the variable and missing one
`get('DATABASE_URL')` compiles perfectly and breaks at runtime. With A it is a class property:
renaming breaks the build.

**C is typed and is legitimate Nest**, only more machinery for the same result — a namespaced object,
`ConfigType<typeof x>`, per-module registration. A already delivers typing from a class that had to
exist anyway for the validation.

**Affects:** `api/config.md`

---

## 2026-09-10 — Boot fails on invalid config, reporting every variable at once

**Decision:** validation runs at module initialisation and the application does not start when it
fails. It reports **all** invalid variables together, ignores unknown ones, and names the variable
without printing its value.

**Options considered:**
- A) Fail at boot, reporting everything at once, ignoring unknown variables.
- B) Fail at boot on the first invalid variable.
- C) Log a warning and start anyway.

**Reasoning:** A.

**A rule applied twice already deliberately does not apply here, and the document says so.** A
process's environment legitimately contains dozens of variables that are not ours — `PATH`, `HOME`,
CI runner variables. Rejecting the unknown, which was the choice for request bodies and for query
parameters, would make the application impossible to start on any real machine. Unstated, someone
later "fixes" the inconsistency and breaks every deploy.

**Reporting everything at once:** under B, a first-time clone fixes one variable, restarts, finds the
next, restarts. Eight missing variables are eight cycles; the full list is one.

**The message never prints the value.** Half of these variables are secrets, and a boot error goes to
the orchestrator's log, which usually has more readers than the database. *`DATABASE_URL` is invalid*
is enough; printing the connection string is not.

**C is refused:** a warning at boot in a container that restarts itself is a warning nobody reads, and
the application comes up broken while looking healthy.

**Affects:** `api/config.md`

---

## 2026-09-10 — `.env` is ignored, `.env.example` is committed, production reads neither

**Decision:** `.env` is in `.gitignore`. `.env.example` is committed, listing every variable with a
safe sample value. In production the file is not read at all — only real environment variables.

**Options considered:**
- A) `.env` ignored, `.env.example` committed, file not read in production.
- B) The same, but the file is read in production too.
- C) No `.env.example` — the validated class is already the list.

**Reasoning:** A.

**A tension with the single-home principle was raised before deciding.** `.env.example` lists the
variables and so does the validated config class — two homes for one truth, refused consistently since
the pointing rule. It is accepted here because **the divergence is loud**: if someone adds a variable
to the class and forgets the example, a fresh clone fails at boot with the complete list of what is
missing. The single-home principle exists mainly against silent divergence, and this is not that.

**Not reading a file in production:** if a copy of `.env` reaches the image by accident — which
happens with a careless `COPY . .` — the process has two sources of configuration, and which one wins
depends on precedence details nobody recalls under pressure. Not reading it leaves one source.

**Against C, despite the single-home argument:** the class gives names and types, not plausible
values. Someone cloning needs to know `DATABASE_URL` is a Postgres URL and not a bare host, and the
example is what teaches that. `cp .env.example .env` is also the first line of every README.

**Affects:** `api/config.md`

---

## 2026-09-10 — `nestjs-pino` is the logger

**Decision:** logging goes through `nestjs-pino`, which takes over Nest's logger.

**Options considered:**
- A) `nestjs-pino`.
- B) Nest's default logger with a hand-written `LoggerService` emitting JSON.
- C) `nest-winston`.

**Reasoning:** A, in this order.

**It answers the open question directly:** pino emits structured JSON natively, which is what every
aggregator expects, and Nest's default logger prints prose for a human terminal.

**Maintenance, from the registry rather than reputation:**

| Package | latest | published | Nest peer |
|---|---|---|---|
| `nestjs-pino` | 5.1.0 | 2026-09-01 | `^11.0.8 \|\| ^12.0.0` |
| `nest-winston` | 1.10.2 | 2025-01-21 | up to `^11.0.0` |

`nest-winston` is twenty months old and does not declare support for the current Nest major. The same
kind of signal that moved the ORM choice, sharper here.

**It already carries per-request context storage**, which pays the request-id debt without a second
mechanism. That has a consequence settled separately: the request id lives in `nestjs-pino`'s context,
not in a parallel `AsyncLocalStorage` of our own. Two context stores in one request is the duplication
that diverges.

**B is writing by hand what A delivers.** A custom `LoggerService` emitting JSON is reimplementing pino,
worse.

**What A costs:** it takes over Nest's logger, so every `Logger` call leaves in pino's format. That is
the intent, and it is coupling — replacing it later changes the log format, not just a dependency.

This closes Q11.

**Affects:** `api/logging.md`

---

## 2026-09-10 — JSON to stdout, pretty-printed in development only

**Decision:** logs are JSON on stdout. In development `pino-pretty` renders them, as a dev dependency
only. Nothing is written to a file.

**Options considered:**
- A) JSON on stdout in every environment.
- B) JSON in production, `pino-pretty` in development.
- C) JSON on stdout and to a file.

**Reasoning:** B.

**A principle was checked before being applied, and it does not reach this case.** The error-shape
decision refused divergence between environments — a 500 says the same thing everywhere. That looks
like it would forbid pretty logs in development. It does not: there, what changed was the **content**
sent to a client, on a lightly tested code path, with a security consequence. Here only the
**rendering** of bytes for a human changes — fields, values and structure are identical, and nothing in
the system depends on the output format. Applying the earlier rule here would be using a principle out
of habit rather than reason.

Raw JSON in a local terminal is hostile: a three-hundred-character line per request, and whoever is
debugging reads it worse than prose. The gain is real and the risk is nil.

**C is refused:** a containerised process does not write logs to a file. The orchestrator collects
stdout; a file inside a container fills the disk, disappears on restart, and creates a second copy
nobody reads.

**Affects:** `api/logging.md`

---

## 2026-09-10 — Automatic request logging, with the request id on every line

**Decision:** `nestjs-pino`'s automatic request logging is on. Every line of a request carries the
request id, taken from `nestjs-pino`'s own per-request context — the same id returned in
`X-Request-Id`. Health checks and, outside production, the documentation route are excluded by name.

**Options considered:**
- A) On, with the request id, excluding named noisy routes.
- B) On, with no exclusions.
- C) Off — only what the code logs deliberately.

**Reasoning:** A.

**C is refused:** *did this request even arrive* is the first question in half of all investigations,
and without automatic logging the answer exists only for paths somebody remembered to instrument. A
successful request would leave no trace at all.

**The exclusions are named, not a rule.** A health probe every five seconds is seventeen thousand lines
a day saying nothing is wrong. That drowns the signal in search and costs money at ingestion, since
aggregators bill by volume. This is the only exclusion recommended, and it is by name rather than a
general *exclude what is noisy*, which would become a licence.

**This pays the request-id debt from the error decision**, and it settles the consequence flagged when
the logger was chosen: the id lives in `nestjs-pino`'s context rather than a parallel
`AsyncLocalStorage`. One per-request context store, not two.

Request and response bodies are **not** part of the automatic log — it records the request line, not
its contents.

**Affects:** `api/logging.md`

---

## 2026-09-10 — Two layers keep secrets out of logs

**Decision:** request and response bodies are not logged. On top of that, pino's `redact` covers known
headers and fields — `authorization`, `cookie`, `set-cookie`, `password`, `token`, `secret`.

**Options considered:**
- A) Both layers.
- B) Bodies not logged, no redaction.
- C) Log and rely on review.

**Reasoning:** A. **The two layers cover different holes.** Not logging bodies removes the largest
surface at once. But the automatic request log touches **headers**, and that is where `authorization`
and the session cookie live. Redaction without the body rule would let bodies through; the body rule
without redaction would let headers through.

**pino's `redact` is real machinery rather than review**, which matters because it is the only part of
this decision that does not depend on someone remembering.

**An aggravating fact from the error decision, recorded here because it shapes the boundary:** a 500
tells the client nothing **and sends the whole exception to the log**. The log therefore legitimately
carries stack traces, SQL fragments and parameter values. That is intended, and it makes access to the
log a real security boundary rather than an operational convenience.

**The honest limit of A**, which goes into the document's Enforcement section: `redact` only covers
named paths. Anyone writing `logger.info({ user })` with a `token` inside `user` defeats the whole
configuration. That remains review, and the document says so rather than letting redaction look like a
solved problem.

**Affects:** `api/logging.md`

---

## 2026-09-10 — Levels carry a written rule, and a 4xx is not an error

**Decision:** the document states one short rule per level, and the level is set by `LOG_LEVEL`,
defaulting to `info`.

| Level | Means |
|---|---|
| `error` | It broke, and somebody has to look |
| `warn` | It degraded and continued: a retry, a fallback, a limit reached |
| `info` | An event that matters to the business |
| `debug` | Off in production |

**Options considered:**
- A) A written rule per level.
- B) No rule — the names explain themselves.
- C) Only `error` and `info`.

**Reasoning:** A. Everyone knows the list of levels; what goes wrong in practice is the boundary
between two of them. **When everything becomes `error`, no error means anything** — the alert fires
constantly, somebody silences it, and the one that mattered goes with it.

**The concrete case the rule exists for:** a request with an invalid body returns 400. That is not an
application error, it is the system working. Logging it as `error` turns the service's error rate into
a count of careless clients, and the graph stops measuring health.

**B is refused:** level names look self-explanatory and are not. *Warn* attracts everything vaguely
bad, and the `warn`/`error` boundary is precisely the one deciding whether somebody is woken at night.

**C is refused:** without `warn`, degradation either becomes `error` and hits the problem above, or
becomes `info` and disappears.

**A boundary this document does not decide:** what reaches Sentry versus what stays in the log. The
overlap is real — not every `error` deserves an event — and it belongs to `api/observability.md`.

**Affects:** `api/logging.md`

---

## 2026-09-10 — A paid service is never a default; it is documented and ready

**Decision, as a principle:** Prumo does not install by default any tool requiring a commercial
account. Such a tool is **documented** — how it is wired, what it needs, what it changes — so it is
ready the day the developer wants it, and absent until then.

**Amends** *`@sentry/nestjs` alone; OpenTelemetry is not installed separately* (2026-09-09), which
locked Sentry into the stack. That entry stands as the record of why Sentry is the right choice **when
chosen**; it no longer makes it a default.

**Reasoning:** the user's, and it is about who decides. Installing a service that requires an account,
a DSN and eventually a bill is making a commercial decision on the developer's behalf, inside a
project they own. Free and open tooling — pnpm, Biome, Nest, MikroORM, pino, Vitest — costs nothing to
receive and can be deleted. A SaaS dependency is different in kind, not in degree.

**Sentry is the only entry in the stack this touches today.** Everything else is open source. The
principle is recorded as a principle rather than a Sentry exception, because it governs every future
addition to the catalogue.

**This revives, narrowly, an idea from the frozen brief** — *capabilities are documented, not
generated* — which was dropped in the rewrite because it came bound to the porting rule. What survives
is the part that needs no architecture: the scaffolder documents how a capability is implemented
rather than deciding it is present.

**What the default project therefore has for observability:** structured logs and a health check.
**What it does not have:** error reporting and tracing. Tracing goes with Sentry, since the earlier
decision declined a separate OpenTelemetry setup precisely because Sentry brought it — with Sentry
optional, a default project has no traces at all. Stated so it is a known absence rather than an
assumed presence.

**Affects:** `docs/stack.md`, `api/observability.md`, and every future capability

---

## 2026-09-10 — A 5xx becomes an event; a 4xx never does

**Decision:** when Sentry is installed, a response of status 5xx becomes an event — both an unhandled
exception and a deliberately thrown 5xx `HttpException`. A 4xx never becomes one, and a `logger.error`
call does not by itself create one.

**Options considered:**
- A) Any 5xx response.
- B) Only unhandled exceptions — anything that is not an `HttpException`.
- C) Any `logger.error`.

**Reasoning:** A. This is the boundary the logging document deliberately left open.

**B looks simpler and loses the case that matters most.** When an external service goes down and the
code deliberately throws `ServiceUnavailableException`, that is a real failure somebody needs to see —
and B treats it as routine purely because it was thrown explicitly. **The useful boundary is the
status, not the exception type.**

**C couples two systems with different purposes.** A log is a record; Sentry is an alert. If every
`logger.error` became an event, changing the level of one log line would change alerting behaviour,
which nobody expects while editing a log.

**The failure this prevents is the one the logging levels decision described:** send everything and the
issue list becomes a stream of invalid client input, the alert fires constantly, and somebody mutes
the whole project.

**Affects:** `api/observability.md`

---

## 2026-09-10 — The request id is a Sentry tag; no request body is ever sent

**Decision:** an event carries the request id **as a tag**, and the user's identifier when a session
exists. PII sending stays off. The request body is never attached.

**Options considered:**
- A) Request id tag, user identifier, no PII, no body.
- B) The same plus the request body, to make reproduction easier.
- C) The SDK's defaults only.

**Reasoning:** A. This pays the second half of the request-id debt: without the id on the event,
Sentry shows the stack and the log shows what happened before it, with no way to join them.

**As a tag rather than loose context**, because tags are indexed and searchable: pasting the
`X-Request-Id` a customer reported finds the event in one step, where plain context would mean opening
events one by one.

**The user's identifier distinguishes "one customer affected" from "everyone affected"**, and that
difference decides whether anybody is woken. The id only — not an email, not a name.

**The bar here is higher than for logs, and the reason is structural:** a log stays inside your
infrastructure; **Sentry is a third party**. What goes there leaves your perimeter, lives in another
company's storage and is readable by anyone with access to that project. The logging rules were
written for a system you control; these are not.

**The body is refused even though it is useful:** on an authentication route the body is the password;
on a payment route it is the card. Reproduction is a convenience, and a leak into a third-party system
is an incident.

**C loses the request-id debt** and makes the whole decision worthless.

**Affects:** `api/observability.md`

---

## 2026-09-10 — Liveness and readiness are separate routes

**Decision:** `@nestjs/terminus` exposes two routes. **Liveness** reports that the process is up and
checks no dependency. **Readiness** checks that dependencies answer, the database included.

**Options considered:**
- A) Two separate routes.
- B) One route checking everything.
- C) One route returning 200 without checking anything.

**Reasoning:** A. The two questions have opposite consequences, and B forces one answer to both.

**The failure B causes is well known:** a single endpoint that checks the database, used as liveness.
The database wobbles for thirty seconds, the check fails, and the orchestrator **restarts the
process**. Restarting does not fix a database, and meanwhile the healthy capacity is gone. A wobble
becomes an outage.

*Should I restart this process?* and *should I send it traffic?* cannot share an answer.

**C is not as useless as it looks** — it answers the liveness question correctly, and many services
have exactly that. But then there is no readiness at all, and the orchestrator routes traffic to a
process that started without being able to reach the database.

**Two ties to earlier decisions, recorded in the document:** the health route is `@Public()`, or the
global guard answers the orchestrator with 401; and it is in the logging exclusion list, or the probe
produces seventeen thousand lines a day.

**This is now half of what the document ships by default**, since error reporting became optional.

**Affects:** `api/observability.md`

---

## 2026-09-10 — `database/` holds six documents

**Decision:** the area contains `entities.md`, `migrations.md`, `queries.md`, `transactions.md`,
`multi-tenancy.md` and `testing.md`.

**Three boundaries settled rather than assumed:**

- **Indexes live inside `entities.md`.** MikroORM declares an index on the entity, so whoever writes
  one writes the other in the same act. The counter-argument is real — *what needs an index* is also
  read when something is slow, with no entity being written — and this is the most debatable merge in
  the list.
- **No performance document.** Performance is not a subject; it is a consequence of three others. N+1
  belongs to `queries.md`, indexes to `entities.md`, and pagination is already settled in
  `api/pagination.md`. A separate document would repeat all three and drift from each.
- **`testing.md` exists here despite `core/testing.md`.** `core/` decides the runner, which crosses
  every type. This one decides what is specific to a database — a real Postgres per run, isolation
  between tests. They do not overlap, and the boundary is written in both.

**What arrives already decided and is not reopened:** PostgreSQL 18+, `uuidv7()` generated by the
database, `timestamptz` everywhere, hard delete by default, `tenant_id`, MikroORM v7 with
`defineEntity`.

**Affects:** phase 2

---

## 2026-09-10 — An entity is a decorated class plus a `defineEntity` schema

**Decision:** `defineEntity` is used **with a class**. The class carries serialization and
documentation decorators — `@Exclude`, `@ApiProperty` — and **no MikroORM decorators**. The schema
lives in the `defineEntity` call.

**Options considered:**
- A) `defineEntity` with a decorated class.
- B) `defineEntity` without a class, undoing the serialization decision and restoring per-route
  response DTOs.
- C) MikroORM decorators on the entity, abandoning `defineEntity`.

**Reasoning:** A, and this decision exists because **two records of ours contradicted each other**.

`docs/stack.md` said *entities use `defineEntity`: full inference, no decorators*. The serialization
decision said a route returns the entity with `@Exclude` on the entity class. An entity cannot carry
no decorators and carry `@Exclude` at the same time.

**The original ORM entry had a qualifier the summary lost** — *no decorators… for the ORM's own sake*
— and `docs/stack.md` dropped it while condensing. The summary is what went stale, which is precisely
the failure the pointing rule predicted and the anti-pattern the brief lists.

A is what both decisions actually meant: *no decorators* was about the **ORM's** decorators, which is
what `defineEntity` replaces. Serialization decorators serve a different library and a different
purpose.

**A fact already on record and worth repeating here:** `reflect-metadata` returned to the project
anyway, because class-validator needs it. That part of MikroORM v7's rationale buys this stack
nothing in practice.

**What A costs, and it is the uncomfortable part:** an entity file now holds two shapes side by side —
a decorated class and a `defineEntity` schema pointing at it. Someone will ask why the schema is not
on the class, and the answer is that v7 separated them deliberately. It is more ceremony than either
alone.

C would undo the v7 choice. B would undo the serialization decision, taken after the recommendation
went the other way and Nest's documentation was read.

**`docs/stack.md` is corrected in the same commit.**

**Affects:** `database/entities.md`, `docs/stack.md`

---

## 2026-09-10 — Singular table names, snake_case columns

**Decision:** table names are singular, columns are snake_case. This is MikroORM's default
`UnderscoreNamingStrategy` for SQL drivers, so nothing is configured.

**Options considered:**
- A) Singular tables, snake_case columns — the default.
- B) Plural tables, snake_case columns, via a custom naming strategy.
- C) `EntityCaseNamingStrategy` — the database mirrors TypeScript in camelCase.

**Reasoning:** A.

**C is refused for a Postgres reason rather than a stylistic one.** An unquoted identifier is folded to
lower case, so `createdAt` becomes `createdat`. Preserving the case requires quoting, and a quoted
identifier must be quoted **forever** — in every hand-written query, every psql session, every
migration, every BI dashboard. It is a permanent tax on every human who touches the database.

**Verified rather than recalled:** `UnderscoreNamingStrategy` is the default for all SQL drivers, and
it does not pluralise. `class User` becomes table `user`. Plural would therefore cost either a
`tableName` on every entity or a custom strategy — about ten lines, written once.

**A also makes the table name match the class name exactly**, removing a mental translation when
reading a migration.

**The cost, raised before the choice and recorded because it is sharp:** plural is the more common SQL
convention, and worse, **`user` is a reserved word in Postgres**. `SELECT * FROM user` in psql returns
the session user rather than the table, with no error. It does not break the ORM, which always quotes
identifiers, but it breaks the query someone writes by hand. The mitigation is to quote it —
`FROM "user"` — and the document says so.

**Affects:** `database/entities.md`

---

## 2026-09-10 — `created_at` and `updated_at` on every table, maintained by the ORM

**Decision:** every table carries `created_at` and `updated_at` as `timestamptz`, maintained by
MikroORM's `onCreate` and `onUpdate`. No database trigger.

**Options considered:**
- A) Both columns, maintained by the ORM.
- B) Both, with `updated_at` maintained by a trigger.
- C) `created_at` only.

**Reasoning:** A. The normal path is the application, and there the ORM is correct. B's advantage
appears only for writes that bypass the ORM — migrations and manual surgery — which are often
precisely the moments when you **do not** want `updated_at` touched, because no user changed anything.

**What A costs, and it is a silent failure, which is the category this project has treated strictly:**
a backfill leaves `updated_at` stale, and somebody later trusts it to decide what to synchronise. Not
the size of a cross-tenant leak, but the same family.

**C is refused:** without `updated_at`, *when did this last change* has no answer at all, and it is the
second most frequent question anyone asks about a row.

Three structural columns were already settled and did not return: `id` as UUID v7 with
`DEFAULT uuidv7()`, `tenant_id` on tenant-scoped tables, and `deleted_at` only where a reason is
stated.

**Affects:** `database/entities.md`

---

## 2026-09-10 — Type mapping, and enums as `text` with a CHECK

**Decision:**

| Kind | Type |
|---|---|
| Money | `numeric`. Never `float` or `double precision`. |
| Text | `text`. Not `varchar(n)`; length is validated on the DTO. |
| JSON | `jsonb`. Never `json`. |
| Time | `timestamptz`, already settled. |
| Enum | `text` with a CHECK constraint. The TypeScript union is the source; the CHECK is the guard. |

**Options considered, for the enum — the only genuinely contested one:**
- A) `text` plus CHECK.
- B) Postgres's native enum type.
- C) A lookup table with a foreign key.

**Reasoning:** A.

**B is refused on the cost of change.** A native enum takes a new value painlessly, but **removing or
reordering requires recreating the type** and rewriting every column that depends on it — a lock and a
maintenance window on a large table. You discover this two years later, when a status becomes legacy.

**C is right when the set is data** — user-editable, carrying attributes of its own. For a fixed set
living in code it is a join for nothing, on every query.

**The other four rules were stated rather than offered as options**, because each has one answer.
Floating point does not represent 0.10 exactly and the error accumulates across a sum; `varchar(n)`
performs identically to `text` in Postgres and only adds a limit that hurts to change; `json` stores
raw text and cannot be indexed.

**Corroboration, not authority:** the frozen era reached the same conclusion about the CHECK. It is in
the archive, where nothing is in force — but two independent derivations landing in the same place is
a signal worth recording.

**Affects:** `database/entities.md`

---

## 2026-09-10 — A short list of mandatory indexes; the rest is measured

**Decision:** three things always carry an index — `tenant_id`, every foreign key column, and every
column used to fetch a single row, such as `email` or `slug`. Everything else is added on measurement.

**Options considered:**
- A) A short mandatory list, the rest measured.
- B) Nothing mandatory; measure first.
- C) An index on everything appearing in a `WHERE`.

**Reasoning:** A. An index is not free — it is updated on every `INSERT` and `UPDATE`, occupies space
and enters the vacuum plan — so C pays for unused indexes on every write, forever.

**B sounds disciplined and is refused:** the three cases above need no measurement, because they are
known consequences of the design. Waiting to measure means waiting for slowness in production to
discover what was already known.

**The least obvious item is the foreign key, and it is the most commonly forgotten index there is.**
Postgres does **not** create an index on the referencing side; only the referenced side has one, by
virtue of being a primary key. So `order.customer_id` has no index unless somebody declares it, and
*find this customer's orders* becomes a scan.

**Two of our own decisions had already created index requirements without saying so.** Cursor
pagination runs `WHERE id < :cursor ORDER BY id DESC`, which the primary key's index already covers —
recorded so nobody "optimises" by adding another. And `tenant_id` appears in **every** query against a
tenant-scoped table, so without an index every listing for every tenant scans the whole system's table.

**What A costs:** somebody adds a listed index to a ten-row table where it earns nothing. Negligible,
and the alternative is a judgement per table.

**Affects:** `database/entities.md`

---

## 2026-09-10 — Foreign keys are `ON DELETE RESTRICT` by default

**Decision:** every foreign key declares `ON DELETE RESTRICT`. `CASCADE` is used only where the child
has no meaning without its parent — an order line without an order — and is named when used.

**Options considered:**
- A) `RESTRICT` by default, `CASCADE` where composition is real.
- B) `CASCADE` by default.
- C) `SET NULL` by default.

**Reasoning:** A.

**This question changed weight because of the delete decision.** While soft delete was the default,
almost nothing was really removed and the foreign-key rule rarely fired. With hard delete as the
default, `DELETE` is an ordinary operation and what happens to the children matters.

**B combined with hard delete is the most dangerous combination assembled so far.** Deleting a
customer would silently remove their orders, invoices, payments and history in one transaction. The
command returns success. There is no error and no warning, and the backup becomes the only way out.

A makes the same command fail, saying children exist. Whoever is deleting then decides what to do, and
that decision becomes explicit code rather than a side effect of a schema line written months earlier.
Failing closed again, where the cost of the wrong side is lost data.

**C is refused for a different reason:** it produces silent orphans. The order still exists with a null
`customer_id`, and every query that assumed the relationship returns a wrong result rather than an
error.

**Verified earlier and relevant here:** MikroORM v7 stopped inferring database-level foreign-key rules
from the ORM's `cascade` option, because the coupling was confusing. The database rule must therefore
be declared deliberately, which makes this decision mandatory rather than implicit.

**Affects:** `database/entities.md`

---

## 2026-09-10 — Migrations are generated, then read and edited

**Decision:** a migration is generated from the entity diff, then **read and edited** before it is
committed. What the generator emits is a draft, not a result.

**Options considered:**
- A) Generated, then reviewed and edited.
- B) Generated and committed as emitted.
- C) Always hand-written, with `--blank`.

**Reasoning:** A.

**The case that decides it is renaming a column.** The generator does not see a rename — it sees one
column gone and another appeared, and emits `DROP COLUMN` plus `ADD COLUMN`. Committed as emitted,
that deletes the column's data in production. The SQL is correct with respect to the diff and wrong
with respect to the intent, and no tool knows the difference.

**B also falsifies a claim made one document earlier.** `database/entities.md` states that migration
review is the real check for most entity rules. If nobody reads the SQL, that sentence has nothing
behind it — and this repository has already catalogued two checks that lied.

**C is refused because the diff is genuinely good at what it does**, which is remembering what you
forgot. A new entity with six columns, three indexes and two foreign keys, written by hand, misses
something. The diff does not.

**What A costs:** discipline. *Generated and reviewed* depends on someone actually reading, and the day
a migration is 200 lines is the day the reading becomes a skim. The mitigation is the separation of
data migrations from schema migrations — a large migration is usually two migrations mixed together.

**Affects:** `database/migrations.md`

---

## 2026-09-10 — Migrations run as a pipeline step, and stay compatible with the previous release

**Decision:** migrations run as a separate pipeline step, before the new version is deployed. Not at
application boot, and not by hand. **Every migration must be compatible with the previous release.**

**Options considered:**
- A) A separate pipeline step.
- B) At application boot.
- C) Manually, by whoever deploys.

**Reasoning:** A, and the second argument against B is the one that usually goes unnoticed.

- With N replicas they race at boot, and a failed migration puts every replica into a restart loop.
  The deploy does not degrade, it removes the service.
- **The application process would need DDL permission at runtime.** The database user serving requests
  would be able to `DROP TABLE`, and any SQL injection or compromised process inherits that. With a
  separate step, the deploy uses a privileged user for thirty seconds and the application runs as one
  that only reads and writes rows.

**C is refused:** somebody forgets, and the new code meets the old schema.

**Corroboration, not authority:** the frozen era reached the same place — pg-boss's schema was applied
by the deploy pipeline rather than at boot.

**The obligation A creates, declared rather than discovered:** during a rolling deploy the **previous
version keeps running against the new schema**. A migration that drops a column the old code still
reads breaks production before the new version finishes rolling out. Every migration must therefore be
backward-compatible with the previous release, which makes removing a column **two** deployments — one
that stops using it, one that removes it. A real and recurring cost, stated now rather than found on a
Friday.

**Affects:** `database/migrations.md`

---

## 2026-09-10 — No `down` migrations; undoing is a new migration forward

**Decision:** migrations carry no `down`. Undoing a schema change is a new migration going forward.

**Options considered:**
- A) No `down`.
- B) `down` generated and maintained.
- C) `down` in development only.

**Reasoning:** A, and the previous decision changed the weight of this one.

**The main reason `down` exists stopped existing minutes ago.** Because every migration must be
compatible with the previous release, **rolling back the application does not require rolling back the
schema** — the old version runs against the new schema by design.

**What remains is undoing the schema change itself, and there `down` lies.** The `down` of a migration
that dropped a column recreates the column **empty**. The command reports success, the schema returns
to its old shape, and the data does not come back. It is a rollback that looks like it worked.

**B keeps code that runs almost never and is therefore never tested**, offering false confidence
exactly during a panic, which is when people read least carefully what they are running.

**C is the honest middle and is refused for that reason:** *development only* means the code exists, is
in the repository, and eventually somebody runs it in production because it was there.

**What A costs:** iterating on a schema locally is less comfortable. Getting a migration wrong means
recreating the local database rather than reversing. With Testcontainers and Docker that is seconds,
so the cost is small — but it is daily for whoever is modelling.

**Affects:** `database/migrations.md`

---

## 2026-09-10 — Schema migrations and data backfills are separate

**Decision:** a schema migration performs DDL only and runs in the deploy step. Filling existing rows
is a separate, idempotent task run in batches, outside the deploy path.

**Options considered:**
- A) Separate, with the backfill outside the deploy step.
- B) Together, in one migration.
- C) Separate files, both in the deploy step.

**Reasoning:** A. The two operations have opposite natures.

- **DDL is fast and locks.** `ALTER TABLE … ADD COLUMN` with a volatile default rewrites the whole
  table while holding a lock, and everybody waits.
- **A backfill is slow and needs no lock.** A million updates can run in batches, slowly, without
  stopping anyone.

Mixed together, the slow one inherits the fast one's lock, and the deploy's migration step — which the
previous decision placed **before** the new version starts — holds the entire deploy while it fills
rows.

**C tidies the file and does not fix the problem:** the deploy still waits on the backfill.

**Idempotence is what makes A work.** The data task will be interrupted — a timeout, a restarted pod,
somebody cancelling — so it must survive running twice. `UPDATE … WHERE status IS NULL` satisfies that
naturally.

**A consequence that must be written down:** between the schema migration and the end of the backfill
there is a window where the column exists and is partly empty. Code reading it has to tolerate that,
which almost always means the column is born nullable and becomes `NOT NULL` in a **third** deployment,
after the backfill finishes.

**Combined with the previous decision's rule, the full cost is:** removing a column takes two
deployments, and adding a required column to existing data takes three. That is expensive, it is the
price of not stopping the service, and it is stated now rather than discovered.

**Affects:** `database/migrations.md`

---

## 2026-09-10 — The `EntityManager` is the only door; `@InjectRepository` is not used

**Decision:** services inject the `EntityManager`. Reads are `em.find(Entity, …)`, writes are
`em.persist` and `em.flush`. `@InjectRepository` is not used.

**Options considered:**
- A) `@InjectRepository(Entity)` for reads, `EntityManager` for writes.
- B) The `EntityManager` alone.
- C) A repository, reaching the `em` through `getEntityManager()` when writing.

**Reasoning:** B, and a verified fact decided it before the options were weighed.

**MikroORM's own guidance is explicit:** *"You should work with the `EntityManager` directly instead of
using a repository when it comes to entity persistence; repositories should be treated as an extension
point for custom logic."* And `persist`, `flush` and `remove` were **removed** from repositories in v6
for being shortcuts to the same `EntityManager` methods.

**That fact settles it on its own: persistence is impossible without the `em`.** So every option
involving a repository yields **two** doors in a service — a repository to read, the `em` to write —
and only one option yields a single door. A is not *repository instead of em*; it is repository **plus**
em, with a boundary somebody decides per method. C is worse: it hides the second door behind a call, so
the service depends on the `em` without declaring it anywhere.

**Two vendor conventions point in different directions here.** The Nest ecosystem's is
`@InjectRepository`, by muscle memory from TypeORM; MikroORM's own is the `EntityManager`. MikroORM's
won because Nest's would produce two doors regardless.

**What B costs, and it is real:** `em.find(User, …)` requires passing the class on every call, which a
repository spared. More importantly it **contradicts muscle memory** — an assistant without this
document in front of it writes `@InjectRepository`, because that is what every Nest-with-an-ORM example
contains. The document therefore has to carry an explicitly negative rule, which is exactly the kind
that needs writing down because it fights a habit.

**Deliberately not decided here:** whether custom repository classes exist as an extension point. That
is a candidate answer to how tenant filtering is guaranteed, and belongs to `multi-tenancy.md`.

**Affects:** `database/queries.md`

---

## 2026-09-10 — Relations are `Ref`/`Collection`, accessed through `$`, populated explicitly

**Decision:** relations are declared as `Ref<T>` and `Collection`, accessed only through the `$`
accessor, with `populate` stated on every read that needs them.

**Options considered:**
- A) `Ref`/`Collection` with `$`, and explicit `populate`.
- B) Plain relations, `populate` by discipline, N+1 caught in review.
- C) Eager loading on the entity.

**Reasoning:** A, and a verified fact changed the nature of the question before it was asked.

**MikroORM's `Loaded<Entity, Hints>` tracks populated relations at compile time**, and accessing `$` on
an unloaded `Ref<T>` is a TypeScript error. What would otherwise be *remember to use `populate`* — a
review item — becomes something the compiler refuses.

That matters because **N+1 is the most silent database defect there is**: the page works, it just gets
slower as the list grows, and nobody receives an error.

**This is the return on the TypeScript decision.** `strict` and `noUncheckedIndexedAccess` were taken
on the argument that compiler-enforced guarantees are worth the friction; this is that bargain paying
out.

**C is the classic trap:** it trades N+1 for over-fetching on every query, including the ones that
never touch the relation, and it is invisible at the call site — whoever reads the service does not see
that three tables were loaded.

**B is what most projects do, which is why N+1 is everywhere.**

**What A costs, daily and visibly:** `user.organization.$.name` instead of `user.organization.name`.
The `$` appears at every relation access. It is noise, and it is the price of the compiler knowing what
was loaded.

**Affects:** `database/queries.md`, `database/entities.md`

---

## 2026-09-10 — `em.find` is the default; dropping a level requires a stated reason

**Decision:** `em.find` is the default. The QueryBuilder is used where the operation does not exist
there — aggregation, window functions, CTEs, upserts. Raw SQL is used only where the QueryBuilder
cannot reach either. **Dropping a level carries a one-line comment saying why.**

**Options considered:**
- A) A ladder, with a stated reason for each step down.
- B) Free choice.
- C) `em.find` only; anything else becomes a database view.

**Reasoning:** A. The risk of having no rule runs in both directions: with no permission to drop down,
somebody forces the ORM to do in three queries what SQL does in one; with unlimited permission, the
QueryBuilder becomes the default path because it is familiar, and the typing and the unit of work stop
applying.

**The mandatory comment is the part worth defending.** Without it, whoever reads that query a year
later cannot tell whether the QueryBuilder is there because it was needed or because the author did not
know how to express it with `em.find`. That difference decides whether anyone may simplify it. One line
settles it, and its absence is visible in review.

**C has real merit** — a view pushes complexity where the planner can see it — and is refused because a
view becomes schema, schema becomes a migration, and every reporting query would then require a deploy.

**What A does not relax:** the multi-tenancy rules apply to raw SQL too. A raw query is exactly where a
tenant filter escapes, because none of the ORM is in the path. That link is recorded here and settled
in `multi-tenancy.md`.

**Affects:** `database/queries.md`

---

## 2026-09-10 — Services return managed entities; only the owning service mutates one

**Decision:** a service returns the managed entity. **Only the service that owns an entity mutates it**
— controllers, interceptors and serializers read and never write.

**Options considered:**
- A) Managed entity, with the ownership rule written down.
- B) A detached copy.
- C) Managed entity, no rule.

**Reasoning:** A. This is where MikroORM's price finally lands in full. An entity from `em.find` is
**managed**: changing it and calling `flush()` later persists the change, even though nobody called
`persist`. That is the Unit of Work, named twice as a cost while recommending the ORM.

The serialization decision already sends the entity to the controller and out through the response, so
managed entities cross the whole application.

**B is refused:** it would undo a decision taken after Nest's documentation was read, and it discards
the identity map, which is half the reason this ORM was chosen.

**C is refused, and its failure mode is the concrete one:** somebody adjusts a field in an interceptor
*just for the response*, a service downstream calls `flush()` in the same request, and the cosmetic
adjustment becomes a database write. No error, and the data changes.

**What bounds the damage, recorded so the risk is sized rather than feared:** the MikroORM Nest
integration forks an `em` per request, so the blast radius is one request. It is not a leak that
crosses users.

**What A costs:** it is a review rule, not a compiler rule. Unlike the relation decision, no type
prevents it — a managed entity and a detached one have the same shape. This is the part of the Unit of
Work accepted without a net.

**Affects:** `database/queries.md`

---

## 2026-09-10 — Transactions are explicit, and only where more than one unit must be atomic

**Decision:** a transaction is opened explicitly, in the service code that needs more than one
operation to succeed or fail together. Everywhere else the implicit transaction around `flush` is
enough.

**Options considered:**
- A) Explicit, only where atomicity spans more than one operation.
- B) Per request — middleware opens one at the start and closes it at the end.
- C) Per service method, always.

**Reasoning:** A, and a verified fact set the size of the question. **`em.flush()` already wraps its
changes in an implicit transaction**, so a single flush is atomic on its own. An explicit transaction
is therefore not for *writing correctly*; it is for the case where two flushes, or a flush plus
something else, must happen together.

**B is the most expensive of the three.** The transaction lasts as long as the request. If the handler
calls an email provider, a payment gateway or anything across the network, the database holds row locks
while waiting for a third party. A five-second timeout in an external service becomes five seconds of
lock, under concurrency that becomes a queue, and the queue becomes an outage. **The database pays for
somebody else's slowness.**

**C is refused:** a transaction on every method includes the read-only ones, holding a snapshot for no
reason, and it trains people to write the annotation without thinking — so when it matters, nobody
notices.

**What A costs:** somebody has to recognise the case that needs atomicity. That is judgement, and
judgement errs. It is mitigated by the rule being simple to apply — *does more than one unit of work
have to happen together?* — and by the failure being visible: partially written data shows up quickly
in an integration test.

**Affects:** `database/transactions.md`

---

## 2026-09-10 — Transactions are opened with the `em.transactional` callback

**Decision:** a transaction is opened with `em.transactional(async em => …)`. The `@Transactional()`
decorator is not used, and `begin`/`commit`/`rollback` are not written by hand.

**Options considered:**
- A) The `@Transactional()` decorator on the method.
- B) The `em.transactional` callback.
- C) Manual `begin`/`commit`/`rollback`.

**Reasoning:** B. The practical difference is not style but **where the boundary can fall**: a decorator
makes the whole method the boundary and cannot be narrowed, while the callback's boundary is the lines
inside the block.

**The previous decision named the expensive mistake as holding a transaction across a network call, and
the decorator makes exactly that easy to commit unnoticed.** A method that writes two things and also
sends an email sits entirely inside the transaction, and nothing in the code shows it. With the
callback, the external call is visibly outside the block.

**What the decorator does better, and it is real:** composition. With `REQUIRED` propagation, a
decorated method calling another joins the same transaction automatically. With callbacks, nesting
takes care and passing the forked `em` down.

B wins because A's failure mode is silent — a lock held across HTTP only appears under load, in
production — and B's is tedious but visible. That is the trade this project has made throughout.

**C is refused:** by hand, somebody eventually misses a `rollback` on an error path, and a connection
left holding an open transaction is the kind of leak that exhausts the pool.

**Affects:** `database/transactions.md`

---

## 2026-09-10 — READ COMMITTED, with `FOR UPDATE` rather than a higher isolation level

**Decision:** the isolation level stays Postgres's default, READ COMMITTED. Where an invariant depends
on reading and then deciding, the row is locked with `SELECT … FOR UPDATE`. The isolation level is not
raised.

**Options considered:**
- A) READ COMMITTED, protected by `FOR UPDATE` where needed.
- B) SERIALIZABLE on every transaction.
- C) READ COMMITTED, raised to SERIALIZABLE where needed.

**Reasoning:** A. The case that actually bites under READ COMMITTED is read-decide-write: two concurrent
requests read the same balance, each checks that it is sufficient, and both write. The balance goes
negative and **no transaction failed**.

**B is refused on its global cost:** SERIALIZABLE makes Postgres abort transactions with serialization
errors under concurrency, so **every** transaction in the system needs retry logic — including the ones
that never conflicted. A global cost paid to solve a local problem.

**Between A and C, the difference is which tool is reached for first.** C says *raise the isolation*; A
says *lock the row*. `FOR UPDATE` is local, explicit and visible in the query, so whoever reads that
method sees that concurrency is in play. Raising isolation is invisible at the call site and changes the
behaviour of everything inside the block. `FOR UPDATE` also needs no retry: the second transaction waits
rather than aborting.

**What A costs:** somebody has to recognise the read-decide-write pattern and remember the lock. It is
review, the same class of judgement as the transaction boundary — but **this failure is worse**:
negative money, stock sold twice, and nothing in the system raises an alarm. It belongs in the
document's Enforcement section in plain words.

**Affects:** `database/transactions.md`

---

## 2026-09-10 — No automatic retry; a deadlock is a bug to fix

**Decision:** transactions are not retried automatically. A deadlock becomes a 500, reaches the log and
— where Sentry is installed — becomes an event. The fix is ordering the locks.

**Options considered:**
- A) No automatic retry.
- B) Retry on deadlock, with an attempt limit.
- C) Retry on any database error.

**Reasoning:** A.

**A deadlock is an ordering bug, not bad luck.** Two transactions lock A then B, and B then A. The fix
is to always lock in the same order, and it is permanent. **Retrying hides it**: the system grows slower
under load, the graph degrades gradually, and nobody ever looks, because nothing fails.

**The second argument is worse: a retry repeats side effects outside the database.** If the transaction
already sent an email or charged a card before failing, the second attempt does it again. The callback
form keeps external calls outside the transaction block, which reduces this rather than removing it —
a retry re-runs the method, not only the block.

**C is refused outright:** retrying a constraint violation or a syntax error repeats the same failure
until patience runs out.

**What A costs:** under high contention an occasional deadlock is nearly unavoidable even with correct
ordering, and then a user sees an error a retry would have hidden. That is the price of keeping the
defect visible.

**B returns to the table** the day measurement shows recurring deadlocks with the ordering already
correct. It then stops being machinery for a problem that does not exist.

**Affects:** `database/transactions.md`

---

## 2026-09-10 — Tenant isolation is a MikroORM filter, with RLS parked and unmeasured

**Decision:** tenant isolation is enforced by a MikroORM filter declared `default: true`, with its
parameter set per request. Postgres Row Level Security is **not** adopted now.

**Options considered:**
- A) The MikroORM filter alone.
- B) The filter **plus** RLS, so the database refuses the row even under raw SQL.
- C) RLS alone.
- D) Discipline and review.

**Reasoning:** A, with an explicit account of why not B.

**Verified at MikroORM's documentation before deciding:**

| | |
|---|---|
| With `default: true` | applies automatically to `find`, `findOne`, `findAndCount`, `count`, `nativeUpdate`, `nativeDelete` |
| Per-request parameter | `em.setFilterParams()`, copied to every fork |
| QueryBuilder | **not** applied unless `qb.applyFilters()` is called |
| Raw SQL | not reached |
| Creation | not listed |

MikroORM's own warning: *"Filters are applied inside the application, so a raw query or a forgotten
`filters` option can still read past them."* So a filter is a **strong read guard with three named
holes** — the QueryBuilder, raw SQL, and row creation.

**B is technically superior and that is not disguised.** RLS is the only option that closes the raw-SQL
hole, and cross-tenant leakage is the highest-consequence silent failure in this project.

**B is not recommended because its cost has not been verified**, and the original multi-tenancy decision
recorded that this cost must be measured rather than assumed. There is a concrete tension with the
transaction decision: RLS needs the tenant set per connection or per transaction, and transactions were
deliberately **not** wrapped around plain reads. `SET LOCAL` has nowhere to live in an untransacted
read, and a session-level `SET` conflicts with transaction-mode pooling. That may have a clean
resolution; recommending B without knowing it would be exactly what *verify, do not recall* forbids.

**RLS goes to `OPEN-QUESTIONS.md`** as the stronger alternative, pending measurement.

**D is the present state**, already recorded as a lost guarantee. **C alone** discards the application
layer, which is what fails early and legibly in development.

**Affects:** `database/multi-tenancy.md`

---

## 2026-09-11 — `multi-tenancy/` is an area, not a file inside `database/`

**Decision:** multi-tenancy becomes its own area, `multi-tenancy/`, shipped only when the project is
multi-tenant. The inclusion table gains an eighth row.

**Options considered:**
- A) The inclusion rule gains file-level granularity.
- B) `multi-tenancy/` becomes an area.
- C) The file always ships, opening with *if the project is multi-tenant…*.

**Reasoning:** B, and the argument is better than *it solves the problem*.

**Multi-tenancy is not a database subtopic. It crosses areas.** `tenant_id` is a database concern, but
resolving which tenant a request belongs to is an `api/` concern, and a SaaS `web` has tenant-switching
rules in its interface. Treating it as a file inside `database/` was a classification error, surfaced
only because the user pointed out that not every project is a SaaS.

**As an area it fits the existing model without inventing a mechanism.** `monorepo/` is already an area
conditioned on an axis that is not a type; `multi-tenancy/` is conditioned on a third axis the same way.

**C is the anti-pattern with an excuse sentence in front of it.** A complicates the rule that was chosen
precisely for being seven explicit rows, and file-level granularity invites a per-file exception in
every area.

**This partly answers the open question about where "is this multi-tenant?" is asked:** there is a third
axis beside Type and Architecture. **How** the CLI asks remains phase 6's; *whether there is something to
ask* is settled here.

**A second correction falls out:** `docs/stack.md` listed `tenant_id` under **Structural** with no
condition, which is wrong for a single-tenant project. That is the second contradiction found in the
summary document, after the entity-decorator one, and it is fixed in the same commit. Both were the
same failure: a condition lost while condensing.

**Affects:** `docs/structure.md`, `docs/stack.md`, phase 6, and the `database/` document list

---

## 2026-09-11 — One container per run, one database per worker

**Decision:** Testcontainers starts one Postgres container per test run, and each Vitest worker gets its
own database inside it.

**Options considered:**
- A) One container, one database per worker.
- B) One container, a single database, tests run serially.
- C) One container per test file.

**Reasoning:** A. Vitest runs test files in **parallel workers**, so a single shared database with
cleanup between tests means one worker truncating a table while another reads from it. The test fails
intermittently and people re-run until it passes, which is worse than a test that fails honestly.

**B trades time for simplicity and the exchange rate worsens.** A serial suite grows linearly until
nobody runs it before committing, and a suite nobody runs protects nothing.

**C pays container startup per file.** A Postgres container takes seconds, and twenty files become
minutes before the first assertion.

**What A costs:** somebody has to create and drop the per-worker database, and the worker identifier has
to reach the setup code. That is plumbing — roughly fifteen lines in a global setup file — written once.

Testcontainers was made mandatory rather than optional by the key decision: `uuidv7()` does not exist in
a fake database.

**Affects:** `database/testing.md`

---

## 2026-09-11 — Tests are isolated by truncating, not by rolling back

**Decision:** every table is truncated between tests, in a single `TRUNCATE` statement listing them all.
Tests are not wrapped in a transaction that is rolled back.

**Options considered:**
- A) Truncate between tests.
- B) Open a transaction before the test and roll it back after.
- C) A fresh database per test.

**Reasoning:** A, and the argument against B is specific to this project.

**The code under test opens its own transactions.** Atomicity comes from `em.transactional`, so a test
already inside a transaction turns the code's own into a savepoint, which does not behave identically —
and a commit is never actually exercised.

That matters because the isolation rules are precisely about real transaction behaviour. **Testing
`FOR UPDATE` inside a wrapper that will roll back is testing something adjacent to the truth rather than
the truth.**

**C is refused on time:** creating a database per test costs more than truncating.

**What A costs, and it is a concrete interaction with the foreign-key decision:** with
`ON DELETE RESTRICT` everywhere, truncating a parent table **fails** while children exist. The way out
is truncating every table in one statement — `TRUNCATE a, b, c` — or using `CASCADE`. It is written down
because whoever writes the setup will hit it, and Postgres's error message does not suggest the fix.

Truncating is also slower than a rollback. That is the price of testing what runs in production rather
than a close relative of it.

**Affects:** `database/testing.md`

---

## 2026-09-11 — The test schema comes from the migrations

**Decision:** the test database's schema is built by running the migrations, once per worker database.
The schema generator is not used.

**Options considered:**
- A) Migrations, applied once per worker database.
- B) `orm.schema.createSchema()` from the entities.
- C) The generator in tests, plus a separate test asserting migrations and entities agree.

**Reasoning:** A, and the migration decision made this more important than it would normally be.

**Migrations are edited by hand.** The generator produces a draft, somebody corrects it, and the result
can therefore diverge from what the entities describe. **If tests build their schema from the entities,
that divergence never appears** — the suite runs against a schema that exists nowhere, and production
runs against another.

A also makes testable the claim written into `database/entities.md`, that migration review is the real
check: with the suite running against the migrations, a wrong migration breaks a test instead of a
deploy.

**C is tempting and is more machinery for less guarantee.** It asserts the two agree in **shape**, and
tests nothing running against what production will actually have.

**What A costs, and it grows:** fifty accumulated migrations become a few seconds per worker database,
on every run. Applying them once per database rather than per file — which the container decision
already allows — is the mitigation.

**An honest tipping point, recorded so the reversal is informed:** if applying migrations ever dominates
the suite's runtime, the way out is dumping the schema from the migrations in CI and restoring that dump
in tests. That keeps the guarantee and removes the cost. Not now; when it hurts.

**Affects:** `database/testing.md`

---

## 2026-09-11 — Test data comes from factories, not shared fixtures

**Decision:** each entity has a factory — a function building a valid row from defaults and accepting
overrides, `makeUser({ plan: 'trial' })`. Tests build what they need inline. No shared fixture file.

**Options considered:**
- A) A factory per entity.
- B) A shared fixture file loaded before the suite.
- C) Raw inserts inside each test.

**Reasoning:** A.

**B's failure mode is known and slow:** the fixture file starts with three users, grows to forty, and a
test comes to depend on user twelve having a `trial` plan. Nobody can change the file without breaking a
distant test, and nobody can read a test without opening the fixture to find out what data it is dealing
with.

**A makes a test state what matters and nothing else.** `makeUser({ plan: 'trial' })` says the plan is
relevant and the rest is not, and the scenario is legible without leaving the file. It is the same
instinct as the Enforcement section in every document here: make what a rule depends on visible.

**It also composes with the isolation decision.** With truncation between tests, each one builds its own
scenario from nothing; a shared fixture presumes persistent state, which truncation just removed.

**C is not wrong, it is A without the reusable part** — twenty lines of `em.persist` at the top of each
test with the required fields repeated. When a new `NOT NULL` column arrives, all of them break at once;
with factories, one file breaks.

**What A costs:** factories are test code that has to be maintained and kept in step with the entities.
Real work, and less of it than C for the reason above.

**Affects:** `database/testing.md`

---

## 2026-09-11 — The client areas are written `web`, then `mobile`, then `site`

**Decision:** phase 3 runs `web/` → `mobile/` → `site/`. The roadmap had left the order open.

**Reasoning:** `web` first because it is the client with the most already settled — Vite, React,
TanStack Router, TanStack Query, Tailwind, shadcn/ui and react-hook-form with Zod are locked, so its
questions are about convention rather than library choice. `mobile` second because NativeWind is
Tailwind, chosen so one styling language crosses both clients, so `web` gives it something to refer to.
`site` last because it is the most different of the three — Next's App Router and server-side data
fetching share nothing with the `web` stack — so it neither gains nor loses from the ordering.

**A structural question was raised and deliberately not decided.** The phase 1 contracts — RFC 9457
errors with the `errors` extension, cursor pagination, the httpOnly cookie, the `/api/v1` path — each
have a client-side rule. If `web/` establishes those and `mobile/` points at them, a `mobile`-alone
project gets a dangling pointer, since it never receives `web/`. That is the same failure class the
multi-tenancy area exposed.

It is **not** decided now because it is predicted rather than observed: the overlap may be small, or
each client may consume the contract differently enough that nothing repeats. Creating a ninth area for
a problem nobody has hit yet is the day-zero test applied to the structure itself. It goes to
`OPEN-QUESTIONS.md` and is settled when `mobile/` either repeats `web/` or does not.

**Affects:** phase 3

---

## 2026-09-11 — The web app is organised by feature

**Decision:** code is organised by feature — `features/<name>/` holding that feature's components, hooks
and queries together. `routes/` carries thin route definitions that point at features.

**Options considered:**
- A) By feature.
- B) By type — `components/`, `hooks/`, `queries/`, `pages/`.
- C) Hybrid — by type at the top, by feature inside each.

**Reasoning:** A. It is the same choice the API made with one module per resource, so *where do I go to
change orders* has one answer at both ends of the project.

**The practical argument:** a change to orders touches one folder instead of five. Organising by type
optimises for *show me every hook*, which nobody asks, while organising by feature optimises for
*change this feature*, which is every task.

**What A costs, in the same shape as the `@InjectRepository` rule:** it **contradicts muscle memory**.
`components/`, `hooks/`, `pages/` is the layout of nearly every React tutorial, so it is what an
assistant writes unaided. The document has to say so explicitly.

**C is the worst:** it forces two decisions per file — what type it is and what feature it belongs to —
and produces `components/orders/` and `hooks/orders/` describing the same thing in different places.

**Affects:** `web/structure.md`

---

## 2026-09-11 — Three destinations for shared code, and no `shared/` folder

**Decision:**

| Destination | Holds |
|---|---|
| `components/ui/` | shadcn primitives, where its CLI puts them |
| `lib/` | pure functions — no state, no React |
| a named feature | anything with behaviour |

There is no `shared/` or `common/` folder.

**Options considered:**
- A) The three destinations above.
- B) A `shared/` folder for anything serving more than one feature.
- C) Everything loose in a root `components/`.

**Reasoning:** A. `components/ui/` was already settled by the tool: the shadcn CLI installs there, and
moving it would mean post-editing every install — the same argument that made a Nest module's anatomy
exactly what its generator produces.

**The rest is the no-`SharedModule` rule applied to the client, for the same reason.** `shared/` has no
admission criterion — *is this shared?* answers yes for anything used twice — so it only grows and
becomes the junk drawer. Requiring a name forces the question *what is this*, and a component nobody can
name is one that should not be promoted yet.

**The distinction that makes A work is the same one from the API:** not everything shared is a
component. Formatting a date is a function in a file under `lib/`. It needs no folder, no feature name
and no discussion.

**What A costs:** the boundary between *pure function in `lib/`* and *has behaviour, becomes a feature*
is a judgement. A hook that only wraps `useState` sits between them. **The rule stated: if it uses React,
it is not `lib/`.**

**Affects:** `web/structure.md`

---

## 2026-09-11 — One context per subject, living in the feature that owns it

**Decision:** client state is React context, one per subject, living in the feature that owns it. A root
context exists only for what belongs to no feature. There is no single application context.

**Options considered:**
- A) One context per subject, in its owning feature.
- B) One application context at the root holding everything.
- C) Bring Zustand back.

**Reasoning:** A.

**The trap this rule exists for:** React context re-renders **every** consumer when its value changes.
An "application context" bundling theme, sidebar and current user makes a theme toggle re-render the
whole tree. It does not show up in development with three components; it shows up when the screen grows,
and it never errors.

One context per subject limits re-rendering to the consumers of that subject, and puts the state beside
the code that uses it — the same axis as the feature-first layout.

**B is that trap, and it is attractive because it looks tidy:** one place for "the app's state". The cost
arrives late and is hard to trace, because excessive re-rendering produces no error.

**On C, honestly:** if the project accumulates real client state, Zustand becomes the right answer again
— it solves precisely the re-render problem A works around by discipline. Zustand was dropped on the
day-zero test, with the note that installing it later costs nothing. That remains true, and **the
document says when to reopen it** rather than pretending context scales indefinitely.

**Affects:** `web/structure.md`

---

## 2026-09-11 — The import alias is `@/`, pointing at the app's own `src/`

**Decision:** `@/` resolves to the app's own `src/`. Not an app-named alias, and not relative imports.

**Options considered:**
- A) `@/` — shadcn's default.
- B) An app-named alias such as `@web/`, to avoid collision in a monorepo.
- C) No alias; relative imports.

**Reasoning:** A.

**C is not available:** shadcn writes alias-based imports into every component it installs, and undoing
that on each install is the post-processing already refused when the module anatomy was fixed to what the
generator produces.

**Between A and B, A wins for the `nest g resource` reason:** it is what the tool generates and what
every example contains. B solves a real but rare problem — moving a file between apps in a monorepo — at
the cost of deviating from the default in **every** project, including `alone` ones where the collision
cannot occur.

**A's risk is recorded rather than avoided:** in a monorepo, `@/` means different things in different
apps, so a file moved between them can compile while pointing somewhere else. That goes into the document
as a warning, and the `monorepo/` area may decide otherwise for the only case where the problem exists.

**Affects:** `web/structure.md`, `monorepo/` (phase 4)

---

## 2026-09-11 — File-based routes, with the generated tree committed

**Decision:** routes are defined as files, with TanStack Router's Vite plugin generating the route tree.
**The generated tree is committed.**

**Options considered:**
- A) File-based routes, generated tree committed.
- B) File-based routes, generated tree gitignored.
- C) Code-based routes.

**Reasoning:** A.

**File-based** is the documented mode and what the plugin assumes. Code-based routes work and require
maintaining a central registry by hand — which is exactly the file the plugin would have generated.

**Committing the generated tree is the debatable half, and the deciding argument is that without it the
repository does not typecheck on a clean clone.** The route tree is imported by application code, so
`tsc` fails until somebody runs the generator. That breaks CI, breaks the editor of whoever just cloned,
and turns *run the dev server first* into a prerequisite for any task.

**The cost is real and irritating:** a generated file in git produces merge conflicts when two people add
a route. The conflict always resolves the same way — regenerate — but it appears.

A broken clone is worse than a predictable conflict.

**Corroboration, not authority:** the frozen era reached the same conclusion.

**Affects:** `web/routing.md`

---

## 2026-09-11 — An authenticated layout protects; public routes live outside it

**Decision:** an authenticated layout route wraps everything requiring a session, redirecting in its
`beforeLoad`. A public route is one that lives outside that layout.

**Options considered:**
- A) An authenticated layout; public routes sit outside it.
- B) Each route declares whether it needs a session.
- C) No client-side protection — the route loads, the API refuses, and error handling redirects.

**Reasoning:** A, after a distinction that changes the weight of the whole question.

**Client-side route protection is not security.** The API refuses, through its global guard. If someone
forgets to protect a route in the web app, nothing leaks — the server returns 401 and the screen receives
no data. What is lost is experience: the page mounts, fires a request, gets a 401, and the user sees a
flash of broken interface before being redirected.

So the fail-closed argument that decided the API's guard **does not apply here with the same force**, and
that is written down so nobody treats the client guard as the boundary and relaxes on the server.

**The property that decides A: protection is expressed by where the file lives.** For a route to be born
unprotected, somebody has to actively place it outside the authenticated layout — forgetting is not
enough. The file tree carries the rule, visible without opening a file.

It is also the same mental model as the API: protected by default, public declares itself. One shape at
both ends.

**B has the shape the API already refused**, and here it produces C's experience every time somebody
forgets. **C is defensible on *the API is the boundary*** and is refused on the flash of broken interface
at every expired session.

**Affects:** `web/routing.md`

---

## 2026-09-11 — Search params are validated with Zod at the route

**Decision:** every search param is validated with a Zod schema in the route's `validateSearch`. An
invalid value is rejected by the router, not by the component. Path params need no rule — the router
types them from the file name.

**Options considered:**
- A) Validated with Zod at the route.
- B) Typed without validation — declare the shape and trust it.
- C) No typing; read strings from the URL and convert where needed.

**Reasoning:** A, on the same reasoning as the server's validation pipe.

**A search param is untrusted input.** It comes from the address bar, which anyone can edit: `?page=abc`,
`?limit=99999`, `?status=<script>`. The difference from a request body is that **it does not pass through
the API on its way in.** If a component feeds `?limit` straight into a request, it becomes the path by
which an unvalidated value reaches the server — which will refuse it, but only after a round trip and
with an error the user cannot interpret.

Validating at the route settles it before anything happens, and Zod is already installed for the
react-hook-form resolver. No new dependency.

**B is the worst of the three:** the type says `number` while the runtime value is the string `"abc"`. A
type that lies is worse than no type, because nothing downstream checks any more.

**C is honest and discards the reason this router was chosen** — end-to-end route typing was the argument
that beat React Router.

**Affects:** `web/routing.md`

---

## 2026-09-11 — TanStack Query owns the cache; the route loader only prefetches

**Decision:** TanStack Query is the single cache. A route loader calls `ensureQueryData` to start the
request early and returns nothing the component depends on; the component reads through the Query hook.

**Options considered:**
- A) Query owns the cache; the loader prefetches.
- B) The loader fetches and passes data down as props; Query handles only non-route data.
- C) `useQuery` in the component only; no loader.

**Reasoning:** A. The router and Query both know how to fetch, and used without a rule a project ends up
with **two caches holding the same thing** — after which *why did the screen not update after saving* has
no single answer.

A combines both advantages without duplicating state. **The loader's benefit is temporal** — the request
leaves on the link click rather than on mount, which removes the loading flash on navigation. **Query's
benefit is everything afterwards**: invalidating after a mutation, revalidating on focus, sharing one
result between two components.

**B loses the second, and that is the classic defect of this pairing.** Data handed down as props is in
no cache, so invalidating after a mutation never reaches it and the screen stays stale until the user
navigates again.

**C loses the first and is the honest choice for a simple project** — it works, with a spinner on every
navigation. A is recommended because its cost is one line in the loader, not an architecture.

**What A requires, recorded so it does not go missing:** the query key is now shared between the loader
and the component, so it must live in one place. Otherwise the loader prefetches under one key while the
component reads another, and the request is paid twice for nothing. That belongs to `web/data.md`.

**Affects:** `web/routing.md`, `web/data.md`

---

## 2026-09-11 — Hand-written client types and a thin fetch wrapper

**Decision:** the web client declares its own request and response types by hand and calls the API
through a thin fetch wrapper. No client is generated from the OpenAPI document.

**Options considered:**
- A) `openapi-typescript` generating types only, with a hand-written wrapper.
- B) Hand-written types and a thin wrapper.
- C) `orval` generating types and TanStack Query hooks.

**Reasoning:** B, chosen by the user against a recommendation of A, on the ground that generated types
are messy. **That objection has a concrete basis that the recommendation omitted:** `openapi-typescript`
emits deeply nested shapes such as
`paths['/api/v1/orders']['get']['responses']['200']['content']['application/json']`, and projects end up
writing a layer of aliases to make them usable. The *types only, no runtime* framing undersold that
ergonomic cost.

**C was refused on both sides:** it generates runtime code and decides the shape of the queries,
including their keys, which is a large body of code nobody reviews, coupled to a generator's opinions and
expensive to leave. Its health is not in question — v8, published the day before this decision — and that
does not change what it decides on the developer's behalf.

**What B costs, and it is the silent kind:** the API renames a field, the web keeps compiling against its
own copy of the type, and the failure appears at runtime as `undefined` on a screen. That is duplication
with silent divergence, which this project has refused elsewhere; here it is accepted knowingly, in
exchange for types a person can read.

**A trap found while reasoning about this, recorded so nobody "fixes" the duplication with it:** in a
monorepo it looks obvious to `import type` the entity from the API package instead of rewriting it.
**That is unsound.** Responses are entities passed through `ClassSerializerInterceptor`, so every
`@Exclude`d property is absent from the JSON while remaining present on the entity type. The shared type
would promise `tenantId` on a payload that never carries it — a type that lies, which is worse than the
duplication it was meant to remove.

**Affects:** `web/data.md`

---

## 2026-09-11 — A query factory per query, returning key and function together

**Decision:** each query has a factory function in its feature, returning the whole options object —
`ordersQuery(filters)` yields `{ queryKey, queryFn }`. Route loaders and components call the same
factory. **The key includes everything that changes the result** — filters, cursor, ordering.

**Options considered:**
- A) A factory returning key and function together.
- B) Keys in a central constants file, with the fetch function separate.
- C) Keys written inline at each `useQuery` and each loader.

**Reasoning:** A. It settles the debt left by the routing decision **by construction rather than by
discipline**. The key and the function cannot disagree when they travel in one object, and the loader and
the component cannot diverge when both call the same factory with the same arguments.

**C is that failure written deliberately:** the loader prefetches under `['orders']`, the component reads
`['orders', filters]`, they miss each other, the request is paid twice and the prefetch achieves nothing.
Nothing warns — it works, only slower.

**B is better than C and still permits the divergence that matters:** the key lives in one place and the
function in another, so somebody can pair the right key with the wrong fetch. A central constants file is
also the junk-drawer shape already refused for `SharedModule` and `shared/`.

**The rule about key contents is stated explicitly** because its failure is silent in a different way: a
key that omits a filter makes two different screens share a cache entry, and the second shows the first's
data.

**Affects:** `web/data.md`

---

## 2026-09-11 — The fetch wrapper converts every error into one `ApiError` type

**Decision:** the wrapper parses every `application/problem+json` body into a single `ApiError` carrying
`status`, `title`, `detail`, `requestId` and the `errors` map already separated, and throws it. Query and
mutation callers always receive that type, never a raw body.

**Options considered:**
- A) One `ApiError` type produced by the wrapper.
- B) The wrapper returns the response as received; each screen interprets it.
- C) The wrapper handles the general case and leaves `errors` for forms to read from the raw body.

**Reasoning:** A. Without it, **every component that displays an error has to know the shape of
problem+json** — dozens of places holding a transport detail, and dozens to edit the day the error format
changes. With A that knowledge sits in one file.

**The most valuable consequence is one only A permits: the `requestId` is present on every error without
anyone asking for it.** A generic error screen can display it, and a user opening a support ticket arrives
with the identifier that finds the exact log line. The API's decision that a 500 reveals nothing is only
sustainable if the id reaches the user, and this is where that happens.

**C is half the distance and leaves forms knowing the format** — the worst place for it, since forms are
the most numerous screens. **B spreads the knowledge everywhere.**

The client has three audiences for one error body and they want different parts of it: a form wants
`errors` per field, a user wants a sentence, support wants the `requestId`. One parsed type serves all
three without any of them parsing.

**Affects:** `web/data.md`, `web/forms.md`

---

## 2026-09-11 — Lists use `useInfiniteQuery` over the cursor

**Decision:** paginated lists use `useInfiniteQuery`, with `getNextPageParam` returning `nextCursor` and
`undefined` once it is null.

**Options considered:**
- A) `useInfiniteQuery`.
- B) A plain `useQuery` with the cursor in component state.
- C) A plain `useQuery` with the cursor in the route's search params.

**Reasoning:** A. It accumulates pages in the cache, knows which page was last, and separates *fetching
the next page* from *fetching the first* — the difference between a spinner in the footer and blanking
the whole list.

**Under B each page replaces the previous one in the cache**, so navigating back loses everything already
loaded and *load more* needs accumulation written by hand.

**C is the only one that deserves a real argument:** putting the cursor in the URL makes the page
shareable and survives a refresh, which is genuinely good. It is refused because with infinite scrolling
the URL would describe the **last** page loaded rather than the five on screen, so opening that link shows
something different from what the person was looking at. An opaque cursor in the address bar also means
nothing to whoever reads it.

**The tie to the routing rules:** if some screen ever does want the cursor in the URL, it is a search
param and passes through `validateSearch` like any other.

**What A costs:** `useInfiniteQuery` has a different shape from `useQuery` — `data.pages` rather than
`data` — so list screens read their result one way and every other screen reads it another. Real
asymmetry, and the price of the cache understanding what a page is.

**Affects:** `web/data.md`

---

## 2026-09-11 — Every mutation declares what it invalidates

**Decision:** each mutation invalidates explicitly in `onSuccess`, using the query factory to build the
key. Nothing invalidates everything, and nothing relies on a short `staleTime`.

**Options considered:**
- A) Explicit invalidation per mutation.
- B) Invalidate everything after any mutation.
- C) No invalidation; a short `staleTime` plus refetch on focus.

**Reasoning:** A.

**B is tempting because it is never wrong, and it is refused on what it costs:** invalidating everything
makes every open screen refetch after any save. On a screen with six queries, saving one field fires six
requests. It works, and it makes the application feel slow for no visible reason.

**C is B spread over time** — more requests still, and the window in which the screen lies remains.

**A composes with the query factory:** because the key comes from the factory, declaring what to
invalidate is calling the same function. There is no loose string to mistype, and invalidating by prefix —
the factory with no arguments — reaches every filter variation of that resource.

**What A costs is judgement:** somebody has to know what a mutation affects, and a mutation touching two
resources must declare both. Forgetting one is silent — the forgotten resource's screen stays stale.

**That silence is preferred to B's**, because A's failure affects one screen and shows up in a test, while
B's affects the whole product's perceived speed and never shows up anywhere.

**Affects:** `web/data.md`

---

## 2026-09-11 — The Zod schema lives with the form and is the source of the type

**Decision:** a form's Zod schema lives in its feature, beside the component, and is the source of the
request type via `z.infer` wherever the shapes match. Where they do not, the schema describes the
**form** and an explicit function builds the request from it.

**Options considered:**
- A) Schema in the feature, source of the type, with an explicit transform where shapes differ.
- B) Schema and request type declared separately, always.
- C) A central schemas file.

**Reasoning:** A. Client types are written by hand, and a form already has a Zod schema — so where both
describe the same shape, declaring them separately is two declarations of one fact, the duplication
refused since class-validator was chosen over Zod on the server.

**Where the shapes match, `z.infer` removes the second declaration for free.** Where they do not — a
confirm-password field that is never sent, a date that travels as an ISO string — A does not pretend they
match: the transform is visible, and whoever reads it sees that the form and the payload are different
things there.

**B pays the duplication in every form to avoid thinking about the minority of cases.** C is the
junk-drawer shape again and separates the schema from the component that uses it, against feature-first
organisation.

**Stated explicitly in the document: a form's schema is not the server's validation.** The API validates
in its `ValidationPipe` and trusts no client. The schema here exists to give immediate feedback, and if
it drifts from the server the server wins — which makes the error-mapping rule the thing that turns that
disagreement into something visible on screen rather than a silent failure.

**Affects:** `web/forms.md`

---

## 2026-09-11 — Field errors map to fields; anything unmatched becomes a form error

**Decision:** the `errors` map from an `ApiError` is walked and `setError` is called on the matching
field. **Anything that matches no field becomes a form-level error**, shown at the top with the
`requestId`.

**Options considered:**
- A) Map what matches; surface the rest as a form error.
- B) Walk only the fields the form knows about.
- C) Show everything as a form-level error without marking fields.

**Reasoning:** A.

**B has a hole that only appears when it happens: the server can reject a field the form does not have.**
Its rules changed, or the validation is business rather than shape — *this email is already in use* comes
back under `errors.email`, but `errors.cnpj` can come back on a screen that shows no CNPJ. Walking only
the form's own fields makes that **vanish**: the user presses save, nothing happens, no message appears.

That is the worst category of failure — silent, on an action the user just took deliberately. A button
that does nothing is the most frustrating experience there is, and it leaves nothing for support to work
from.

**C loses the main benefit:** marking the wrong field is what lets a user understand what to fix without
reading anything.

**A is C as a net underneath B.** Nothing is lost, and the common case stays good.

**This is where an earlier choice pays off:** the error format put field errors in an object keyed by
field precisely because a client consumes them by lookup.

**Affects:** `web/forms.md`

---

## 2026-09-11 — Validate on blur, then on change once a field has errored

**Decision:** forms use `mode: 'onTouched'` with `reValidateMode: 'onChange'`.

**Options considered:**
- A) `onTouched` plus re-validation on change.
- B) `onSubmit`, react-hook-form's default.
- C) `onChange`.

**Reasoning:** A. The two extremes are bad for opposite reasons.

- **`onChange`** turns the email field red on the second character, while the person is still typing. The
  interface reports an error about something that has not finished happening.
- **`onSubmit`** lets someone fill twelve fields, submit, and only then learn the third was wrong. The
  feedback arrives too late to be useful.

**A separates two moments that look like one.** Before a field has errored the user is not interrupted —
it is judged only when they leave it, which is the signal that they finished. After it has errored they
get immediate feedback, because now they are correcting and want to know when it is right.

It is the behaviour nearly every good interface has and almost nobody writes down, so each form ends up
with whatever mode its author chose.

It also costs nothing: two options on the `useForm` call, not code.

**Affects:** `web/forms.md`

---

## 2026-09-11 — Submission disables the button; a non-field error stays on the form

**Decision:** the submit button is disabled while `isSubmitting`. An error with no field becomes a
form-level error at the top, showing `title` and the `requestId`. **The form is not cleared on error.**

**Options considered:**
- A) Disabled button, form-level error, form preserved.
- B) Always-active button; double submission is the server's problem.
- C) A non-field error becomes a floating notification rather than a form error.

**Reasoning:** A. The two halves belong together because the second causes the first: without disabling
the button, a double click sends two creations. The second may even come back as a 409 — and then there
is an error on screen for a request that **succeeded**.

**Double-clicking is the most common cause of duplicates in any system**, and preventing it is free since
`isSubmitting` already exists.

**Not clearing on error looks like a detail and is what annoys most.** Someone fills twelve fields, hits a
server error, and a cleared form means they lost all of it over a problem that was not theirs.

**C was the option most seriously considered.** A floating notification is better for a **transient**
error — *no connection, try again*. For an error that requires changing what was typed it is worse: it
disappears on its own, and the user looks back at the form no longer knowing what it said.

**Showing the `requestId` closes a line that started with the API's error rules:** a 500 reveals nothing,
the log holds everything, and the user carries the identifier that joins the two. Without this, that
decision is only half done.

**Affects:** `web/forms.md`

---

## 2026-09-11 — shadcn components are edited in place

**Decision:** a shadcn component copied into the project is edited directly. It is not wrapped, and there
is no parallel component around it.

**Options considered:**
- A) Edit in place — the file is yours, as shadcn intends.
- B) Never edit; wrap in an own component when a change is needed.
- C) Edit appearance and tokens only; behaviour goes in a wrapper.

**Reasoning:** A.

**B produces a parallel set of components** — a `Button` wrapping `ui/Button` — and then every screen has
to know which of the two to import. Half will import the wrong one, and the wrapper stops applying exactly
where it mattered.

**C has the same disease at smaller scale**, plus a boundary somebody judges on every change: *is
swapping the loading icon appearance or behaviour?*

**What A costs, and it must be written down: re-running the CLI for that component overwrites your
edits.** shadcn neither versions nor merges. That is a consequence of its model rather than a defect
here, and it means reinstalling a component is a deliberate act with the diff inspected — not part of
*update the dependencies*.

shadcn is not a dependency: its CLI copies files in, and the template ships its plumbing rather than its
components, so a developer installs each one when it is needed.

**Affects:** `web/components.md`

---

## 2026-09-11 — A class list becomes a component on the third repetition

**Decision:** a repeated Tailwind class list is extracted on its **third** occurrence, and extracted as a
component rather than a string constant.

**Options considered:**
- A) Extract on the third repetition, as a component.
- B) Extract on the second.
- C) No rule; judge case by case.

**Reasoning:** A.

**A number rather than judgement**, because *when it makes sense* gives two developers different
thresholds in one project and an assistant a third. Any number is arbitrary; having one is not.

**Three rather than two, because the second occurrence is often not a repetition** — two things that
happen to look alike today and will diverge next week. Extracting on the second couples two independent
things, and the next change then needs a prop to tell them apart. The third occurrence is the evidence
that the pattern is real.

**A component rather than a string constant:** `const cardClasses = "…"` shares the appearance without
sharing the structure. Every site still writes its own `div`, and the day the card needs an extra wrapper
there is nowhere to put it.

**What A costs:** counting, and nobody counts. In practice the rule works as a trigger in review — *this
is the third time* — rather than as discipline while writing. That is preferred to having no criterion to
point at.

The failure it exists for: the same sequence appearing in eight places, where changing the spacing becomes
a hunt through eight files.

**Affects:** `web/components.md`

---

## 2026-09-11 — No automatic Tailwind class sorting

**Decision:** classes are not sorted automatically. Biome's `useSortedClasses` is not enabled and
Prettier is not reintroduced.

**Options considered:**
- A) Enable `useSortedClasses`.
- B) No automatic sorting.
- C) Bring back `prettier-plugin-tailwindcss`.

**Reasoning:** B, after verifying Biome's rule rather than assuming it.

**What the check found:** `useSortedClasses` is in the **nursery** group — its own documentation says it
is experimental and may change at any time — its fix is classified **unsafe**, so it is not applied by
`biome check --write` or on save, and it does not yet sort screen variants or plugin utilities.

**And something that precedes all of that: class order in the attribute changes nothing functionally.**
Tailwind generates the CSS in its own order; the `className` string is text. This is cosmetic and
diff-related, not a correctness concern.

**A does not fit what is already built.** The pre-commit hook runs `biome check --staged --write`, and an
unsafe fix is not applied by that command. Applying it would mean `--unsafe`, which enables **every**
unsafe fix in the project rather than this one. So the rule would either merely complain, leaving someone
to sort by hand, or force a change to the hook that nobody wants.

Adopting an experimental tool for a cosmetic gain, when it also fights the existing hook, is a poor trade.

**C is refused:** reintroducing Prettier undoes the decision that removed it and its plugin ecosystem in
favour of a single binary.

**The condition for reopening is concrete: when `useSortedClasses` leaves nursery and its fix becomes
safe.** It then runs inside the hook that already exists, with nothing else changing.

**Affects:** `web/components.md`

---

## 2026-09-11 — Variants are expressed with `cva`, everywhere

**Decision:** component variants use `class-variance-authority`, including in components that did not come
from shadcn. There is one variant grammar in the project.

**Options considered:**
- A) `cva` everywhere.
- B) `cva` only in shadcn components; own components use conditional `className`.
- C) No `cva`; conditionals everywhere.

**Reasoning:** A. `cva` is already in the project — it arrives with shadcn and every component the CLI
installs is written with it — so this recognises what is there rather than adopting something.

**B creates two variant grammars in one project, and the boundary between them is *where the file came
from*** — the worst possible boundary, because it is history rather than nature. Six months on, nobody
knows which components came from the CLI.

**`cva` solves something a conditional does not: it declares the combinations.** With template strings,
`size` and `variant` are two strings concatenated and nothing stops `ghost` and `destructive` appearing
together. With `cva` the variants are an object and TypeScript knows which values exist, so a typo like
`"primry"` does not compile.

**C is the state this decision avoids**, where the last class in the string wins by accident of order.

**What A costs:** `cva` is one more thing to learn before writing a first component. It is small, and it is
already installed — so the cost is learning, not a dependency.

**Affects:** `web/components.md`

---

## 2026-09-11 — `client/` becomes an area, holding what every client shares

**Decision:** a ninth area, `client/`, ships when the project has at least one client — `web`, `mobile` or
`site`. It holds `data.md` and `forms.md`, which move out of `web/`. `web/` keeps `structure.md`,
`routing.md` and `components.md`.

**Options considered:**
- A) One `client/` area holding both shared layers.
- B) Repeat the rules in `web/`, `mobile/` and `site/`, as deliberate duplication.
- C) Two areas — one for the wire contract, one for the TanStack Query conventions.

**Reasoning:** A, and this closes a question that was parked precisely so it could be measured rather than
predicted.

**The measurement, made by comparing each `web/` document against what `mobile/` would need:**

| Document | Applies to mobile? |
|---|---|
| `structure.md` | Same principles, different specifics — Expo Router's `app/`, no shadcn |
| `routing.md` | Same pattern, different mechanics; search params barely exist |
| **`data.md`** | **Nearly identical** — Query, the wrapper, `ApiError`, the key factory, invalidation all hold verbatim |
| **`forms.md`** | **Nearly identical** — react-hook-form and Zod behave the same; only rendering differs |
| `components.md` | Half — `cva` and the extraction rule hold; shadcn does not exist, NativeWind replaces Tailwind |

**The prediction was right and incomplete.** There are **two** shared layers, not one: the **wire
contract** — base URL, `/api/v1`, credentials, `ApiError` with `requestId`, hand-written types — which
holds for all three clients including `site`; and the **TanStack Query conventions**, which hold for `web`
and `mobile` and not for a `site` fetching on the server.

**Corroboration found while moving the files:** neither `data.md` nor `forms.md` contained the words
*web*, *React*, *Vite* or *TanStack Router*. They had been written neutrally without anyone trying, which
is evidence they never belonged to one client.

**C is more precise and is over-fragmentation:** nine areas become ten, and the second would carry an even
stranger condition — *web or mobile, but not site*.

**What A costs, and it is what made this hesitate:** it **breaks the simplicity of the inclusion table**.
All seven existing rows are simple equalities; this is the first with an *or*. And `site` receives a
document it half uses — a small dose of the anti-pattern this project avoids, mitigated by the document
saying which half is Query-specific. Unused context costs tokens; it does not produce wrong code.

**Affects:** `docs/structure.md`, `docs/stack.md`, `web/`, `mobile/`, `site/`, phase 6

---

## 2026-09-11 — What moves to `client/`: similarity **and** consequence

**Decision:** a document moves to `client/` when it is nearly identical across clients **and** carries
rules whose violation is silent. What is merely similar, and cheap to get wrong, is repeated per area.

By that rule: `data.md` and `forms.md` belong to `client/` — a forgotten invalidation and an unmatched
field error both fail without a sound. `structure.md` and `components.md` stay per area — a wrong folder
layout is visible on first opening the project and costs one folder to fix.

**Options considered:**
- A) Similarity **and** consequence.
- B) Similarity alone — everything nearly identical moves.
- C) No criterion; decide document by document.

**Reasoning:** A, and the question was raised because a closer look contradicted an earlier estimate.
`web/structure.md` was described as *sharing principles but differing in specifics*; the actual
differences between web and mobile are two sentences — the routes directory is `routes/` in one and
`app/` in the other, and there is no shadcn on mobile. Everything else is word for word identical.

**So by similarity alone, `structure.md` would move too.** The criterion exists to say why it should not.

**It also explains why `client/` exists at all**, without turning it into *everything that looks alike*.
The reason `data.md` and `forms.md` moved was not saving lines — it was that two drifting copies would
mean one of them quietly ceasing to be true about a failure nobody sees. A folder layout has no such
property.

**B would drag `structure.md` along**, and then a `site` would inherit the one-context-per-subject rule,
which is a different conversation under React Server Components.

**C is what was happening**, and it is how a project arrives at three restructurings.

**Affects:** `client/`, `web/`, `mobile/`, `site/`

---

## 2026-09-11 — Expo Router's `app/` holds thin files; screens live in features

**Decision:** files under `app/` render a feature and hold no screen implementation.
`app/orders.tsx` renders `features/orders`.

**Options considered:**
- A) Thin files in `app/`; the screen lives in its feature.
- B) The screen lives in `app/`; only what is reused moves down to `features/`.

**Reasoning:** A. It matches what the web area decided for `routes/`, and the symmetry matters in a
monorepo holding both: the same feature exists in two apps, and if one puts the screen in the route while
the other puts it in the feature, comparing them becomes translation.

**It also has its own reason.** Expo Router's `app/` is a URL namespace — everything in it has a public
path attached. Putting implementation there mixes *how you reach this screen* with *what this screen
does*, and the first changes for navigation reasons while the second changes for product reasons.

**What A costs:** one more file per screen, containing an import and a render. On a simple screen that
reads as bureaucracy.

**The rest of `mobile/structure.md` is not decided here.** Feature-first, `lib/` for pure functions, no
`shared/` folder, one context per subject, and the `@/` alias all carry over from the web area unchanged,
under the criterion that what is similar and cheap to get wrong is repeated rather than shared.

**Affects:** `mobile/structure.md`

---

## 2026-09-11 — The same three destinations on mobile, with `components/ui/` hand-written

**Decision:** mobile keeps the same three destinations for shared code — `components/ui/`, `lib/`, and a
named feature. `components/ui/` holds **hand-written** visual primitives, since shadcn's CLI installs
nothing for React Native.

**Options considered:**
- A) The same three destinations, with `components/ui/` written by hand.
- B) Two destinations; a shared visual primitive becomes a named feature.
- C) One destination; everything shared becomes a feature.

**Reasoning:** A. **B and C would force naming a button as a feature, and *feature `button`* is a lie** —
a feature is a slice of product, and a button is not product. That would corrupt the criterion the web
area established, which is that what cannot be named should not be promoted yet. A button **can** be
named; it simply is not a feature.

Keeping all three also preserves symmetry with the web area, which in a monorepo means the same person
finds the same things in the same places in both apps.

**The difference is one sentence in the document:** on the web, `components/ui/` is the shadcn CLI's
territory and its components are edited in place; on mobile it is hand-written from the start, and there
is no *reinstall over the top* to warn about.

**Affects:** `mobile/structure.md`

---

## 2026-09-11 — The splash is held until the session is resolved

**Decision:** the native splash screen stays visible until the session has been read from
`expo-secure-store`. Only then does the router render the authenticated group or redirect to login.
Protection lives in an authenticated layout group, not in each screen.

**Options considered:**
- A) Hold the splash until the session is known.
- B) Render the route immediately and redirect once the absence of a session is discovered.
- C) No layout; each screen checks for itself.

**Reasoning:** A, and the question exists because mobile has a state the web does not.

**On the web the cookie travels with every request and the server decides, so the client is never in
doubt.** On mobile the session sits in `expo-secure-store` and reading it is **asynchronous**: on every
cold start there is a moment when the app does not know whether anyone is signed in.

**There is an aggravating factor unique to mobile: MMKV persists across launches.** If a protected screen
renders before the decision, it can show cached data **from the previous user** for a fraction of a second
before redirecting.

**Holding the splash is free in perceived terms.** It is already a native, expected moment, and nobody
finds it odd for an app to take 200ms to open. B's flash reads as a defect, and at worst shows somebody
else's data.

**C is worse here than the equivalent was on the web**, where it was refused for experience: a per-screen
check means the screen somebody writes tomorrow does not check.

**What A costs:** the splash must be controlled explicitly rather than disappearing when React mounts.
That is bootstrap configuration rather than a per-screen rule, and `expo-splash-screen` exists for it.

**Affects:** `mobile/routing.md`

---

## 2026-09-11 — A deep link's destination is held in memory and consumed after login

**Decision:** when a deep link targets a protected route with no session, the intended destination is kept
**in memory** and navigated to immediately after a successful login. It is not persisted, and it is
discarded if the app closes first.

**Options considered:**
- A) In memory, consumed after login.
- B) Persisted in MMKV so it survives the app closing.
- C) Not kept; after login, always the home screen.

**Reasoning:** A.

**C is the most common reason a notification link "does not work":** somebody taps a specific order,
authenticates, and lands somewhere else, then has to find the order by hand. It undoes the value of any
linked notification.

**Memory rather than disk, for a privacy reason.** The destination is only useful between *opened the
link* and *finished logging in* — seconds. Persisting it extends the life of a value that describes the
user's intent — `orders/123` says order 123 exists and that this person was interested in it — beyond the
process that needed it. That is a privacy cost with no matching gain: somebody who closed the app midway
through login is not returning expecting to resume.

**What A costs:** if the system kills the app during login — low memory, for instance — the destination is
lost. That is acceptable, and in that specific case it is the same outcome as C.

**Affects:** `mobile/routing.md`

---

## 2026-09-11 — Expo Router's typed routes are enabled

**Decision:** `experiments.typedRoutes` is enabled. Navigation uses absolute paths. The generated
`expo-env.d.ts` stays gitignored, following Expo's own convention.

**Options considered:**
- A) Enable typed routes.
- B) Leave `href` as a plain string.

**Reasoning:** A.

**This looks like the Biome nursery rule that was refused, and the difference is worth stating so the
inconsistency does not read as carelessness.** There the tool was experimental and the gain was
**cosmetic** — class order changes nothing functionally. Here the tool is beta and the gain is
**correctness**: a wrong `href` is broken navigation and a wrong param is a screen that opens empty.
Experimental for correctness is a different trade from experimental for appearance.

**There is also a symmetry argument:** TanStack Router was chosen for the web precisely for end-to-end
route typing. Leaving mobile without an equivalent means the same typo compiles in one app and not the
other.

**Verified rather than recalled:** typed routes are in beta, enabled through an `experiments` flag, type
both hrefs and params, do not support relative paths, and generate a gitignored `expo-env.d.ts`.

**What A costs, concretely:**

- Relative paths stop working; every navigation uses an absolute path.
- It is beta and may change. Unlike the Biome case, backing out is switching off a flag rather than
  undoing a habit spread through the code.
- **`expo-env.d.ts` is generated and gitignored — the opposite of the web decision**, where the route tree
  is committed because without it a clean clone does not typecheck. Expo's convention is followed here
  rather than forcing symmetry, because that file is their territory and fighting the framework's default
  `.gitignore` creates friction on every upgrade. The asymmetry is recorded in the document so nobody
  "corrects" it later.

**Affects:** `mobile/routing.md`

---

## 2026-09-11 — Secure store holds what grants access; MMKV holds everything else

**Decision:** anything that **grants access if stolen** — the session cookie, any token — lives in
`expo-secure-store`. Everything else lives in MMKV. MMKV's own encryption is not used.

**Options considered:**
- A) By nature: secure store for what grants access, MMKV for the rest.
- B) Secure store for everything sensitive, cached personal data included.
- C) Everything in MMKV, using its encryption.

**Reasoning:** A.

**Verified at Expo's documentation before writing any rule:**

| | |
|---|---|
| Backing | iOS Keychain; Android Keystore over SharedPreferences |
| Size | No Expo-enforced limit, but **iOS has historically refused values above roughly 2048 bytes** |
| Not a backup | *"do not rely on it as a single source of truth for irreplaceable, critical data"* |
| Uninstall | Android deletes it; **iOS keeps it across reinstalls** with the same bundle ID |

**B does not work even if wanted:** at roughly 2KB per value on iOS, a cached profile does not fit. It
would be a rule the platform refuses.

**C moves the problem rather than solving it:** MMKV's encryption needs a key, and that key has to live
somewhere. In the bundle it is public — which the mobile config document states outright. In the secure
store, you are using the secure store anyway, with one more step.

**A gives a criterion that scales without a list: does this alone open somebody's account?** A token does.
A name does not. A cached list of orders does not — it reveals information, and revealing is not granting.

**Two consequences go into the document rather than being discovered:**

The app sandbox already protects MMKV from other applications. MMKV's encryption defends against
filesystem access — a rooted device, an extracted backup — not against the neighbouring app.

**The session surviving reinstall on iOS means *I deleted the app to sign out* does not work**, and a
handed-on device stays signed in. That is not fixed by storing it elsewhere; it is fixed by clearing on
logout.

**Affects:** `mobile/storage.md`

---

## 2026-09-11 — The Query cache is persisted in MMKV, with a maximum age

**Decision:** the TanStack Query cache is persisted to MMKV with a maximum age, and is **cleared on
logout** together with the session.

**Options considered:**
- A) Do not persist; cache in memory only.
- B) Persist to MMKV with a maximum age, cleared on logout.
- C) Persist with no expiry.

**Reasoning:** B. On the web the cache lives in memory and disappears on reload, which is acceptable
because the network is there and reloading is cheap. **Mobile differs in two ways:** the app is killed and
reopened constantly, and the network may simply not exist at the moment somebody opens it.

**It is the difference between an app that opens showing yesterday's list while it refreshes, and one that
opens blank with a spinner.** On a phone, opening blank is the default experience of a bad application,
and it happens every time somebody opens it in a lift.

**C is refused:** a cache with no expiry presents months-old data as current, and the user has no way to
know it is stale.

**A is honest and is what the web does**, and is refused because the reason A is acceptable on the web —
the network is always there and reloading is cheap — does not hold here.

**The part that is not about experience:** a persisted cache writes API responses to disk, personal data
included. Under the storage rule that belongs in MMKV and is correct — it does not grant access. But it
means **logout must clear the cache, not only the session.** Without that, switching users on one device
shows the previous user's data — the same flash the routing decision described, except permanent rather
than a fraction of a second.

That makes clearing on logout mandatory rather than hygienic.

**Affects:** `mobile/storage.md`

---

## 2026-09-11 — Logout erases everything belonging to the user, and nothing else

**Decision:** logout clears the session from `expo-secure-store`, the persisted Query cache, and every
MMKV key holding that user's data. Device preferences — theme, language — survive.

**Options considered:**
- A) Erase what belongs to the user.
- B) Erase the session only.
- C) Erase MMKV entirely.

**Reasoning:** A. The two previous decisions made this mandatory rather than hygienic: the session lives
in secure storage, API responses are persisted to disk, and **on iOS the session survives reinstalling the
app**.

**B leaves the device holding personal data on disk and, on iOS, a credential that returns after a
reinstall.** The user did the one thing the product offered to protect themselves, and their data stayed.

**C looks safest and punishes the common case:** wiping MMKV takes theme, language and every device
preference with it, so the next login — which is usually **the same person coming back** — finds the app
as though it were new. Security that penalises the common case to serve the rare one ends up switched off
by somebody.

**A requires a distinction when each key is written: is this the user's or the device's?** That is
judgement, made once per key at the moment it is created.

**Stated explicitly in the document because it is counter-intuitive: clearing on logout does not address
a lost device.** Nobody signs out of a phone that is gone. That is server-side work — invalidating the
session remotely — and does not belong to this document. It is written down so nobody treats wiping local
storage as the answer to theft.

**Affects:** `mobile/storage.md`

---

## 2026-09-11 — Only values that are public by nature are embedded in a build

**Decision:** an app build embeds only what is public by nature — the API base URL, and a third-party
**publishable** key where the project uses such a service. Nothing else. A feature needing a secret is
performed by the API, and the app calls the API.

**Options considered:**
- A) Public-by-nature values only.
- B) Embed what is needed, obfuscated.
- C) Embed nothing; fetch configuration from the API on first launch.

**Reasoning:** A. **This is the fact with no equivalent in the API's configuration document.** There, a
secret in an environment variable is the correct place for a secret. Here **there is no safe place** —
whoever has the `.apk` or `.ipa` reads any string inside it.

Expo's own warning, verbatim: *"Do not store sensitive info, such as private keys, in `EXPO_PUBLIC_`
variables. These variables will be visible in plain-text in your compiled application."*

**B is refused, and its worst quality is not being weak.** Obfuscation against someone holding the binary
is a speed bump, extractable in minutes with public tooling. The real damage is the **sense** of
protection: somebody starts embedding things they would not have embedded had they known they were
exposed.

**C does not work:** fetching configuration from the API requires knowing the API's URL. It is circular,
and it adds a network round trip before anything functions, with a failure mode on a plane.

**The criterion, and it goes into the document: would this still be safe printed on a billboard?** A
publishable key is designed for exactly that — it is what the name means. A secret key is not.

**Named conditionally, not listed:** an error-reporting DSN is an example of the category *if the project
chose such a service*. Paid services are documented rather than installed, so the mobile area assumes none
of them exists.

**Affects:** `mobile/config.md`

---

## 2026-09-11 — `EXPO_PUBLIC_` variables, read in one typed config module

**Decision:** configuration comes from `EXPO_PUBLIC_*` environment variables, read in **one** module that
exports a typed object. Every literal read lives there, and nothing else in the app touches
`process.env`.

**Options considered:**
- A) `EXPO_PUBLIC_*` read in one config module.
- B) `EXPO_PUBLIC_*` read wherever they are used.
- C) `extra` in `app.config.ts` via `Constants.expoConfig.extra`.

**Reasoning:** A.

**Verified rather than recalled:** Expo inlines `process.env.EXPO_PUBLIC_X` at build time, and **only
static dot notation is replaced** — `process.env['EXPO_PUBLIC_X']` is not. The environment therefore
cannot be iterated: every variable must appear literally, written by hand, somewhere in the code.

**That constraint does not fight A; it argues for it.** It requires the literal reads to be gathered in
one place, which is what the design wanted anyway.

A is also the same shape as the API's configuration document — one module reads the environment, the rest
imports an object — for the same reason: renaming a variable breaks one file rather than compiling and
failing at runtime.

**B scatters `process.env.EXPO_PUBLIC_…` across dozens of files.** Beyond having no type, it makes it
impossible to know what the app consumes without searching the whole project — which matters more here,
because that list is also the list of what is baked into the binary.

**C is refused because Expo is moving away from it.** Adopting the pattern a vendor is leaving behind buys
a future migration for nothing.

**A symmetry worth recording:** the API's configuration rules and these arrive at the same shape — one
module, one typed object, nobody else reading the environment — by different routes. There it was so the
type would not lie; here it is to know what is embedded in the binary.

**Affects:** `mobile/config.md`

---

## 2026-09-11 — Configuration is validated at build time, not at boot

**Decision:** a build step verifies that every expected `EXPO_PUBLIC_` variable exists, and the build
fails when one is missing. There is no runtime validation.

**Options considered:**
- A) Validate at build.
- B) Validate at boot, as the API does.
- C) Both.

**Reasoning:** A, and the difference from the API is the nature of the environment.

**The API's environment is runtime** — it starts, reads, and refuses to start when something is missing.
**A mobile app's environment is build-time:** the value is inlined into the bundle, so by the time the app
runs the variable is already a string literal — or is `undefined`, frozen inside the binary.

**Build is the only moment when the fix is cheap.** A missing variable at build means somebody adds it and
runs again: two minutes. Discovered at boot, the app is in a store, and the cycle is build, submit,
review, wait.

**B cannot even see what it is looking for.** If the variable is absent when the bundle is made,
`process.env.EXPO_PUBLIC_X` is replaced by `undefined` **literally**. That is not a detectable absence
meaning *nobody configured this* — it is a constant that was always `undefined`. Validating at boot merely
confirms, late, what the build already knew.

**C looks like belt and braces and buys the worse half of B:** validation code running on every launch for
a value that cannot change after the build.

**What A costs:** the validation step has to exist in the pipeline, and somebody running `expo start`
locally without a `.env` is not stopped — there the feedback is immediate anyway, since the screen breaks
at once.

**Affects:** `mobile/config.md`

---

## 2026-09-11 — NativeWind for everything it covers; a style object needs a stated reason

**Decision:** NativeWind is used for everything it covers. A style object or `StyleSheet` is used only
where an API requires one — an animated style, a native prop that takes no `className` — with a comment
naming the API that required it.

**Options considered:**
- A) A ladder, with a stated reason for stepping off NativeWind.
- B) NativeWind for layout, `StyleSheet` for the rest.
- C) Free choice.

**Reasoning:** A. It is the same ladder as the query rules, where `em.find` is the default and stepping
down to the QueryBuilder or raw SQL needs a written reason. **The shape repeats because the problem
repeats:** with no permission to step down, somebody forces the upper tool to do what it cannot; with
unlimited permission, the lower one becomes the default path because it is familiar.

**The comment answers the same question a year later:** is that `StyleSheet` there because Reanimated
requires it, or because whoever wrote it did not know the equivalent class? That answer decides whether
anyone may simplify it.

**B puts the boundary in the wrong place.** *Layout* and *the rest* is not a technical division — it is
just where NativeWind feels comfortable — and in practice it produces a component with half its styling in
each system.

**Affects:** `mobile/components.md`

---

## 2026-09-11 — Each platform keeps its own scale; the class crosses, the pixel does not

**Decision:** NativeWind's native defaults are kept. `text-base` means *the base size on that platform*,
and the document says so. Spacing that must be identical across web and mobile is written as an absolute
value.

**Options considered:**
- A) Accept each platform's default.
- B) Force `rem: 16` on native so the scales line up.
- C) Abandon the scale; absolute values everywhere.

**Reasoning:** A.

**Verified:** NativeWind uses a `rem` of 16 on web and **14 on native**, matching each platform's own
default. So `text-base` and `p-4` produce different sizes in the two apps — not a bug, but alignment with
two different conventions.

In a `mobile`-only project this is invisible and correct. In a monorepo with `web` it is the source of
*why is the button smaller in the app?*, and the answer is in neither codebase, because both say
`text-base`.

**B is tempting and wrong:** 14 is not arbitrary, it is the platform's default text size. Forcing 16 makes
every piece of text in the app larger than in every other app on the device, and people notice without
being able to say why. It would trade consistency with **the platform** for consistency with **the other
app of the same product**, and the user only ever sees the first.

**C discards the whole scale to solve one case.**

**What A costs, and why this is a decision rather than a footnote:** whoever designs has to know that the
same class is not the same pixel. Unwritten, somebody compares the two screens side by side, treats the
difference as a defect, and "fixes" it with B.

**The tie to the mobile stack decision:** NativeWind was chosen so one styling language would cross both
clients. That remains true — the **language** crosses, the **scale** does not.

**Affects:** `mobile/components.md`

---

## 2026-09-11 — The `site` type uses Next's App Router

**Decision:** `site` projects use the App Router. Not the Pages Router, and not both.

**Options considered:**
- A) App Router.
- B) Pages Router.
- C) Both, per route.

**Reasoning:** A. It is where Next invests, so choosing Pages today is choosing the path that only falls
further behind. For a type whose reason to exist is SEO, Server Components matter concretely: the page
arrives rendered without the client fetching anything.

**C is supported by Next and is the worst option for Prumo:** two mental models in one project, with
different rules for layouts, data fetching and caching in each. An assistant reading `.prumo/` would have
to know which half it is in.

**What A costs, in the same shape as refusing `@InjectRepository`:** training material. Much of what exists
written about Next is Pages Router, so an assistant without this context mixes `getServerSideProps` with
Server Components. The document has to be explicit and negative about it.

**A gap found before this decision and worth recording:** `docs/stack.md` had **no `Site` row at all**. The
eighteen stack questions came from the frozen era's list, which had a Web line and a Mobile line and none
for a public site — because there it was a conditional document rather than a type with its own stack.
When `site` became a type, its stack did not follow. Writing this area's conventions without settling that
first would have meant inventing a stack silently.

**Part of it was already settled without being noticed:** `client/` ships to `site` and has already fixed
react-hook-form with Zod, hand-written types, the `ApiError` and the wire contract.

**Affects:** `site/`, `docs/stack.md`

---

## 2026-09-11 — `site` styles with Tailwind and shadcn, as `web` does

**Decision:** Tailwind with shadcn/ui, the same as the web area.

**Options considered:**
- A) Tailwind and shadcn.
- B) Tailwind without shadcn.
- C) Something else.

**Reasoning:** A. It is the third time this choice appears and the reason is the one from the other two:
in a monorepo holding `web` and `site`, whoever writes sees one styling language in both. The limit
already recorded for mobile — the language crosses, the scale does not — does not even apply here, since
both run in a browser with a `rem` of 16.

**B has an honest argument:** a marketing site has a header, a footer, a card and a contact form, and none
of that needs an accessible combobox. Installing shadcn's plumbing to use two components looks
disproportionate.

**A wins on something that is not about quantity.** shadcn's plumbing is `cn()`, `cva` and the theme
tokens, and those three are used from the first hand-written component onward, whether or not any
component is installed. Without them the site would write conditional `className` — refused for variants
in the web area — and would declare its palette differently from `web`.

**C is refused:** switching styling language between two apps that run in the same browser, in the same
monorepo, has no argument behind it.

**Affects:** `site/`, `docs/stack.md`

---

## 2026-09-11 — Static by default, revalidated where content changes, dynamic with a reason

**Decision:** routes are static by default. Revalidation is used where content changes without a deploy —
a blog, a catalogue. A dynamic route requires a written reason, and is only for responses that depend on
who asked.

**Options considered:**
- A) Static by default.
- B) Dynamic by default, static where it pays.
- C) Everything static; new content requires a deploy.

**Reasoning:** A. This is the decision that determines whether the `site` type does what it exists for. It
was separated from `web` **because of SEO** — if pages do not arrive rendered, the type loses its reason.

**The default must be static because in the App Router a page becomes dynamic by accident.** Reading a
cookie, a header or a search param inside a Server Component switches the whole route to per-request
rendering — no error, no warning, and a page that was instant now waits on a server. With a static
default, that change is a departure from a written rule and shows up in review. With a dynamic default,
nobody notices.

**C is defensible for a small site** and breaks the first time a client wants to publish a paragraph
without calling a developer.

**B inverts the cost:** the common case for a site — an institutional page that rarely changes — would pay
for a server on every visit, including the crawler's, and crawlers visit often.

**What A costs, and it goes into Enforcement: nothing warns when a route slips into being dynamic.** It is
review, and the clue is indirect — somebody added a cookie read three components down.

**Affects:** `site/`

---

## 2026-09-11 — The site fetches on the server, never in a client component

**Decision:** data is fetched in a Server Component or in the static generation function. Client
components receive data as props. A browser-side call exists only for interaction after load — submitting
a form, for instance.

**Options considered:**
- A) Fetch on the server.
- B) TanStack Query in a client component, as the web area does.
- C) Mixed, with no rule.

**Reasoning:** A. **B is the shape that turns `site` into a slower `web`.** If data arrives through
`useQuery`, the static page Next generated is empty in the HTML and the crawler sees a shell — and in that
case there was no reason to separate the two types at all.

**A consequence made explicit: `site` uses half of `client/data.md`.** The wire-contract layer applies;
the TanStack Query layer does not. That was anticipated when the `client/` area was created, and this is
the document where the anticipation is confirmed.

**Credentials change meaning here.** On `web` and `mobile` a call carries the user's cookie. On the site's
server there is no user — the render is for everyone — so the call is anonymous. If a page needs
authenticated data, it is neither static nor public, and probably does not belong to the `site` type.

**Affects:** `site/`, `client/data.md`

---

## 2026-09-11 — Feature-first, except that a route file carries its own content and metadata

**Decision:** the site is organised by feature, **except** that `page.tsx` and `layout.tsx` hold the
route's content alongside its metadata. `features/` holds what is reused across routes.

**Options considered:**
- A) Feature-first, with route files carrying content and metadata.
- B) The same as the web area — a thin `app/` pointing at features.
- C) No `features/`; everything inside `app/`.

**Reasoning:** A. By the repetition criterion this would carry over from the web area, and the App Router
changes a premise that was embedded there.

On `web` and `mobile` the route directory holds a thin file pointing at a feature. In the App Router that
is possible and **counterproductive**: `page.tsx` is where `generateMetadata` and `generateStaticParams`
live, and those are exactly what makes the `site` type exist. Pushing the page into a feature separates
the content from the metadata describing it.

**Metadata is part of a page's content, not of its navigation.** A title, a description and a share image
describe that specific text; separating them makes it easy to change one without the other, and a page
with the wrong title is a defect that only surfaces when somebody shares the link.

**C loses what feature-first solves:** two fragments reused across routes have nowhere to live without
importing between route folders.

**An asymmetry recorded deliberately, the second this session, so it does not read as carelessness:**
`web` and `mobile` keep thin route files and `site` does not. The reason is not preference — only in the
App Router does the route carry SEO metadata, and that is precisely what distinguishes the type.

**Affects:** `site/`

---

## 2026-09-11 — `multi-tenancy/` holds two documents

**Decision:** the area contains `isolation.md` and `client.md`.

**Reasoning:** *how the tenant is resolved* and *how the filter uses it* are one act — the resolution
exists to feed the filter, and neither is read without the other — so under the subject test they are one
file.

`client.md` is separate because it is read during an interface task, with nothing from the database open.
It also carries a rule in the same silent-failure family as the rest: **switching tenant without clearing
the query cache shows the previous tenant's data.** That is the defect the mobile logout rule addressed
under a different trigger, and this one is worse, because switching tenant is an ordinary action inside a
session rather than an exit event.

**Already settled and not reopened:** isolation is a MikroORM filter declared `default: true` with its
parameter set per request, with three named holes — the QueryBuilder, raw SQL and row creation — and RLS
parked for want of measurement.

**A gap flagged rather than fixed:** `core/` still has no documents, despite being the only unconditional
area. Its content — TypeScript, Biome, the hook, file naming — has been settled since the stack questions.
It sits late in the roadmap and is worth revisiting once this area closes.

**Affects:** phase 4b

---

## 2026-09-11 — The tenant comes from the session, never from the request

**Decision:** the active tenant is derived from the session by the server. The client never chooses it.
A subdomain may exist for presentation, and never decides isolation.

**Options considered:**
- A) The session is the source.
- B) The subdomain identifies the tenant.
- C) A client-sent header or path param, validated against the user's membership.

**Reasoning:** A. Getting this wrong is not leakage through carelessness — it is leakage **by design**.

**C is dangerous even with the validation**, because it depends on that validation existing on **every**
route. Forgetting once is complete cross-tenant access, and the forgetting is invisible: the route works
perfectly for someone entitled to the data and equally well for someone who is not. It is the most direct
way to turn a review lapse into an incident.

**B is refused because a subdomain is input.** It arrives in the `Host` header, which a client controls:
`curl -H "Host: acme.app.com"` with another tenant's session is the attack, and proxies rewrite `Host` on
their own, making the defence depend on infrastructure configuration.

**A inverts that: the tenant is a property of who you are, not of how you asked.** Nothing the client
sends can change it.

**What A does not forbid:** the subdomain can still exist for **presentation** — a logo, a theme, the right
company's login screen. It simply does not decide isolation. If the subdomain says `acme` and the session
says another tenant, the answer is an error rather than a choice.

**Affects:** `multi-tenancy/isolation.md`

---

## 2026-09-11 — Better Auth's organization plugin, with the active organization in the session

**Decision:** the `organization` plugin is used, with `activeOrganizationId` **persisted in the session**.
`tenant_id` on business tables holds the organization's id.

**Options considered:**
- A) The plugin, with the active organization persisted in the session.
- B) The plugin, with the active organization managed client-side only.
- C) A custom session field, without the plugin.

**Reasoning:** A.

**Verified at Better Auth's documentation:** the plugin supports multiple organizations per user, roles
and invitations, and extends the session with `activeOrganizationId` — exactly the shape the previous
decision requires.

**B is refused by name in the document, because the vendor presents it as reasonable.** Their
documentation says: *"It's not always you want to persist the active organization in the session. You can
manage the active organization in the client side only. For example, multiple tabs can have different
active organizations."* That is legitimate for many products and, for a multi-tenant system, it means the
**tab** decides isolation — which is what the previous decision refused. Somebody will find that sentence,
so the refusal is recorded rather than implied.

**C would mean reimplementing membership, invitations and roles**, all three of which a multi-tenant SaaS
needs. It is rewriting what the plugin already has, with the difference that ours would be tested by
nobody else.

**Two costs of A, put on the table:**

**Multiple tabs share one active organization.** Switching tenant in one changes the other, and somebody
working across two clients at once will notice. That is the direct price of the server owning the choice,
and it is the case Better Auth itself cites.

**A schema boundary.** Better Auth's tables live in their own Postgres schema, so `organization` and
`member` are there while business tables carry `tenant_id` in ours. Whether `tenant_id` has a foreign key
into their `organization` table is the next decision — pointing at it would make our migrations depend on
a schema their CLI administers.

**Affects:** `multi-tenancy/isolation.md`

---

## 2026-09-11 — `tenant_id` carries a cross-schema foreign key to `organization`

**Decision:** `tenant_id` has a foreign key into Better Auth's `organization` table, across the schema
boundary, with `ON DELETE RESTRICT`. The deploy applies Better Auth's migrations **before** ours.

**Options considered:**
- A) With a cross-schema foreign key and `RESTRICT`.
- B) Without one — `tenant_id` references the organization by convention, guaranteed by nothing.
- C) Copy the organization into our schema and point at the copy.

**Reasoning:** A.

**What B gives up is large and silent.** Without the key, a `tenant_id` pointing at an organization that
does not exist compiles, inserts and passes tests — and the row is orphaned: invisible to every filtered
query and impossible to find without looking deliberately. That is the defect class the index and
foreign-key rules were written to prevent.

**The `RESTRICT` side effect is the wanted behaviour.** Deleting an organization that still has business
data **should** fail. The right path is the application deciding what happens to that data — archive,
export, delete in order — rather than a silent `CASCADE` fired by an authentication library's CLI.

**C is refused:** two sources of truth for one organization, synchronised by somebody. It is duplication
with silent divergence in the shape of a table.

**A's real cost, and it is what made this hesitate:** our migrations now depend on `organization` existing,
so **order matters**. Better Auth's CLI must run before our migrations, always. The migration step in the
deploy pipeline now has two halves with a mandatory sequence, and inverting them breaks the deploy.

That sequence goes into the document as written order rather than something to be deduced.

**Affects:** `multi-tenancy/isolation.md`, `database/migrations.md`

---

## 2026-09-11 — Three holes, three different answers

**Decision:**

| Hole | Rule |
|---|---|
| **Creation** | `tenant_id` is **never a method argument**. It is read from the session in the same place that feeds the filter, and the column is `NOT NULL`. |
| **QueryBuilder** | `qb.applyFilters()` is mandatory, and its absence is a named review item. |
| **Raw SQL** | `WHERE tenant_id = $1` is mandatory, and the query carries a comment stating it was checked. |

**Options considered:**
- A) Three answers, each at the level where the problem lives.
- B) Forbid the QueryBuilder and raw SQL on tenant-scoped tables; `em.find` only.
- C) Accept all three as review risk, with no specific rule.

**Reasoning:** A.

**B is tempting and refused.** It genuinely solves two of the three — prohibition beats a reminder — but
the query rules permitted stepping down precisely because some operations `em.find` cannot express, and
aggregation over a tenant-scoped table is the most common one in any SaaS: *how many orders did this
customer place this month*. Forbidding it would push that into three queries or a view, and views were
already refused.

**The creation rule is the most important part of A.** If a method accepts `tenantId` as a parameter, a
path exists to pass the wrong one — and somebody will pass the tenant of the user being read rather than
the user logged in. Read from the same source that feeds the filter, the two cannot diverge.

`NOT NULL` is the net: it does not prevent a wrong tenant, it prevents an **absent** one, which is the
most common failure when somebody forgets.

**C is the state already recorded as a lost guarantee** when `tenant_id` was first locked.

**Affects:** `multi-tenancy/isolation.md`

---

## 2026-09-11 — A tenantless route declares itself; a missing parameter is an error

**Decision:** a route without a tenant declares that explicitly, and the filter is disabled by
declaration. **An absent filter parameter is an error, never an implicit "no filter".** The list is short
and closed: authentication, the health route, third-party webhooks, and the route listing a user's
organizations.

**Options considered:**
- A) The route declares it; a missing parameter is an error.
- B) The filter is ignored when the parameter is absent.
- C) Those routes do not use the `em` at all.

**Reasoning:** A.

**B is the most dangerous option in this whole area.** *No parameter means no filter* turns **every**
tenant-resolution bug into total access: a session that failed to load, middleware in the wrong order, a
request that took an unexpected path — each produces an absent parameter, and B answers by returning the
entire system. With no error.

**A inverts it.** An absent parameter fails, and the only way to operate without a tenant is a route
saying so. The forgetting then fails closed — the route breaks in development on the first call — instead
of leaking.

**C is honest for the health route and for webhooks** and does not serve the route listing a user's
organizations: that reads the `member` table, which is data, filtered by **user** rather than by tenant.

**A note that goes into the document with it:** the list is closed, not a category to grow. Every new
route is born with a tenant, and adding to that list is a decision rather than configuration.

**Affects:** `multi-tenancy/isolation.md`

---

## 2026-09-11 — Switching tenant clears the whole query cache

**Decision:** changing the active tenant clears the entire TanStack Query cache. The tenant is not added
to query keys.

**Options considered:**
- A) Clear the whole cache on switch.
- B) Include the tenant in every query key.
- C) Nothing; rely on revalidation.

**Reasoning:** A, after a subtlety that changes the answer.

**The query-key rule already covers this in principle** — a key includes everything that changes the
result, and the tenant changes the result. **But the tenant is invisible to whoever writes the query.**
The server derives it from the session: the client does not send it, does not pass it as a filter, and
never sees it in the calling code. Nobody will remember to put it in the key, because nothing in the file
suggests it exists.

**B looks more correct and is the trap.** In cache terms it is the right answer — entries from different
tenants stop colliding. But it is a rule to honour in **every** query factory, and missing one means that
screen showing the previous tenant's data. Correct when remembered, silent when not.

**A is blunt and safe.** It does not depend on anyone remembering anything in N places; it depends on one
line in one place.

**C is refused:** revalidation happens after the screen has already rendered with stale data. The user
sees another customer's orders for a moment — or much longer, with no network.

**A's limit, stated:** if the session's tenant changes **without** the app knowing — another tab switching,
which the session decision already recorded as a consequence — the cache is not cleared. It is rare, it is
known, and it is the cost that decision already accepted.

**Affects:** `multi-tenancy/client.md`

---

## 2026-09-11 — Switching tenant navigates to a neutral route

**Decision:** changing tenant navigates to the tenant's root, always — even when the current route would
happen to exist in the destination.

**Options considered:**
- A) Always navigate to a neutral route.
- B) Stay on the route and handle the 404 when it arrives.
- C) Map the route — fall back to the resource's list where the path has a resource id.

**Reasoning:** A.

**B is refused because a 404 is a correct answer to a question the user did not ask.** They asked to
switch company, not to open that order in the new context. Staying put means the first thing they see
after switching is *not found*, having done nothing wrong.

**C looks kinder and fails confusingly in the minority.** `/orders/abc-123` → `/orders` works. But
`/settings/billing/method/xyz` has no obvious *go up one level*, so the heuristic lands well on some
screens and somewhere strange on others. Behaviour that depends on the shape of a URL is behaviour nobody
can predict.

**A is predictable: switching company always lands at the start of that company.** Mildly annoying once,
understandable every time.

**A also avoids a case worse than the 404.** If a resource with the same id happened to exist in the
destination tenant — unlikely with UUID v7, not impossible on a slug route — B would open **a different
resource** at the same URL, and the user would believe they were still looking at what they had been.

**Affects:** `multi-tenancy/client.md`

---

## 2026-09-11 — The active tenant is persistently visible

**Decision:** the active tenant is visible on every screen, persistently — not inside a menu that has to
be opened. Visible, not large: a name in the header is enough.

**Options considered:**
- A) Persistently visible on every screen.
- B) Visible in the tenant selector, inside a menu.
- C) Not a rule; each product's design decision.

**Reasoning:** A. This looks like decoration and is a safety rule.

**In a multi-tenant system, whoever operates it usually has access to more than one tenant** — an agency,
a consultancy, internal support, an accountant. **The expensive mistake is not the system leaking data; it
is the person acting on the wrong tenant:** deleting an order, sending an invoice, inviting somebody — in
the wrong customer's account.

**The system cannot detect that.** From the API's point of view it is a perfectly authorised request: the
session has that tenant active, the filter lets it through, everything works. The only defence is the
person seeing where they are before acting.

**B is refused because a selector inside a menu answers *where am I* only for someone who already
suspects they might be in the wrong place.** Whoever acts by mistake acts precisely because they do
**not** suspect: they opened the app, saw a familiar list, and acted. The label has to be in the path of
the eye, not one click away.

**This is a rule rather than design because C would let each product decide, and half of them would leave
it out** — in a single-tenant product the information looks redundant. Prumo generates a multi-tenant
project exactly when the answer to the third axis is yes, and there it never is.

**What A costs:** permanent space in an interface, and on a phone screen permanent space is expensive. The
rule says **visible**, not **prominent**.

**Affects:** `multi-tenancy/client.md`

---

## 2026-09-11 — `core/` holds three documents, and two of its subjects were never decided

**Decision:** the area contains `tooling.md`, `testing.md` and `conventions.md`.

**Reasoning:** `tooling.md` merges the TypeScript configuration with Biome and the hook because both are
start-up configuration, read at assembly and afterwards only when a complaint appears. Splitting them
would produce two twenty-line files in the one area where **every file costs a line of index in every
project**.

**`core/` is the only place in the knowledge base where size is a constraint rather than a symptom.** It
is unconditional, so it is always-loaded context, and its admission bar is *crossing every type in fact*.

**Two of its subjects turned out never to have been decided**, which was not expected — this area looked
like transcription:

| Subject | State |
|---|---|
| TypeScript `strict` + `noUncheckedIndexedAccess` | decided |
| Biome and the pre-commit hook | decided |
| Vitest | decided |
| **Source file naming** | **never decided** — step 0.3 settled *document* naming, not source |
| **Comments and code style** | **never decided** — the frozen era had a rule, archived and not in force |

**Affects:** `core/`

---

## 2026-09-11 — `moduleResolution: nodenext`, and three corrections from reading Nest's starter

**Decision:** the TypeScript configuration follows `nestjs/typescript-starter`, which means
`module` and `moduleResolution` are both `nodenext`, `target` is `ES2023`, and
`strictPropertyInitialization` is `false`. `noUncheckedIndexedAccess` is added on top;
`exactOptionalPropertyTypes` stays off.

**Reasoning:** the user's direction was to use what NestJS indicates. Reading the file rather than
recalling it corrected three things already recorded here.

**1. There was no conflict to resolve.** The starter already sets `moduleResolution: nodenext`, which is
one of the three values MikroORM v7 accepts. The recommendation about to be made described an explicit
deviation from `nest new` forced by the ORM — **that deviation does not exist.** The friction was invented.

**2. Decision 7 carries an argument that is now wrong.** It recorded, citing a `nest-cli` issue, that
*"`nest new` turns strict options off"*. The starter has `strict: true`. The decision itself stands —
`strict` plus `noUncheckedIndexedAccess`, without `exactOptionalPropertyTypes` — but one of its supports
has gone.

**3. Decision 16 rests on a stale premise.** It argued that taking Jest would be *"buying the exact fight
the maintainer of our own ORM gave up on"*, on the basis that `nest new` generates Jest. **The starter
already declares `"types": ["vitest/globals", "node"]`.** The decision does not change — Vitest was
right — but Nest agrees, and it was written as though Nest disagreed.

**`strictPropertyInitialization: false` is now a decision rather than a carried consequence.** Decision 7
had recorded the `name!: string` idiom with switching the flag off *"available and not chosen"*. Nest
switches it off, so following Nest settles it: DTO fields need no `!`.

**The cost, put on the table before choosing:** the flag is not only about DTOs. With it off, **any** class
may declare a property that is never assigned, and the compiler says nothing —
`private cache: Map<string, X>` compiles and throws on first use. That is rare in a Nest service, where
dependencies arrive through the constructor, and it is a free guarantee being switched off because of one
specific layer.

**Affects:** `core/tooling.md`, and it amends decisions 7 and 16

---

## 2026-09-11 — Biome on pre-commit, `tsc --noEmit` on pre-push

**Decision:** `.githooks/pre-commit` runs `biome check --staged --write`. `.githooks/pre-push` runs
`tsc --noEmit`.

**Options considered:**
- A) Biome only; type checking left to CI.
- B) Biome plus `tsc --noEmit` on pre-commit.
- C) Biome on pre-commit, `tsc` on pre-push.

**Reasoning:** C. It separates the two by the cost each justifies.

**Most of this project's guarantees are compiler guarantees.** N+1 became a type error, a wrong route does
not compile, and what `strict` catches was just re-decided. A hook that only formats lets through exactly
the class of error the knowledge base most relies on.

**But `tsc` costs five to thirty seconds on a medium project, and a slow hook is a hook somebody bypasses
with `--no-verify`** — after which Biome does not run either. B is what most projects do and it is what
trains people to bypass.

**Formatting is instant and belongs on every commit**, including the five small ones in an afternoon.
**Type checking is expensive and does not need to run five times** — it needs to run before the code leaves
the machine, which is what `pre-push` is for.

**A leaves the project's strongest guarantee to be discovered in CI**, after the push, on the longest
cycle.

**What C costs:** one more hook file, and `pre-push` does not run for anyone who never configured
`core.hooksPath` — the same hole already recorded for the `prepare` script.

**Affects:** `core/tooling.md`

---

## 2026-09-11 — Biome's recommended set, with a written reason for any change

**Decision:** Biome runs its recommended rule set. Adding or disabling a rule requires a one-line reason
in the configuration file.

**Options considered:**
- A) The recommended set only, with written reasons for changes.
- B) Recommended plus a curated selection of extra rules.
- C) Everything Biome offers, minus whatever complains too much.

**Reasoning:** A. The recommended set is what the maintainers consider correct for a new project and what
an assistant finds in every example, so the configuration stays short — and a short lint configuration is
one somebody reads before disagreeing with it.

**C is the road to a two-hundred-line configuration** where half the disabled rules carry no recorded
reason, and nobody can tell whether a rule was switched off because it was wrong or because it annoyed
somebody on a Friday.

**B was the most seriously considered**, and extra rules worth having are deliberately **not named here**:
naming rules by guesswork is the opposite of how every other decision in this project was made. A leaves
that door open by construction — adding is permitted, with a reason.

**The written reason is the part that matters.** It stops nobody from adjusting; it guarantees that in a
year the configuration explains itself. That is the same mechanism as the comment required when stepping
down the query ladder and when stepping off NativeWind — **the third time this shape has appeared**, which
is what makes it a pattern rather than a preference.

**Affects:** `core/tooling.md`

---

## 2026-09-11 — Tests are co-located, named `*.spec.ts`

**Decision:** a test file sits beside the file it tests, with the `.spec.ts` suffix, in every type.

**Options considered:**
- A) Co-located, `.spec.ts`.
- B) A mirrored `tests/` tree.
- C) Co-located, `.test.ts`.

**Reasoning:** A. Part of this was already settled without being stated as a general rule: the Nest module
anatomy is exactly what `nest g resource` produces, and it generates `*.spec.ts` beside the file.

**A mirrored tree has to be moved when the code moves, and nobody moves it.** So
`tests/features/orders/` survives after `features/orders/` became `features/pedidos/`, and the test
becomes an orphan that still passes. Co-located, it travels with the file without anyone thinking about
it.

**`.spec.ts` rather than `.test.ts` has no technical reason** — Vitest accepts both — only consistency, and
the tie-break is the generator: choosing `.test.ts` would add a rename step after every generation, which
is the argument that fixed the module anatomy.

**What A costs:** `src/` holds twice as many files in a listing, and looking for a component means passing
its test. Real visual noise, and smaller than an orphaned test that still passes.

**Affects:** `core/testing.md`

---

## 2026-09-11 — The database is not mocked; code that touches it is tested against it

**Decision:** tests do not mock the database. A service test runs against the real Postgres. A test without
a database exists for code without a database — a pure function. There is no unit/integration split to
assign.

**Options considered:**
- A) No database mocking.
- B) Two tiers: unit tests with a mocked `em`, integration tests with a real database.
- C) Mock everywhere, with a small separate integration suite.

**Reasoning:** A, and two earlier decisions changed the shape of this question.

**The restart removed ports and the hexagonal layering, so there are no interfaces to mock** — a service
talks to MikroORM's concrete `EntityManager`. Mocking it means imitating a complex third-party class:
identity map, unit of work, flush. **A mock that imitates that badly passes the tests and lies about what
the code does.**

**And a real Postgres is already there**, one per worker, with its schema built from the migrations —
isolated and cheap to use.

**B and C fall on that first point:** the `em` mock is the hardest thing in the suite to write and the
least trustworthy. It has to get right when a flush persists, what a populated relation returns, what
happens to a managed entity — and each time it is wrong, the test passes and production does not. **A test
that passes for the wrong reason is worse than no test, because it grants permission not to look.**

**A also dissolves the *is this a unit or an integration test* argument**, which every project has and
nobody wins. The answer becomes mechanical: the code touches the database or it does not.

**What A costs, and it is real: tests are slower.** Every test touching the database pays a round trip, and
a thousand of them are minutes rather than seconds. Parallel workers and truncation instead of recreation
already mitigate it, and the gap against an in-memory mock remains and grows with the suite.

**Affects:** `core/testing.md`

---

## 2026-09-11 — Coverage is measured and reported, never a blocking threshold

**Decision:** coverage is measured and reported. No threshold blocks a merge. The question in review is
*does this behaviour have a test*, not *did the number go up*.

**Options considered:**
- A) Measured and reported, no threshold.
- B) A blocking threshold.
- C) Not measured.

**Reasoning:** A.

**A threshold turns a proxy into a target.** Coverage measures lines executed; what matters is behaviour
verified. The two correlate until somebody needs the number, and then they diverge deliberately: whoever is
below writes tests to raise it rather than to check anything, and a test that calls a function and asserts
nothing covers the line and guarantees nothing. Whoever is above stops thinking, because the number says it
is fine.

**There is an interaction with not mocking the database that changes the arithmetic.** With a real
database and no mocks, a test is more expensive to write — so a high threshold pushes towards the cheap way
of raising coverage, which is exactly the test that asserts nothing.

**C is refused:** without measuring, nobody knows where there is no test at all. *Where there is nothing* is
genuinely useful information, unlike *we are at 72%*, which says nothing about which 28%.

**What A costs, plainly: nothing stops coverage from falling.** With no threshold a module can be born
untested and CI stays green. The defence is review, and review tires.

**If a floor is ever wanted, the honest form is on the diff rather than the project** — requiring new code
to arrive tested is more truthful than an average the old code sustains.

**Affects:** `core/testing.md`

---

## 2026-09-11 — kebab-case everywhere, with the generator's role suffixes

**Decision:** every source file is kebab-case, with the role suffix the generator uses —
`users.service.ts`, `users.controller.ts`, `create-user.dto.ts`, `button.tsx`. One service per resource,
not one per action.

**Options considered:**
- A) kebab-case in every file, in every type.
- B) kebab-case on the server, PascalCase for React components.
- C) PascalCase for components everywhere.

**Reasoning:** A, for three reasons of differing weight.

**No rename step.** The fourth appearance of this argument — after the module anatomy, the shared
destinations and the test suffix. `nest g resource` and shadcn's CLI both emit kebab-case, so anything else
creates a correction after every generation, and a correction after generation is what people forget.

**B creates a boundary by file content.** *Is this a component?* becomes a judgement per file, and a file
exporting a component and a helper has no answer.

**And one technical reason that settles it alone:** macOS and Windows have case-insensitive filesystems.
Renaming `OrderList.tsx` to `orderList.tsx` does not register as a change in git, so the file ends up with
different casing in the repository and on a Linux clone. PascalCase lives with that; kebab-case never
touches the problem.

**An ambiguity resolved rather than assumed.** The instruction arrived with the example
`create-user.service.ts`, which is not a Nest pattern: Nest generates `users.service.ts`, one service per
resource, with the action name belonging to the DTO. Taken literally it would have meant one service per
action — reintroducing, through a file-naming convention, the use-case granularity the restart measured at
13 files per feature. The user confirmed the shape rather than the granularity, and the module anatomy is
unchanged.

**Affects:** `core/conventions.md`

---

## 2026-09-11 — A comment earns its place by carrying what the code cannot

**Decision:** a comment is written only when it carries a fact the code cannot carry about itself. The test
is whether a careful reader could recover it anyway. The three places where that test answers *no*: an
outside constraint, code that looks wrong and is right, and something tried that does not work.

**Options considered:**
- A) Adopt the frozen era's rule, with its three named cases.
- B) A simpler rule: comment the **why**, never the **what**.
- C) No rule.

**Reasoning:** A. The frozen era's rule was read rather than inherited — reusing it without deciding would
be keeping something by convenience, which is what the restart refused when it chose clean derivation over
migration.

**B is the better-known formulation and is worse.** *Why, not what* sounds clear and decides nothing in the
moment: every comment somebody writes looks like a why to the person writing it.
`// increment the counter because we need a count` is a why and is rubbish. The rule has no test, so it
rejects nothing.

**The archived rule has a test** — *could a careful reader recover this?* — applicable by looking at the
line. That is the difference between a principle and a ruler.

**The three cases are not categories to classify into; they are where the test answers *no* in practice.**
An outside constraint — *this vendor returns 200 with the error in the body* — is not in the code. Code that
looks wrong and is right is the only place a comment stops somebody "fixing" it. And something tried that
does not work is the information most often lost and most expensive to rediscover.

**C is refused:** with no ruler, comment volume becomes a function of who wrote the file, and the codebase
ends up with densely commented stretches beside silent ones without the difference meaning anything.

**The archived observation is carried forward, because it is the most useful part:** enforcement is review,
and **what stands in for enforcement is the templates obeying the rule** — an assistant imitates the code
it reads before it obeys a document. That becomes an obligation on phase 5.

**A problem the new structure solved rather than worked around:** the frozen era had to restate this rule in
the generated project's root pointer, because its index routed by trigger and *"I am about to write a
comment"* is not a trigger anyone looks up. `core/` is the always-loaded area, so the rule is simply there.

**Affects:** `core/conventions.md`, phase 5

---

## 2026-09-14 — `monorepo/` holds three documents

**Decision:** the area contains `layout.md`, `dependencies.md` and `tasks.md`.

**Reasoning:** `tasks.md` merges running scripts across packages with the base TypeScript configuration,
because both are *how the workspace builds* — build order, what runs before what, and the `extends` that
makes every app inherit from one place. It is the weakest boundary in the list and was confirmed rather
than assumed.

**Left out:** publishing a package to a registry. A Prumo monorepo holds applications rather than
libraries, and by the day-zero test publishing has no work until somebody publishes.

**Carried in from another area:** the web structure decision recorded that `@/` means different things in
different apps of a monorepo, and left the question here.

**Affects:** phase 4

---

## 2026-09-14 — `apps/` and `packages/`, with an integration package from day one

**Decision:** a monorepo has `apps/` and `packages/`. `packages/` holds an integration package from the
start: URL construction, the `ApiError` parsing, the hand-written contract types, and the query factories.
**Each app injects its own transport.** App directories are named after the type — `apps/api`,
`apps/web` — never after the product.

**Options considered:**
- A) `apps/` + `packages/`, with the integration package.
- B) The same package, core only — URL, `ApiError`, types — with query factories left in each app.
- C) No `packages/` at all.

**Reasoning:** A, after the recommendation had already moved twice, and the movement is the record.

**It was first recommended by convention.** `apps/` + `packages/` is what every pnpm example shows, and
bringing it in unexamined was about to be the *deciding something because it is standard* anti-pattern.

**Listing what would actually go there emptied it.** Shared API types were refused in favour of
hand-written ones; a generated client was refused; validation schemas differ on each side;
shadcn copies components rather than sharing them; tsconfig and Biome bases are root files, not packages.
So the recommendation changed to `apps/` only — an empty `packages/` is the day-zero test failing, and
worse than empty, **a directory that exists invites**: somebody fills it because the place is ready, and
the admission question is never asked.

**The user then named content that does exist: the front/back integration layer.** Going through
`client/data.md` item by item, URL construction, `ApiError` parsing, the contract types and the query
factories are all genuinely shared. Only transport is not — the web sends the cookie through
`credentials: 'include'`, mobile attaches it from secure storage, and a site's server calls anonymously.
So the package takes an injected transport, which is where the frozen era also arrived.

**The largest gain recovers what the hand-written-types decision gave up.** That decision accepted, as a
cost, that a renamed field leaves each client compiling against its own copy. With a package there is
**one copy instead of three**: drift against the server is still possible, and it stops multiplying per
client, and fixing it becomes one place. The unsoundness found earlier does not apply, because the package
describes the **wire shape** — what the JSON actually carries — rather than an entity whose `@Exclude`d
fields are absent from it.

**B was refused because its separation buys nothing:** an unused export in a package is removed by
bundling, unlike unused context in `.prumo/`, which costs tokens every session. Splitting would also force
`web` and `mobile` to duplicate query factories between themselves — the exact duplication that created
the `client/` area.

**Verified before writing the rule**, since three bundlers consume this package:

| | |
|---|---|
| Metro and symlinks | Resolved. **Expo SDK 52+** resolves workspace packages automatically with `expo/metro-config` — no `watchFolders`, no `nodeModulesPaths` |
| Isolated dependencies | *"With SDK 53, disabling isolated dependencies is recommended, or you may encounter native build errors and dependency conflicts."* pnpm's default **is** isolated, so a monorepo containing `mobile` may need `nodeLinker: hoisted` — which gives up the strict isolation that is pnpm's main benefit. The wording says *SDK 53 and earlier*, suggesting later versions resolved it; that is not confirmed |
| TypeScript source in a workspace package | **Not addressed by the documentation.** Not asserted here |

**Affects:** `monorepo/layout.md`

---

## 2026-09-14 — The shared package ships TypeScript source, not a build

**Decision:** the package's `main` points at TypeScript source. Each app transpiles what it imports. There
is no build step for the package and no `dist/`.

**Options considered:**
- A) Source.
- B) Compiled, publishing `dist/` with declaration files.
- C) Both, behind conditional `exports`.

**Reasoning:** A.

**B charges where it hurts most: it introduces a mandatory build order.** The package must compile before
any app, and in a workspace without Turborepo that becomes a hand-chained script or a `--filter` invocation.
**Worse day to day:** without a watcher, changing the package and not seeing the effect in the app is the
default failure mode of a monorepo with an intermediate build, and it costs half an hour of confusion each
time it happens.

A keeps the package as files. Editing a type and seeing the error in the app immediately is what makes
sharing useful, and is what justifies the package existing instead of three copies.

**C is B with a fork to maintain.**

**What A costs, and it is the part that was not verified:** it may require one line of configuration in
each consumer, and which ones is unknown. Next almost certainly needs `transpilePackages`. Vite usually
handles it. Metro transpiles everything through Babel and should handle it. *Should* is not verified.

That belongs to phase 5, where the template is assembled and a compiler looks at it — the kind of thing
found by building rather than by reading.

**Affects:** `monorepo/layout.md`, phase 5

---

## 2026-09-14 — `@/` stays per app in a monorepo

**Decision:** every app keeps `@/` resolving to its own `src/`. There is no app-named alias. A shared
package is imported by its package name, never through an alias.

**Options considered:**
- A) Keep `@/` per app, with the risk recorded.
- B) App-named aliases — `@web/`, `@site/` — replacing `@/`.
- C) `@/` in apps and package names for shared code.

**Reasoning:** A. C was removed from the table: it describes what is already true, since a package is
imported by name in any case.

**B is refused on the argument the web decision already made**, and it has not weakened: an app-named
alias deviates from shadcn's default in **every** project, including `alone` ones where the collision
cannot occur. The cost lands on 100% of projects for a risk that exists in some monorepos.

**The risk is also narrower than it looks.** Moving a file between apps is rare, and in most cases the
destination path does not exist in the other app, so the compiler complains. Silent failure requires both
apps to have a file at the same path — which happens precisely with a generic utility, and **that is the
case which should have been in the shared package rather than duplicated**.

So A's failure scenario is a symptom of a different problem, and fixing that problem removes this one.

**Recorded in the document:** moving a file **between apps** is an operation that calls for checking
imports, and is not the same as moving one inside an app.

**Affects:** `monorepo/layout.md`

---

## 2026-09-14 — A second package needs two consumers and a name

**Decision:** code becomes a package when **two apps consume it**. While one app uses it, it stays inside
that app. A package is named for what it does — never `shared`, `common` or `utils`.

**Options considered:**
- A) Two consumers, and a real name.
- B) One consumer is enough, if it looks reusable.
- C) No criterion; judge case by case.

**Reasoning:** A.

**Two rather than one, because one consumer is evidence of nothing.** It is the trap already refused when
extracting a repeated class list: two things that look alike today diverge next week. Here it is worse —
extracting early into a package costs more than extracting early into a component, since it carries a
`package.json`, a workspace entry and declared dependencies, and undoing it is more work than doing it.

**The name matters as much as the number.** `packages/shared` cannot grow wrongly because it cannot grow
rightly: anything fits inside *shared*. Requiring a name forces the question *what is this*, which is the
only thing keeping the boundary honest.

**That is the third time this project has refused the same shape** — `SharedModule` at the module level,
`shared/` at the folder level, and now `packages/shared` at the workspace level. Three refusals of one
pattern is what makes it a principle rather than a preference.

**What A costs:** code two apps will eventually use stays duplicated until the second one exists. Real,
temporary discomfort, preferable to a package created for a consumer whose second never arrived.

**Affects:** `monorepo/layout.md`

---

## 2026-09-14 — Every external dependency goes through the catalog; internal ones are `workspace:*`

**Decision:** every external dependency is declared once in the catalog and referenced as `catalog:` in
each `package.json`. A dependency on a workspace package is `workspace:*`.

**Options considered:**
- A) Every external dependency in the catalog.
- B) The catalog only for what more than one package uses.
- C) No catalog; literal versions.

**Reasoning:** A.

**B requires a judgement that ages.** *More than one uses it* is true today and changes tomorrow, and when
the second package adopts it somebody has to remember to move the version into the catalog. Nobody
remembers, because nothing prompts — and the project ends up with two versions of one library, discovered
when one of them breaks.

**A is uniform, and the uniformity is the point:** *which version of X do we use* has one place to look,
always, with no exception to check first.

**`workspace:*` rather than `workspace:^`** because publishing was left out of this area's scope — this is
a monorepo of applications. Without publishing, a version range on an internal package means nothing, and
`*` states what is true: the version sitting next to it.

**What A costs:** a dependency used by exactly one package also goes through the catalog, which is
indirection with no sharing benefit in that case. Small, and it is the price of having no exception for
somebody to assess.

**Affects:** `monorepo/dependencies.md`

---

## 2026-09-14 — An app never depends on another app

**Decision:** an app depends on packages. A package never depends on an app. **An app never depends on
another app**, not even for a type. A package depending on another package is allowed with no special rule.

**Options considered:**
- A) App → package only.
- B) The same, except an app may `import type` from another app.
- C) Free.

**Reasoning:** A, and the tempting edge is app → app: in a monorepo with `api` and `web`, importing a type
from `apps/api` looks like the obvious way to stop duplicating the contract.

**That was already found to be unsound.** The response is an entity passed through
`ClassSerializerInterceptor`, so every `@Exclude`d property is absent from the JSON and **present on the
type**. The shared type would promise `tenantId` on a payload that never carries it.

**A second reason is structural: an app is deployable.** `apps/web` depending on `apps/api` means building
the site requires the backend to be present, CI needs both for either, and the boundary between two things
with separate lifecycles stops existing.

**B is the well-intentioned trap.** *Only a type, it is erased at compile time* is true at runtime and
false everywhere else: `tsc` needs the other app to check, the editor needs it, CI needs it — and
`import type` does not stop somebody swapping it for a value import six months later, when the type becomes
a constant. B also carries the unsoundness with it: the type it would share is the wrong one.

**If two apps need the same type, the answer is the package** — which is what it exists for.

**Package → package needs no rule:** the package ships source, so there is no build order to protect, and
a package already requires two consumers to exist at all.

**Affects:** `monorepo/dependencies.md`

---

## 2026-09-14 — Each package declares what it imports; the root holds only workspace tooling

**Decision:** every package declares each dependency it imports. The root `package.json` holds only
workspace tooling — nothing that application code imports.

**Options considered:**
- A) Each package declares its own.
- B) Common dependencies at the root, to avoid repetition.

**Reasoning:** A. What is at stake has a name: **phantom dependencies.** With `react` only at the root,
`apps/web` imports it and works without having declared it — harmless until somebody extracts that app, or
removes `react` elsewhere, and the import breaks with nothing having changed in the app. pnpm's strict
isolation exists to prevent exactly that.

**B saves repetition in a file and pays with a guarantee** — and the repetition it avoids is not real:
with every dependency going through the catalog, each `package.json` says `"react": "catalog:"`, so
repeating it is an identical line rather than a version to keep in sync. The catalog already solved the
problem B would be solving.

**A tension that may force B in practice, recorded rather than discovered:** the Expo verification found
that a monorepo containing `mobile` **may require `nodeLinker: hoisted`**, and hoisted is precisely the
mode in which phantom dependencies become possible again, because everything is reachable from the root.

So in a monorepo with `mobile`, A can become a rule without enforcement, upheld by review alone. **A
remains the right rule** — declaring what you use is correct whether or not the installer punishes
otherwise — and the net may not be there.

The document carries both: the rule, and the condition under which its guarantee disappears.

**Affects:** `monorepo/dependencies.md`

---

## 2026-09-14 — Root scripts for workspace-wide tasks; `dev` only per app

**Decision:** the root `package.json` has `lint`, `typecheck` and `test`, each running through `pnpm -r`.
**There is no `dev` script at the root.** Development is started per app, with `--filter`.

**Options considered:**
- A) Root scripts for what makes sense everywhere; `dev` per app only.
- B) Everything through `--filter`, no root scripts.
- C) Root scripts for everything, `dev` included.

**Reasoning:** A.

**What replaced Turborepo is mostly already there:** `pnpm -r` runs in **topological order**, so the
orchestration usually credited to Turborepo exists without it. What does not exist is caching.

**C is a trap.** `pnpm dev` at the root of a monorepo with four apps starts four processes, one of them
interactive, when whoever ran it expected the app they are working on. **The absence of that script is what
teaches that `dev` is per app**; if it exists, nobody learns.

**B is refused because `lint` and `typecheck` across the workspace are exactly what the pre-push hook
calls.** Requiring each person to assemble the right `--filter` for that invites several versions of one
command.

**Recorded because it is the reversal condition:** without caching, `pnpm -r typecheck` runs `tsc` in every
package from scratch every time. In a small workspace that is seconds; in a large one it is not. **This is
where Turborepo returns to the table**, and the condition is measurable rather than *when it gets big*:
when the root `typecheck` becomes annoying enough that somebody stops running it before pushing.

**Affects:** `monorepo/tasks.md`

---

## 2026-09-14 — A root `tsconfig.base.json`, extended by relative path; no project references

**Decision:** compiler options live in `tsconfig.base.json` at the workspace root. Each app and package
extends it by relative path and overrides only what differs — `moduleResolution` in clients, `jsx`, the
`types` array. **Project references are not used.**

**Options considered:**
- A) A root `tsconfig.base.json`, extended by relative path.
- B) A `packages/tsconfig` package consumed by name.
- C) No base; each project carries its own complete file.

**Reasoning:** A.

**Project references were not offered as an option, and the reason is recorded:** they require
`composite: true` and produce a **build order with intermediate artefacts**. Shipping the shared package as
source refused exactly that, for the most concrete reason available — changing the package and not seeing
the effect. References would reintroduce that failure mode through another door.

**B is the pattern most monorepos use and is refused:** it turns configuration into a package, with a
`package.json`, a workspace entry and a declared dependency, in order to deliver one JSON file. It also
contradicts the package rule in letter and spirit — a package needs two consumers **and a name that says
what it does**, and `tsconfig` says what it is.

The layout decision had already arrived here when listing what `packages/` would hold: configuration bases
are root files.

**C produces five files that start identical and diverge silently** — one gains a flag, another does not,
and nobody notices until behaviour differs between apps.

**What A costs:** `extends: "../../tsconfig.base.json"` is a relative path, and a relative path breaks if
the depth changes. The depth is fixed by the layout — `apps/<name>` and `packages/<name>` — so it is stable
as long as that layout holds.

**Affects:** `monorepo/tasks.md`

---

## 2026-09-14 — A template is a versioned skeleton, not generator output

**Decision:** each template is a complete project **committed to this repository**. The CLI copies files. It
never calls `nest new`, `create-vite`, `create-expo-app` or `create-next-app`.

**Options considered:**
- A) A versioned skeleton — the whole project lives in `templates/<type>/`.
- B) Delegate to the official generator and apply an overlay of our files on top; the repository keeps only
  the diff.
- C) Versioned, plus a script in this repository that re-runs the generator and shows the diff against the
  committed base.

**Reasoning:** A. Scaffolding is only testable if its output is fixed. Two people running `prumo new` a week
apart must receive the same project, and phase 7 exists to prove a template works — which cannot be done for
something assembled at run time out of a moving upstream.

**B fails silently, which is the disqualifying part.** When a generator renames or moves a file, the overlay
lands somewhere else and reports nothing; the project is wrong and compiles. It also makes `prumo new` depend
on the network, on a third-party CLI being installed, and on answering that CLI's interactive questions.

**C was not chosen because it is A plus a maintenance tool**, and that tool can be added later without
changing anything the CLI does. It decides nothing — it only makes the drift visible.

**What A costs, stated plainly:** the templates go stale. The upstream starters evolve, dependency versions
advance, and nothing announces it. Refreshing is manual and recurring work.

**The reversal condition, measurable rather than a feeling:** C belongs on the table the day refreshing a
template by hand produces a mistake nobody caught.

**Affects:** `templates/`, phase 6 (the CLI copies, it does not generate), phase 7 (the CI has a fixed
artefact to run)

---

## 2026-09-14 — A template ships the work of day one, not an example to delete

**Decision:** a template contains the wiring **and exactly what the project would need anyway** — for `api`,
authentication with Better Auth, the user entity, its migration and its spec; for `web` and `mobile`, the
login screen and the transport injection; for `site`, a real page. No feature exists in a template to be
deleted.

**Options considered:**
- A) Wiring only — no feature at all.
- B) Wiring plus an example feature, marked as disposable.
- C) Wiring plus what the day-zero test already admits.

**Reasoning:** C. This is not *more complete is better*. `core/conventions.md` states its own enforcement
clause plainly: **an assistant imitates the code it reads before it obeys a document**, and if the code fails
the test the rule is already dead. A carries a cost that document has already declared fatal — with no
module, no entity, no DTO and no spec in the skeleton, the first thing anybody writes becomes the house
pattern, and it is derived from prose rather than from an example.

**B pays that cost with code the developer did not ask for.** Code marked disposable is not deleted; it stays
and becomes the pattern copied, including where it is wrong.

**C is the day-zero test applied to templates** — *does this have work on the day the project is born?* — and
not a new criterion invented for this decision. It is the same reasoning that admitted Better Auth to the
stack.

**What C costs:** it is far more work to build. Authentication is the hardest part to get right, and Better
Auth + NestJS + MikroORM is unverified territory — the most expensive item in phase 5. It also bakes Better
Auth into the template rather than leaving it a choice. That second cost was already accepted when the stack
locked it.

**The exposure is deliberate:** if that integration does not survive contact with the compiler, this is the
phase that exists to find out.

**Affects:** `templates/`, and the enforcement clause of `core/conventions.md`

---

## 2026-09-14 — One template per type, adapted to the architecture at copy time

**Decision:** there is **one skeleton per type**, written in its standalone form. When the architecture is
`monorepo`, the CLI rewrites the few files that differ — the `extends` in `tsconfig.json`, the `name` and the
dependency versions in `package.json` — and skips the tooling configuration the workspace root owns.

**Options considered:**
- A) One template; the CLI rewrites what differs.
- B) Two complete variants per type, `alone/` and `monorepo/`.
- C) One template plus a small per-type overlay holding only the files that differ.

**Reasoning:** A. B and C are disqualified by the same thing: both duplicate **the dependency list**, which is
the content that changes most often. B duplicates a whole skeleton — eight instead of four, every fix with two
homes, diverging silently, which is the failure `tsconfig.base.json` was chosen to prevent and the one
`CLAUDE.md` §9 names outright. C is B in miniature, applied to the highest-churn file in the project.

**The objection to A is smaller than it looks.** The template decision did not say the CLI must be a byte
copier; it said the CLI must not depend on a moving upstream. Rewriting a field in **our own** `package.json`
is deterministic and testable. Calling `nest new` is not.

**What A costs:** the monorepo form never exists as files in this repository. It can only be inspected by
generating it — which is what phase 7's CI does, and which it has to do under every option anyway.

**A tension is recorded rather than hidden:** A is the option with more CLI code and fewer files, against a
standing preference for less code. It is recommended anyway, because the alternative does not trade code for
simplicity — it trades code for a duplicated dependency list, a debt that grows on its own.

**Affects:** `templates/`, phase 6 (the CLI's copy step has a documented transformation), `monorepo/tasks.md`,
`monorepo/dependencies.md`

---

## 2026-09-14 — Build order: api, web, the monorepo, then mobile and site

**Decision:** phase 5 is built in the order `api` → `web` → `monorepo` → `mobile` → `site`. The composition is
exercised as soon as two apps exist, not after all four.

**Options considered:**
- A) The roadmap's order — all four types, then the monorepo last.
- B) `api`, `web`, the monorepo, then `mobile` and `site`.
- C) Cheapest first — `site` as a rehearsal of the template shape, then `api`.

**Reasoning:** B. This phase exists to find where the documents were wrong, so the order is chosen to retire
uncertainty early. Three are on the table: the Better Auth + NestJS + MikroORM integration, the copy-time
transformation, and whether Expo still requires `nodeLinker: hoisted`.

**A leaves the composition until last**, which is the one point where a fix costs four times — the
transformation depends on the shape of the app templates (`tsconfig.json`, where tooling configuration lives),
so discovering it wrong after four are written means correcting four.

**B proves the composition on the smallest set that can prove it** — two apps and the integration package —
before three more templates are written on top of it. `mobile` then joins a workspace that already works, which
is the only place the `nodeLinker` question has an answer.

**C rehearses on the type that proves least.** `site` has two documents, and going there first would settle the
template's shape on the simplest case while deferring the most expensive unknown.

**What B costs:** the monorepo is visited twice — once to exist with two apps, once when `mobile` joins. The
second pass is the verification already owed to this phase, so the overhead is small and not wasted.

**Affects:** `_plan/00-ROADMAP.md` (phase 5), and the order the phase-5 debts come due

---

## 2026-09-14 — A template is done when it installs, starts and passes its own tests

**Decision:** the acceptance criterion for every template is `install`, `lint`, `typecheck`, `build`, **the
artefact starting**, and `test` passing. For `mobile`, *starting* means **the bundle is produced** — not that
anything renders on a screen.

**Options considered:**
- A) It compiles.
- B) It compiles and starts.
- C) It compiles, starts, and its own tests pass.

**Reasoning:** C, and the previous decision very nearly forced it. A template carries the user entity **and its
spec**; a spec that does not pass is a broken template whatever this decision says. `core/testing.md` forbids
mocking the database, so that spec brings up a real Postgres through Testcontainers — which is also the only
thing that proves the authentication integration end to end.

**A is disqualified because compiling does not prove wiring**, and wiring is what a skeleton is. A
`ValidationPipe` registered wrongly, a module never imported, an environment variable never read — none of
those is a type error. The API would compile cleanly and return 500 to its first request.

**What C costs:** Docker, here and in phase 7's CI, and a slow verification cycle.

**The `mobile` exception is named here rather than deduced later.** Rendering an Expo app requires a simulator,
which does not belong in CI. Leaving *starts* undefined would let somebody read it either way.

**Affects:** `templates/`, phase 7 (this is the criterion the CI runs)

---

## 2026-09-14 — Dependency versions are pinned exactly, with no lockfile in the template

**Decision:** every dependency in a template is written as an **exact version** — `"11.1.3"`, not `"^11.1.3"`.
No `pnpm-lock.yaml` is committed inside a template. In the `monorepo` form the same rule applies to the
catalog, which is where the literal lives.

**Options considered:**
- A) Exact versions, no lockfile.
- B) Caret ranges, no lockfile.
- C) Caret ranges plus a lockfile committed in the template.

**Reasoning:** A. It is the only option that treats both architectures identically, and the only one that adds
no large generated file for a manual refresh to forget.

**B is the least reproducible option available**, which is the thing the template decision refused: a minor
published tomorrow can break a generated project with nothing in Prumo having changed.

**C is asymmetric.** pnpm keeps a **single `pnpm-lock.yaml` at the workspace root**, covering every package;
per-template lockfiles do not compose, so the `monorepo` form would discard them and install fresh — leaving
`alone` reproducible and `monorepo` not. It is also the file most likely to be forgotten when a template is
refreshed by hand, which is precisely the reversal condition already on record.

**What A costs:** transitive dependencies still float, so reproducibility covers direct dependencies only. And
it ages into an inconsistency — a developer running `pnpm add` later receives a caret, and the project ends up
carrying both conventions.

**The floating transitives are covered by a mechanism that already has to exist:** phase 7's CI runs the
templates, so a transitive that rots turns it red. That is information, not damage.

**One claim in this decision is unverified and is declared as such:** the single-root-lockfile behaviour is the
main argument against C. It is confirmed or refuted at step 3 of the build order, when the monorepo is actually
assembled. If it is wrong, C returns to the table.

**Affects:** `templates/`, the catalog in `monorepo/dependencies.md`, phase 7

---

## 2026-09-14 — A template carries a real name, placed where it barely has to be rewritten

**Decision:** templates contain **no placeholder tokens**. Each carries a real, working name, and is written so
that the project's name appears in as few files as possible — `package.json` and `README.md`. The database is
called `app`, the compose service is called `postgres`, and source code reaches its own files through `@/`.

**Options considered:**
- A) Placeholder tokens such as `{{name}}`, substituted on copy.
- B) A real name, with the CLI rewriting every occurrence.
- C) A real name, with the template written so there are almost no occurrences to rewrite.

**Reasoning:** C. **A is excluded by contradiction, not by preference:** the acceptance criterion requires a
template to install, start and pass its tests **as committed**, and `{{name}}` is not a valid package name. A
template carrying placeholders cannot be verified by anything, so the two decisions cannot both hold.

**B's cost is a surface that grows on its own.** *Every occurrence* is fine until the project name reaches a
compose file, a database name or an import; each new place is another rewrite in the CLI, and the one that gets
forgotten is wrong and silent in the generated project.

**C is B with the constraint that keeps the copy-time transformation small** — and keeping that transformation
small is exactly what made one-template-per-type worth choosing over two variants.

**What C costs:** it is sustained by review alone. Nothing prevents somebody putting the project name somewhere
new. It applies to four templates in this repository, though, not to every generated project.

**Affects:** `templates/`, phase 6 (the CLI's rewrite surface is `package.json` and `README.md`)

---

## 2026-09-14 — There is no `src/common/`; cross-cutting code lives where it serves

**Decision:** the template has **no `common/` directory**. `@Public()`, `@CurrentUser()` and the authentication
guard live in `src/auth/`; the RFC 9457 filter lives in `src/errors/`; the request id lives in
`src/request-context/`, which is a module because the logger and the filter both consume it. The decorators are
files, not modules.

**Options considered:**
- A) `src/common/`, subdivided into `filters/`, `guards/`, `decorators/`.
- B) Each piece where it serves.
- C) Loose files directly in `src/`.

**Reasoning:** B, and it is not a new rule — it is the rule already written. `api/modules.md` says *anything
serving more than one module becomes its own module, named for what it does*, and *a pure function is a
function in a file, imported directly; it gets no module*. Applying both gives every piece an address, and
leaves the decorators as plain files.

**Nest was checked first, because a standing instruction says the API follows what Nest indicates.** It
indicates nothing here: `docs.nestjs.com/guards` and `docs.nestjs.com/exception-filters` label their code blocks
`auth.guard.ts`, `roles.decorator.ts`, `http-exception.filter.ts` and `all-exceptions.filter.ts` — bare
filenames, no directory — and the `typescript-starter` generates `src/` with four files and no folders.
`src/common/` is a community convention, not a framework indication.

**A is the junk drawer already refused three times, under another name**, and the template is the one artefact
able to kill that refusal in practice, because it is the code an assistant reads before it reads the document.
Choosing A would revoke `modules.md` silently.

**C is literal about Nest's documentation and wrong about why:** those examples omit directories because they
are teaching a concept, not organising a project. Ten such files turn `src/` into the junk drawer without even
giving it a name.

**What B costs:** more small directories at the root of `src/`, and a decision about what each new piece serves
instead of a default place to put it. That friction is the mechanism, and it is still friction.

**Affects:** `templates/api`, and every template that has cross-cutting code

---

## 2026-09-14 — The `users` module exposes one route: `GET /api/v1/users/me`

**Decision:** the API template's `users` module ships an entity, a migration, a spec and **one authenticated
route** returning the session's own user. No list endpoint, no `:id` endpoint.

**Options considered:**
- A) No endpoint at all — entity, migration and spec only.
- B) `GET /api/v1/users/me`.
- C) `/me`, plus a paginated `GET /users` and `GET /users/:id`.

**Reasoning:** B. Every authenticated application calls this on day one, and it is what the `web` template will
consume, so it is work rather than demonstration. It also exercises most of `routes.md` with a real example
instead of a didactic one: `@CurrentUser()`, the global guard, the prefix and URI versioning, the Swagger
plugin, and `ClassSerializerInterceptor` with `@Exclude` — where the excluded property is a credential that
genuinely must not leave.

**A leaves the most repeated shape in the project unexemplified.** With no route of its own, half of
`routes.md` has no code: versioning, the input DTO, `@Exclude`, `@SerializeOptions`, the Swagger plugin.

**C buys an example with a route the previous decision forbade.** Listing every user is a product decision, not
day-one work, and in many projects it is a route that should not exist open. An unwanted route nobody deletes
is worse than a rule without an example.

**What B costs, stated rather than hidden:** `pagination.md` gets no code at all — and cursor pagination is
exactly the rule an assistant gets wrong unaided, inventing `page`/`limit` and returning `total`.

**Where that cost is recovered:** phase 7 exists for committed, verified example projects. An example is the
right place to demonstrate without shipping, because it never reaches anybody's project. The pagination debt is
recorded there.

**Affects:** `templates/api`, `api/pagination.md` (unexemplified by design), phase 7

---

## 2026-09-14 — One `db:migrate` script chains both migration systems

**Decision:** the template has a single migration entry point —
`"db:migrate": "mikro-orm migration:up && auth migrate"` — used by the test setup and by the deploy pipeline
alike.

**Options considered:**
- A) One composite script chaining both.
- B) Two scripts, `db:migrate` and `auth:migrate`, documented and called separately.
- C) One system: run `auth generate` and paste its SQL into a MikroORM migration.

**Reasoning:** A. B and A differ only in **where the failure appears**, and A picks the cheap place. A composite
script that fails, fails immediately, in development. Two scripts fail as a forgotten pipeline step, in
production, and what breaks is authentication. `migrations.md` already defines migration as a separate step
before deploy; with two scripts that is two steps, and the missing one is silent until a login fails.

**The chain is visible in `package.json`**, so it teaches the two systems to anyone who opens the file while
still protecting whoever does not.

**C trades a real inconvenience for a recurring risk.** It contradicts `auth.md` directly, and every Better Auth
upgrade means re-deriving the schema by hand — a copy maintained by discipline, in the one area where silent
drift costs most.

**The CLI was verified rather than recalled.** Better Auth's documentation states that `migrate` *"is available
if you're using the built-in Kysely adapter. For other adapters, you'll need to apply the schema using your
ORM's migration tool."* That **confirms the design `auth.md` already chose**: a separate connection means the
built-in adapter, which is the only case where the CLI has anything to do.

**What A costs:** `&&` has no rollback. If the second command fails, the first has already applied.

**Unverified and declared as such:** whether `auth migrate` prompts before applying, and therefore whether the
script needs a non-interactive flag. It is settled by the template's first `pnpm db:migrate`.

**Affects:** `templates/api`, `database/migrations.md`, `database/testing.md`

---

## 2026-09-14 — The template ships `docker-compose.yml` and no `Dockerfile`

**Decision:** the API template includes a `docker-compose.yml` with Postgres 18 — service `postgres`, database
`app` — and **no `Dockerfile`**.

**Options considered:**
- A) Compose only.
- B) Both.
- C) Neither; the developer brings their own Postgres.

**Reasoning:** A. Compose is what makes the acceptance criterion executable and reproducible:
`docker compose up -d && pnpm db:migrate && pnpm start:dev` works on anyone's machine and in phase 7's CI.

**B would write new conventions in code with no document behind them.** Deployment is absent from all
thirty-three documents, so a Dockerfile means deciding multi-stage builds, base image, Node version in the
image, how pnpm enters, production-only installs and whether it runs as root — half a dozen conventions decided
*because they are standard*, which `CLAUDE.md` names as an anti-pattern. A bad Dockerfile in a template is worse
than none, because it is copied without being read.

**C is nearly excluded by the acceptance criterion**, the same way placeholders were: if done means *it starts*,
and starting depends on an environment nothing defines, the template cannot be verified by anything.

**What A costs:** the generated project has no answer to its first deploy.

**That gap is parked, not solved.** Deployment is a hole across the whole knowledge base — packaging,
production environment variables, how migrations run in a pipeline (`migrations.md` says *when*, not *how*), and
the orchestrator healthcheck that `observability.md` already built two routes for. It is recorded in
`OPEN-QUESTIONS.md` as a candidate area after V1 rather than opened in the middle of phase 5.

**Affects:** `templates/api`, phase 7's CI, `OPEN-QUESTIONS.md`

---

## 2026-09-14 — The application owns a `Profile`; Better Auth owns the identity

**Decision:** the API template's MikroORM side is a single entity, `Profile`, in the application schema, keyed
by the Better Auth user id and holding what the application knows about a person — display name, locale,
timezone. `GET /api/v1/users/me` returns the session's user together with its profile.

**This corrects the decision above it.** That entry promised *the user entity, its migration and its spec*, and
described `@Exclude` hiding a credential. Neither holds: `auth.md` puts Better Auth's tables in their own schema
on their own connection, so `user`, `session` and `account` belong to Better Auth and are never mapped by
MikroORM, and credentials live in `account`. The route survives; what it reads was wrong.

**Options considered:**
- A) Nothing application-owned — MikroORM configured with zero entities; `/me` returns the session user.
- B) A `Profile` entity.
- C) A neutral invented entity such as `Note`, explicitly an example.

**Reasoning:** B. **A costs five documents, not one.** `entities.md`, `migrations.md`, `queries.md`,
`transactions.md` and `testing.md` would have no code at all, and the test apparatus the acceptance criterion
demands — Testcontainers, a database per worker, truncation, factories — would have nothing to exercise, so it
would either be born dead or not born. `/me` would also collapse into a pass-through of the session,
demonstrating no service, no `EntityManager`, no `Ref<T>`, no `populate` and no spec against a real Postgres.

**B is also the correct design, not only the useful one.** Better Auth owns identity; the application owns what
it knows about the person. A project storing a user's timezone inside Better Auth's table is wrong, and a
template without `Profile` would teach exactly that.

**C is the disposable example already refused**, under a different name.

**What B costs:** it does not pass the day-zero test cleanly. A project may never want a profile table, and it
would then be the first thing to delete. The test is a criterion, not a judge — it exists to stop us shipping
what does not serve, and this serves.

**Affects:** `templates/api`, the `users` route decision above, all five `database/` documents

---

## 2026-09-14 — The API template is written single-tenant; composing the multi-tenant form waits for the CLI

**Decision:** `templates/api` is written in its single-tenant form. **Whether the CLI composes a multi-tenant
variant is not decided here** — it is recorded as an open question against step 6.1.

**Options considered:**
- A) Single-tenant, permanently; a multi-tenant project wires isolation by hand from the two `multi-tenancy/`
  documents.
- B) The CLI composes the multi-tenant form — extra files copied, Better Auth's `organization` plugin enabled.
- C) Decide only that the template is written single-tenant, and answer the composition in phase 6.

**Reasoning:** C, and the reason is a bind found while writing the options rather than a preference.

**In a day-zero multi-tenant project there is no tenant-scoped table.** `Profile` belongs to a user, not to a
tenant, and `organization`, `member` and `invitation` are Better Auth's. So the isolation wiring would be
registered over nothing.

That leaves A and B as **two defects rather than two choices**. A abandons *fail closed* at the one place the
project has closed every other time: a forgotten filter is cross-tenant leakage, which fails silently, and
under A that wiring is the only dangerous wiring a developer does by hand from prose. B honours the rule and
ships a filter that demonstrates nothing — unless a tenant-scoped table is invented, which is the disposable
example already refused twice.

**Neither can be recommended honestly while the bind stands**, and the information that resolves it — how the
CLI actually composes — arrives at step 5.3 and in phase 6. The single-tenant form is the base of both answers,
so writing it is identical work under either.

**What C costs:** it defers a security question, and deferred security questions are how they disappear. It is
acceptable only because it is written down with `Blocks: 6.1`, not because it is comfortable.

**Affects:** `templates/api`, `OPEN-QUESTIONS.md`, step 6.1

---

## 2026-09-14 — TypeScript 6, because Nest's starter has not moved to 7

**Decision:** templates use **TypeScript 6**, not 7. The stack's version floor changes from 5.8 to 6.0.

**What was verified, at the registry and by measurement:**

| Fact | Source |
|---|---|
| `nestjs/typescript-starter` declares `"typescript": "^6.0.2"` | the starter's `package.json` |
| Nest is at 12.0.1, and so is the starter | npm registry |
| TypeScript 7.0.2 was published 2026-07-08; 6.0.3 on 2026-04-16 | npm registry |
| TypeScript 7 **does** emit `design:paramtypes` under `emitDecoratorMetadata` | compiled and read the output |
| TypeScript 7 requires an explicit `rootDir` alongside `outDir` (TS5011) | same probe |
| 7 drops `target: es5`, `downlevelIteration`, `baseUrl`, `moduleResolution: classic` | the 7.0 announcement |
| Microsoft ships `@typescript/typescript6` for code needing the older compiler API | the 7.0 announcement |
| MikroORM 7.2.0 requires Node >= 22.17.0 | npm registry |

**Options considered:**
- A) TypeScript 6.
- B) TypeScript 7.
- C) Different versions per type.

**Reasoning:** A. Decorators were measured first, because that would have excluded 7 outright. It does not —
so the decision rests on something else.

**Two things this stack mandates consume the TypeScript compiler API:** the `@nestjs/swagger` CLI plugin, which
`routes.md` requires enabling, and the `@nestjs/cli` build. The existence of `@typescript/typescript6` is the
admission that this API changed. If either fails on 7, the template cannot meet its acceptance criterion, and
phase 5 becomes a tooling migration instead of template writing.

**Nest had two months to adopt 7 and did not.** With a standing instruction that the API follows what Nest
indicates, that is not a tiebreaker — it is the answer.

**C is excluded by two decisions already taken:** the catalog holds one version per dependency with no
exception to check, and there is a single `tsconfig.base.json` for the whole workspace.

**What A costs:** it is one major behind the native compiler, which is the largest speed change in the
language's history, and it is a choice that ages by definition.

**The reversal condition, measurable:** the day `nestjs/typescript-starter` declares `^7`. Not before, and not
*when it feels stable*.

**Affects:** `docs/stack.md` (the floor line and the Language row), `core/tooling.md`, every template

---

## 2026-09-14 — Vitest 4, by the same rule that chose TypeScript 6

**Decision:** templates use **Vitest 4**, the major `nestjs/typescript-starter` declares, not the current 5.

**Options considered:**
- A) Vitest 4, as the starter declares (`^4.1.2`).
- B) Vitest 5.

**Reasoning:** A. The case for adopting 5 is weaker than the case for TypeScript 7 that was just refused: 5.0.0
was published on 2026-09-03, eleven days ago, against two months for TypeScript 7. Accepting it here would mean
applying two different criteria in the same session — and **the criterion, not the version, is what governs the
next ten times this appears.**

**What A costs:** one major behind, again, and the same ageing.

**The reversal condition:** the day the starter declares `^5`.

**One thing left open on purpose, because it is not the user's decision:** the starter carries no SWC plugin,
only `vite-tsconfig-paths`, while Nest's injection depends on `emitDecoratorMetadata`, which esbuild does not
emit. Either Vitest 4 resolves that another way, or the template needs `unplugin-swc`. It is settled by running
`pnpm test`, not by discussion.

**Affects:** `core/testing.md`, every template

---

## 2026-09-14 — `users` exposes `GET` and `PATCH /users/me`

**Decision:** the `users` module exposes two routes on the session's own profile: `GET /api/v1/users/me` and
`PATCH /api/v1/users/me`. This extends the earlier one-route decision, which was taken **before** the entity
behind it was settled.

**Options considered:**
- A) `GET` only, faithful to the letter of the earlier decision.
- B) `GET` and `PATCH`.

**Reasoning:** B. **A leaves `Profile` inert** — the row is created at first login with defaults and never
changes. That removes the write path entirely: `em.persist` and `em.flush` have no example, there is no input
DTO, so `whitelist`, `forbidNonWhitelisted` and `transform` are configured over nothing, and `transactions.md`
touches nothing either. It also undermines the entity decision itself: a profile nobody can edit is not day-one
work.

**The earlier decision chose one route over *one route plus a list of every user*.** The list was the problem,
not the count. Editing one's own display name or timezone is the user acting on their own data, not an
administrative route, so it falls on the safe side of that line.

**What B costs:** two routes instead of one, which is an expansion beyond the letter of what was approved —
which is why it was asked rather than assumed.

**Affects:** `templates/api`, `api/routes.md`, `database/queries.md`

---

## 2026-09-14 — `profile.user_id` carries a real foreign key into `auth.user`

**Decision:** `profile.user_id` references `auth.user(id)` with `ON DELETE RESTRICT`, across schemas, inside the
one Postgres instance.

**This also corrects the migration chain above.** That entry wrote the script as
`mikro-orm migration:up && auth migrate`. `multi-tenancy/isolation.md` already says *"Run Better Auth's
migrations before ours"*, because `tenant_id` references `organization`. The approved option — one composite
script — stands; the order inside it was wrong and an existing rule decides it. The script is now
`auth migrate --yes && mikro-orm migration:up`, which serves both cases: our migrations that do not depend on
authentication do not care about the order, and the ones that do require exactly this.

**Options considered:**
- A) No foreign key — `profile.user_id` is a unique, indexed `uuid` and nothing more.
- B) A cross-schema foreign key with `ON DELETE RESTRICT`.

**Reasoning:** B. The decoupling A buys is partly an illusion: both ends already live in the same Postgres, and
what changes is whether **the database knows it or only we do**. Between the database guaranteeing and the
application remembering, this project has chosen the database every time — `ON DELETE RESTRICT`, `NOT NULL`, a
`CHECK` instead of an application-level enum. `entities.md` requires a foreign key to carry `RESTRICT`, and an
exception written into an integrity rule is how integrity rules die.

**What A costs:** deleting a user leaves an orphan profile and nothing prevents it.

**What B costs:** it couples the two systems at schema level. If Better Auth ever moves to another database,
this foreign key is what breaks. And `RESTRICT` means deleting a user **fails** while a profile exists, so the
application must delete the profile first, deliberately — work the template has to show, or the first account
deletion breaks.

**Affects:** `templates/api`, `database/entities.md`, the migration chain

---

## 2026-09-14 — A Better Auth hook creates the profile

**Decision:** `databaseHooks.user.create.after` calls `UsersService.createProfile`, using the sign-up `name` as
the display name. `createAuth` receives the hook as an argument, so the factory stays free of Nest and the CLI
entry creates Better Auth without it.

**Options considered:**
- A) A Better Auth hook creates the profile.
- B) `GET /me` creates the profile lazily when it is missing.
- C) Explicit onboarding — `/me` returns 404 until the client calls `POST /users/me`.

**Reasoning:** A. The hook is Better Auth's documented extension point for exactly this, and it is the only
option where the client never learns that identity and profile are two tables.

**B makes a `GET` write**, which breaks the verb's safety, and two concurrent first requests race to create
the same row, one of them hitting the unique constraint.

**C is honest and atomic, and it pays for that with another route** and a *signed up without a profile*
state every client must handle.

**What A costs:** authentication now depends on `users`. And it is not atomic — the user and the profile are
written over two connections, so a failure between them leaves a user with no profile and `/me` answering 404.
That window needs a database failure between two consecutive writes, and its result is a visible 404, not
corrupted data.

**Verified running:** sign-up returns 200, `GET /api/v1/users/me` returns the profile with a
database-generated UUID v7 id, and `PATCH` changes only the field sent.

**Affects:** `templates/api` (`auth.factory.ts`, `auth.module.ts`), `api/auth.md`

---

## 2026-09-14 — Seven documents corrected against the running API template

**Decision:** the knowledge base now states what the running template proved, in the documents that claimed
otherwise or said nothing.

| Document | Correction |
|---|---|
| `core/tooling.md` | `biome.jsonc`; the `preset` field; in `api`, the parameter-decorator parser option on and `useImportType` off; `import type` forbidden where Nest reads the type at runtime |
| `api/auth.md` | `toNodeHandler` with `@Req()`/`@Res()` instead of `auth.handler(req)`; CLI on the compiled config, run first; `generateId: 'uuid'`; the foreign key into `auth.user`; the sign-up hook |
| `api/config.md` | `.env` loaded by `process.loadEnvFile` in the environment module, which is now the one place `process.env` is read |
| `database/testing.md` | Better Auth's migrations run first in each worker database, and its tables are truncated |
| `api/observability.md` | The ORM connects explicitly at bootstrap |
| `database/entities.md` | `p.text()`, because `p.string()` emits `varchar(255)` |
| `docs/stack.md` | The Auth row |

**Reasoning:** each is a fact observed in the running template, not a preference. Two carry costs worth
recording.

**`useImportType` off** gives up an autofix that is correct everywhere Nest does not read types at runtime.
It is off because in `api` it breaks injection silently, and on a DTO it silently disables validation — which
passed lint, typecheck, build and the service tests. **The DTO case remains unenforced:** it fails nowhere,
so only a request test sending an invalid body, or review, catches a hand-written `import type`.

**Loading `.env` in code** adds a few lines the framework would otherwise own. It is there because the two
CLIs import the configuration before any Nest module exists, and Node refuses `--env-file` in
`NODE_OPTIONS`.

**Affects:** the seven documents above

---

## 2026-09-14 — A module may hold more than one service, split by name rather than size

**Decision:** a module may contain further services beside the resource's own, generated with
`nest g service <name> <module> --flat`, each named for a part of the resource the resource's name does not
cover — `order-refunds`, `order-shipping`. There is no line limit, no `services/` directory and no service per
action. **This reopens and amends** *A module's anatomy is what `nest g resource` produces* (2026-09-10).

**Why it was reopened:** the anatomy rule allowed exactly one way out of a growing service — a new module —
and that way out is right only when a second responsibility has crept in. A module that is large and still one
thing has none: two modules sharing the same entities and invariants end up wanting each other, which the cycle
rule forbids. The rule was blocking the outlet Nest itself provides.

**Verified before deciding:** `nest g service profile-avatars users --flat --dry-run` creates
`src/users/profile-avatars.service.ts` and its spec **and updates `users.module.ts` to register it**. Allowing a
second service therefore keeps the original decision's central argument — the generator and the convention
never disagree.

**Options considered:**
- A) Keep one service per module; growth only through new modules.
- B) Further services in the same module, split when a group of methods has a name of its own.
- C) B, triggered by a line count.
- D) A `services/` directory with one file per action.

**Reasoning:** B. It opens the missing outlet using Nest's mechanism and Nest's generator, and its criterion —
*has a name of its own* — is the same kind of test this project already applies to modules.

**C was refused for the reason coverage thresholds were:** a number ages and invites gaming, and arbitrary
methods moved out to pass it leave something worse than the long file. **D is the frozen era**, measured at
thirteen files per feature.

**What B costs, and the two rules it forced to change in the same step:**
- The split is a judgement, held by review.
- Ownership of an entity moves from *the owning service* to **the services of the owning module**
  (`database/queries.md`).
- Services inside one module can now form a cycle, so the cycle rule reaches between services as well as
  between modules (`api/modules.md`).

**Affects:** `api/modules.md`, `database/queries.md`

---

## 2026-09-14 — The web template has sign-in and sign-up

**Decision:** `templates/web` ships both a sign-in and a sign-up screen.

**Options considered:**
- A) Sign-in only.
- B) Sign-in and sign-up.

**Reasoning:** B. The API template enables public email-and-password sign-up, so under the day-zero test the
screen is day-one work: without it the web hides a capability the server already exposes, the first user is
created with `curl`, and whoever generates the project builds sign-up on day one without an example, beside a
sign-in that has one. It is also the one form where a server error tied to a field happens naturally — an email
already taken.

**What B costs:** not every project has open sign-up. An internal or invite-only system deletes the screen — but
it must also turn public sign-up off in the API, so the deletion is a deliberate change on both sides rather than
forgotten code.

**Affects:** `templates/web`

---

## 2026-09-14 — Two doors to the server: our wrapper for our API, Better Auth's client for its routes

**Decision:** clients call the project's API through the one fetch wrapper, and Better Auth's routes through
Better Auth's own client (`createAuthClient`). One adapter converts the auth client's `error` into the same
`ApiError`, so no form distinguishes the two.

**Verified before deciding, against the running API:** Better Auth's errors are not problem+json.
`toNodeHandler` writes the response itself, past the exception filter — a wrong password is
`401 {"message":"Invalid email or password","code":"INVALID_EMAIL_OR_PASSWORD"}`, a taken email is
`422 {"message":"User already exists. Use another email.","code":"USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"}`, with
no `requestId` in the body. The logging and the `X-Request-Id` header do reach the flow. The auth client returns
`{ data, error }` with `error.status`, `error.message` and `error.code`. `multi-tenancy/client.md` already calls
`organization.setActive`, a method of that client.

**Options considered:**
- A) Better Auth's client for its routes, our wrapper for ours, one error adapter.
- B) Our wrapper for everything, understanding both error shapes.
- C) The API rewrites Better Auth's errors into problem+json.

**Reasoning:** A. The criterion already applied to Better Auth's tables — *the contract is its, not ours* —
applies equally to its routes. **B copies a contract we do not control**, which drifts silently on every upgrade,
grows with every plugin, and contradicts `multi-tenancy/client.md`. **C rewrites another library's responses on
the server**, breaks Better Auth's own client, which expects its shape, and does it on the most sensitive path in
the system.

**What A costs:** two doors to the server where the rule said one, and an authentication error that reaches the
client with no `requestId` in its body.

**Corrected in the same step:** `client/data.md` names the two doors; `api/auth.md` no longer claims the exception
filter covers authentication errors.

**Affects:** `client/data.md`, `api/auth.md`, `templates/web`, `templates/mobile`

---

## 2026-09-14 — The web's authenticated screen shows and edits the profile

**Decision:** behind the authenticated layout, `templates/web` has one page that reads `GET /users/me` and edits
it through `PATCH /users/me`.

**Options considered:**
- A) Show the profile only.
- B) Show and edit it.

**Reasoning:** B, for the reason the API gained its `PATCH`. **Better Auth's errors carry no field map**, so
sign-in and sign-up can only ever raise form-level errors. Without the profile form, the rule in
`client/forms.md` that fails most silently — walking `ApiError.errors` into `setError` — would have no code at
all, and neither would a mutation invalidating a query through its factory. An invalid `locale` returns
`400 {"errors": {"locale": [...]}}`, which is the one place in the template where that path runs. The route
already exists in the API, so this is day-one work rather than demonstration.

**What B costs:** one more form and one mutation in the template.

**Affects:** `templates/web`, `client/forms.md`, `client/data.md`

---

## 2026-09-14 — Clients call the API across origins, in development as in production

**Decision:** the web calls the API directly at `VITE_API_URL`. The API enables CORS for one validated origin,
`WEB_ORIGIN`, with credentials, and passes the same origin to Better Auth's `trustedOrigins`. No Vite proxy.

**Verified before deciding, in Better Auth's source:** every request carrying a cookie has its `Origin` header
validated against `trustedOrigins`, and the default trusts only the API's own `baseURL`. A browser sends the
page's origin even on a proxied `POST` — a proxy rewrites `Host`, not `Origin` — so the API must name the web's
origin under **either** option. The difference between them is everything else.

**Options considered:**
- A) A Vite proxy — relative `/api`, no CORS in development.
- B) Direct cross-origin calls, with CORS configured for one origin.

**Reasoning:** B. **A hides CORS until the first deploy**, which is the worst moment to meet it: the proxy exists
only in development, and production either has a reverse proxy serving both on one domain — a deployment decision
still open — or has CORS. B uses one configuration for development and for production on separate subdomains, and
fails early and cheaply. `mobile` has no proxy at all, so the API has to accept direct calls regardless.

`SameSite=Lax` holds in both places: different ports on `localhost` are the same site, and so are subdomains of one
domain.

**What B costs:** the API gains `enableCors`, a validated `WEB_ORIGIN` and `trustedOrigins` reading it. A wrong
origin surfaces as a browser CORS error, one of the least helpful messages there is. Web and API on unrelated
domains would need `SameSite=None`, which this template does not cover.

**Affects:** `templates/api` (`main.ts`, `env.ts`, `auth.factory.ts`, `.env.example`), `templates/web`,
`api/config.md`

---

## 2026-09-14 — In `alone`, the integration layer already has the package's shape

**Decision:** a client template keeps the wire contract in `src/api-contract/` — `createClient({ baseUrl, fetch })`,
`ApiError`, the hand-written contract types and the query factories. The monorepo composition moves the directory
whole to `packages/api-contract` and rewrites `@/api-contract` to the package name.

**Why a decision was needed:** `client/data.md` put types and query factories *beside the feature that uses
them*, while `monorepo/layout.md` put the same code in one package with an injected transport. With one template
per type, adapted at copy time, the `alone` form scattering that code across features would make step 5.3 gather
files from several directories — a transformation that is not small, and fails silently when a file is missed.

**Options considered:**
- A) Literal to `client/data.md` — wrapper in `lib/`, types and factories in each feature.
- B) `alone` already has the package's shape, in `src/api-contract/`.
- C) The two forms diverge deliberately; the package is written separately in 5.3.

**Reasoning:** B. A and C pay the price the one-template decision refused, elsewhere: A turns composition into
file surgery, C writes the client code twice in this repository. B keeps the transformation to one moved directory
and one import prefix. It also stands on its own without a monorepo: every wire shape in one place mirrors the API,
so a renamed field has one file to fix.

**What B costs:** a project that stays `alone` injects a transport it never varies — indirection bought for a
composition it may never use. And two rules changed in the same step.

**Amended:** `client/data.md` (types and factories in `api-contract/`; transport injected by the app);
`web/structure.md`, `mobile/structure.md`, `site/structure.md` (a fourth place for shared code).

**Affects:** the documents above, `templates/web`, `templates/mobile`, `templates/site`, step 5.3

---

## 2026-09-14 — Client tests render components against a fake transport

**Decision:** the web template's tests render components with Testing Library and replace the network by passing
a fake `fetch` to `createClient`. No request-mocking library. The tests assert the silent rules: a `400` with an
`errors` map shows each message **on its field**, and a Better Auth `401` becomes a form-level error.

**Options considered:**
- A) Component tests against a fake `fetch` injected through the transport.
- B) Tests against the running API and a Postgres container.
- C) Pure code only — `ApiError` parsing and URL building.

**Reasoning:** A. It is the only option that tests the dangerous rule and works in the `alone` form. **B cannot
exist in `alone`**, where there is no API beside the web, and would couple the client suite to Docker. **C tests
the parsing, which is not where it breaks**: the failure is a form receiving a correct `ApiError` and not calling
`setError` on the right field — a suite that passes while the thing that matters is broken.

The seam already existed: the integration layer takes its transport from the app, so the fake imitates nothing
internal and needs no library — which is also why MSW stays cut.

**What A costs:** the fake responses are written by hand and can drift from the API unnoticed — the same cost
accepted for hand-written contract types. It also needs a simulated DOM. The monorepo composition runs the API and
the web in one CI, which is where that drift can surface.

**Amended:** `core/testing.md` — a client replaces the network through the injected transport.

**Affects:** `templates/web`, `templates/mobile`, `core/testing.md`

---

## 2026-09-14 — For `web`, *starts* means the build is served and the whole app mounts

**Decision:** the web template's *starts* criterion is `vite build` succeeding and `vite preview` serving it,
**plus one test that mounts the whole application** — root, router and real providers — in the simulated DOM and
finds the sign-in screen.

**Options considered:**
- A) The build is produced and served.
- B) The sign-in screen renders in a real browser.
- C) A, plus one test mounting the whole application in the simulated DOM.

**Reasoning:** C. A proves a bundle exists and nothing about rendering: a provider missing at the root, or a route
that throws on mount, passes it — and the root is where a template's wiring lives. The component tests render
individual screens, not the tree with its router. C closes that gap with the simulated DOM the component tests
already brought. **B buys the last fraction of certainty with Playwright**, which the day-zero test cut, and
browser downloads in CI.

**What C costs:** a simulated DOM is not a browser — CSS, layout and APIs jsdom does not implement stay invisible.
And the mounting test depends on the router's configuration, so it breaks when that changes.

**Affects:** `templates/web`, phase 7

---

## 2026-09-14 — A client template ships the shadcn components its screens use

**Decision:** `templates/web` ships shadcn's plumbing **and exactly the components its own screens use** — a
button, an input, a label and what a field error needs — installed by the shadcn CLI, not written by hand. **This
amends** the rule carried from the frozen era, *templates ship its plumbing, not its components*.

**Why it was reopened:** that rule was decided when a template had no screens. A later decision gave the web
template sign-in, sign-up and a profile form — the same pattern as the `users` route amended once its entity was
settled.

**Options considered:**
- A) Plumbing only; screens use raw elements with Tailwind classes.
- B) The components the screens use, installed by the CLI.

**Reasoning:** B. **A breaks another rule on day one.** Three forms repeat one class list, and
`web/components.md` requires extracting it on the third occurrence **as a component** — so the template would
either violate that rule or invent a `Button` and an `Input` that are not shadcn's, and the developer's first
`shadcn add button` would produce a second button. *Edit a shadcn component in place* would have no example.

What the old rule protected against — shipping components no screen uses — stays refused.

**What B costs:** it reverses a decision that survived two eras, and the components carry a style the developer
did not pick. Choosing another means reinstalling over them, and the CLI overwrites without warning.

**Affects:** `docs/stack.md`, `templates/web`, `templates/site`

---

## 2026-09-14 — shadcn components are built on Base UI

**Decision:** shadcn components in `web` and `site` use **Base UI**, shadcn's default primitive library, installed
with no `-b` flag.

**Verified before deciding:** Base UI became shadcn's default in July 2026, with the stated reasons *"Base UI is
stable"*, *"Every new project we've started runs on Base UI"* and *"projects created on shadcn/create now pick Base
UI over Radix 2 to 1"*. The same announcement: *"Radix is not being deprecated… every update and new component
will ship for both libraries."* React Aria support arrived in July 2026. Registry: `@base-ui/react` 1.8.0
(2026-09-04), `radix-ui` 1.6.7 (2026-07-24).

**Options considered:**
- A) Base UI, the default.
- B) Radix.
- C) React Aria.

**Reasoning:** A, by the rule that chose TypeScript 6 and Vitest 4 — follow what the tool indicates — and this
time with no stability conflict: it is declared stable and its maintainer runs it in production. `shadcn init` and
`shadcn add` produce it with no flag, so the generator and the convention agree. **B makes every install remember
`-b radix`**, and a correction after generation is the one people forget. **C is the newest and least-proven
support**, chosen with no project-specific reason.

**What A costs:** muscle memory. Years of tutorials, and every assistant's training, show Radix's composition
(`asChild`); Base UI composes differently (`render`). Assistants will write Radix patterns over Base UI
components. The mitigation is the one used for `@InjectRepository`: the template's code shows the right form.

**Affects:** `docs/stack.md`, `templates/web`, `templates/site`, `web/components.md`

---

## 2026-09-14 — A pinned version must be at least one day old

**Decision:** a template pins the newest version **published at least 24 hours earlier**, and never commits a
`minimumReleaseAgeExclude` entry. This refines *dependency versions are pinned exactly* (2026-09-14).

**What surfaced it:** installing the web template left a `pnpm-workspace.yaml` nobody wrote, listing
`lucide-react@1.46.0` and `zod@4.6.5` under `minimumReleaseAgeExclude`. pnpm's documentation states
`minimumReleaseAge` defaults to **1440 minutes since v11**, to reduce the risk of installing a compromised
package; both versions were under a day old. The same documentation says exclusions are not added automatically;
pnpm 12.3.4 added them. Every other pinned version in both templates was checked against the registry and
already satisfied the rule.

**Options considered:**
- A) Pin the newest and commit the exclusions.
- B) Pin the newest version at least a day old; never commit an exclusion.
- C) Pin the newest and install past the guard without recording anything.

**Reasoning:** B. **A has the template switch off a supply-chain guard on the developer's behalf**, and the
exclusion outlives the version it was written for. **C works on the maintainer's machine and breaks on the
developer's**: under the strict mode installation fails, and under the default mode pnpm falls back to another
version, so the exact pin silently stops being exact. A generator that disables the guard by default stands on
the wrong side of it; one day behind costs a template almost nothing.

**What B costs:** up to a day behind the newest release, and whoever refreshes a template checks a publish date,
not only a version number.

**Applied:** `lucide-react` 1.46.0 → 1.45.0 and `zod` 4.6.5 → 4.6.4; the generated file is removed, and a clean
install no longer recreates it.

**Affects:** every template's `package.json`, the catalog in `monorepo/dependencies.md`

---

## 2026-09-14 — Three documents corrected against the running web template

**Decision:** the knowledge base now states what building and testing the web template proved.

| Document | Correction |
|---|---|
| `web/components.md` | Base UI composes with `render` (and `nativeButton={false}`), never `asChild`; `cn` comes from the `cn` package; the scoped Biome override; `shadcn init` needs every choice as a flag |
| `client/forms.md` | One function in `features/forms/` maps server errors, with the form-level error on `root.server`; every authentication error is form-level; a test rendering the form against a fake `400` is what enforces the mapping; `z.email()` in the examples |
| `core/tooling.md` | In a client using shadcn, `noLabelWithoutControl` and `useSemanticElements` are off for `components/ui/` only |

**Reasoning:** each is a fact from the running template. The `render` example was compiled inside the template
before it was written down, and so was the `asChild` counterexample — which **does not build**, correcting a claim
drafted in the same step that the compiler would not catch it usefully.

**What the scoped override costs:** a hand-edited primitive in `components/ui/` is no longer checked by those two
rules. They stay on for every screen, where a label without a control is a real defect.

**Affects:** the three documents above

---

## 2026-09-14 — A template's README holds its name and the commands to run it

**Decision:** each template has a `README.md` with the project's name as its title, its requirements, the
commands to run it, the everyday scripts, and one line pointing at `AGENTS.md` and `.prumo/`. It summarises no
convention.

**Options considered:**
- A) Name, commands, and a pointer to the conventions.
- B) Name, commands, and a summary of the main conventions.
- C) No README; the project name lives only in `package.json`.

**Reasoning:** A. The commands belong to no `.prumo/` document and are what nobody discovers alone — the API's
compose, two migration systems and build-before-migrate are not obvious. **B is a second source of one truth**,
and `CLAUDE.md` §9 records that the summary is the copy that goes stale. **C leaves exactly that knowledge
undocumented**, in a repository whose first oddity would be having no README.

**What A costs:** someone reading the repository without an assistant finds a pointer, not the rules.

**Writing it exposed two defects in `docker-compose.yml`**, which had never been run — every earlier database was
started with `docker run`. It did not mount `docker/init`, so a fresh database had no `auth` schema and
`auth migrate` failed. And it mounted the volume at `/var/lib/postgresql/data`, which the Postgres 18 image
refuses — from 18 the mount is `/var/lib/postgresql`. Both are fixed, and the README's commands were then run
literally against a fresh compose database: all six tables created, readiness `up`.

**Affects:** `templates/api`, `templates/web`, phase 6 (the CLI's rewrite surface)

---

## 2026-09-14 — The monorepo composition is written now, as the CLI's own copy step

**Decision:** step 5.3 implements the copy-time transformation in `bin/`, as the code phase 6 completes with the
CLI's questions. It is not composed by hand, and not written as a separate throwaway script.

**Options considered:**
- A) Write the transformation now, as the CLI's copy step.
- B) Compose by hand once, and record the transformation as a specification for phase 6.
- C) A throwaway composition script, ported to the CLI later.

**Reasoning:** A. The transformation **is** the CLI's copy step: B does not write it and C writes it twice. The
one-template decision accepted that the monorepo form *can only be inspected by generating it* — so generating has
to exist for anything to verify it, including phase 7's CI. It also proves the promise that the rewrite is small
in code rather than prose: if it is not small, that shows up as lines.

**B leaves a prose specification of file transformations**, the kind of text nothing executes and that rots.
**C translates the same transformation into a second implementation**, which is where silent differences enter.

**What A costs:** it pulls forward the choice of the CLI's language, planned for phase 6. That choice is taken
next, as its own decision.

**Affects:** `bin/`, step 5.3, phase 6, phase 7

---

## 2026-09-14 — The CLI is TypeScript on Node, published to npm

**Decision:** `bin/` is written in TypeScript, runs on Node, and is distributed as an npm package run with
`pnpm dlx prumo`. It is compiled before publishing.

**Verified before deciding:** Node's documentation for 22.18.0 records *"Type stripping is enabled by default"*;
the project's floor, 22.17, still needs a flag. The same page states Node does not strip types from files under
`node_modules`, so a CLI installed from npm has to ship compiled regardless.

**Options considered:**
- A) TypeScript on Node, published to npm.
- B) A POSIX shell script.
- C) A single Go or Rust binary.

**Reasoning:** A. **It adds no requirement**: every generated project already needs Node 22.17 and pnpm. The work
is copying trees and editing JSON, which is native here, and the language, lint, tests and compiler are the ones
this repository already runs. **B** edits JSON through `jq` — a new requirement — or through hand-rolled parsing,
fragile exactly where the transformation lives; it does not run on Windows without WSL, and tests poorly. **C**
adds a second language and a per-platform release pipeline to avoid a dependency Prumo's users already have.

**What A costs:** a build step for the CLI itself, and a package Prumo has to publish and version.

**A consequence, not a closure:** with JSON native, the open question about the format of the CLI's stored
answers loses the tension that raised it. It stays open for phase 6.

**Affects:** `bin/`, phase 6, `OPEN-QUESTIONS.md`

---

## 2026-09-14 — Internal packages use the fixed scope `@app`

**Decision:** the integration package is `@app/api-contract` in every generated workspace, whatever the project is
called. The composition rewrites `@/api-contract` to `@app/api-contract` and nothing else.

**Verified before deciding, at the npm registry:** `api-contract` exists as a **public** package; `@app/api-contract`
does not. Whether the `@app` scope has an owner cannot be confirmed from the public registry.

**Options considered:**
- A) A fixed scope, `@app/api-contract`.
- B) The project's name as scope, `@<project>/api-contract`.
- C) No scope, `api-contract`.

**Reasoning:** A. **B puts the project's name into every source file that imports the contract**, which the
real-name decision forbade, and turns the CLI's rewrite surface from `package.json` and `README.md` into source
code. **C gives an internal package the name of a public one** — the textbook shape of a dependency-confusion
attack. The examples in `monorepo/layout.md` and `monorepo/dependencies.md` already use `@app`.

**What A costs:** the name is generic, so a project that later publishes packages or merges two workspaces has to
rename the scope. And nothing guarantees `@app` stays unowned on npm; `workspace:*` never consults the registry,
but replacing it with a version range would open the door.

**Affects:** step 5.3, `bin/`, `monorepo/layout.md`, `monorepo/dependencies.md`

---

## 2026-09-14 — Biome in a workspace: shared settings at the root, differences per app

**Decision:** the workspace root holds `biome.jsonc` with the formatter and the preset. Each app that needs more has
its own `biome.jsonc` with `"extends": "//"`, holding only what differs from the root.

**Verified before deciding:** Biome's monorepo guide documents nested configuration files, `"extends": "//"` as
*"extend from the root configuration, regardless of where the nested configuration is"*, and that commands run from
the root respect every nested file.

**Options considered:**
- A) One root configuration with per-directory `overrides`.
- B) A root configuration plus a nested one per app, extending it.
- C) Each app keeps a complete configuration; nothing at the root.

**Reasoning:** B, the shape already chosen for TypeScript — a base at the root, each app extending with what
differs. **A** makes composition merge app configurations into the root's overrides, restructuring JSON rather than
moving a file, and every new app edits the shared file. **C** duplicates the formatter and preset per app — the
*files that start identical and diverge silently* already refused for `tsconfig` — and leaves the root hook with no
root configuration.

**What B costs:** an app's effective configuration is read from two files.

**Amended:** `monorepo/tasks.md`.

**Affects:** `monorepo/tasks.md`, step 5.3, `bin/`

---

## 2026-09-14 — In a workspace, compose files stay with the app that owns the database

**Decision:** `docker-compose.yml` and `docker/init/` stay in `apps/api`. `.githooks/` and the `prepare` script move
to the workspace root. Each app keeps its own `.env` and `.env.example`.

**Settled by facts rather than choice:** Git has one `core.hooksPath` per repository, and the root already runs
`lint`, `typecheck` and `test`, so the hooks belong there. `.env` stays per app because the API loads it from its
working directory — `pnpm --filter api start:dev` runs inside `apps/api` — and Vite reads it from the app's folder;
a root `.env` would be read by neither.

**Options considered, for the compose file:**
- A) Move it to the root.
- B) Keep it in `apps/api`.

**Reasoning:** B. It adds nothing to the transformation — the file and its init script stay where the template put
them. Its contents are the API's: the `auth` schema and the `app` database belong to the type that brings the
`database/` area. **A** moves the file and rewrites its `./docker/init` path, and at the root it would look like
workspace infrastructure without being it.

**What B costs:** from the root the command is `docker compose -f apps/api/docker-compose.yml up -d`. When a second
consumer of the same database appears, the file moves to the root then — the two-consumer criterion
`monorepo/layout.md` already applies to packages.

**Affects:** step 5.3, `bin/`, `templates/api/README.md` in its workspace form

---

## 2026-09-14 — A composed workspace is done when the root checks pass and each app meets its own criterion

**Decision:** the composed workspace is accepted when `pnpm install`, `pnpm lint`, `pnpm typecheck` and `pnpm test`
pass from the root **and** each app meets its template's criterion from inside the workspace — the API builds,
migrates and starts with readiness `up`; the web builds, is served, and its whole-app mounting test passes.

**Options considered:**
- A) The root checks only.
- B) The root checks, plus each app's full criterion inside the workspace.
- C) B, plus an integration test of the web's real client against the running API.

**Reasoning:** B. Composition changes wiring: an app importing `@app/api-contract` from a package that is only
TypeScript source, configurations extending the root, hooks moving. **A typechecks the package through TypeScript,
not through the bundler** — if Vite cannot resolve it at build time, A passes, which is the gap the template
criterion already refused under another name. **C decides by the back door** the request-level testing question
parked in `OPEN-QUESTIONS.md`, and belongs to phase 7's CI.

**What B costs:** slower verification, and Docker, as the template criterion already required.

**Affects:** step 5.3, phase 7

---

## 2026-09-14 — Dependency build scripts are denied by name

**Decision:** the API template carries a `pnpm-workspace.yaml` whose `allowBuilds` marks five packages `false` —
`@scarf/scarf`, `@swc/core`, `cpu-features`, `protobufjs`, `ssh2` — each with its reason. Composition merges that
block into the workspace root. `strictDepBuilds` stays on.

**What surfaced it:** every earlier install ran with `--ignore-scripts`. A plain `pnpm install` of the API template,
and of the composed workspace, failed with `ERR_PNPM_IGNORED_BUILDS`. pnpm's documentation: `strictDepBuilds`,
default `true` since v10.3, *"will exit with a non-zero exit code if any dependencies have unreviewed build scripts"*;
`allowBuilds` (since v10.26, replacing `onlyBuiltDependencies`, removed in v11) maps packages to `true` or `false`.

**Verified before deciding:** marking all five `false` makes the install exit 0 — denied counts as reviewed.
`@scarf/scarf` is install telemetry, arriving through `swagger-ui-dist` from `@nestjs/swagger`. `ssh2`,
`cpu-features` and `protobufjs` arrive through Testcontainers, a development dependency. `@swc/core` receives its
binary as an optional dependency. The API suite and the web suite already passed with no build scripts run. The web
template's dependencies have none.

**Options considered:**
- A) Deny the five explicitly.
- B) Allow the five.
- C) Turn `strictDepBuilds` off.

**Reasoning:** A. It resolves the known five while **a new build script still fails the install loudly**, which is
the guard's purpose, and it keeps telemetry off developers' machines — no invasive tooling by default. **B** runs
that telemetry everywhere and compiles native code that fails without a C toolchain. **C** turns every future build
script, including a compromised dependency's, into a warning — the same trade refused for the release-age guard.

**What A costs:** the `alone` API template gains a `pnpm-workspace.yaml`, which composition must merge rather than
copy — a nested one would make pnpm treat `apps/api` as a separate workspace. If one of the five ever needs its build
to function, the symptom is a runtime error rather than an install failure.

**Affects:** `templates/api`, `bin/` (composition), `monorepo/dependencies.md`

---

## 2026-09-14 — Hooks are wired by a script that tolerates a missing repository and nothing else

**Decision:** `prepare` runs `node .githooks/install.mjs`. Inside a Git repository it sets `core.hooksPath`; with no
Git or no repository it exits 0; when Git is present and the setting cannot be written, it fails. **This amends the
locked `"prepare": "git config core.hooksPath .githooks"`.**

**What surfaced it:** a plain install of the API template outside a repository failed — `git config` exited 128, and
`prepare` runs on every install. That is an install inside a container, in CI from an archive, or from a downloaded
zip.

**Verified in all three states:** no repository → install completes; repository → `core.hooksPath` is `.githooks`;
repository with its directory made unwritable → the script exits 1 with Git's error, and the setting stays unset.

**Options considered:**
- A) A shell guard — `git rev-parse … && git config … || true`.
- B) A short Node script in `.githooks/`.
- C) No `prepare`; the CLI sets hooks once and the README tells cloners to run a command.
- D) Keep it, and document `--ignore-scripts` for environments without Git.

**Reasoning:** B is the only option that tolerates a missing repository without swallowing a real failure and without
depending on the system shell. **A** is POSIX syntax, and pnpm uses the system shell — `cmd` on Windows, where
`/dev/null` does not exist — and its `|| true` hides a repository that could not be configured. **C** leaves every new
clone without hooks, widening a gap `core/tooling.md` already records. **D** keeps installs failing by default.

**What B costs:** a file doing what used to be one line. It lives in `.githooks/`, where Git ignores anything not named
after a hook.

**Amended:** `docs/stack.md`, `core/tooling.md`.

**Affects:** `templates/api`, `templates/web`, `templates/workspace`

---

## 2026-09-14 — The mobile template has sign-in, sign-up and an editable profile

**Decision:** `templates/mobile` ships the same three screens as the web template — sign-in, sign-up, and a profile
it reads and edits.

**Options considered:**
- A) Mirror the web: sign-in, sign-up, editable profile.
- B) Sign-in only, as the day-one decision first wrote it.
- C) Sign-in and editable profile, without sign-up.

**Reasoning:** A. Both reasons that added screens to the web are independent of platform. The API exposes public
sign-up, so without the screen the first user is created with `curl`; and Better Auth's errors carry no field map,
so only the profile form exercises the silent rule in `client/forms.md` — on the platform where forms are hardest to
get right. Running the same `api-contract/` and error mapping on both platforms also proves the shared layer is
shareable. **C assumes a web exists for sign-up**, while `mobile` can be generated beside the API alone.

**What A costs:** three forms in React Native, with keyboard, focus and no native `<form>` — the most expensive
template of the phase, paid once.

**Affects:** `templates/mobile`

---

## 2026-09-14 — Mobile uses stable NativeWind with Tailwind 3, through a named catalog

**Decision:** `templates/mobile` uses NativeWind 4 with Tailwind 3. In a workspace, Tailwind 3 lives in a named
catalog, `tailwind3`, referenced as `catalog:tailwind3`; the web's Tailwind 4 stays in the default catalog. **This
amends** *one version per dependency, with no exception to check* to *no unnamed exception*.

**Verified before deciding:** NativeWind's stable installation guide (4.2.7, supporting Expo SDK 57) installs
`tailwindcss@^3.4.17` with a `tailwind.config.js` using `nativewind/preset`. Tailwind 4 support exists only in
`nativewind@5.0.0-rc.0`, published 2026-09-13, which peers `tailwindcss >4.1.11`. pnpm documents named catalogs —
`catalogs:` in `pnpm-workspace.yaml`, `catalog:<name>` in `package.json` — holding different versions of one package.
The composition step already refuses two versions of one dependency, so a workspace with web and mobile could not be
generated at all.

**Options considered:**
- A) Stable NativeWind 4 with Tailwind 3, and a named catalog for the difference.
- B) NativeWind 5 RC with Tailwind 4.
- C) Drop NativeWind; use `StyleSheet`.
- D) Keep the rule; do not support web and mobile in one workspace until v5 is stable.

**Reasoning:** A, by the criterion that chose MikroORM, TypeScript 6 and Vitest 4 — follow what the tool marks
stable. The exception is named, in one file, and every other conflict still fails loudly. **B** puts a two-day-old
release candidate under every generated app's styling, and the NativeWind facts `mobile/components.md` records were
verified on v4. **C** reverses the stack and five documents. **D** makes the most common product shape — API, web
and app — impossible to generate for an unknown time.

**What A costs:** two Tailwind dialects in one workspace, JavaScript configuration in one app and CSS in the other,
and a migration to v5 that is certain to come.

**The reversal condition, measurable:** the day NativeWind's stable installation guide installs Tailwind 4, mobile
migrates and the `tailwind3` catalog is deleted.

**Amended:** `monorepo/dependencies.md`.

**Affects:** `templates/mobile`, `bin/` (composition must place Tailwind 3 in the named catalog),
`monorepo/dependencies.md`, `mobile/components.md`

---

## 2026-09-14 — The mobile template starts from Expo's default template, with its examples removed

**Decision:** `templates/mobile` is produced once from `create-expo-app --template default` on Expo SDK 57, and every
example screen and asset that is not infrastructure is removed in this repository before it is committed.

**Verified before deciding:** Expo's documentation describes `default` as *"Designed to build multi-screen apps"*, with
Expo Router and TypeScript; `blank-typescript` as having no navigation configured; `tabs` as Expo Router in a tab
layout. Expo SDK 57 is the current release and is supported by stable NativeWind 4.2.7.

**Options considered:**
- A) `default`, with its examples removed.
- B) `blank-typescript`, adding Expo Router by hand.
- C) `tabs`.

**Reasoning:** A. It is what Expo recommends, and it leaves the delicate wiring — entry point, scheme, router plugin,
typed routes — to Expo's generator rather than to hand-written configuration, which is where recalled details have
already been wrong twice in this phase. Removing examples happens once, here, not in the hands of whoever generates a
project, which keeps the refusal of disposable examples. **C** embeds a tab layout, while `mobile/routing.md` says the
navigation shape follows the product.

**What A costs:** telling example from infrastructure in `default` exactly, knowing that a forgotten example file
becomes the pattern copied.

**Affects:** `templates/mobile`

---

## 2026-09-14 — The API enables Better Auth's Expo plugin only when a mobile scheme is configured

**Decision:** the API template depends on `@better-auth/expo`, and `createAuth` registers its `expo()` plugin — and
trusts the app's scheme — **only when the optional `MOBILE_APP_SCHEME` is set**. Without it the plugin is not
registered. Composition with `mobile` fills that variable in `apps/api/.env.example`.

**Verified before deciding, in the plugin's source (`@better-auth/expo` 1.7.4):** it copies an `expo-origin` header
into `origin` when a request has none — without that, the origin check refuses every cookie-bearing request from a
native app; it trusts `exp://` in development; it appends the cookie to deep-link redirects after OAuth callbacks,
magic links and email verification; and it registers `/expo-authorization-proxy`, which redirects to **any `https`
URL on another origin**.

**Options considered:**
- A) Always registered in the API template.
- B) Composition inserts the plugin into `auth.factory.ts` when mobile is present.
- C) In the API's code, registered only when a mobile scheme is configured.

**Reasoning:** C. **A gives every API — including those that will never have an app — an open redirect endpoint and
an origin-substituting header**: conditional capability shipped unconditionally, as attack surface. **B rewrites
TypeScript source at composition**, which the copy-time decisions kept out, and does nothing for someone who generates
the API alone and adds an app later. C makes the condition configuration: an API without the variable exposes
nothing, and adding an app later is one variable.

**What C costs:** a dependency and a few dormant lines in every API, and a configuration branch most projects never
enable — the branch nobody tests. So the template tests both states.

**Affects:** `templates/api` (`env.ts`, `auth.factory.ts`, `.env.example`, a spec), `bin/` (composition),
`api/auth.md`, `api/config.md`

---

## 2026-09-15 — Mobile tests run on Jest with `jest-expo`; every other type stays on Vitest

**Decision:** `templates/mobile` runs its tests with Jest and the `jest-expo` preset, with
`@testing-library/react-native`. `api`, `web`, `site` and the CLI stay on Vitest. **This amends** `core/testing.md`,
which said Vitest for every type.

**Verified before deciding:** Expo's unit-testing guide installs `jest-expo jest @types/jest` with
`"preset": "jest-expo"` and does not mention Vitest. `@testing-library/react-native` 14.0.1 peers `jest >=29.0.0`.
`vitest-react-native`, the community alternative, was last published on 2024-01-30.

**Options considered:**
- A) Jest with `jest-expo` in mobile; Vitest everywhere else.
- B) Force Vitest in mobile.
- C) No component tests in mobile; pure code on Vitest only.

**Reasoning:** A, by the criterion that chose TypeScript 6, Vitest 4 and Base UI — follow what the tool indicates.
**B fights the ecosystem in the most fragile part of the template**: the component testing library requires Jest,
the Vitest bridge is abandoned, and React Native ships Flow that Expo's preset transforms. **C returns the gap the
client-test decision closed**: the silent form rule untested on the platform where forms are hardest.

**What A costs:** two runners in one workspace with near-identical APIs, and a rule that now has an exception. The
rules that matter — placement, no database mocks, no threshold, asserting behaviour — are unchanged.

**Amended:** `core/testing.md`.

**Affects:** `templates/mobile`, `core/testing.md`, the workspace catalog

---

## 2026-09-15 — The mobile bundle is produced for iOS and Android

**Decision:** the mobile template's *starts* criterion is `expo export` producing bundles for **iOS and Android**. The
web platform the Expo default template supports is removed with its examples.

**Options considered:**
- A) iOS and Android.
- B) One platform.
- C) iOS, Android and web.

**Reasoning:** A. Metro resolves modules per platform — `.ios.tsx` and `.android.tsx` files, and native libraries such
as MMKV with a different JavaScript entry for each — so an import error that exists on one platform appears only in
that platform's bundle. **B verifies half the app and calls it done.** **C** maintains react-native-web, a third
platform nobody chose, inside a type whose web counterpart is the Vite `web` type, and invites using `mobile` as `web`.

**What A costs:** twice the bundling time in verification.

**Affects:** `templates/mobile`, phase 7

---

## 2026-09-15 — Web uses the React version Expo pins, so a workspace holds one React

**Decision:** `templates/web` pins `react` and `react-dom` to **19.2.3**, the version Expo SDK 57 pins, instead of
19.3.0. The workspace catalog holds a single React.

**Verified before deciding:** Expo's default SDK 57 template pins `react` 19.2.3. `react-native` 0.86.3 peers
`react ^19.2.3`, so 19.3.0 satisfies the range — but its bundled Fabric renderer declares
`reconcilerVersion: "19.2.3"`, and React Native carries no exact-version check (unlike `react-dom`'s check against
`react`), so a mismatch would fail at runtime on a device, not at install or bundle time. `@tanstack/react-query`,
used by the shared contract package, peers `react`.

**Options considered:**
- A) Web aligns with Expo's React.
- B) Mobile uses 19.3.0, against Expo's pin.
- C) A named catalog for mobile's React.

**Reasoning:** A. The minor between 19.2 and 19.3 costs the web nothing, and mobile runs exactly the combination Expo
tested. **B pairs a renderer compiled for 19.2.3 with another React**, a combination nobody tested and this project
cannot verify — the mobile criterion bundles, it does not render. **C puts two Reacts in one workspace** beside a
shared package that peers React; Tailwind could differ per app because each compiles its own CSS, but React is shared
runtime, which is exactly where two versions break.

**What A costs:** the web stays a minor behind even when generated alone, for a type the project may never have, and
every React upgrade waits on Expo.

**The reversal condition:** when Expo pins a newer React, the web follows.

**Affects:** `templates/web`, the workspace catalog

---

## 2026-09-15 — Five documents corrected against the running mobile template

**Decision:** the knowledge base states what building, testing and bundling the mobile template proved.

| Document | Correction |
|---|---|
| `mobile/config.md` | The build check lives in `app.config.ts`; `expo export` reads variables from the environment, not `.env` |
| `mobile/storage.md` | MMKV 4 is `createMMKV` and `remove`; user keys are one list the logout walks |
| `client/data.md` | Mobile's auth client uses `expoClient`; its API transport attaches `auth.getCookie()` with `credentials: 'omit'` |
| `core/testing.md` | RNTL 14 renders asynchronously; `jest-expo` leaves the manifest empty, so tests use a plain Better Auth client; Jest extends `jest-expo`'s transforms for Better Auth's ESM |
| `mobile/components.md` | The app declares `react-native-css-interop`; `@tailwind` is allowed in `global.css` only |

**Reasoning:** each is a fact observed in the running template — the `.env` behaviour by running `expo config` and
`expo export` side by side, the interop declaration by bundling with and without it.

**Affects:** the five documents above

---

## 2026-09-15 — The site template's real page is a static home page, with no API call

**Decision:** `templates/site` ships one static home page with its own metadata, and calls no API. It carries no
`api-contract/` until a page calls the API. **This narrows** the integration-layer decision for `site`: the directory
exists when there is a call, not by default.

**Options considered:**
- A) A static home page, no API call, no `api-contract/`.
- B) A, plus a privacy policy page.
- C) A public, cacheable API route for the site to consume.

**Reasoning:** A. The API has no public data route — everything it serves requires a session — so on day one the site
has nothing to fetch, and inventing something to fetch is what the day-zero test refuses. **C adds a public data
route to every generated API** so the template has something to show: the disposable example refused twice. **B**
ships placeholder legal text the owner must rewrite, close to that same example, and a site can exist with no app in
any store.

**What A costs:** `site/rendering.md`'s rules on server fetching and revalidation get no code, the same gap accepted
for pagination. It is recovered where that one is: phase 7's verified example projects.

**Amended:** `site/structure.md`.

**Affects:** `templates/site`, `site/rendering.md`, phase 7

---

## 2026-09-15 — No client uses the React Compiler; the site starts from an empty Next app

**Decision:** `templates/site` is created with `create-next-app@16.3.5 --ts --app --src-dir --tailwind --biome
--import-alias "@/*" --empty`, without `--react-compiler`, and the `AGENTS.md` it generates by default is removed. The
React Compiler is also **turned off in `templates/mobile`**, where Expo's default template had enabled it.

**How it surfaced:** listing `create-next-app`'s options exposed that `mobile` carried `experiments.reactCompiler: true`
from Expo's template — kept as generator configuration, never decided — while `web`, on Vite, has no compiler. Two
clients of one project behaved differently and nobody had chosen it. Every other flag was settled by an existing
decision; Next 16.3.5 peers `react ^19.0.0`, so the pinned 19.2.3 fits.

**Options considered:**
- A) No React Compiler in any client — off in `site`, turned off in `mobile`.
- B) The React Compiler in every client, including a Vite plugin for `web`.
- C) Each tool's default — on in `mobile`, off in `site` and `web`.

**Reasoning:** A. The compiler is not in the stack; it reached `mobile` by the generator's inertia, which is the kind of
decision the brief forbids taking silently. Off everywhere keeps the three clients alike without adding a build step to
any. **B** adds build machinery to every client, including one that has none today, and a compiler rewriting components
fails in ways that are hard to diagnose. **C** records the inconsistency instead of removing it: an assistant that learns
to drop `useMemo` in mobile carries the habit to web, where nothing compiles it away.

**What A costs:** the automatic memoisation, and a setting that goes against Expo's default. If the compiler is worth
having, it enters by its own decision, in all three clients at once.

**Verified:** with the compiler off, the mobile tests pass and iOS and Android still bundle.

**Affects:** `templates/site`, `templates/mobile`

---

## 2026-09-15 — The site's test guards its metadata

**Decision:** the site template's test imports each indexable page's exported `metadata` and asserts it carries a
`title` and a `description`. No DOM, no mock.

**Options considered:**
- A) No test.
- B) A component test rendering the page and finding its heading.
- C) A test of the page's exported metadata.

**Reasoning:** C. A site exists to be found, and a page without a title or description works in the browser while
disappearing from search — the silent failure that matters here. **A** needs `passWithNoTests`, turns the acceptance
criterion into a formality, and leaves the first test anybody writes to become the pattern. **B** asserts the text of a
static page, which is appearance, not behaviour — the execution-only test `core/testing.md` refuses.

**What C costs:** it guards the declaration, not the rendered HTML; a layout overriding the metadata passes it. That
part belongs to the site's *starts* criterion, which reads the served HTML.

**Affects:** `templates/site`, `core/testing.md`

---

## 2026-09-15 — For `site`, *starts* means a static build served with its metadata

**Decision:** the site template's *starts* criterion is `next build` succeeding with `/` reported as **static**, and
`next start` serving `/` with status 200 and HTML carrying `<title>` and `<meta name="description">`.

**Options considered:**
- A) Build, `/` static, served with 200 and its metadata in the HTML.
- B) Build and served with 200.
- C) Build only.

**Reasoning:** A. It closes the gap the metadata test left — it reads the rendered HTML, not the declaration — and it
catches a route that became dynamic by accident, such as a layout reading `cookies()`. *Static by default* is the core
rule of `site/rendering.md`, and nothing else verifies it. **B** passes a page with no rendered metadata and a route
gone dynamic — the two failures only a site has. **C** proves nothing is served, the *it compiles* already refused.

**What A costs:** it reads `next build`'s output, whose format changes between Next versions; when it does, the
criterion breaks because of the tool rather than the template — loudly.

**Affects:** `templates/site`, phase 7

---

## 2026-09-15 — Next's agent-rules block is turned off, and its advice moves into `.prumo/`

**Decision:** `templates/site` sets `agentRules: false` in `next.config.ts`. `site/rendering.md` gains the advice the
block carried: read the installed version's guide in `node_modules/next/dist/docs/` before writing Next code.

**Verified before deciding, in Next 16.3.5's source:** `next dev`, when `@vercel/detect-agent` reports an AI coding
agent and the managed block is missing, either **appends** its delimited block to an existing `AGENTS.md`, or — when
neither file exists — **creates** `AGENTS.md` and `CLAUDE.md`. It is gated by `agentRules` in `next.config`, default
`true`. The docs directory ships inside the package.

**Options considered:**
- A) Keep the default.
- B) `agentRules: false`, with nothing in its place.
- C) `agentRules: false`, and the advice moved into `site/rendering.md`.

**Reasoning:** C. **A changes the project's `AGENTS.md` on the first `next dev`**, leaving a diff nobody wrote, and in a
workspace creates `AGENTS.md` and `CLAUDE.md` inside `apps/site` — two competing context files, an anti-pattern the brief
names. **B discards true advice** that agrees with this project's own *verify, do not recall*, in a version Next itself
warns has changed. C keeps the advice and the single source.

**What C costs:** the docs path is now a fact Prumo maintains; if Next moves it, the document is wrong until a template
refresh notices.

**Amended:** `site/rendering.md`.

**Affects:** `templates/site`, `site/rendering.md`, `OPEN-QUESTIONS.md` (generated assistant files)

---

## 2026-09-15 — The CLI asks for types first; several types make a workspace

**Decision:** `prumo new` asks which types the project has, as a multiple choice. **Several types produce a
`monorepo` without asking.** With a single type, it asks `alone` or `monorepo`, defaulting to `alone`. `alone` remains
exactly one type. Before generating a workspace the CLI says so.

**Options considered:**
- A) `alone` is one type; the architecture is asked first.
- B) `alone` holds several types as sibling projects in one folder, with no workspace.
- C) Types first; several make a workspace; one asks.

**Reasoning:** C. It never asks a question whose answer is already forced, and keeps a one-app workspace available
for someone who intends to grow — composition already supports it. **B** has no `packages/api-contract` without a
workspace, so the contract would be copied into each client, which the integration-layer and one-template decisions
refused; it is also a third state no document describes. **A** asks, in the common case, what the answers already say.

**What C costs:** the architecture is not always an explicit question, and the flow branches; someone choosing two
types does not see the word *monorepo* before it happens, which is why the CLI announces it.

**Affects:** `bin/`, step 6.1, `docs/structure.md`, `OPEN-QUESTIONS.md`

---

## 2026-09-15 — In V1 the CLI asks whether a project is multi-tenant, and ships the rules, not the wiring

**Decision:** `prumo new` asks whether the project is multi-tenant. A yes includes `.prumo/multi-tenancy/` in the
project. The templates stay single-tenant in V1: the organization plugin, the filter and tenant resolution are wired
by the developer, guided by those documents. Composing the multi-tenant form is the first item after V1, and it must
not be switchable by an environment variable.

**What changed since the question was parked:** the tenancy decision of 2026-09-14 found that a day-zero multi-tenant
project has no tenant-scoped table, and treated wiring over nothing as demonstrating nothing. It is protection rather
than demonstration: the filter declared `default: true`, the parameter read from the session and the closed list of
tenantless routes are what make the first tenant-scoped table isolated from birth.

**Options considered:**
- A) Do not ask in V1; no project receives `multi-tenancy/`.
- B) Ask, and include the context only.
- C) Ask, and ship both context and wiring across `api`, `web` and `mobile`.

**Reasoning:** B for V1. **C is right in the long run** and is the largest single piece left — an organization plugin,
the filter and tenant resolution in the API, tenant switching in both clients, a second verified state for three
templates with tests for both. It would more than double what remains. **A is worse than B in every respect**: a SaaS
project would not even receive the rules. B delivers the cheap part now and does not pretend the wiring exists.

**What B costs:** the most dangerous wiring in a multi-tenant project stays manual in V1 — the gap *fail closed* exists
to prevent — now with its rules beside it rather than absent.

**The constraint recorded for C:** Mobile's Expo plugin could safely be switched by a variable because a wrong value
removes a capability. Tenant isolation cannot: a wrong value removes the isolation.

**Affects:** `bin/`, step 6.1, `docs/structure.md`, `OPEN-QUESTIONS.md`, the post-V1 list

---

## 2026-09-15 — The CLI always writes `AGENTS.md` and `CLAUDE.md`, and no Copilot file

**Decision:** every generated project receives `AGENTS.md`, the pointer into `.prumo/`, and `CLAUDE.md` containing
`@AGENTS.md`. The CLI asks nothing about assistants. It no longer writes `.github/copilot-instructions.md`. **This
amends** the assistant-layer table of 2026-09-09.

**Verified before deciding:** Claude Code's documentation — *"Claude Code reads `CLAUDE.md`, not `AGENTS.md`"* — and
it recommends a `CLAUDE.md` importing `@AGENTS.md`. VS Code's settings reference lists `chat.useAgentsMdFile`, *"Enable
or disable using `AGENTS.md` files as context for chat requests"*, **default `true`**, beside
`github.copilot.chat.codeGeneration.useInstructionFiles`, also default `true`. A first summary of VS Code's
instructions page claimed `AGENTS.md` was off by default; that was an inference from a sentence about a setting, and
the settings reference refuted it.

**Options considered:**
- A) Always `AGENTS.md` and `CLAUDE.md`; drop the Copilot file.
- B) Ask which assistants, writing `CLAUDE.md` only for Claude.
- C) Keep all three.

**Reasoning:** A. **Copilot in VS Code now reads `AGENTS.md` by default**, so its own file became a second source read
alongside the first — two sources of one truth, the failure `CLAUDE.md` §9 names. `CLAUDE.md` stays because Claude Code
does not read `AGENTS.md`, and a one-line file costs less than a question. **B** asks to save one line, and teams change
assistants: a project born without `CLAUDE.md` leaves the first Claude user without context until someone notices.

**What A costs:** a one-line file that does nothing for teams without Claude.

**Amended:** `CLAUDE.md` §7, `_plan/00-ROADMAP.md`.

**Affects:** `bin/`, step 6.1, `OPEN-QUESTIONS.md`

---

## 2026-09-15 — Every question has a flag; a missing answer is asked in a terminal and an error elsewhere

**Decision:** each question `prumo new` asks has a matching flag. In an interactive terminal, what the flags did not
answer is asked. **Outside a terminal — CI, a pipe — a missing answer is an error.** The only defaults applied without
asking are those a decision already fixed, such as `alone` for a single type.

**Options considered:**
- A) Flags only.
- B) Interactive questions only.
- C) Both, with missing answers asked in a terminal and refused elsewhere.

**Reasoning:** C. **A loses the person** who most needs a generator — the one who does not know its flags yet.
**B loses automation**, and phase 7's CI has to generate example projects with nobody typing. C serves both with one
code path, and refusing a missing answer outside a terminal is *fail closed* applied to the CLI itself: an example is
never multi-tenant, or not, by accident.

**What C costs:** two paths per question, both tested, and most likely a prompt library, because a multiple choice on
bare `readline` is poor. That library is its own decision.

**Affects:** `bin/`, step 6.1, phase 7

---

## 2026-09-15 — Interactive questions use `@clack/prompts`

**Decision:** the CLI asks its interactive questions with `@clack/prompts`, pinned to the newest version at least a day
old.

**Verified before deciding, at the registry:** `@clack/prompts` 1.8.1 (2026-09-13), stable since 1.0.0 on 2026-01-28,
four small dependencies, used by `create-vite`, `astro`, `sv` and `nuxi`. `@inquirer/prompts` 8.7.2 (2026-09-07) with
ten sub-packages. `prompts` last published 2021-10-07 and `enquirer` 2023-07-28 — still depended on by
`create-next-app`, `shadcn` and `create-expo-app`.

**Options considered:**
- A) `@clack/prompts`.
- B) `@inquirer/prompts`.
- C) `node:readline`, no library.
- D) `prompts` or `enquirer`.

**Reasoning:** A. It is maintained, small, and what recently written generators chose. **C** turns the multiple choice
into typed text we validate ourselves, and leaves cancellation and terminal restoration to our code — own code in the
first thing a user sees, to save one small dependency. **B** brings ten packages for four questions. **D** is
unmaintained; the generators still using `prompts` show inertia, not a recommendation.

**What A costs:** a second runtime dependency in a CLI that had one.

**Affects:** `bin/`

---

## 2026-09-15 — Templates and the knowledge base ship inside the CLI's npm package

**Decision:** the CLI's build copies into the published package exactly the files `git ls-files` lists under
`templates/` and `.prumo-templates/`. Nothing is downloaded at generation time. The `~/.prumo/` cache directory leaves
the naming table.

**Measured before deciding:** 209 committed files, 1.8 MB, of which 960 KB are the mobile template's icons. The
`~/.prumo/` cache came from the frozen era's naming decision and was never decided in this one.

**Options considered:**
- A) Everything inside the npm package, copied from the committed file list.
- B) The CLI downloads templates from a GitHub tag into `~/.prumo/`.
- C) Inside the package, plus a `--templates <path>` flag.

**Reasoning:** A. **The CLI's version is the templates' version**, so `pnpm dlx prumo@1.2.0` always generates the same
project — the reproducibility the committed-skeleton decision rests on. Copying from `git ls-files` also settles, by
construction, the debt that composition reads the working tree with its local `node_modules` and `.env`. **B** lets CLI
and template versions diverge and adds cache invalidation, an offline failure, and code fetched from somewhere other than
the package the person installed. **C** adds a public flag only Prumo's developers use; phase 7's CI runs inside this
repository, where the CLI finds the templates by relative path.

**What A costs:** fixing a template means publishing a new CLI version.

**Amended:** `CLAUDE.md` §0.

**Affects:** `bin/` (build), phase 6, phase 7

---

## 2026-09-15 — The project's answers are stored as `.prumo/config.json`

**Decision:** the CLI records a project's answers — types, architecture, multi-tenancy — in `.prumo/config.json`.

**Options considered:**
- A) `config.json`.
- B) `config.yaml`.
- C) `key=value`.

**Reasoning:** A. The open question existed because the format depended on the CLI's language, and that is settled:
JSON is native to a TypeScript CLI and needs no dependency. `docs/structure.md` already makes the file the tool's,
never hand-edited, so JSON's lack of comments costs nothing. **B** adds a dependency to read and write a file nobody
edits, with YAML's implicit typing traps. **C** was attractive only for a shell CLI, needs its own parsing, and a list
of types does not fit it.

**What A costs:** if the file ever has to be edited by hand, JSON explains a value worse than YAML would.

**Amended:** `docs/structure.md`.

**Affects:** `bin/`, `OPEN-QUESTIONS.md`

---

## 2026-09-15 — The CLI gives each mobile app its own identity, with the scheme written in one place

**Decision:** the CLI rewrites `name`, `slug` and `scheme` in the mobile app's `app.json` from the project's name, and
writes the same scheme into the API's `MOBILE_APP_SCHEME` when both types are present. The auth client no longer passes
a scheme, so `app.json` is the only place it is written. **This amends** the real-name decision: the rewrite surface is
`package.json`, `README.md` and, for mobile, `app.json` — still no source code.

**Verified before deciding, in `@better-auth/expo` 1.7.4's client:** with no `scheme` option it resolves
`Constants.expoConfig?.scheme`, the `app.json` value. The server plugin read for the Expo decision appends the session
cookie to deep-link redirects after OAuth, magic links and email verification. Removing the option kept the mobile tests
passing and iOS and Android bundling.

**Options considered:**
- A) Rewrite the identity from the project name, with the scheme in one place.
- B) Keep `mobile` and `app` fixed; the README says to change them before publishing.
- C) Ask for the identity as its own question.

**Reasoning:** A. **A generic scheme is a security defect, not a cosmetic one.** Two installed apps registering `app://`
leave the operating system to choose which opens a link, and the link after sign-in carries the session cookie — so
another app with the same scheme can receive it. **B ships that defect as the default**, silent until someone reads a
README. **C** asks what the project name already answers, of people who may not know what a bundle identifier is.

**What A costs:** a third file in the rewrite surface, and a small conversion in the CLI from a project name to a valid
scheme — lowercase, no spaces.

**Amended:** the real-name decision; `templates/mobile/src/features/auth/auth-client.ts`.

**Affects:** `bin/`, step 6.1, `templates/mobile`, `OPEN-QUESTIONS.md`

---

## 2026-09-15 — Expo's assistant files return only when the template is regenerated

**Finding, not a choice:** the question of what stops Expo's generated `AGENTS.md`, `CLAUDE.md` and
`.claude/settings.json` from returning is closed without a decision. No package Expo runs — its CLI, router or Metro
runtime — references either file; they ship in `expo-template-default` (57.0.24) and appear only when `create-expo-app`
generates a project. Unlike Next, whose `next dev` rewrites them, nothing in daily use brings them back.

**What follows:** an instruction for whoever refreshes the mobile template, recorded in the roadmap under *Owed to any
template refresh*.

**Affects:** `OPEN-QUESTIONS.md`, `_plan/00-ROADMAP.md`

---

## 2026-09-15 — V1 ships one command, `prumo new`

**Decision:** the V1 CLI has `prumo new` and nothing else. `prumo update` and `prumo add` are recorded as open
questions after V1, each with the problem that makes it hard.

**Options considered:**
- A) `prumo new` only.
- B) `new` and `update`.
- C) `new` and `add`.

**Reasoning:** A. Each other command carries a genuinely hard problem, and neither is needed to generate a correct
project. **`update`** has to reconcile knowledge-base changes with prose the team edited — a three-way merge over
markdown — where overwriting destroys work and not overwriting leaves stale rules. **`add`**, under the type-first
decision, turns an `alone` project into a workspace by restructuring code the team already wrote. V1 does one thing, end
to end verified by phase 7.

**What A costs:** a project generated with V1 does not receive knowledge-base corrections automatically — this session
alone corrected more than twenty documents — and growing from `alone` to a workspace is manual.

**Amended:** `docs/structure.md`, which described both commands as existing.

**Affects:** `bin/`, phase 6, `OPEN-QUESTIONS.md`

---

## 2026-09-15 — Examples are generated inside CI, never committed

**Decision:** phase 7 generates projects with `prumo new` inside CI and applies each template's acceptance criterion to
them. No generated project is committed to this repository. **This amends** the roadmap's *generated projects,
committed and verified*.

**Options considered:**
- A) Generated projects committed under `examples/`, with CI failing on a diff against a fresh generation.
- B) Generated only inside CI, and discarded.

**Reasoning:** B. **A is the duplicate the whole of phases 5 and 6 was built to avoid** — every combination a full copy
of the templates, mobile icons included, with every template change producing a diff in each copy. It replaces
*prevented by construction* with *watched by a check*. The CLI decision already promised the verification happens by
generating, and B tests what a user actually runs rather than a copy of what it would produce.

**What B costs:** seeing a generated project means running the CLI, and in review a change to the output shows up as
CI green or red rather than as a diff.

**Amended:** `_plan/00-ROADMAP.md` (step 7.1).

**Affects:** phase 7

---

## 2026-09-15 — CI verifies the contract against the running API; two demonstration debts stay open

**Decision:** phase 7's CI generates a workspace, starts the API, signs a user up and calls `/users/me` **through the
real client in `packages/api-contract`**, asserting the hand-written contract matches what the API returns. The
pagination example and the server-fetch-with-revalidation example are **not** written; they are recorded as known gaps.

**Options considered:**
- A) A committed demonstration project carrying all three.
- B) CI verifies the contract; the two demonstration debts stay recorded gaps.
- C) A separate demonstration repository after V1.

**Reasoning:** B. The three debts differ in kind. The contract one is a **verification** and is buildable from what
exists — it closes the only one of the three that fails silently: a field renamed on the server while each client keeps
compiling against its own copy. The other two require features the templates deliberately refused — a route listing
every user, and public data — so demonstrating them means writing code no generated project receives. **A rebuilds the
duplicate the previous decision just refused**, with a whole application to maintain on top of a copy of the templates.
**C postpones with no date, in a repository that ages faster because this CI never runs it.**

**What B costs:** `api/pagination.md` and the data half of `site/rendering.md` keep no code an assistant can imitate —
the failure `core/conventions.md` names. It is recorded as a known gap rather than called resolved.

**Affects:** phase 7, `api/pagination.md`, `site/rendering.md`

---

## 2026-09-15 — CI verifies five generated projects

**Decision:** CI generates and verifies five projects: each of the four types `alone`, and one workspace holding all
four. Other combinations are not generated in CI.

**Options considered:**
- A) Four alone projects and one full workspace.
- B) A, plus an `api` + `web` workspace and a multi-tenant `alone` API.
- C) The whole matrix.

**Reasoning:** A. It is the smallest set that exercises **every path that runs** — install, build, start, bundle — and
what it leaves out is what the CLI's own tests already cover, because those combinations differ in generated files
rather than in execution: multi-tenancy currently changes only which `.prumo/` areas are copied, and contract
extraction with a single client has a composition test. **C** costs dozens of installs per run, and a slow CI is one
somebody switches off — the same reasoning that kept Turborepo out for now.

**What A costs:** no workspace of two types and no multi-tenant project is installed in CI. If a bug ever escapes
through an uncovered combination, B enters with a measured reason rather than as precaution.

**Affects:** phase 7

---

## 2026-09-15 — CI has two jobs, and a weekly run

**Decision:** one GitHub Actions workflow with two jobs. **The repository job** runs the CLI's lint, typecheck and
tests, which include the composition tests. **The generated job** generates the five projects and applies each
template's acceptance criterion, the workspace's, and the contract check against the running API. It runs on push and
pull request to `main`, **and on a weekly schedule**.

**Options considered, for the jobs:**
- A) Two jobs: the repository, and the generated projects.
- B) A, plus a job running each template's checks in place.

**Options considered, for the trigger:**
- C) Push and pull request only.
- D) Push and pull request, plus a weekly scheduled run.

**Reasoning:** A with D. Generated projects are copies of the templates with names rewritten, so verifying both in place
and generated is nearly the same run twice; the templates are verified **through what the CLI produces**, which is what
a user receives. The weekly run is what makes an earlier promise true: versions are pinned exactly with no lockfile, so
transitive dependencies float, and **a scheduled run is how a rotted transitive turns CI red on its own** instead of
blaming whoever pushed next.

**What this costs:** a failure that exists in a template surfaces one step away, in the generated project rather than in
the original file. And the weekly run spends CI time with nothing changed, raising an alarm that needs someone watching.

**Affects:** phase 7, the dependency-pinning decision's stated cost

---

## 2026-09-15 — The interactive flow is tested through an injected asker, and confirmed once by a person

**Decision:** `resolveAnswers` takes the thing that asks, so tests script the answers and assert the order, what a flag
already settled, and the branch where several types decide the architecture. `@clack/prompts` lives behind that
interface in `terminalAsker`. **The library itself is confirmed by one manual run**, recorded when it happens.

**Options considered:**
- A) Do not verify; record it as unverified.
- B) A pseudo-terminal test driving keystrokes in CI.
- C) Invert the dependency and script the answers.
- D) C, plus one manual confirmation.

**Reasoning:** D. **A leaves the path every new user walks as the only unverified one.** **B** is notoriously brittle —
a layout change in the library breaks the test with nothing wrong — and brings a dependency for that alone. **C alone
leaves the library unproven**: a wrong option passed to `@clack/prompts` keeps the tests green. A single human look
closes exactly that gap.

**What D costs:** the manual check covers the version somebody looked at, and nothing after it.

**Verified by sabotage:** asking the architecture despite `--alone`, and asking for a name the flag had given, each fail
a test.

**Affects:** `bin/`

---

## 2026-09-15 — The package is published only when V1 is ready

**Decision:** `prumo` is published to npm when V1 is complete — after phase 7 and the repository reorganisation — and
never without an explicit instruction, because publishing is an outward-facing act.

**Verified:** the name `prumo` is unregistered on npm today.

**Options considered:**
- A) Publish a `0.0.x` now to hold the name.
- B) Publish when V1 is ready.
- C) Publish at V1; until then install from the repository.

**Reasoning:** B. **A puts an unverified CLI in a public registry** — one phase 7 has not run and the reorganisation has
not touched — and gives the project users before it has a first version. **C** does not help while the repository is
private, and packing already exercised the package locally.

**What B costs, stated rather than assumed away:** somebody else may register the short name in the meantime. It is
unlikely and irreversible, and the risk cannot be measured from here. If that mattered more than shipping something
incomplete, A would be the answer.

**Affects:** V1 release, `bin/package.json`

---

## 2026-09-15: The CLI lives in `cli/`, and the package root stays a subfolder

**Decision:** the folder holding the CLI is renamed `bin/` → `cli/`. It remains the root of the published npm
package, which continues to be assembled by a build step that stages `templates/` and the knowledge base from
`git ls-files`.

**Options considered:**
- A) Keep `bin/`.
- B) Rename to `cli/`.
- C) Make the repository root the package, so nothing is copied and the root `README.md` becomes the npm page.

**Reasoning:** B. **C was the clean shape until it was tested.** `npm pack` packs the working tree, not the index:
a scratch package proved that a `templates/api/.env` sitting in a working copy is packed and published, while
`node_modules/` is excluded. The staging step is therefore not ceremony. It is what keeps an uncommitted secret
out of the registry, and a package root that is a subfolder is the shape that keeps it. **A** left the folder
named after executables while holding source.

**Verified at the tool, not recalled:** npm 11.17.0 also **drops `.gitignore` and `.npmrc`** from a tarball even
when nested inside a directory listed in `files`. The five templates each ship a `.gitignore`. That is a publishing
defect, recorded in `OPEN-QUESTIONS.md`, not closed here.

**What B costs:** every dated entry above that names `bin/` now names a folder that no longer exists. They are
history and stay as written; only live references were updated.

**Found while verifying the rename:** `pnpm test` in the package scanned `cli/templates/`, the build's own output,
and failed eight files. CI never saw it because CI never builds before testing. The test script now scans `--dir src`.

**Affects:** `cli/`, `.github/workflows/ci.yml`, `CLAUDE.md` §1 and §8

---

## 2026-09-15: One `README.md`, at the root, copied into the package by the build

**Decision:** the repository has a single `README.md` at its root. The build copies it into `cli/`, so GitHub and
npm show the same page. It says what Prumo is, how to run it, what it generates, and what lands in a generated
project. Roadmap and contribution notes stay out of it, because they would appear on the npm page; they live in
`docs/`.

**Options considered:**
- A) A root `README.md` only, leaving the npm page empty.
- B) One at the root and one in `cli/`, each written for its audience.
- C) One at the root, copied into the package at build time.

**Reasoning:** C. **B is two sources of one truth, and the divergence is invisible** because nobody reads both.
A leaves the published package looking abandoned. C costs three lines in `scripts/copy-assets.mjs`, next to the
copies that already happen.

**What C costs:** the text has to serve a GitHub visitor and an npm visitor at once, which rules out anything
addressed only to a contributor.

**Verified, not assumed:** every instruction in it was executed. `pnpm install --dir cli` works from a clean
checkout, and generating with `--types api,web --single-tenant` produced a workspace whose `.prumo/` held exactly
`api`, `client`, `core`, `database`, `monorepo` and `web`, with `git init` run and no commit made.

**Affects:** `README.md`, `cli/scripts/copy-assets.mjs`, `cli/.gitignore`

---

## 2026-09-15: No em dashes in anything that leaves this repository

**Decision:** the em dash is not used. The rule applies to every file that ships or governs a session: the
knowledge base, the `INDEX.md` line the CLI writes, `CLAUDE.md`, the live documents in `docs/`,
`OPEN-QUESTIONS.md` and `README.md`. `DECISIONS.md` keeps the ones it already carries, because it is a
record of what was written on the day it was written.

**Options considered:**
- A) Apply the rule only to new text.
- B) Sweep all 2,171 occurrences, the record included.
- C) Sweep the 272 in what ships and what governs sessions, leaving the record alone.

**Reasoning:** C. Under **A** the rule would not hold in the one place it reaches a user, since 215 of the
occurrences sit in documents copied into every generated project. **B** edits a decision log for style, and
no mechanical substitution is right: each em dash wants a comma, a colon, a semicolon, a period or a pair of
parentheses depending on the sentence.

**What C costs:** two punctuation styles inside one repository, split along a line a reader has to be told
about rather than one they can see.

**Verified, not asserted:** a script reduced every touched file to its lowercase word sequence and compared it
against the committed version. All 33 knowledge documents and `cli/src/context.ts` came back word for word
identical, so only punctuation moved. The five files where words did change are the ones where a causal em
dash became `because`, `since` or `which is`, each reviewed by hand. `prumo new` was then run, and the
generated `.prumo/INDEX.md` lists every document with the new separator.

**Affects:** `.prumo-templates/` (33 files), `cli/src/context.ts`, `CLAUDE.md`, `docs/` (4 live documents),
`OPEN-QUESTIONS.md`

---

## 2026-09-15: The planning material leaves the repository

**Decision:** `_plan/`, `_sources/` and `docs/decisions-v0-hexagonal-fastify.md` are removed. What survives them
was moved first: the template maintenance debts to `docs/maintaining-templates.md`, and every dated decision they
recorded is already in `DECISIONS.md`. The frozen era was then reachable at the `v0-hexagonal-fastify` tag; when
the history was discarded the next day, it moved to the archive bundle, which holds its code as well as its log.

**Reasoning:** each existed to control the work, not to describe the result. `_plan/` held a roadmap whose own
first line said to delete it when V1 ships, nine scoping notes superseded by the 33 documents they produced, and
a log duplicating dates `DECISIONS.md` already carries. `_sources/` held the Portuguese input that produced the
v0 decisions, superseded twice since. The archive held 4,851 lines explicitly in force nowhere.

**What it costs:** a reader who wants to know why the project once chose Fastify has to check out a tag rather
than open a file, and the sequence in which the phases happened is now only readable as dates in this file.

**Consequences handled in the same change:** `CLAUDE.md` lost the `_sources/` language exemption, the roadmap row
in §9, and the phase numbers in §5, §8 and §12, since none of them had a document to point at any more.
`docs/README.md` lost the archive row, and the pointer at the top of this file now names the tag.

**Verified:** `prumo new` with `--types api,mobile --multi-tenant` still writes seven areas and a 30 line index,
and the CLI's suite passes, because the knowledge base was never read from any of the removed paths.

**Affects:** `_plan/`, `_sources/`, `docs/`, `CLAUDE.md`, `DECISIONS.md`

---

## 2026-09-16: The knowledge base is `.prumo-templates/` in both places

**Decision:** the folder keeps the name `.prumo-templates/` inside the published package too. The build copies it
without renaming, and `cli/package.json` ships it under that name.

**Options considered:**
- A) Keep `.prumo-templates/` here and `knowledge/` in the package.
- B) Rename it to `knowledge/` in both.
- C) Use `.prumo-templates/` in both.

**Reasoning:** C. A had one folder under two names, which cost a translation table in the build and a two path
probe in the CLI. The recommendation started as B and changed during the conversation: asked to choose, the user
read the rename as abandoning `.prumo/` itself. That reaction is the evidence. The name is carrying the fact that
this folder becomes `.prumo/` in a generated project, so removing it would have cost meaning to save three lines.

**Verified at the tool:** npm 11.17.0 packs a dot prefixed directory at the package root when `files` names it,
proved with a scratch package before choosing. Then end to end: `npm pack`, installed into an empty project, and
`prumo new --types web` from the installed binary wrote `.prumo/` with `core`, `client` and `web`.

**What C costs:** the folder is hidden from a plain `ls` inside `node_modules/prumo`, where someone inspecting an
installed package would look for it.

**Affects:** `cli/scripts/copy-assets.mjs`, `cli/src/cli.ts`, `cli/package.json`, `cli/.gitignore`

---

## 2026-09-16: The repository root carries no manifest

**Decision:** there is no `package.json` at the root. Everything is run from `cli/`, which is where the only
runnable code lives, and the `README.md` names the two commands that need it.

**Options considered:**
- A) No manifest at the root.
- B) A private root manifest whose scripts forward to `cli/`.
- C) A pnpm workspace holding `cli/`.

**Reasoning:** A. **B is a duplicate in the shape of a script.** It forwards commands, and it starts lying the
day a script is added in `cli/` and not mirrored. **C** would make the five templates candidate workspace
members, since each carries a `package.json`, and they are code to copy rather than code to run here, so it
would need explicit exclusions to stand still.

**What A costs:** someone cloning has to read the README or notice `cli/`, because `pnpm install` at the root
does nothing.

**Affects:** the repository root

---

## 2026-09-16: R1 is complete, and the repository is in its V1 shape

**Decision:** the reorganisation owed before V1 is finished. The repository now holds `README.md`, `CLAUDE.md`,
`DECISIONS.md`, `OPEN-QUESTIONS.md`, `docs/` with four live documents, `.prumo-templates/` with the nine areas,
`templates/` with the five skeletons, `cli/`, and `.github/`.

**What changed in R1:** `bin/` became `cli/`; the repository gained a `README.md` that is also the package page;
the em dash left everything that ships; `_plan/`, `_sources/` and the frozen era's log were removed after their
live remainder moved to `docs/maintaining-templates.md`; the knowledge base took one name in both places; and
the root stayed without a manifest.

**Found while doing it, and not by reading:** `pnpm test` in the CLI scanned the build's own output, and npm
strips a template's `.gitignore` from the published tarball. The first is fixed. The second is reproduced and
open, and it blocks publishing rather than V1.

**Affects:** the whole repository

---

## 2026-09-16: A template's `.gitignore` ships undotted and is restored on copy

**Decision:** the build stages each template's `.gitignore` into the package as `gitignore`, and `copyTemplate`
restores the dot when it writes a project. Two guards come with it: the build refuses to finish if any name npm
deletes survives in the staged package, and CI packs, installs and generates from the installed binary, asserting
the files arrived.

**Why it existed:** npm deletes `.gitignore` and `.npmrc` from a tarball wherever they sit, including inside a
directory named in `files`. Reproduced with the real package before fixing: `prumo new --types web` from an
installed `prumo` wrote a project with no `.gitignore` at all, so a first `git add -A` would commit
`node_modules`, `dist` and `.env`.

**Options considered:**
- A) Rename when packing, rename back when copying.
- B) The CLI writes the file from a constant it holds.
- C) Document the limitation and leave the developer to write their own.

**Reasoning:** A is what the ecosystem settled on for this exact defect. **B puts the same content in two places**,
the template's file and the CLI's constant, and nothing would report them diverging. **C** is a silent failure on
day zero, which is the class of defect this project exists to remove.

**What A costs:** the file has one name in this repository and another inside the package, so anyone reading the
tarball sees `gitignore` and has to know why.

**Verified by sabotage, both ways:** removing the restore makes exactly one test fail, and emptying the rename
table makes the build stop with `templates/api/.gitignore would be dropped by npm`. Then end to end: packed,
installed into an empty project, generated, and the workspace root plus both apps carry `.gitignore`, with no
undotted file left behind.

**Found while composing:** `templates/workspace` was copied raw rather than through `copyTemplate`, so it took
neither the exclusion filter nor this rename. It now goes through the same path as every other template.

**Affects:** `cli/scripts/copy-assets.mjs`, `cli/src/compose.ts`, `cli/src/compose.spec.ts`,
`.github/workflows/ci.yml`, `OPEN-QUESTIONS.md`

---

## 2026-09-16: The decision log and the open questions move into `docs/`

**Decision:** `DECISIONS.md` and `OPEN-QUESTIONS.md` move to `docs/`, and stay public and versioned. The root
keeps `README.md`, `CLAUDE.md` and `.gitignore`.

**Options considered:**
- A) Leave both at the root.
- B) Move both into `docs/`, still tracked and public.
- C) Untrack them and keep them only on one machine.
- D) Move them to a private repository of their own.

**Reasoning:** B. The question raised was whether documenting the process in public is strange. It is not:
decision records are an established practice, and here they are the product itself. `README.md` claims each
choice was made once, written with its reasoning and its cost; this file is the evidence for that claim, and the
sixteen dropped entries answer the *why not X* that anyone evaluating a scaffolder asks first. What was fair in
the discomfort is the placement, not the publishing: 8,380 lines of process at the front door read as the main
document rather than as reference behind the vitrine.

**C was refused** because it would leave the project's memory as an untracked file on one machine, with no backup
and nothing for a second clone, while `CLAUDE.md` §12 requires reading it at the start of every session. **D**
keeps the versioning but splits the project across two repositories that must be kept in step.

**Checked before publishing rather than assumed:** the two files hold no email address, no credential and no
personal name. Neither ships to npm: `cli/package.json` lists only `dist`, `templates` and `.prumo-templates`.

**Affects:** `docs/`, `README.md`, `CLAUDE.md` §3, §8, §9, §11 and §12, `docs/README.md`, `docs/stack.md`,
`docs/structure.md`, `docs/document-template.md`

---

## 2026-09-16: The history is discarded, and archived before it is

**Decision:** the repository restarts from a single commit. The 191 commits and the `v0-hexagonal-fastify` tag
are removed from the public repository, after a `git bundle` of every ref was written outside it and proved by
restoring from it.

**Options considered:**
- A) Keep the history.
- B) Restart from one commit, discarding the rest.
- C) Archive first, then restart.
- D) Delete only the tag.

**Reasoning:** C. B and C leave the same public repository; the difference is a 2.6 MB file kept elsewhere, and
that file is the only remaining copy of an entire era of the project. The hexagonal and Fastify repository,
including the 4,851 line decision log removed on 2026-09-15, exists nowhere else: that removal was justified
by the tag, and this change is what takes the tag away.

**Verified before cutting, not after:** cloning from the bundle restored 191 commits, the tag, the v0 tree with
its `.context-templates`, `examples` and `bin`, and the state of this repository before the move into `docs/`.

**What C costs, stated plainly:** the trail showing what was proved at each step is gone from git. The reasoning
survives in this file, the chronology does not. And a force push does not erase anything on GitHub with certainty:
unreachable objects stay retrievable by SHA for a while, and forks or caches may keep copies. Only deleting and
recreating the repository would be an actual erasure.

**Affects:** the repository's history, the `v0-hexagonal-fastify` tag, the pointer at the top of this file,
`docs/README.md`, and the 2026-09-15 entry that promised the tag
