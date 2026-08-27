import {
  emptyRun,
  resetComposioCallCount,
  snapshotVendorCredits,
  writeRun,
} from "./airtable.ts";
import { scrapeFirecrawl } from "./firecrawl.ts";
import { githubGetFile, githubPutFile } from "./github.ts";
import { layoutWithGroq } from "./groq.ts";
import { PAGES_BASE, waitForLivePage } from "./http.ts";
import { buildMarkdown, parseFrontHash } from "./markdown.ts";
import { sha256Hex, slugFromUrl } from "./util.ts";

export type Progress = (step: string, extra?: Record<string, unknown>) => void;

export async function runScrape(
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
  resetComposioCallCount();
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
  run.groq_ok = "pending";

  const sheetStartErr = await writeRun(run);
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
    progress("done", payload);
    return payload;
  };

  try {
    progress("scrape");
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
      progress("layout", { skipped: true, reason: "unchanged" });
      progress("write", { skipped: true });
      progress("commit", { skipped: true });
      progress("pages", { pageUrl });
      if (waitPages) await waitForLivePage(pageUrl);
      return await finish("ok", { skipped: true });
    }

    if (sameBody && priorRaw) {
      run.skipped_unchanged = "false";
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
    throw err;
  }
}
