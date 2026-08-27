import { asString, extractJsonObject, sleep } from "./util.ts";

export const PAGE_TYPES = new Set([
  "article",
  "guide",
  "product",
  "changelog",
  "thread",
  "docs",
  "other",
]);

export const CALLOUT_KINDS = new Set(["note", "warning", "tip"]);

export type GroqPage = {
  pageType: string;
  title: string;
  summary: string | null;
  sections: { heading: string; body: string }[];
  callouts: { kind: string; text: string }[];
  mermaid: string | null;
  warnings: string[];
};

export function validateGroqPage(raw: unknown, fallbackTitle = "Untitled"): GroqPage {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Groq JSON must be an object");
  }
  const o = raw as Record<string, unknown>;
  let title = asString(o.title).replace(/\s+/g, " ").trim();

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
  if (!sections.length && summaryRaw) {
    sections.push({ heading: "", body: summaryRaw });
  }
  if (!sections.length) {
    throw new Error("Groq JSON missing sections");
  }
  if (!title) {
    title = sections.find((s) => s.heading)?.heading || fallbackTitle;
  }
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

export function pageToMarkdown(page: GroqPage): string {
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

export const GROQ_SYSTEM = `You classify scraped page markdown into one JSON object.
The markdown is the only source of truth. Do not invent facts, URLs, prices, names, or quotes.
Drop site chrome: navigation, cookies, login, ads, share, related, follow-ups, app download, cookie consent.
Keep the real article, thread, changelog, or docs content.
Return JSON only, no markdown fences.
If the user message is CHUNK i of n, extract only from that chunk. Do not guess missing chunks.

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

/** Free-tier Groq TPM is often 8000 — keep each request well under that. */
export function groqTpmBudget(): number {
  const n = Number(Deno.env.get("GROQ_TPM_BUDGET") || 6500);
  return Number.isFinite(n) && n >= 2000 ? Math.floor(n) : 6500;
}

export function groqChunkChars(): number {
  const n = Number(Deno.env.get("GROQ_CHUNK_CHARS") || 4500);
  return Number.isFinite(n) && n >= 1200 ? Math.floor(n) : 4500;
}

export function groqMaxChunks(): number {
  const n = Number(Deno.env.get("GROQ_MAX_CHUNKS") || 2);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 2;
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5) + Math.ceil(GROQ_SYSTEM.length / 3.5) + 80;
}

export function shrinkForGroq(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]")
    .replace(/\((https?:\/\/[^)\s]{90,})\)/g, (_, url: string) => `(${url.slice(0, 72)}…)`)
    .replace(/https?:\/\/[^\s)\]>]{90,}/g, (url) => url.slice(0, 72) + "…")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function groqTooLarge(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  // Single request bigger than the TPM cap (e.g. Requested 9230, Limit 8000).
  const requested = parseRequestedTokens(err);
  const budget = groqTpmBudget();
  if (requested != null && requested > budget) return true;
  return /413|context[_ ]length|too large|too many tokens|maximum context|payload too large|request too large/i
    .test(text);
}

export function groqNeedsCooldown(err: unknown): boolean {
  const text = err instanceof Error ? err.message : String(err);
  return /429|rate_limit_exceeded|tokens per minute|TPM|try again in/i.test(text) &&
    !groqTooLarge(err);
}

export function parseRequestedTokens(err: unknown): number | null {
  const text = err instanceof Error ? err.message : String(err);
  const m = text.match(/Requested\s+(\d+)/i);
  return m ? Number(m[1]) : null;
}

export function parseRetryAfterMs(err: unknown): number {
  const text = err instanceof Error ? err.message : String(err);
  const m = text.match(/try again in\s+([\d.]+)\s*s/i);
  if (m) return Math.min(25_000, Math.ceil(Number(m[1]) * 1000) + 400);
  return 5_000;
}

export async function throttleAfterGroq(charsUsed: number) {
  const tokens = Math.ceil(charsUsed / 3.5) + 200;
  const budget = groqTpmBudget();
  // Leave headroom so the next chunk does not 429 mid-job.
  const waitMs = Math.min(12_000, Math.max(1_500, Math.ceil((tokens / (budget * 0.75)) * 60_000)));
  await sleep(waitMs);
}

export function fitChunksUnderTpm(text: string, maxChars: number): string[] {
  let size = maxChars;
  while (size > 1200 && estimateTokens("x".repeat(size)) > groqTpmBudget()) {
    size = Math.floor(size * 0.8);
  }
  let chunks = splitMarkdownChunks(text, size);
  // Re-split any chunk that still looks oversized (dense URLs / code).
  const out: string[] = [];
  for (const chunk of chunks) {
    if (estimateTokens(chunk) <= groqTpmBudget()) {
      out.push(chunk);
      continue;
    }
    const smaller = Math.max(1200, Math.floor(chunk.length * 0.55));
    out.push(...splitMarkdownChunks(chunk, smaller));
  }
  return out.filter(Boolean);
}

export function splitMarkdownChunks(text: string, maxChars: number): string[] {
  const src = text.trim();
  if (!src) return [];
  if (src.length <= maxChars) return [src];

  const blocks = src.split(/(?=\n#{1,6}\s)/);
  const chunks: string[] = [];
  let buf = "";

  const flush = () => {
    const piece = buf.trim();
    if (piece) chunks.push(piece);
    buf = "";
  };

  const pushHard = (block: string) => {
    for (let i = 0; i < block.length; i += maxChars) {
      const piece = block.slice(i, i + maxChars).trim();
      if (piece) chunks.push(piece);
    }
  };

  for (const block of blocks) {
    if (block.length > maxChars) {
      flush();
      const paras = block.split(/\n{2,}/);
      let inner = "";
      for (const para of paras) {
        if (para.length > maxChars) {
          if (inner.trim()) chunks.push(inner.trim());
          inner = "";
          pushHard(para);
          continue;
        }
        if (inner.length + para.length + 2 > maxChars) {
          if (inner.trim()) chunks.push(inner.trim());
          inner = para;
        } else {
          inner = inner ? inner + "\n\n" + para : para;
        }
      }
      if (inner.trim()) chunks.push(inner.trim());
      continue;
    }
    if (buf.length + block.length > maxChars) flush();
    buf += block;
  }
  flush();
  return chunks.filter(Boolean);
}

export function mergeGroqPages(pages: GroqPage[]): GroqPage {
  const first = pages[0];
  const typed = pages.find((p) => p.pageType && p.pageType !== "other");
  const sections: GroqPage["sections"] = [];
  for (const page of pages) {
    for (const section of page.sections) {
      const prev = sections[sections.length - 1];
      if (prev && prev.heading && prev.heading === section.heading) {
        prev.body = [prev.body, section.body].filter(Boolean).join("\n\n");
      } else {
        sections.push({ heading: section.heading, body: section.body });
      }
    }
  }
  const callouts: GroqPage["callouts"] = [];
  const seen = new Set<string>();
  for (const page of pages) {
    for (const callout of page.callouts) {
      const key = `${callout.kind}:${callout.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      callouts.push(callout);
    }
  }
  const warnings = pages.flatMap((p) => p.warnings);
  if (pages.length > 1) {
    warnings.push(`[UNCLEAR FROM SOURCE] classified in ${pages.length} Groq chunks`);
  }
  return {
    pageType: typed?.pageType || first.pageType,
    title: first.title,
    summary: pages.map((p) => p.summary).find(Boolean) ?? null,
    sections,
    callouts,
    mermaid: pages.map((p) => p.mermaid).find(Boolean) ?? null,
    warnings,
  };
}

export async function groqClassify(
  markdown: string,
  fragment: string | null,
  part = { index: 1, total: 1 },
  fallbackTitle = "Untitled",
): Promise<GroqPage> {
  const key = Deno.env.get("GROQ_API_KEY");
  if (!key) throw new Error("Missing GROQ_API_KEY");

  const model = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-20b";
  const focus = fragment
    ? `\n\nThe URL hash is #${fragment}. Keep that version or section. Drop other changelog versions if they are clearly separate.`
    : "";
  const chunkNote = part.total > 1
    ? `CHUNK ${part.index} of ${part.total}. Extract only this chunk. Title may be "${fallbackTitle}".\n\n`
    : "";

  let lastErr: unknown = "Groq failed";
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 2048,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: GROQ_SYSTEM },
          { role: "user", content: chunkNote + markdown + focus },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      lastErr = new Error(`Groq ${res.status}: ${JSON.stringify(data)}`);
      if (groqNeedsCooldown(lastErr) && attempt < 3) {
        await sleep(parseRetryAfterMs(lastErr));
        continue;
      }
      throw lastErr;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Groq returned empty content");
    }
    return validateGroqPage(extractJsonObject(content), fallbackTitle);
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function groqClassifySized(
  markdown: string,
  fragment: string | null,
  part: { index: number; total: number },
  fallbackTitle: string,
  depth = 0,
): Promise<GroqPage> {
  // Never call Groq with a payload that already looks over the TPM budget.
  if (estimateTokens(markdown) > groqTpmBudget() && markdown.length > 1200 && depth < 5) {
    const pieces = fitChunksUnderTpm(markdown, Math.max(1200, Math.floor(markdown.length / 2)));
    if (pieces.length >= 2) {
      const pages: GroqPage[] = [];
      for (const piece of pieces) {
        pages.push(await groqClassifySized(piece, fragment, part, fallbackTitle, depth + 1));
      }
      return mergeGroqPages(pages);
    }
  }

  try {
    const page = await groqClassify(markdown, fragment, part, fallbackTitle);
    await throttleAfterGroq(markdown.length);
    return page;
  } catch (err) {
    if (groqNeedsCooldown(err)) {
      await sleep(parseRetryAfterMs(err));
      const page = await groqClassify(markdown, fragment, part, fallbackTitle);
      await throttleAfterGroq(markdown.length);
      return page;
    }
    if (!groqTooLarge(err) || markdown.length < 1200 || depth >= 5) throw err;
    const requested = parseRequestedTokens(err);
    const budget = groqTpmBudget();
    await sleep(2_000);
    const targetChars = requested
      ? Math.max(1200, Math.floor(markdown.length * ((budget * 0.6) / requested)))
      : Math.max(1200, Math.floor(markdown.length / 2));
    let pieces = fitChunksUnderTpm(markdown, targetChars);
    if (pieces.length < 2) {
      pieces = splitMarkdownChunks(markdown, Math.max(1200, Math.floor(markdown.length / 2)));
    }
    if (pieces.length < 2) throw err;
    const pages: GroqPage[] = [];
    for (let i = 0; i < pieces.length; i++) {
      pages.push(await groqClassifySized(pieces[i], fragment, {
        index: part.index,
        total: part.total,
      }, fallbackTitle, depth + 1));
    }
    return mergeGroqPages(pages);
  }
}

export async function groqClassifyAdaptive(
  markdown: string,
  fragment: string | null,
  fallbackTitle: string,
): Promise<GroqPage> {
  const compact = shrinkForGroq(markdown);
  const chunks = fitChunksUnderTpm(compact, groqChunkChars());
  if (!chunks.length) throw new Error("Empty markdown for Groq");

  const maxChunks = groqMaxChunks();
  const use = chunks.slice(0, maxChunks);
  const pages: GroqPage[] = [];
  for (let i = 0; i < use.length; i++) {
    pages.push(await groqClassifySized(use[i], fragment, {
      index: i + 1,
      total: use.length,
    }, fallbackTitle));
  }
  const merged = mergeGroqPages(pages);
  if (!merged.title || merged.title === "Untitled") merged.title = fallbackTitle;
  if (chunks.length > maxChunks) {
    merged.warnings.push(
      `[UNCLEAR FROM SOURCE] only first ${maxChunks} of ${chunks.length} chunks sent to Groq (TPM / time limit)`,
    );
    const rest = chunks.slice(maxChunks).join("\n\n").trim();
    if (rest) {
      merged.sections.push({
        heading: "More from source",
        body: rest.slice(0, 12000) + (rest.length > 12000 ? "\n\n[truncated]" : ""),
      });
    }
  }
  return merged;
}

export async function layoutWithGroq(
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
      const page = await groqClassifyAdaptive(rawMarkdown, fragment, fallbackTitle);
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
