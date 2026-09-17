# site

## Requirements

Node 22.17 or later, and pnpm. The build downloads its font from Google Fonts, so it needs network access.

## Running it

```sh
pnpm install
pnpm dev
```

The site runs on `http://localhost:3200`, leaving 3000 to the API. It calls no API yet; when a page needs data, it fetches it on the server.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm test` | Checks that each indexable page exports a title and a description |
| `pnpm lint` | Biome |
| `pnpm typecheck` | Generates Next's route types, then `tsc --noEmit`; also run before every push |
| `pnpm build` · `pnpm start` | Production build, then serves it |

## Conventions

The rules this project follows live in `.prumo/`, and `AGENTS.md` points to them. Read those before
changing how something is done.
