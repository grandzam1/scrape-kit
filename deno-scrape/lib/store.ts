/** Run snapshots: Deno KV when available, else in-memory (same isolate). */

export type ScrapeJob = {
  kind: "scrape";
  runId: string;
  sourceUrl: string;
  slug?: string;
  waitFor: number;
  onlyMainContent: boolean;
};

export type RunSnapshot = Record<string, unknown>;

const memoryRuns = new Map<string, RunSnapshot>();
let kvPromise: Promise<Deno.Kv | null> | null = null;

export async function getKv(): Promise<Deno.Kv | null> {
  if (!kvPromise) {
    kvPromise = (async () => {
      try {
        const openKv = (Deno as unknown as { openKv?: () => Promise<Deno.Kv> }).openKv;
        if (typeof openKv !== "function") return null;
        return await openKv.call(Deno);
      } catch (err) {
        console.error("Deno.openKv failed; using memory snapshots:", err);
        return null;
      }
    })();
  }
  return kvPromise;
}

export async function saveRunSnapshot(runId: string, snapshot: RunSnapshot) {
  const kv = await getKv();
  if (!kv) return;
  await kv.set(["runs", runId], { ...snapshot, updatedAt: new Date().toISOString() }, {
    expireIn: 1000 * 60 * 60 * 24 * 14,
  });
}

export async function getRunSnapshot(runId: string): Promise<RunSnapshot | null> {
  const kv = await getKv();
  if (!kv) return null;
  const row = await kv.get<RunSnapshot>(["runs", runId]);
  return row.value;
}

export async function saveRunSnapshotSafe(runId: string, snapshot: RunSnapshot) {
  const row = { ...snapshot, updatedAt: new Date().toISOString() };
  memoryRuns.set(runId, row);
  try {
    await saveRunSnapshot(runId, row);
  } catch (err) {
    console.error("KV saveRunSnapshot failed:", err);
  }
}

export async function getRunSnapshotSafe(runId: string): Promise<RunSnapshot | null> {
  try {
    const fromKv = await getRunSnapshot(runId);
    if (fromKv) return fromKv;
  } catch (err) {
    console.error("KV getRunSnapshot failed:", err);
  }
  return memoryRuns.get(runId) ?? null;
}

export async function saveAirtableRecordId(runId: string, recordId: string) {
  const kv = await getKv();
  if (!kv) return;
  try {
    await kv.set(["airtableRecord", runId], recordId, {
      expireIn: 1000 * 60 * 60 * 24 * 14,
    });
  } catch (err) {
    console.error("KV saveAirtableRecordId failed:", err);
  }
}

export async function loadAirtableRecordId(runId: string): Promise<string | null> {
  const kv = await getKv();
  if (!kv) return null;
  try {
    const row = await kv.get<string>(["airtableRecord", runId]);
    return row.value;
  } catch {
    return null;
  }
}
