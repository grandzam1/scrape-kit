import { logger } from "../lib/logger.js";
import {
  executeComposioTool,
  extractMarkdownFromComposioResult,
} from "../lib/composio.js";

function dig(obj, paths) {
  for (const p of paths) {
    let cur = obj;
    let ok = true;
    for (const key of p.split(".")) {
      if (cur && typeof cur === "object" && key in cur) cur = cur[key];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur != null) return cur;
  }
  return null;
}

/**
 * Firecrawl scrape via Composio SDK (connected account holds the API key).
 */
export async function scrapeWithFirecrawl(job) {
  const fc = job.firecrawl || {};
  const tools = job.composio?.tools || {};
  const slug = tools.scrape || "FIRECRAWL_SCRAPE";

  let formats = [...(fc.formats || ["markdown"])];
  // When image download is enabled, also request links (+ html if configured)
  // so we can discover more image URLs without hardcoding per site.
  if (job.images?.download) {
    if (!formats.includes("markdown")) formats.push("markdown");
    if (!formats.includes("links")) formats.push("links");
    if (job.images?.includeHtml && !formats.includes("html")) {
      formats.push("html");
    }
  }

  const args = {
    url: job.source.url,
    formats,
    onlyMainContent: fc.onlyMainContent ?? true,
    waitFor: fc.waitFor ?? 0,
  };

  if (fc.timeout !== undefined) args.timeout = fc.timeout;
  if (fc.includeTags) args.includeTags = fc.includeTags;
  if (fc.excludeTags) args.excludeTags = fc.excludeTags;
  if (fc.actions) args.actions = fc.actions;
  if (fc.location) args.location = fc.location;
  if (fc.jsonOptions) args.jsonOptions = fc.jsonOptions;

  logger.info(`Firecrawl (Composio) scrape: ${job.source.url}`);

  const result = await executeComposioTool(job, slug, args);
  const markdown = extractMarkdownFromComposioResult(result);

  if (!markdown || typeof markdown !== "string") {
    throw new Error(
      "Firecrawl via Composio returned no markdown. Check connected Firecrawl account and tool output.",
    );
  }

  const data = result?.data ?? {};
  const payload =
    typeof data === "object" && !Array.isArray(data)
      ? data.data && typeof data.data === "object"
        ? data.data
        : data
      : {};

  const metadata =
    payload.metadata ||
    dig(result, ["data.metadata", "data.data.metadata"]) ||
    {};

  const html =
    (typeof payload.html === "string" && payload.html) ||
    dig(result, ["data.html", "data.data.html"]) ||
    "";

  const links =
    (Array.isArray(payload.links) && payload.links) ||
    dig(result, ["data.links", "data.data.links"]) ||
    [];

  return {
    markdown,
    html: typeof html === "string" ? html : "",
    links: Array.isArray(links) ? links : [],
    metadata: {
      ...metadata,
      sourceURL: metadata.sourceURL || job.source.url,
      url: job.source.url,
    },
    raw: result,
  };
}
