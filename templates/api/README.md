# api

## Requirements

Node 22.17 or later, pnpm, and PostgreSQL 18: one already on this machine, or Docker to run the one in
`docker-compose.yml`. The tests need Docker either way.

## Running it

```sh
pnpm install
pnpm dev
```

`.env` comes with the generated project, copied from `.env.example` with a random `BETTER_AUTH_SECRET`. It is not
committed, so on a fresh clone run `cp .env.example .env` and replace the secret with 32 or more random characters.

`DATABASE_URL` starts as `MISSING`. While it is, `pnpm dev` offers to create the database first: it asks for a name,
uses a Postgres answering on `localhost:5432` (asking for a user and password if the current one is refused), and
otherwise starts the Docker one. It then writes the URL into `.env` and migrates. `pnpm db:setup` does the same at any
time. Without a terminal every answer comes from a flag: `--name`, `--local` or `--docker`, `--user`, `--password`,
`--skip-migrate`, and `--json` for one JSON result on stdout.

The API listens on `http://localhost:3000`. Outside production, its documentation is at `/api/docs`.

`pnpm db:migrate` builds first, then runs Better Auth's migrations and then the application's. Before
migrating, Better Auth logs `Database schema mismatch` because its tables do not exist yet; the migration
still completes.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm test` | Runs the suite against a throwaway Postgres; Docker must be running |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc --noEmit`, also run before every push |
| `pnpm db:setup` | Creates a development database, writes its URL into `.env`, and migrates |
| `pnpm db:migrate` | Builds, then runs Better Auth's migrations and the application's |
| `pnpm db:migration:create` | Generates a migration from the entity diff, to be read and edited before committing |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
