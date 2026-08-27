import { fixMojibake, stripBom } from "./util.ts";

export function buildMarkdown(
  sourceUrl: string,
  title: string,
  body: string,
  extra: Record<string, string> = {},
): string {
  const scrapedAt = new Date().toISOString();
  const cleanTitle = fixMojibake(stripBom(title)).replace(/\s+/g, " ").trim();
  const cleanBody = fixMojibake(stripBom(body)).trim();
  const extraLines = Object.entries(extra)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");
  return `---
title: ${JSON.stringify(cleanTitle)}
source: ${sourceUrl}
scrapedAt: ${scrapedAt}
layout: scrape
${extraLines}
---

${cleanBody}
`;
}

export function parseFrontHash(md: string): string | null {
  const m = md.match(/^contentHash:\s*"?([a-f0-9]{64})"?/m);
  return m?.[1] ?? null;
}
