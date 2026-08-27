import { firecrawlCreditUsage } from "./firecrawl.ts";

export const RUN_HEADERS = [
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
  "airtable_ok",
  "airtable_error",
  "firecrawl_credits_used",
  "firecrawl_credits_remaining",
  "firecrawl_plan_credits",
  "composio_tool_calls_30d",
  "composio_calls_this_run",
  "composio_rate_remaining",
  "credits_error",
  "duration_ms",
  "actor",
];

export let lastComposioRateRemaining = "";
export let composioCallCount = 0;

export function resetComposioCallCount() {
  composioCallCount = 0;
}

export type RunLog = Record<string, string>;

export function emptyRun(): RunLog {
  const row: RunLog = {};
  for (const key of RUN_HEADERS) row[key] = "";
  return row;
}

export async function composioExecute(slug: string, args: Record<string, unknown>) {
  const apiKey = Deno.env.get("COMPOSIO_API_KEY");
  const userId = Deno.env.get("COMPOSIO_USER_ID");
  if (!apiKey || !userId) {
    throw new Error("Missing COMPOSIO_API_KEY or COMPOSIO_USER_ID");
  }
  const account = Deno.env.get("COMPOSIO_AIRTABLE_ACCOUNT_ID");
  if (!account) {
    throw new Error("Missing COMPOSIO_AIRTABLE_ACCOUNT_ID");
  }
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
  composioCallCount += 1;
  lastComposioRateRemaining =
    res.headers.get("x-ratelimit-remaining") ??
    res.headers.get("X-RateLimit-Remaining") ??
    lastComposioRateRemaining;
  if (!res.ok || data?.successful === false) {
    throw new Error(`Composio ${slug}: ${JSON.stringify(data).slice(0, 800)}`);
  }
  return data;
}

export async function composioUsageSnapshot(): Promise<{ toolCalls: string; rateRemaining: string }> {
  const apiKey = Deno.env.get("COMPOSIO_API_KEY");
  if (!apiKey) throw new Error("Missing COMPOSIO_API_KEY");
  const to = Date.now();
  const from = to - 30 * 24 * 60 * 60 * 1000;
  const attempts: Array<Record<string, string>> = [
    { "x-api-key": apiKey, "Content-Type": "application/json" },
    { "x-org-api-key": apiKey, "Content-Type": "application/json" },
    {
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
  ];
  let lastErr = "Composio usage unavailable";
  for (const headers of attempts) {
    const res = await fetch("https://backend.composio.dev/api/v3.1/project/usage/summary", {
      method: "POST",
      headers,
      body: JSON.stringify({ from, to, entity_types: ["tool_calls"] }),
    });
    lastComposioRateRemaining =
      res.headers.get("x-ratelimit-remaining") ??
      res.headers.get("X-RateLimit-Remaining") ??
      lastComposioRateRemaining;
    const raw = await res.json() as Record<string, unknown>;
    if (!res.ok) {
      lastErr = `Composio usage ${res.status}: ${JSON.stringify(raw).slice(0, 200)}`;
      continue;
    }
    const body = (raw.data && typeof raw.data === "object" ? raw.data : raw) as {
      entities?: Record<string, { total_quantity?: string; event_count?: number }>;
    };
    const tool = body.entities?.tool_calls;
    const toolCalls = tool?.total_quantity ??
      (tool?.event_count != null ? String(tool.event_count) : "");
    return {
      toolCalls: toolCalls || "0",
      rateRemaining: lastComposioRateRemaining || "-",
    };
  }
  throw new Error(lastErr);
}

export async function snapshotVendorCredits(run: RunLog) {
  const errors: string[] = [];
  try {
    const fc = await firecrawlCreditUsage();
    if (fc.remaining) run.firecrawl_credits_remaining = fc.remaining;
    if (fc.plan) run.firecrawl_plan_credits = fc.plan;
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
  }
  try {
    const usage = await composioUsageSnapshot();
    run.composio_tool_calls_30d = usage.toolCalls;
    run.composio_rate_remaining = usage.rateRemaining;
  } catch {
    if (lastComposioRateRemaining) run.composio_rate_remaining = lastComposioRateRemaining;
    if (!run.composio_tool_calls_30d) run.composio_tool_calls_30d = "-";
  }
  run.credits_error = errors.length ? errors.join(" | ").slice(0, 500) : "";
  run.composio_calls_this_run = String(composioCallCount);
}

export function airtableFields(run: RunLog): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of RUN_HEADERS) {
    const value = (run[key] ?? "").trim();
    fields[key] = value === "" ? "-" : value;
  }
  return fields;
}

export function extractRecordId(payload: unknown): string | null {
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

export async function ensureRunsTable() {
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
  const tables = (schema?.data?.tables ?? schema?.data?.data?.tables ?? []) as Array<{
    id?: string;
    name?: string;
    fields?: Array<{ name?: string }>;
  }>;
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
  } else {
    const table = tables.find((t) => t.name === tableName);
    const have = new Set((table?.fields ?? []).map((f) => f.name).filter(Boolean) as string[]);
    for (const name of RUN_HEADERS) {
      if (have.has(name) || !table?.id) continue;
      try {
        await composioExecute("AIRTABLE_CREATE_FIELD", {
          baseId,
          base_id: baseId,
          tableId: table.id,
          table_id: table.id,
          tableIdOrName: table.id,
          name,
          type: name.endsWith("_error") ? "multilineText" : "singleLineText",
        });
        have.add(name);
      } catch {
        /* column may already exist or toolkit args differ */
      }
    }
  }
  airtableReady = { baseId, table: tableName };
  return airtableReady;
}

const airtableRecordIds = new Map<string, string>();

export async function upsertRun(run: RunLog): Promise<string | null> {
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

export async function writeRun(run: RunLog) {
  const err = await upsertRun(run);
  if (err) {
    run.airtable_ok = "false";
    run.airtable_error = err.slice(0, 500);
    return err;
  }
  run.airtable_ok = "true";
  run.airtable_error = "";
  return null;
}
