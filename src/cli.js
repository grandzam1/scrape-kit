#!/usr/bin/env node
import path from "node:path";
import dotenv from "dotenv";
import { loadJobConfig, resolveFromRoot } from "./lib/config.js";
import { exitFail, exitOk } from "./lib/exit.js";
import { logger } from "./lib/logger.js";
import { runJob } from "./pipeline/run.js";

dotenv.config({ path: resolveFromRoot(".env") });

function parseArgs(argv) {
  const args = { job: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--job" || a === "-j") {
      args.job = argv[i + 1];
      i += 1;
    } else if (a === "--help" || a === "-h") {
      args.help = true;
    }
  }
  return args;
}

function printHelp() {
  console.log(`scrape-kit — config-driven scrape via Composio (Firecrawl + Groq)

Usage:
  node src/cli.js --job jobs/<name>.yaml

Requires COMPOSIO_API_KEY in .env (Firecrawl/Groq keys stay in Composio).

Examples:
  node src/cli.js --job jobs/chatgpt-full.yaml
  node src/cli.js --job jobs/chatgpt-last-2.yaml

New scrape without code changes:
  1. Copy jobs/example-generic.yaml
  2. Edit url / mode / output / groq.promptFile
  3. Run with --job
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.job) {
    printHelp();
    if (!args.job) process.exit(args.help ? 0 : 1);
    return;
  }

  const job = loadJobConfig(args.job);
  logger.info(`Loaded job: ${path.relative(job._meta.root, job._meta.jobPath)}`);

  const result = await runJob(job);
  if (typeof result.imagesDownloaded === "number") {
    logger.info(`images downloaded: ${result.imagesDownloaded}`);
  }
  exitOk(`Job "${job.name}" completed (${result.mode})`, result.paths);
}

main().catch(exitFail);
