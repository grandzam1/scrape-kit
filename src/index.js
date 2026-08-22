/**
 * Programmatic entry — same pipeline as CLI.
 *
 *   import { runJob, loadJobConfig } from "./src/index.js";
 *   const job = loadJobConfig("jobs/chatgpt-full.yaml");
 *   const result = await runJob(job);
 */
export { loadJobConfig } from "./lib/config.js";
export { runJob } from "./pipeline/run.js";
