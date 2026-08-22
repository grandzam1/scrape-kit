import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixMojibake, looksLikeMojibake, stripBom } from "../src/lib/mojibake.js";

const samples = [
  ["itâ€™s", "it’s"],
  ["â†’", "→"],
  ["â€œmuteâ€", "“mute”"],
  ["already it’s fine", "already it’s fine"],
];

let failed = 0;
for (const [input, want] of samples) {
  const got = fixMojibake(input);
  const ok = got === want;
  if (!ok) failed += 1;
  console.log(ok ? "ok " : "FAIL", JSON.stringify(input), "=>", JSON.stringify(got), ok ? "" : `want ${JSON.stringify(want)}`);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scrapeRoot = path.join(root, "docs", "scrapes");
const files = readdirSync(scrapeRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join("docs", "scrapes", d.name, "page.md"));
for (const rel of files) {
  const abs = path.join(root, rel);
  const raw = readFileSync(abs);
  const bom = raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf;
  const before = stripBom(raw.toString("utf8"));
  const after = fixMojibake(before);
  writeFileSync(abs, after, "utf8");
  const leftover = [...after.matchAll(/â.{0,8}|ðŸ.{0,8}|Ã.{0,6}/g)].slice(0, 8).map((m) => m[0]);
  console.log(
    rel,
    "bom",
    bom,
    "changed",
    before !== after,
    "still_mojibake",
    looksLikeMojibake(after),
    leftover,
  );
}

if (failed) process.exit(1);
