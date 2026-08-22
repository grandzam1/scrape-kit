# scrape-kit

Standalone scrape pipeline: YAML jobs, Composio/Firecrawl, optional Deno HTTP runner, GitHub Pages.

This repo is **only** the scraper. The original `zamplandoc` workspace is unchanged.

## What you get

| Piece | Role |
|---|---|
| `src/` + `jobs/` | Local CLI (`node src/cli.js --job jobs/….yaml`) |
| `deno-scrape/` | Cloud HTTP: scrape → commit `docs/scrapes/<slug>/page.md` |
| `docs/` | GitHub Pages site for those markdown files |

## Setup (local CLI)

1. Connect **Firecrawl** in [Composio](https://app.composio.dev) (API key stays there).
2. Groq is optional (`mode: extract` only).

```bash
npm install
cp .env.example .env
```

Set at least `COMPOSIO_API_KEY` and `COMPOSIO_USER_ID`.

```bash
npm run scrape -- --job jobs/example-generic.yaml
```

## Deno runner (no local Node)

Deploy `deno-scrape/main.ts` to Deno Deploy. Env vars:

- `FIRECRAWL_API_KEY` or Composio scrape (CLI path uses Composio)
- `GITHUB_TOKEN` with `contents:write` on this repo
- `GITHUB_REPO=grandzam1/scrape-kit`
- `SCRAPE_SECRET`

```bash
curl -X POST "https://<your-app>.<org>.deno.net/scrape" \
  -H "Content-Type: application/json" \
  -H "x-scrape-secret: YOUR_SECRET" \
  -d "{\"url\":\"https://example.com\",\"slug\":\"example\"}"
```

That commit triggers Pages.

## GitHub Pages

Site: https://grandzam1.github.io/scrape-kit/

Paste a URL on the home page. The browser opens a websocket to the Deno runner (`/ws`), shows each step, then links the live Pages URL.

Shell, tokens, and PWA come from [portal-mobile-kit](https://github.com/grandzam1/portal-mobile-kit):

- `docs/assets/portal-shell.css` — safe areas, tab clearance, focused header
- `docs/config/theme.json` — color / type tokens
- `docs/manifest.webmanifest` + `docs/icons/` — installable PWA
- Home uses the **tab** shell; scrape articles use the **focused** shell (back + centered title, no tab bar)

New files under `docs/scrapes/` render as articles.

## Modes

| Mode | Path | Groq |
|------|------|------|
| `full` | scrape → clean → optional images → `.md` | no |
| `extract` | scrape → extract → validate → `.md` | yes (Composio) |
