# workspace

## Requirements

Node 22.17 or later, pnpm, and Docker for the API.

## Layout

| Directory | What it is |
|---|---|
| `apps/` | Deployable applications, one per type. Each has its own README with the commands to run it |
| `packages/api-contract` | The wire contract between the clients and the API, shipped as TypeScript source |

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm install` | Installs every app and package |
| `pnpm --filter <app> dev` | Starts one app. There is no root `dev` on purpose |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Runs across every app and package |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
