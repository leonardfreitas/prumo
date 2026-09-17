# web

## Requirements

Node 22.17 or later, pnpm, and the API running.

## Running it

```sh
pnpm install
pnpm dev
```

`.env` comes with the generated project, copied from `.env.example`; `VITE_API_URL` points at the API. It is not
committed, so on a fresh clone run `cp .env.example .env`.

The app runs on `http://localhost:5173`, which is the origin the API trusts by default (`WEB_ORIGIN`).

Open it and you are sent to sign in, because everything but the sign-in and sign-up pages needs a session. Follow
**Sign up** to create an account; you land on your profile, which you can edit. The API must be running and
migrated first, or the session check has nothing to answer it.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm test` | Renders components against a fake transport; no API needed |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc --noEmit`, also run before every push |
| `pnpm build` | Production build into `dist/`; `pnpm preview` serves it |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
