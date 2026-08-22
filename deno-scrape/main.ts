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

function buildMarkdown(sourceUrl: string, title: string, body: string): string {
  const scrapedAt = new Date().toISOString();
  return `---
title: ${JSON.stringify(title)}
source: ${sourceUrl}
scrapedAt: ${scrapedAt}
layout: scrape
---

${body.trim()}
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
