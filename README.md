# scrape-kit

Scrape a URL → structured markdown on GitHub Pages → log the run in Airtable.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for product path, contracts, and roadmap.

## Production path (use this)

| Piece | Role |
|---|---|
| `deno-scrape/` | Deno Deploy: Firecrawl → Groq layout → `docs/scrapes/<slug>/page.md` |
| `docs/` | GitHub Pages site + scrape UI |
| Airtable `runs` | One row per scrape (via Composio) |

Site: https://grandzam1.github.io/scrape-kit/

Paste a URL on the home page. The browser opens a websocket to the Deno runner, shows each step, then links the live page.

### Deno Deploy env

Required for a full run:

- `FIRECRAWL_API_KEY`
- `GROQ_API_KEY` (without it the page is **degraded** / `layoutSource: raw`)
- `GITHUB_TOKEN` (`contents:write` on this repo)
- `GITHUB_REPO=grandzam1/scrape-kit`
- `SCRAPE_SECRET` (for `POST /scrape`)
- `COMPOSIO_API_KEY` + `COMPOSIO_USER_ID`
- `COMPOSIO_AIRTABLE_ACCOUNT_ID` (connected Airtable account — **required** for the runs log)

Optional:

- `GROQ_MODEL` (default `openai/gpt-oss-20b`)
- `GROQ_CHUNK_CHARS` (default `4500`)
- `GROQ_TPM_BUDGET` (default `6500`)
- `GROQ_MAX_CHUNKS` (default `2`)
- `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE` (default table `runs`)
- `GITHUB_BRANCH` / `PAGES_BASE`

Create one empty Airtable base named **scrape-kit** (API cannot create the first workspace/base). The runner creates/patches the `runs` table.

```bash
curl -X POST "https://zamplandoc-scrape.grandzam1.deno.net/scrape" \
  -H "Content-Type: application/json" \
  -H "x-scrape-secret: YOUR_SECRET" \
  -d "{\"url\":\"https://example.com\"}"
```

Contracts: `schemas/run.schema.json`, `schemas/page.schema.json`.

### Pages / UI

Shell and PWA patterns follow [portal-mobile-kit](https://github.com/grandzam1/portal-mobile-kit). Scrapes live under `docs/scrapes/`.

## Lab / legacy (local Node CLI)

YAML jobs under `src/` + `jobs/` scrape via Composio into local `output/`. They do **not** publish to Pages. Prefer the Deno path for product work.

```bash
npm install
cp .env.example .env
npm run scrape -- --job jobs/example-generic.yaml
```

| Mode | Path | Groq |
|------|------|------|
| `full` | scrape → clean → optional images → `.md` | no |
| `extract` | scrape → extract → validate → `.md` | yes (Composio) |
