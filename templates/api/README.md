# api

## Requirements

Node 22.17 or later, pnpm, and Docker.

## Running it

```sh
pnpm install
cp .env.example .env        # then replace BETTER_AUTH_SECRET with 32 or more random characters
docker compose up -d --wait
pnpm db:migrate
pnpm dev
```

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
| `pnpm db:migration:create` | Generates a migration from the entity diff, to be read and edited before committing |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
