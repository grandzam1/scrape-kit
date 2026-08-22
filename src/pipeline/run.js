import path from "node:path";
import {
  resolveFromRoot,
  writeJson,
  writeText,
  ensureDir,
} from "../lib/config.js";
import { logger } from "../lib/logger.js";
import { scrapeWithFirecrawl } from "./scrape.js";
import { cleanMarkdown } from "./clean.js";
import { extractWithGroq, validateWithGroq } from "./groq.js";
import { assertExtractShape, resolveValidatedModel } from "./validate.js";
import { renderFullMarkdown, renderExtractMarkdown } from "./render.js";
import { processImages } from "./images.js";

function outPath(job, relativeOrName, fallbackDirFile) {
  const value = relativeOrName || fallbackDirFile;
  return path.isAbsolute(value) ? value : resolveFromRoot(value);
}

/**
 * Main pipeline.
 * mode:full  → V1 (no Groq)
 * mode:extract → V2 (Groq extract + validate)
 * images.download → optional local image assets
 */
export async function runJob(job) {
  logger.info(`Starting job "${job.name}" mode=${job.mode}`);

  const scraped = await scrapeWithFirecrawl(job);

  const rawPath = job.output.raw
    ? outPath(job, job.output.raw)
    : resolveFromRoot("raw", `${job.name}.json`);
  writeJson(rawPath, {
    scrapedAt: new Date().toISOString(),
    job: job.name,
    source: job.source,
    metadata: scraped.metadata,
    markdown: scraped.markdown,
    html: scraped.html,
    links: scraped.links,
    raw: scraped.raw,
  });
  logger.info(`Raw dump: ${rawPath}`);

  const cleaned = cleanMarkdown(scraped.markdown, job.clean, {
    ...scraped.metadata,
    sourceURL: scraped.metadata?.sourceURL || job.source.url,
    url: job.source.url,
  });

  const outDir = outPath(job, job.output.dir);
  ensureDir(outDir);
  const mdPath = path.join(outDir, job.output.markdown);

  if (job.mode === "full") {
    let markdown = renderFullMarkdown(cleaned);
    const imageResult = await processImages(job, {
      markdown,
      html: scraped.html,
      links: scraped.links,
      outDir,
      baseUrl: job.source.url,
    });
    markdown = imageResult.markdown;
    writeText(mdPath, markdown);
    logger.info(`Wrote markdown: ${mdPath}`);
    return {
      mode: "full",
      paths: {
        raw: rawPath,
        markdown: mdPath,
        ...(imageResult.imagesDir ? { images: imageResult.imagesDir } : {}),
        ...(imageResult.manifestPath
          ? { imageManifest: imageResult.manifestPath }
          : {}),
      },
      imagesDownloaded: imageResult.downloads.filter((d) => d.ok).length,
    };
  }

  let model = await extractWithGroq(job, cleaned);
  assertExtractShape(model);

  const maxRetries = job.groq.maxRetries ?? 1;
  let attempt = 0;
  while (true) {
    const validation = await validateWithGroq(job, cleaned, model);
    try {
      model = resolveValidatedModel(validation, model);
      assertExtractShape(model);
      break;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      attempt += 1;
      logger.warn(`Validation failed; retry extract ${attempt}/${maxRetries}`);
      model = await extractWithGroq(job, cleaned);
      assertExtractShape(model);
    }
  }

  let markdown = renderExtractMarkdown(model, job.source.url);
  const imageResult = await processImages(job, {
    markdown,
    html: scraped.html,
    links: scraped.links,
    outDir,
    baseUrl: job.source.url,
  });
  markdown = imageResult.markdown;
  writeText(mdPath, markdown);

  const modelPath = path.join(outDir, job.output.model || "model.json");
  writeJson(modelPath, model);

  logger.info(`Wrote markdown: ${mdPath}`);
  logger.info(`Wrote model: ${modelPath}`);

  return {
    mode: "extract",
    paths: {
      raw: rawPath,
      markdown: mdPath,
      model: modelPath,
      ...(imageResult.imagesDir ? { images: imageResult.imagesDir } : {}),
      ...(imageResult.manifestPath
        ? { imageManifest: imageResult.manifestPath }
        : {}),
    },
    imagesDownloaded: imageResult.downloads.filter((d) => d.ok).length,
  };
}
