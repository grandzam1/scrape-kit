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

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    return json({ ok: true, service: "zamplandoc-scrape" });
  }

  if (req.method !== "POST" || url.pathname !== "/scrape") {
    return json({ ok: false, error: "POST /scrape with JSON { url, slug? }" }, 404);
  }

  const secret = Deno.env.get("SCRAPE_SECRET");
  if (secret && req.headers.get("x-scrape-secret") !== secret) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    const sourceUrl = String(body.url ?? "").trim();
    if (!sourceUrl) return json({ ok: false, error: "url is required" }, 400);

    const waitFor = Number(body.waitFor ?? 3000);
    const onlyMainContent = body.onlyMainContent !== false;
    const slug = String(body.slug ?? slugFromUrl(sourceUrl)).replace(/[^a-zA-Z0-9_-]/g, "-");
    const path = `docs/scrapes/${slug}/page.md`;

    const scraped = await scrapeFirecrawl(sourceUrl, waitFor, onlyMainContent);
    const markdown = buildMarkdown(sourceUrl, scraped.title, scraped.markdown);
    const gh = await githubPutFile(path, markdown, `scrape: update ${slug}`);

    return json({
      ok: true,
      slug,
      path,
      sourceUrl,
      html_url: gh?.content?.html_url ?? `https://github.com/${REPO}/blob/${BRANCH}/${path}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: message }, 500);
  }
});
