/**
 * HTTP scrape runner: Firecrawl → Groq JSON → Deno markdown → GitHub docs/scrapes/<slug>/page.md
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
  const hash = u.hash.replace(/^#/, "").toLowerCase();
  const raw = `${u.hostname}${u.pathname}${hash ? "-" + hash : ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
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

const PAGE_TYPES = new Set([
  "article",
  "guide",
  "product",
  "changelog",
  "thread",
  "docs",
  "other",
]);

const CALLOUT_KINDS = new Set(["note", "warning", "tip"]);

type GroqPage = {
  pageType: string;
  title: string;
  summary: string | null;
  sections: { heading: string; body: string }[];
  callouts: { kind: string; text: string }[];
  mermaid: string | null;
  warnings: string[];
};

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseFrontHash(md: string): string | null {
  const m = md.match(/^contentHash:\s*"?([a-f0-9]{64})"?/m);
  return m?.[1] ?? null;
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Groq response was not valid JSON");
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validateGroqPage(raw: unknown): GroqPage {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Groq JSON must be an object");
  }
  const o = raw as Record<string, unknown>;
  const title = asString(o.title).replace(/\s+/g, " ").trim();
  if (!title) throw new Error("Groq JSON missing title");

  const pageType = PAGE_TYPES.has(asString(o.pageType)) ? asString(o.pageType) : "other";

  const sectionsIn = Array.isArray(o.sections) ? o.sections : [];
  const sections = sectionsIn
    .filter((s) => s && typeof s === "object")
    .map((s) => {
      const row = s as Record<string, unknown>;
      return {
        heading: asString(row.heading).trim(),
        body: asString(row.body).trim(),
      };
    })
    .filter((s) => s.heading || s.body);
  if (!sections.length) throw new Error("Groq JSON missing sections");

  const calloutsIn = Array.isArray(o.callouts) ? o.callouts : [];
  const callouts = calloutsIn
    .filter((c) => c && typeof c === "object")
    .map((c) => {
      const row = c as Record<string, unknown>;
      const kind = asString(row.kind).toLowerCase();
      return {
        kind: CALLOUT_KINDS.has(kind) ? kind : "note",
        text: asString(row.text).trim(),
      };
    })
    .filter((c) => c.text);

  let mermaid = o.mermaid == null ? null : asString(o.mermaid).trim();
  if (mermaid && (mermaid.includes("```") || mermaid.length > 8000)) mermaid = null;

  const warnings = Array.isArray(o.warnings)
    ? o.warnings.map((w) => asString(w).trim()).filter(Boolean)
    : [];

  const summaryRaw = o.summary == null ? "" : asString(o.summary).trim();
  return {
    pageType,
    title,
    summary: summaryRaw || null,
    sections,
    callouts,
    mermaid,
    warnings,
  };
}

function pageToMarkdown(page: GroqPage): string {
  const parts: string[] = [];
  if (page.summary) parts.push(page.summary);
  for (const section of page.sections) {
    if (section.heading) parts.push(`## ${section.heading}`);
    if (section.body) parts.push(section.body);
  }
  for (const callout of page.callouts) {
    parts.push(`> **${callout.kind}:** ${callout.text}`);
  }
  if (page.mermaid) {
    parts.push("```mermaid\n" + page.mermaid + "\n```");
  }
  if (page.warnings.length) {
    parts.push("## Warnings\n\n" + page.warnings.map((w) => `- ${w}`).join("\n"));
  }
  return parts.join("\n\n").trim();
}

const GROQ_SYSTEM = `You classify scraped page markdown into one JSON object.
The markdown is the only source of truth. Do not invent facts, URLs, prices, names, or quotes.
Drop site chrome: navigation, cookies, login, ads, share, related, follow-ups, app download, cookie consent.
Keep the real article, thread, changelog, or docs content.
Return JSON only, no markdown fences.

Schema:
{
  "pageType": "article" | "guide" | "product" | "changelog" | "thread" | "docs" | "other",
  "title": string,
  "summary": string | null,
  "sections": [{"heading": string, "body": string}],
  "callouts": [{"kind": "note" | "warning" | "tip", "text": string}],
  "mermaid": string | null,
  "warnings": string[]
}

mermaid is a mermaid diagram body only, or null if the page has no real flow to draw.
warnings lists gaps as [UNCLEAR FROM SOURCE].`;

async function groqClassify(markdown: string, fragment: string | null): Promise<GroqPage> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("Missing GROQ_API_KEY");

  const model = Deno.env.get("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
  const clipped = markdown.length > 100_000
    ? markdown.slice(0, 100_000) + "\n\n[truncated]"
    : markdown;

  const focus = fragment
    ? `\n\nThe URL hash is #${fragment}. Keep that version or section. Drop other changelog versions if they are clearly separate.`
    : "";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: GROQ_SYSTEM },
        { role: "user", content: clipped + focus },
      ],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${JSON.stringify(data)}`);
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Groq returned empty content");
  }
  return validateGroqPage(extractJsonObject(content));
}

async function layoutWithGroq(
  rawMarkdown: string,
  fallbackTitle: string,
  fragment: string | null,
) {
  if (!Deno.env.get("GROQ_API_KEY")) {
    return {
      title: fallbackTitle,
      body: rawMarkdown,
      pageType: "other",
      layoutSource: "raw",
      groqError: "Missing GROQ_API_KEY",
    };
  }

  let lastErr = "Groq failed";
  for (let i = 0; i < 2; i++) {
    try {
      const page = await groqClassify(rawMarkdown, fragment);
      return {
        title: page.title || fallbackTitle,
        body: pageToMarkdown(page),
        pageType: page.pageType,
        layoutSource: "groq",
      };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }
  return {
    title: fallbackTitle,
    body: rawMarkdown,
    pageType: "other",
    layoutSource: "raw",
    groqError: lastErr,
  };
}

function buildMarkdown(
  sourceUrl: string,
  title: string,
  body: string,
  extra: Record<string, string> = {},
): string {
  const scrapedAt = new Date().toISOString();
  const cleanTitle = fixMojibake(stripBom(title)).replace(/\s+/g, " ").trim();
  const cleanBody = fixMojibake(stripBom(body)).trim();
  const extraLines = Object.entries(extra)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---
title: ${JSON.stringify(cleanTitle)}
source: ${sourceUrl}
scrapedAt: ${scrapedAt}
layout: scrape
${extraLines}
---

${cleanBody}
`;
}

async function scrapeFirecrawl(url: string, waitFor: number, onlyMainContent: boolean) {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("Missing FIRECRAWL_API_KEY");

  let fragment = "";
  try {
    fragment = new URL(url).hash.replace(/^#/, "");
  } catch {
    fragment = "";
  }

  const actions = fragment
    ? [
      { type: "wait", milliseconds: 2000 },
      {
        type: "executeJavascript",
        script: `location.hash = ${JSON.stringify("#" + fragment)};`,
      },
      { type: "wait", milliseconds: 2500 },
    ]
    : [];

  const payloads = [
    {
      url,
      formats: ["markdown", "links"],
      onlyMainContent,
      waitFor: fragment ? Math.max(waitFor, 6000) : waitFor,
      maxAge: 0,
      ...(actions.length ? { actions } : {}),
    },
    {
      url: url.split("#")[0],
      formats: ["markdown", "links"],
      onlyMainContent,
      waitFor: Math.max(waitFor, 4000),
      maxAge: 0,
    },
  ];

  let data: Record<string, unknown> | null = null;
  let lastErr = "Firecrawl failed";
  for (const body of payloads) {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    data = await res.json();
    if (res.ok) break;
    lastErr = `Firecrawl ${res.status}: ${JSON.stringify(data)}`;
    data = null;
  }
  if (!data) throw new Error(lastErr);

  const payload = data as {
    data?: { metadata?: { title?: string }; markdown?: string };
    metadata?: { title?: string };
    markdown?: string;
  };
  const markdown = payload?.data?.markdown ?? payload?.markdown;
  if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
    throw new Error("Firecrawl returned no markdown");
  }

  const title = payload.data?.metadata?.title ?? payload.metadata?.title ?? url;
  return { markdown, title };
}

function githubHeaders() {
  const token = Deno.env.get("GITHUB_TOKEN");
  if (!token) throw new Error("Missing GITHUB_TOKEN");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "zamplandoc-deno-scrape",
  };
}

function decodeGithubContent(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}

async function githubGetFile(path: string): Promise<string | null> {
  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const res = await fetch(`${api}?ref=${encodeURIComponent(BRANCH)}`, {
    headers: githubHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const body = await res.json();
  if (typeof body.content !== "string") return null;
  return decodeGithubContent(body.content);
}

async function githubPutFile(path: string, content: string, message: string) {
  const api = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = githubHeaders();

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
  { id: "scrape", label: "Firecrawl reading the page" },
  { id: "layout", label: "Groq shaping the page" },
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
  const origin = req.headers.get("origin") ?? "";
  if (ALLOWED_ORIGINS.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    if (host === "grandzam1.github.io" || host.endsWith(".github.io")) return true;
    if (host === "localhost" || host === "127.0.0.1") return true;
  } catch {
    /* no origin */
  }
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

const RUN_HEADERS = [
  "run_id",
  "started_at",
  "finished_at",
  "status",
  "source_url",
  "fragment",
  "slug",
  "page_url",
  "layout_source",
  "groq_ok",
  "groq_error",
  "firecrawl_ok",
  "firecrawl_error",
  "github_ok",
  "github_error",
  "skipped_unchanged",
  "sheet_ok",
  "sheet_error",
  "duration_ms",
  "actor",
];

type RunLog = Record<string, string>;

function emptyRun(): RunLog {
  const row: RunLog = {};
  for (const key of RUN_HEADERS) row[key] = "";
  return row;
}

async function composioExecute(slug: string, args: Record<string, unknown>) {
  const apiKey = Deno.env.get("COMPOSIO_API_KEY");
  const userId = Deno.env.get("COMPOSIO_USER_ID");
  if (!apiKey || !userId) {
    throw new Error("Missing COMPOSIO_API_KEY or COMPOSIO_USER_ID");
  }
  const account = Deno.env.get("COMPOSIO_AIRTABLE_ACCOUNT_ID") ?? "ca_xzi4VNLxHNMu";
  const res = await fetch(
    `https://backend.composio.dev/api/v3.1/tools/execute/${encodeURIComponent(slug)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        connected_account_id: account,
        arguments: args,
      }),
    },
  );
  const data = await res.json();
  if (!res.ok || data?.successful === false) {
    throw new Error(`Composio ${slug}: ${JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

function airtableFields(run: RunLog): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of RUN_HEADERS) fields[key] = run[key] ?? "";
  return fields;
}

function extractRecordId(payload: unknown): string | null {
  const walk = (v: unknown): string | null => {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    if (typeof o.id === "string" && o.id.startsWith("rec")) return o.id;
    if (Array.isArray(o.records) && o.records[0]) return walk(o.records[0]);
    if (o.data) return walk(o.data);
    return null;
  };
  return walk(payload);
}

let airtableReady: { baseId: string; table: string } | null = null;

async function ensureRunsTable() {
  if (airtableReady) return airtableReady;
  const listed = await composioExecute("AIRTABLE_LIST_BASES", {});
  const bases = (listed?.data?.bases ?? listed?.data?.data?.bases ?? []) as Array<
    { id?: string; name?: string }
  >;
  const wanted = Deno.env.get("AIRTABLE_BASE_ID");
  const named = bases.find((b) => (b.name || "").toLowerCase() === "scrape-kit");
  const baseId = wanted || named?.id || bases[0]?.id;
  if (!baseId) {
    throw new Error(
      "Airtable has no bases. In airtable.com create a base named scrape-kit (empty is fine), then scrape again.",
    );
  }
  const tableName = Deno.env.get("AIRTABLE_TABLE") ?? "runs";
  const schema = await composioExecute("AIRTABLE_GET_BASE_SCHEMA", { baseId, base_id: baseId });
  const tables = (schema?.data?.tables ?? schema?.data?.data?.tables ?? []) as Array<{ name?: string }>;
  const hasRuns = tables.some((t) => t.name === tableName);
  if (!hasRuns) {
    await composioExecute("AIRTABLE_CREATE_TABLE", {
      base_id: baseId,
      name: tableName,
      description: "scrape-kit production run log",
      fields: RUN_HEADERS.map((name) => ({
        name,
        type: name.endsWith("_error") ? "multilineText" : "singleLineText",
      })),
    });
  }
  airtableReady = { baseId, table: tableName };
  return airtableReady;
}

const airtableRecordIds = new Map<string, string>();

async function upsertRun(run: RunLog): Promise<string | null> {
  try {
    const { baseId, table } = await ensureRunsTable();
    const rec = airtableRecordIds.get(run.run_id);
    if (rec) {
      await composioExecute("AIRTABLE_UPDATE_RECORD", {
        baseId,
        tableIdOrName: table,
        recordId: rec,
        fields: airtableFields(run),
        typecast: true,
      });
      return null;
    }
    const created = await composioExecute("AIRTABLE_CREATE_RECORD", {
      baseId,
      tableIdOrName: table,
      fields: airtableFields(run),
    });
    const id = extractRecordId(created);
    if (!id) throw new Error("Airtable create returned no record id");
    airtableRecordIds.set(run.run_id, id);
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

async function writeRun(run: RunLog) {
  const err = await upsertRun(run);
  if (err) {
    run.sheet_ok = "false";
    run.sheet_error = err.slice(0, 500);
    return err;
  }
  run.sheet_ok = "true";
  run.sheet_error = "";
  return null;
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
  const started = Date.now();
  let fragment = "";
  try {
    fragment = new URL(sourceUrl).hash.replace(/^#/, "");
  } catch {
    fragment = "";
  }

  const run = emptyRun();
  run.run_id = crypto.randomUUID();
  run.started_at = new Date().toISOString();
  run.status = "queued";
  run.source_url = sourceUrl;
  run.fragment = fragment;
  run.slug = slug;
  run.page_url = pageUrl;
  run.actor = waitPages ? "ws" : "post";

  const sheetStartErr = await writeRun(run);
  progress("queued", {
    slug,
    pageUrl,
    runId: run.run_id,
    status: run.status,
    sheetOk: run.sheet_ok,
    sheetError: run.sheet_error,
  });

  const finish = async (status: string, extra: Record<string, unknown> = {}) => {
    run.status = status;
    run.finished_at = new Date().toISOString();
    run.duration_ms = String(Date.now() - started);
    const sheetErr = await writeRun(run);
    const payload = {
      slug,
      pageUrl,
      path: filePath,
      sourceUrl,
      runId: run.run_id,
      status,
      layoutSource: run.layout_source,
      groqError: run.groq_error,
      sheetOk: run.sheet_ok,
      sheetError: run.sheet_error || sheetStartErr || sheetErr || "",
      ...extra,
    };
    progress("done", payload);
    return payload;
  };

  try {
    progress("scrape");
    const scraped = await scrapeFirecrawl(sourceUrl, waitFor, onlyMainContent);
    run.firecrawl_ok = "true";
    const contentHash = await sha256Hex(scraped.markdown);

    const existing = await githubGetFile(filePath);
    if (existing && parseFrontHash(existing) === contentHash) {
      run.skipped_unchanged = "true";
      run.github_ok = "true";
      run.layout_source = "unchanged";
      progress("layout", { skipped: true, reason: "unchanged" });
      progress("write", { skipped: true });
      progress("commit", { skipped: true });
      progress("pages", { pageUrl });
      if (waitPages) await waitForLivePage(pageUrl);
      return await finish("ok", { skipped: true });
    }

    progress("layout");
    const laid = await layoutWithGroq(scraped.markdown, scraped.title, fragment || null);
    run.layout_source = laid.layoutSource;
    run.groq_ok = laid.layoutSource === "groq" ? "true" : "false";
    run.groq_error = ("groqError" in laid && laid.groqError) ? laid.groqError : "";

    progress("write");
    const extra: Record<string, string> = {
      contentHash,
      pageType: laid.pageType,
      layoutSource: laid.layoutSource,
      runId: run.run_id,
    };
    if (run.groq_error) extra.groqError = run.groq_error;
    const markdown = buildMarkdown(sourceUrl, laid.title, laid.body, extra);

    progress("commit");
    await githubPutFile(filePath, markdown, `scrape: update ${slug}`);
    run.github_ok = "true";

    progress("pages", { pageUrl });
    let pagesOk = true;
    if (waitPages) pagesOk = await waitForLivePage(pageUrl);

    const degraded = run.groq_ok !== "true" || run.sheet_ok !== "true" || !pagesOk;
    return await finish(degraded ? "degraded" : "ok", { skipped: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (run.firecrawl_ok !== "true") {
      run.firecrawl_ok = "false";
      run.firecrawl_error = message.slice(0, 500);
    } else if (run.github_ok !== "true") {
      run.github_ok = "false";
      run.github_error = message.slice(0, 500);
    }
    run.status = "failed";
    run.finished_at = new Date().toISOString();
    run.duration_ms = String(Date.now() - started);
    await writeRun(run);
    throw err;
  }
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
    return json({
      ok: true,
      service: "zamplandoc-scrape",
      ws: "/ws",
      runsLog: Boolean(Deno.env.get("COMPOSIO_API_KEY") && Deno.env.get("COMPOSIO_USER_ID")),
    });
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
