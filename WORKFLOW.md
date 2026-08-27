# scrape-kit workflow

Production app: **GitHub Pages UI** → **Deno Deploy** (`zamplandoc-scrape`) → **Firecrawl + Groq** → **GitHub commit** → **Pages live URL** → **Airtable `runs` log**.

Live endpoints:

| Endpoint | Role |
|----------|------|
| `GET /health` | Service info |
| `WebSocket /ws` | Browser UI (GitHub Pages) — streaming steps, waits for Pages |
| `POST /scrape` | API — default **async** (`202` + NDJSON stream) |
| `POST /scrape` + `"async": false` | API — sync single JSON when finished |
| `GET /runs/:runId` | Poll run snapshot (memory, or KV if provisioned on Deploy) |

Status lifecycle: `queued` → `ok` | `degraded` | `failed`

---

## Swimlane — entry paths

Three ways to start a scrape. All converge on the same `runScrape` pipeline.

```mermaid
flowchart TB
  subgraph User["User / API client"]
    U1["Paste URL on GitHub Pages"]
    U2["POST /scrape (default async)"]
    U3["POST /scrape async:false"]
    U4["Optional: GET /runs/:runId"]
  end

  subgraph PagesUI["GitHub Pages (docs/)"]
    P1["scrape.js opens WebSocket"]
    P2["Shows step progress + live link"]
  end

  subgraph Deno["Deno Deploy — zamplandoc-scrape"]
    D1["WS /ws → runScrape(waitPages=true)"]
    D2["prepareScrapeJob → runId + snapshot"]
    D3["202 + NDJSON stream (keeps isolate alive)"]
    D4["Or EdgeRuntime.waitUntil if available"]
    D5["runScrape(waitPages=false)"]
    D6["GET /runs/:id → snapshot"]
  end

  subgraph Pipeline["Shared pipeline — runScrape"]
    direction TB
    PL1["queued — write Airtable row"]
    PL2["Firecrawl scrape"]
    PL3{"Same body hash<br/>and not prior raw?"}
    PL4["Skip Groq — unchanged"]
    PL5["Groq layout (chunked)"]
    PL6["Build page.md front matter"]
    PL7["GitHub PUT docs/scrapes/slug/page.md"]
    PL8["Wait for Pages live (WS only)"]
    PL9["Snapshot credits + upsert Airtable"]
    PL10["ok / degraded / failed"]
  end

  subgraph External["External services"]
    FC["Firecrawl API"]
    GQ["Groq API"]
    GH["GitHub repo grandzam1/scrape-kit"]
    GP["GitHub Pages"]
    AT["Airtable runs via Composio"]
  end

  U1 --> P1
  P1 --> D1
  D1 --> PL1

  U2 --> D2
  D2 --> D3
  D2 --> D4
  D3 --> D5
  D4 --> D5
  D5 --> PL1
  U4 --> D6

  U3 --> D5

  PL1 --> PL2
  PL2 --> FC
  PL2 --> PL3
  PL3 -->|yes| PL4
  PL3 -->|no| PL5
  PL4 --> PL7
  PL5 --> GQ
  PL5 --> PL6
  PL6 --> PL7
  PL7 --> GH
  PL7 --> PL8
  PL8 --> GP
  PL8 --> PL9
  PL4 --> PL8
  PL9 --> AT
  PL9 --> PL10

  PL10 --> P2
  PL10 --> D6
  PL10 --> U4
```

---

## Swimlane — async API detail (Phase 3)

New Deno Deploy does **not** support `Kv.enqueue` / `listenQueue`. Async uses a **202 response** plus either a progress stream or background `waitUntil`.

```mermaid
sequenceDiagram
  autonumber
  participant Client as API client
  participant Deno as Deno Deploy
  participant Store as Run snapshot<br/>(memory / KV)
  participant Pipe as runScrape pipeline
  participant AT as Airtable

  Client->>Deno: POST /scrape { url }
  Deno->>Deno: prepareScrapeJob() → runId
  Deno->>Store: save snapshot (queued)

  alt EdgeRuntime.waitUntil available
    Deno-->>Client: 202 JSON { runId, statusUrl, mode: waitUntil }
    Deno->>Pipe: background runQueuedScrapeJob
  else Default on Deploy
    Deno-->>Client: 202 NDJSON stream { runId, mode: stream }
    loop Each step
      Pipe->>Store: update snapshot
      Deno-->>Client: NDJSON { step, pct, label }
    end
  end

  Pipe->>AT: create / update runs row
  Pipe->>Store: final snapshot (ok | degraded | failed)

  opt Poll while stream open or after disconnect
    Client->>Deno: GET /runs/:runId
    Deno->>Store: read snapshot
    Deno-->>Client: { status, pageUrl, groqOk, ... }
  end
```

---

## Swimlane — browser UI (WebSocket)

The home page does **not** use `POST /scrape`. It keeps one WebSocket open for the whole run (isolate stays alive; Pages wait enabled).

```mermaid
sequenceDiagram
  autonumber
  participant User as User
  participant UI as GitHub Pages<br/>docs/assets/scrape.js
  participant Deno as Deno Deploy<br/>WS /ws
  participant Pipe as runScrape
  participant GP as GitHub Pages

  User->>UI: Submit URL
  UI->>Deno: WebSocket connect
  UI->>Deno: { url, waitFor }
  Deno->>Pipe: runScrape(..., waitPages=true)

  loop Steps: queued → scrape → layout → write → commit → pages
    Pipe-->>Deno: progress event
    Deno-->>UI: { step, pct, label }
    UI-->>User: Update progress ring
  end

  Pipe->>GP: poll until page.html live
  Pipe-->>Deno: done { pageUrl, status }
  Deno-->>UI: final step
  UI-->>User: Show live link (or degraded warning)
  Deno->>UI: WebSocket close
```

---

## Pipeline steps (all paths)

| Step | What happens |
|------|----------------|
| **queued** | Assign `runId`, slug, `pageUrl`; create Airtable row; save snapshot |
| **scrape** | Firecrawl fetches URL → markdown + title; record Firecrawl credits |
| **layout** | If body hash unchanged and prior publish was not `raw` → skip Groq. Else Groq JSON layout (chunked, TPM throttle, max 2 chunks) |
| **write** | Build Deno `page.md` with front matter (`layoutSource`, `contentHash`, `runId`) |
| **commit** | `githubPutFile` → `docs/scrapes/<slug>/page.md` |
| **pages** | WS path: wait until `page.html` is live on GitHub Pages |
| **done** | Final status `ok` / `degraded` / `failed`; vendor credits on Airtable; snapshot updated |

---

## Out of scope (lab only)

Node CLI (`npm run scrape -- --job jobs/...`) uses Composio + local `output/`. It does **not** publish to GitHub Pages or use this Deno pipeline.

See also: [ARCHITECTURE.md](./ARCHITECTURE.md)
