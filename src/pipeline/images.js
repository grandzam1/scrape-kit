import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { ensureDir, writeJson } from "../lib/config.js";
import { logger } from "../lib/logger.js";

const IMAGE_EXT_RE = /\.(avif|bmp|gif|jpe?g|png|svg|webp|ico)(\?|#|$)/i;
const MD_IMAGE_RE = /!\[[^\]]*]\((?<url><[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\)/g;
const HTML_IMG_RE = /<img[^>]+src=["']([^"']+)["']/gi;
const BARE_URL_RE =
  /https?:\/\/[^\s<>"'`()]+?\.(?:avif|bmp|gif|jpe?g|png|svg|webp|ico)(?:\?[^\s<>"'`]*)?/gi;

const PREVIEW_CONVERT_EXTS = new Set([".webp", ".avif"]);

function unwrapUrl(raw) {
  let u = String(raw || "").trim();
  if (u.startsWith("<") && u.endsWith(">")) u = u.slice(1, -1);
  u = u.replace(/&amp;/g, "&");
  return u;
}

function resolveUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl || undefined).href;
  } catch {
    return null;
  }
}

function isDownloadableImageUrl(url) {
  if (!url) return false;
  if (url.startsWith("data:")) return false;
  if (url.startsWith("blob:")) return false;
  try {
    const u = new URL(url);
    if (!/^https?:$/i.test(u.protocol)) return false;
    if (IMAGE_EXT_RE.test(u.pathname) || IMAGE_EXT_RE.test(url)) return true;
    if (/oaiusercontent|openai|cdn\.|cloudfront|imgur|giphy|twimg/i.test(u.hostname)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Collect unique image URLs from markdown, optional HTML, and Firecrawl links.
 */
export function extractImageUrls({ markdown = "", html = "", links = [], baseUrl }) {
  const found = new Set();

  for (const match of markdown.matchAll(MD_IMAGE_RE)) {
    const href = resolveUrl(unwrapUrl(match.groups?.url || match[1]), baseUrl);
    if (isDownloadableImageUrl(href)) found.add(href);
  }

  let m;
  const htmlRe = new RegExp(HTML_IMG_RE.source, HTML_IMG_RE.flags);
  while ((m = htmlRe.exec(html))) {
    const href = resolveUrl(unwrapUrl(m[1]), baseUrl);
    if (isDownloadableImageUrl(href)) found.add(href);
  }

  for (const match of markdown.matchAll(BARE_URL_RE)) {
    const href = resolveUrl(unwrapUrl(match[0]), baseUrl);
    if (isDownloadableImageUrl(href)) found.add(href);
  }

  for (const link of links) {
    const candidate = typeof link === "string" ? link : link?.url || link?.href;
    const href = resolveUrl(unwrapUrl(candidate), baseUrl);
    if (isDownloadableImageUrl(href)) found.add(href);
  }

  return [...found];
}

function extFromContentType(contentType) {
  const ct = String(contentType || "").split(";")[0].trim().toLowerCase();
  const map = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/x-icon": ".ico",
    "image/vnd.microsoft.icon": ".ico",
  };
  return map[ct] || null;
}

function extFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(IMAGE_EXT_RE);
    if (!match) return null;
    const ext = match[1].toLowerCase();
    return `.${ext === "jpeg" ? "jpg" : ext}`;
  } catch {
    return null;
  }
}

function shortHash(input) {
  return createHash("sha1").update(input).digest("hex").slice(0, 10);
}

/** Markdown-friendly relative path (./images/...) for IDE preview. */
function toMarkdownPath(imagesDirName, fileName) {
  return `./${imagesDirName}/${fileName}`.replace(/\\/g, "/");
}

async function downloadOne(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "scrape-kit/1.0 (+image-download)",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (contentType && !contentType.startsWith("image/") && !contentType.includes("svg")) {
      if (!/octet-stream|binary/i.test(contentType) && !IMAGE_EXT_RE.test(url)) {
        throw new Error(`Not an image content-type: ${contentType}`);
      }
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new Error("Empty body");
    return { contentType, buf };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Convert webp/avif → png so Cursor/VS Code markdown preview can display them.
 */
async function maybeConvertForPreview(buf, ext, enabled) {
  if (!enabled) return { buf, ext };
  if (!PREVIEW_CONVERT_EXTS.has(ext)) return { buf, ext };
  try {
    const sharp = (await import("sharp")).default;
    const png = await sharp(buf).png().toBuffer();
    return { buf: png, ext: ".png" };
  } catch (err) {
    logger.warn(`Preview convert skipped (${ext}): ${err.message || err}`);
    return { buf, ext };
  }
}

/**
 * Download images and optionally rewrite markdown to local relative paths.
 * Config (job.images):
 *   download, dir, rewriteMarkdown, maxImages, timeoutMs, previewFriendly
 */
export async function processImages(job, { markdown, html, links, outDir, baseUrl }) {
  const cfg = job.images || {};
  if (!cfg.download) {
    return { markdown, downloads: [], imagesDir: null, manifestPath: null };
  }

  const imagesDirName = cfg.dir || "images";
  const imagesDir = path.join(outDir, imagesDirName);
  ensureDir(imagesDir);

  const maxImages = cfg.maxImages ?? 100;
  const timeoutMs = cfg.timeoutMs ?? 20000;
  const previewFriendly = cfg.previewFriendly !== false;
  const urls = extractImageUrls({
    markdown,
    html: html || "",
    links: links || [],
    baseUrl,
  }).slice(0, maxImages);

  logger.info(`Images: found ${urls.length} candidate URL(s)`);

  const downloads = [];
  const urlToLocal = new Map();

  for (let i = 0; i < urls.length; i += 1) {
    const url = urls[i];
    const hash = shortHash(url);
    const index = String(i + 1).padStart(3, "0");

    try {
      const { contentType, buf } = await downloadOne(url, timeoutMs);
      let ext = extFromContentType(contentType) || extFromUrl(url) || ".img";
      let body = buf;

      const converted = await maybeConvertForPreview(body, ext, previewFriendly);
      body = converted.buf;
      ext = converted.ext;

      const finalName = `img-${index}-${hash}${ext}`;
      const finalPath = path.join(imagesDir, finalName);
      fs.writeFileSync(finalPath, body);

      const relative = toMarkdownPath(imagesDirName, finalName);
      urlToLocal.set(url, relative);
      downloads.push({
        url,
        file: relative,
        bytes: body.length,
        contentType: ext === ".png" && previewFriendly ? "image/png" : contentType,
        ok: true,
      });
      logger.info(`Downloaded image ${relative} (${body.length} bytes)`);
    } catch (err) {
      downloads.push({
        url,
        file: null,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
      logger.warn(`Image download failed: ${url} — ${err.message || err}`);
    }
  }

  let nextMarkdown = markdown;
  if (cfg.rewriteMarkdown !== false) {
    for (const [remote, local] of urlToLocal.entries()) {
      nextMarkdown = nextMarkdown.split(remote).join(local);
    }
  }

  const manifestPath = path.join(imagesDir, "manifest.json");
  writeJson(manifestPath, {
    scrapedAt: new Date().toISOString(),
    source: baseUrl,
    count: downloads.filter((d) => d.ok).length,
    failed: downloads.filter((d) => !d.ok).length,
    downloads,
  });

  return {
    markdown: nextMarkdown,
    downloads,
    imagesDir,
    manifestPath,
  };
}
