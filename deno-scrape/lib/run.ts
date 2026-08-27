import {
  emptyRun,
  resetComposioCallCount,
  snapshotVendorCredits,
  writeRun,
  type RunLog,
} from "./airtable.ts";
import { scrapeFirecrawl } from "./firecrawl.ts";
import { githubGetFile, githubPutFile } from "./github.ts";
import { layoutWithGroq } from "./groq.ts";
import { PAGES_BASE, waitForLivePage } from "./http.ts";
import { buildMarkdown, parseFrontHash } from "./markdown.ts";
import { saveRunSnapshotSafe, type ScrapeJob } from "./store.ts";
import { sha256Hex, slugFromUrl } from "./util.ts";

export type Progress = (step: string, extra?: Record<string, unknown>) => void;

function snapshotFromRun(run: RunLog, extra: Record<string, unknown> = {}) {
  return {
    runId: run.run_id,
    status: run.status,
    sourceUrl: run.source_url,
    slug: run.slug,
    pageUrl: run.page_url,
    layoutSource: run.layout_source,
    groqOk: run.groq_ok,
    groqError: run.groq_error,
    firecrawlOk: run.firecrawl_ok,
    firecrawlError: run.firecrawl_error,
    githubOk: run.github_ok,
    githubError: run.github_error,
    airtableOk: run.airtable_ok,
    airtableError: run.airtable_error,
    skippedUnchanged: run.skipped_unchanged,
    durationMs: run.duration_ms,
    actor: run.actor,
    ...extra,
  };
}

/** Create runId + KV/memory snapshot for async accept. Does not start work. */
export async function prepareScrapeJob(opts: {
  sourceUrl: string;
  slugInput?: string;
  waitFor?: number;
  onlyMainContent?: boolean;
}): Promise<{
  runId: string;
  slug: string;
  pageUrl: string;
  sourceUrl: string;
  status: string;
  job: ScrapeJob;
}> {
  const sourceUrl = opts.sourceUrl;
  const slug = String(opts.slugInput ?? slugFromUrl(sourceUrl)).replace(/[^a-zA-Z0-9_-]/g, "-");
  const pageUrl = `${PAGES_BASE}/scrapes/${slug}/page.html`;
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
  run.actor = "post";
  run.groq_ok = "pending";

  await saveRunSnapshotSafe(run.run_id, snapshotFromRun(run, { step: "queued" }));

  return {
    runId: run.run_id,
    slug,
    pageUrl,
    sourceUrl,
    status: "queued",
    job: {
      kind: "scrape",
      runId: run.run_id,
      sourceUrl,
      slug,
      waitFor: Number(opts.waitFor ?? 3000),
      onlyMainContent: opts.onlyMainContent !== false,
    },
  };
}

export async function runScrape(
  sourceUrl: string,
  slugInput: string | undefined,
  waitFor: number,
  onlyMainContent: boolean,
  progress: Progress,
  waitPages = false,
  existingRunId?: string,
) {
  const slug = String(slugInput ?? slugFromUrl(sourceUrl)).replace(/[^a-zA-Z0-9_-]/g, "-");
  const filePath = `docs/scrapes/${slug}/page.md`;
  const pageUrl = `${PAGES_BASE}/scrapes/${slug}/page.html`;
  const started = Date.now();
  resetComposioCallCount();
  let fragment = "";
  try {
    fragment = new URL(sourceUrl).hash.replace(/^#/, "");
  } catch {
    fragment = "";
  }

  const run = emptyRun();
  run.run_id = existingRunId || crypto.randomUUID();
  run.started_at = new Date().toISOString();
  run.status = "queued";
  run.source_url = sourceUrl;
  run.fragment = fragment;
  run.slug = slug;
  run.page_url = pageUrl;
  run.actor = waitPages ? "ws" : "post";
  run.groq_ok = "pending";

  const sheetStartErr = await writeRun(run);
  await saveRunSnapshotSafe(run.run_id, snapshotFromRun(run));
  progress("queued", {
    slug,
    pageUrl,
    runId: run.run_id,
    status: run.status,
    airtableOk: run.airtable_ok,
    airtableError: run.airtable_error,
  });

  const finish = async (status: string, extra: Record<string, unknown> = {}) => {
    run.status = status;
    run.finished_at = new Date().toISOString();
    run.duration_ms = String(Date.now() - started);
    await snapshotVendorCredits(run);
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
      airtableOk: run.airtable_ok,
      airtableError: run.airtable_error || sheetStartErr || sheetErr || "",
      firecrawlCreditsUsed: run.firecrawl_credits_used,
      firecrawlCreditsRemaining: run.firecrawl_credits_remaining,
      firecrawlPlanCredits: run.firecrawl_plan_credits,
      composioToolCalls30d: run.composio_tool_calls_30d,
      composioCallsThisRun: run.composio_calls_this_run,
      composioRateRemaining: run.composio_rate_remaining,
      ...extra,
    };
    await saveRunSnapshotSafe(run.run_id, { ...snapshotFromRun(run), ...payload });
    progress("done", payload);
    return payload;
  };

  const bump = async (step: string, extra: Record<string, unknown> = {}) => {
    await saveRunSnapshotSafe(run.run_id, snapshotFromRun(run, { step, ...extra }));
    progress(step, extra);
  };

  try {
    await bump("scrape");
    const scraped = await scrapeFirecrawl(sourceUrl, waitFor, onlyMainContent);
    run.firecrawl_ok = "true";
    if (scraped.creditsUsed) run.firecrawl_credits_used = scraped.creditsUsed;
    const contentHash = await sha256Hex(scraped.markdown);

    const existing = await githubGetFile(filePath);
    const sameBody = Boolean(existing && parseFrontHash(existing) === contentHash);
    const priorRaw = Boolean(existing && /layoutSource:\s*"raw"/.test(existing));

    if (sameBody && !priorRaw) {
      run.skipped_unchanged = "true";
      run.github_ok = "true";
      run.layout_source = "unchanged";
      run.groq_ok = "skipped";
      run.groq_error = "Same Firecrawl body as last publish; Groq was not called";
      await bump("layout", { skipped: true, reason: "unchanged" });
      await bump("write", { skipped: true });
      await bump("commit", { skipped: true });
      await bump("pages", { pageUrl });
      if (waitPages) await waitForLivePage(pageUrl);
      return await finish("ok", { skipped: true });
    }

    if (sameBody && priorRaw) {
      run.skipped_unchanged = "false";
    }

    await bump("layout");
    const laid = await layoutWithGroq(scraped.markdown, scraped.title, fragment || null);
    run.layout_source = laid.layoutSource;
    run.groq_ok = laid.layoutSource === "groq" ? "true" : "false";
    run.groq_error = ("groqError" in laid && laid.groqError) ? laid.groqError : "";

    await bump("write");
    const extra: Record<string, string> = {
      contentHash,
      pageType: laid.pageType,
      layoutSource: laid.layoutSource,
      runId: run.run_id,
    };
    if (run.groq_error) extra.groqError = run.groq_error;
    const markdown = buildMarkdown(sourceUrl, laid.title, laid.body, extra);

    await bump("commit");
    await githubPutFile(filePath, markdown, `scrape: update ${slug}`);
    run.github_ok = "true";

    await bump("pages", { pageUrl });
    let pagesOk = true;
    if (waitPages) pagesOk = await waitForLivePage(pageUrl);

    const degraded = run.groq_ok !== "true" || run.airtable_ok !== "true" || !pagesOk;
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
    await snapshotVendorCredits(run);
    await writeRun(run);
    await saveRunSnapshotSafe(run.run_id, snapshotFromRun(run, { error: message }));
    throw err;
  }
}

export async function runQueuedScrapeJob(job: ScrapeJob, progress: Progress = () => {}) {
  return await runScrape(
    job.sourceUrl,
    job.slug,
    job.waitFor,
    job.onlyMainContent,
    progress,
    false,
    job.runId,
  );
}

/** Prefer EdgeRuntime.waitUntil when present (Supabase-style). */
export function hasWaitUntil(): boolean {
  const g = globalThis as Record<string, unknown>;
  const er = g.EdgeRuntime as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  return Boolean(er && typeof er.waitUntil === "function");
}

export function tryWaitUntil(promise: Promise<unknown>): boolean {
  if (!hasWaitUntil()) return false;
  const g = globalThis as Record<string, unknown>;
  const er = g.EdgeRuntime as { waitUntil: (p: Promise<unknown>) => void };
  er.waitUntil(promise);
  return true;
}
