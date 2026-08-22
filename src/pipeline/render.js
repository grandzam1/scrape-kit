/**
 * Render final markdown from either cleaned full page or extract model.
 */
export function renderFullMarkdown(cleanedMarkdown) {
  return cleanedMarkdown.endsWith("\n")
    ? cleanedMarkdown
    : `${cleanedMarkdown}\n`;
}

export function renderExtractMarkdown(model, sourceUrl) {
  const title = model.title || "Extracted exchanges";
  const lines = [
    `# ${title}`,
    "",
    sourceUrl ? `Source: ${sourceUrl}` : null,
    "",
    "---",
    "",
  ].filter((l) => l !== null);

  const exchanges = model.exchanges || [];
  exchanges.forEach((ex, i) => {
    lines.push(`## Exchange ${i + 1}`);
    lines.push("");
    lines.push("### You said:");
    lines.push("");
    lines.push(ex.user_message || "");
    lines.push("");
    lines.push("### Assistant said:");
    lines.push("");
    lines.push(ex.assistant_reply || "");
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}
