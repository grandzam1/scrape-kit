import path from "node:path";
import { readText, resolveFromRoot } from "../lib/config.js";
import { logger } from "../lib/logger.js";
import {
  executeComposioTool,
  extractChatContentFromComposioResult,
} from "../lib/composio.js";

function applyTemplate(template, vars) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    if (value === undefined || value === null) return "";
    return typeof value === "string" ? value : JSON.stringify(value, null, 2);
  });
}

function extractJson(text) {
  const trimmed = String(text).trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Groq response was not valid JSON");
  }
}

/**
 * Load configurable prompt file and call Groq via Composio SDK.
 */
export async function callGroq({
  job,
  promptFile,
  model,
  temperature,
  responseFormat,
  vars,
}) {
  const absPrompt = path.isAbsolute(promptFile)
    ? promptFile
    : resolveFromRoot(promptFile);
  const template = readText(absPrompt);
  const prompt = applyTemplate(template, vars || {});

  const tools = job.composio?.tools || {};
  const slug = tools.chat || "GROQCLOUD_GROQ_CREATE_CHAT_COMPLETION";

  logger.info(`Groq (Composio) model=${model} prompt=${promptFile}`);

  const args = {
    model,
    temperature: temperature ?? 0,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  // Prefer JSON via prompt instructions; some Groq tool schemas omit response_format.
  if (responseFormat === "json_object") {
    args.messages.unshift({
      role: "system",
      content: "Respond with a single valid JSON object only. No markdown fences.",
    });
  }

  const result = await executeComposioTool(job, slug, args);
  const content = extractChatContentFromComposioResult(result);

  if (!content) {
    throw new Error("Groq via Composio returned empty message content");
  }

  if (responseFormat === "json_object") {
    return extractJson(content);
  }
  return content;
}

export async function extractWithGroq(job, cleanedMarkdown) {
  const g = job.groq;
  return callGroq({
    job,
    promptFile: g.promptFile,
    model: g.model,
    temperature: g.temperature,
    responseFormat: g.responseFormat,
    vars: {
      ...(g.vars || {}),
      markdown: cleanedMarkdown,
    },
  });
}

export async function validateWithGroq(job, cleanedMarkdown, model) {
  const g = job.groq;
  if (!g.validatePromptFile) {
    return { valid: true, errors: [], corrected_model: model };
  }

  return callGroq({
    job,
    promptFile: g.validatePromptFile,
    model: g.model,
    temperature: g.temperature,
    responseFormat: g.responseFormat,
    vars: {
      ...(g.vars || {}),
      markdown: cleanedMarkdown,
      model_json: JSON.stringify(model, null, 2),
    },
  });
}
