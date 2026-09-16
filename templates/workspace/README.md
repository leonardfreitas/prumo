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
| `pnpm dev` | Starts every app at once, their output prefixed by app. Mobile runs without its QR code there; use `pnpm mobile` for that |
| `pnpm api` · `pnpm web` · `pnpm mobile` · `pnpm site` | Starts one app; the workspace has a script for each app it holds |
| `pnpm lint` · `pnpm typecheck` · `pnpm test` | Runs across every app and package |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
