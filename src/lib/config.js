import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, "../..");

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function deepMerge(base, override) {
  if (!isPlainObject(base)) return override ?? base;
  const out = { ...base };
  if (!isPlainObject(override)) return out;
  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export function resolveFromRoot(...parts) {
  return path.resolve(ROOT, ...parts);
}

export function loadYamlFile(absPath) {
  if (!fs.existsSync(absPath)) {
    throw new Error(`File not found: ${absPath}`);
  }
  return YAML.parse(fs.readFileSync(absPath, "utf8"));
}

function validateJob(job) {
  const errors = [];
  if (!job?.name) errors.push("name is required");
  if (!["full", "extract"].includes(job?.mode)) {
    errors.push('mode must be "full" or "extract"');
  }
  if (!job?.source?.url) errors.push("source.url is required");
  if (!job?.source?.type) errors.push("source.type is required");
  if (!job?.output?.dir) errors.push("output.dir is required");
  if (!job?.output?.markdown) errors.push("output.markdown is required");
  if (job.mode === "extract" && !job?.groq?.enabled) {
    errors.push('mode "extract" requires groq.enabled: true');
  }
  if (job.mode === "extract" && !job?.groq?.promptFile) {
    errors.push('mode "extract" requires groq.promptFile');
  }
  if (errors.length) {
    throw new Error(`Invalid job config:\n- ${errors.join("\n- ")}`);
  }
}

/**
 * Merge defaults.yaml + job YAML. No hardcoded URLs/prompts in code.
 */
export function loadJobConfig(jobPath) {
  const absJob = path.isAbsolute(jobPath)
    ? jobPath
    : resolveFromRoot(jobPath);
  const defaults = loadYamlFile(resolveFromRoot("config/defaults.yaml"));
  const job = loadYamlFile(absJob);
  const merged = deepMerge(defaults, job);
  validateJob(merged);

  return {
    ...merged,
    _meta: {
      jobPath: absJob,
      root: ROOT,
    },
  };
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeText(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
}

export function writeJson(filePath, data) {
  writeText(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}
