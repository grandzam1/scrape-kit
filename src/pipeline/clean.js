/**
 * Deterministic cleanup from job.clean config — no LLM.
 */
export function cleanMarkdown(markdown, clean = {}, meta = {}) {
  let out = String(markdown ?? "");

  for (const phrase of clean.removePhrases || []) {
    if (!phrase) continue;
    out = out.split(phrase).join("");
  }

  for (const pattern of clean.removePatterns || []) {
    if (!pattern) continue;
    out = out.replace(new RegExp(pattern, "gimu"), "");
  }

  out = out.replace(/\n{3,}/g, "\n\n").trim();

  const title = meta.title || meta.ogTitle || "Scraped page";
  const source = meta.sourceURL || meta.url || "";

  const header = [`# ${title}`, "", source ? `Source: ${source}` : null, "", "---", ""]
    .filter((line) => line !== null)
    .join("\n");

  return `${header}${out}\n`;
}
