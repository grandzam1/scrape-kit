/**
 * HTTP scrape runner: Firecrawl → markdown → GitHub docs/scrapes/<slug>/page.md
 * No Groq. No Pipedream.
 */

const REPO = Deno.env.get("GITHUB_REPO") ?? "grandzam1/scrape-kit";
const BRANCH = Deno.env.get("GITHUB_BRANCH") ?? "main";

function encodeUtf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin);
}

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

function slugFromUrl(url: string): string {
  const u = new URL(url);
  const raw = `${u.hostname}${u.pathname}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return raw.replace(/^-|-$/g, "") || "page";
}

function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/** UTF-8 that was decoded as Windows-1252 and saved again (â€™, â†’, ðŸ…). */
function toCp1252Byte(codePoint: number): number | null {
  if (codePoint <= 0x7f || (codePoint >= 0xa0 && codePoint <= 0xff)) return codePoint;
  const extra: Record<number, number> = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f,
  };
  return extra[codePoint] ?? (codePoint >= 0x80 && codePoint <= 0x9f ? codePoint : null);
}

function utf8SeqLen(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) return 2;
  if (lead >= 0xe0 && lead <= 0xef) return 3;
  if (lead >= 0xf0 && lead <= 0xf4) return 4;
  return 0;
}

function tryDecodeWindow(chars: string[], start: number, len: number): string | null {
  const bytes: number[] = [];
  for (let i = 0; i < len; i++) {
    const ch = chars[start + i];
    if (!ch) return null;
    const byte = toCp1252Byte(ch.codePointAt(0)!);
    if (byte == null) return null;
    bytes.push(byte);
  }
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    if ([...decoded].length >= len) return null;
    return decoded;
  } catch {
    return null;
  }
}

function fixMojibake(input: string): string {
  let text = stripBom(input);
  for (let pass = 0; pass < 3; pass++) {
    const chars = [...text];
    let out = "";
    for (let i = 0; i < chars.length; ) {
      const lead = toCp1252Byte(chars[i].codePointAt(0)!);
      const seqLen = lead == null ? 0 : utf8SeqLen(lead);
      const decoded = seqLen >= 2 ? tryDecodeWindow(chars, i, seqLen) : null;
      if (decoded != null) {
        out += decoded;
        i += seqLen;
      } else {
        out += chars[i];
        i += 1;
      }
    }
    if (out === text) break;
    text = out;
  }
  return text;
}

function buildMarkdown(sourceUrl: string, title: string, body: string): string {
  const scrapedAt = new Date().toISOString();
  const cleanTitle = fixMojibake(stripBom(title)).replace(/\s+/g, " ").trim();
  const cleanBody = fixMojibake(stripBom(body)).trim();
  return `---
title: ${JSON.stringify(cleanTitle)}
source: ${sourceUrl}
scrapedAt: ${scrapedAt}
layout: scrape
---

${cleanBody}
`;
}

async function scrapeFirecrawl(url: string, waitFor: number, onlyMainContent: boolean) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("Missing FIRECRAWL_API_KEY");

  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent,
      waitFor,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Firecrawl ${res.status}: ${JSON.stringify(data)}`);
  }

  const markdown = data?.data?.markdown ?? data?.markdown;
  if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
    throw new Error("Firecrawl returned no markdown");
  }

  const title = data?.data?.metadata?.title ?? data?.metadata?.title ?? url;
  return { markdown, title };
}

async function githubPutFile(path: string, content: string, message: string) {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("Missing GITHUB_TOKEN");

  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "zamplandoc-deno-scrape",
  };

  let sha: string | undefined;
  const existing = await fetch(`${api}?ref=${encodeURIComponent(BRANCH)}`, { headers });
  if (existing.ok) {
    const body = await existing.json();
    sha = body.sha;
  }

  const put = await fetch(api, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message,
      content: encodeUtf8ToBase64(content),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  const result = await put.json();
  if (!put.ok) {
    throw new Error(`GitHub ${put.status}: ${JSON.stringify(result)}`);
  }
  return result;
}

const PAGES_BASE = Deno.env.get("PAGES_BASE") ?? "https://grandzam1.github.io/scrape-kit";
const ALLOWED_ORIGINS = new Set([
  "https://grandzam1.github.io",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
]);

const STEPS = [
  { id: "queued", label: "Got your URL" },
  { id: "scrape", label: "Reading the page" },
  { id: "write", label: "Saving markdown" },
  { id: "commit", label: "Pushing to GitHub" },
  { id: "pages", label: "GitHub Pages building" },
  { id: "done", label: "Live page ready" },
];

function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type, x-scrape-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

function originOk(req: Request) {
  const origin = req.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) return true;
  const secret = Deno.env.get("SCRAPE_SECRET");
  const q = new URL(req.url).searchParams.get("secret");
  const header = req.headers.get("x-scrape-secret");
  return Boolean(secret && (q === secret || header === secret));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForLivePage(pageUrl: string) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(pageUrl, { redirect: "follow" });
      if (res.ok) return true;
    } catch {
      /* Pages not up yet */
    }
    await sleep(4000);
  }
  return false;
}

type Progress = (step: string, extra?: Record<string, unknown>) => void;

async function runScrape(
  sourceUrl: string,
  slugInput: string | undefined,
  waitFor: number,
  onlyMainContent: boolean,
  progress: Progress,
  waitPages = false,
) {
  const slug = String(slugInput ?? slugFromUrl(sourceUrl)).replace(/[^a-zA-Z0-9_-]/g, "-");
  const filePath = `docs/scrapes/${slug}/page.md`;
  const pageUrl = `${PAGES_BASE}/scrapes/${slug}/page.html`;

  progress("queued", { slug, pageUrl });
  progress("scrape");
  const scraped = await scrapeFirecrawl(sourceUrl, waitFor, onlyMainContent);

  progress("write");
  const markdown = buildMarkdown(sourceUrl, scraped.title, scraped.markdown);

  progress("commit");
  await githubPutFile(filePath, markdown, `scrape: update ${slug}`);

  progress("pages", { pageUrl });
  if (waitPages) await waitForLivePage(pageUrl);

  progress("done", { slug, pageUrl, path: filePath, sourceUrl });
  return { slug, pageUrl, path: filePath, sourceUrl };
}

function eventPayload(step: string, extra: Record<string, unknown> = {}) {
  const index = STEPS.findIndex((s) => s.id === step);
  const total = STEPS.length;
  const label = STEPS[index]?.label ?? step;
  return {
    step,
    index,
    total,
    pct: index < 0 ? 0 : Math.round(((index + 1) / total) * 100),
    label,
    ...extra,
  };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    return json({ ok: true, service: "zamplandoc-scrape", ws: "/ws" });
  }

  if (url.pathname === "/ws" && req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    if (!originOk(req)) {
      return json({ ok: false, error: "unauthorized" }, 401);
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onmessage = async (ev) => {
      try {
        const body = JSON.parse(String(ev.data));
        const sourceUrl = String(body.url ?? "").trim();
        if (!sourceUrl) {
          socket.send(JSON.stringify({ step: "error", error: "url is required" }));
          socket.close();
          return;
        }
        await runScrape(
          sourceUrl,
          body.slug,
          Number(body.waitFor ?? 3000),
          body.onlyMainContent !== false,
          (step, extra = {}) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(eventPayload(step, extra)));
            }
          },
          true,
        );
        socket.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ step: "error", error: message }));
          socket.close();
        }
      }
    };
    return response;
  }

  if (req.method !== "POST" || url.pathname !== "/scrape") {
    return json({ ok: false, error: "POST /scrape or WebSocket /ws" }, 404);
  }

  const secret = Deno.env.get("SCRAPE_SECRET");
  if (secret && req.headers.get("x-scrape-secret") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const sourceUrl = String(body.url ?? "").trim();
    if (!sourceUrl) return json({ ok: false, error: "url is required" }, 400);

    const result = await runScrape(
      sourceUrl,
      body.slug,
      Number(body.waitFor ?? 3000),
      body.onlyMainContent !== false,
      () => {},
    );

    return json({ ok: true, ...result }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: message }, 500);
  }
});
