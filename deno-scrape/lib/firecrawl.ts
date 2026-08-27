export function creditNum(data: Record<string, unknown> | undefined, keys: string[]): string {
  if (!data) return "";
  for (const key of keys) {
    const value = data[key];
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export async function scrapeFirecrawl(url: string, waitFor: number, onlyMainContent: boolean) {
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
  const meta = (payload.data?.metadata ?? payload.metadata ?? {}) as Record<string, unknown>;
  const used = meta.creditsUsed ?? meta.credits_used ??
    (data as { creditsUsed?: unknown }).creditsUsed;
  return {
    markdown,
    title,
    creditsUsed: used == null || used === "" ? "" : String(used),
  };
}

export async function firecrawlCreditUsage(): Promise<{ remaining: string; plan: string }> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("Missing FIRECRAWL_API_KEY");
  const headers = { Authorization: `Bearer ${key}` };
  for (const path of ["/v2/team/credit-usage", "/v1/team/credit-usage"]) {
    const res = await fetch(`https://api.firecrawl.dev${path}`, { headers });
    const body = await res.json() as {
      data?: Record<string, unknown>;
      success?: boolean;
    };
    if (!res.ok || body?.success === false) continue;
    const data = (body.data ?? body) as Record<string, unknown>;
    const nested = (data.data && typeof data.data === "object")
      ? data.data as Record<string, unknown>
      : data;
    return {
      remaining: creditNum(nested, ["remainingCredits", "remaining_credits"]),
      plan: creditNum(nested, ["planCredits", "plan_credits"]),
    };
  }
  throw new Error("Firecrawl credit-usage unavailable");
}
