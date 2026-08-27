import { sleep } from "./util.ts";

export const PAGES_BASE = Deno.env.get("PAGES_BASE") ?? "https://grandzam1.github.io/scrape-kit";
export const ALLOWED_ORIGINS = new Set([
  "https://grandzam1.github.io",
  "http://127.0.0.1:4000",
  "http://localhost:4000",
]);

export const STEPS = [
  { id: "queued", label: "Got your URL" },
  { id: "scrape", label: "Firecrawl reading the page" },
  { id: "layout", label: "Groq shaping the page" },
  { id: "write", label: "Saving markdown" },
  { id: "commit", label: "Pushing to GitHub" },
  { id: "pages", label: "GitHub Pages building" },
  { id: "done", label: "Live page ready" },
];

export function corsHeaders(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "content-type, x-scrape-secret",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

export function originOk(req: Request) {
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

export function eventPayload(step: string, extra: Record<string, unknown> = {}) {
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

export async function waitForLivePage(pageUrl: string) {
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
