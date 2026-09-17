# mobile

## Requirements

Node 22.17 or later, pnpm, and the API running with `MOBILE_APP_SCHEME=app`. A simulator or a device with Expo Go
to open the app.

## Running it

```sh
pnpm install
pnpm dev
```

`.env` comes with the generated project, copied from `.env.example`; `EXPO_PUBLIC_API_URL` points at the API. It is
not committed, so on a fresh clone run `cp .env.example .env`.

On an Android emulator `localhost` is the emulator itself; point `EXPO_PUBLIC_API_URL` at your machine's address.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm test` | Jest with `jest-expo`, rendering components against a fake transport; no API needed |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc --noEmit`, also run before every push |
| `pnpm bundle` | Produces the iOS and Android bundles. It reads `EXPO_PUBLIC_API_URL` from the environment, not from `.env`, and fails without it |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
