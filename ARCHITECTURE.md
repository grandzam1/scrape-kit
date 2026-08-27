# scrape-kit architecture

## Product path (source of truth)

**Production:** browser / `POST /scrape` → Deno runner → Firecrawl → Groq layout → GitHub `docs/scrapes/<slug>/page.md` → Pages → Airtable `runs` log.

**Lab / legacy:** Node CLI (`src/` + `jobs/`) writes local `output/` only. It does **not** publish to Pages and does **not** share the Deno Groq layout contract. Prefer extending Deno unless you explicitly need batch YAML offline.

## Contracts

| Contract | File | Notes |
|----------|------|--------|
| Job YAML (CLI only) | `schemas/job.schema.json` | Local Node path |
| Run log row | `schemas/run.schema.json` | Airtable `runs` + API payloads |
| Published page front matter | `schemas/page.schema.json` | `docs/scrapes/.../page.md` |

### Run status

`queued` → `ok` | `degraded` | `failed`

- **ok** — Groq layout succeeded, Airtable write ok, publish ok (Pages wait ok when requested).
- **degraded** — page may still publish; Groq fell back to raw, Airtable write failed, and/or Pages not live in time.
- **failed** — scrape/publish aborted (Firecrawl or GitHub error before a useful page).

### Groq free-tier rules (product behavior)

- TPM budget is limited (~8k tokens/min on on_demand). Runner chunks + throttles; max chunks capped so Deno HTTP does not time out.
- Oversized / rate-limited calls: shrink → split → wait-and-retry; if still incomplete, mark `layoutSource: raw` or partial groq with warnings — never silent success with invented content.

## Non-goals (for now)

- Unifying Node CLI and Deno into one binary.
- Replacing git-backed Pages publish (acceptable until scrape volume grows).
- Async job queue (next reliability phase after contracts).

## Next phases

1. ~~Lock product path + contracts~~ (this doc).
2. Split `deno-scrape/main.ts` into modules (`firecrawl`, `groq`, `github`, `airtable`, `http`).
3. Async runs: accept → `run_id` → background layout/publish (fixes long-page TPM vs Deploy timeout).
