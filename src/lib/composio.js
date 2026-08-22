import { Composio } from "@composio/core";
import { logger } from "./logger.js";

let client = null;

/**
 * Single Composio client. Auth for Firecrawl + Groq lives in Composio
 * connected accounts — only COMPOSIO_API_KEY is required locally.
 */
export function getComposio(job = {}) {
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey) {
    throw new Error(
      "COMPOSIO_API_KEY is missing. Set it in .env (Firecrawl/Groq keys stay in Composio).",
    );
  }

  if (client) return client;

  const cfg = job.composio || {};
  const toolkitVersions = cfg.toolkitVersions || {};
  const init = { apiKey };

  if (Object.keys(toolkitVersions).length) {
    init.toolkitVersions = toolkitVersions;
  }

  client = new Composio(init);
  return client;
}

export function getComposioUserId(job = {}) {
  return (
    process.env.COMPOSIO_USER_ID ||
    job.composio?.userId ||
    "default"
  );
}

/**
 * Execute a Composio tool and normalize the envelope.
 */
export async function executeComposioTool(job, slug, args) {
  const composio = getComposio(job);
  const userId = getComposioUserId(job);
  const cfg = job.composio || {};

  const params = {
    userId,
    arguments: args,
  };

  // Prefer pinned toolkit version from config; otherwise allow latest for agentic use.
  if (cfg.useLatest) {
    params.dangerouslySkipVersionCheck = true;
  } else if (cfg.version) {
    params.version = cfg.version;
  } else {
    // Per-toolkit versions may already be set on the client; still allow latest fallback.
    params.dangerouslySkipVersionCheck = true;
  }

  if (cfg.connectedAccountId) {
    params.connectedAccountId = cfg.connectedAccountId;
  }

  // Optional per-toolkit connected accounts (job YAML or env)
  const accountMap = {
    firecrawl:
      cfg.connectedAccounts?.firecrawl ||
      process.env.COMPOSIO_FIRECRAWL_ACCOUNT_ID,
    groqcloud:
      cfg.connectedAccounts?.groqcloud ||
      process.env.COMPOSIO_GROQ_ACCOUNT_ID,
  };
  if (!params.connectedAccountId && slug.startsWith("FIRECRAWL") && accountMap.firecrawl) {
    params.connectedAccountId = accountMap.firecrawl;
  }
  if (!params.connectedAccountId && slug.startsWith("GROQCLOUD") && accountMap.groqcloud) {
    params.connectedAccountId = accountMap.groqcloud;
  }

  logger.info(`Composio execute: ${slug}`);
  const result = await composio.tools.execute(slug, params);

  if (result?.successful === false) {
    throw new Error(result?.error || `Composio tool failed: ${slug}`);
  }

  return result;
}

/** Dig markdown out of various Composio/Firecrawl response shapes. */
export function extractMarkdownFromComposioResult(result) {
  const data = result?.data ?? result;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return extractMarkdownFromComposioResult({ data: parsed });
    } catch {
      // plain markdown string
      if (data.trim().startsWith("#") || data.length > 50) return data;
    }
  }

  if (!data || typeof data !== "object") {
    return null;
  }

  return (
    data.markdown ??
    data?.data?.markdown ??
    data?.content?.markdown ??
    data?.data?.data?.markdown ??
    (typeof data.content === "string" ? data.content : null) ??
    null
  );
}

/** Dig chat completion text from Groq/Composio envelope. */
export function extractChatContentFromComposioResult(result) {
  const data = result?.data ?? result;

  let payload = data;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return payload;
    }
  }

  return (
    payload?.choices?.[0]?.message?.content ??
    payload?.data?.choices?.[0]?.message?.content ??
    payload?.message?.content ??
    payload?.content ??
    (typeof payload === "string" ? payload : null)
  );
}
