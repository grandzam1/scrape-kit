const secret = Deno.env.get("SCRAPE_SECRET");
if (!secret) throw new Error("SCRAPE_SECRET missing");
const base = "https://zamplandoc-scrape.grandzam1.deno.net";

const res = await fetch(`${base}/scrape`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-scrape-secret": secret,
  },
  body: JSON.stringify({ url: "https://example.com", slug: "phase3-async-smoke" }),
});

console.log("HTTP", res.status);
console.log("X-Run-Id", res.headers.get("X-Run-Id"));
const runIdHdr = res.headers.get("X-Run-Id");

const reader = res.body?.getReader();
if (!reader) throw new Error("no body");
const dec = new TextDecoder();
let buf = "";
let runId = runIdHdr;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += dec.decode(value, { stream: true });
  const parts = buf.split("\n");
  buf = parts.pop() ?? "";
  for (const line of parts) {
    if (!line.trim()) continue;
    console.log("NDJSON", line.slice(0, 200));
    try {
      const j = JSON.parse(line);
      if (j.runId) runId = j.runId;
    } catch { /* */ }
    if (runId) {
      const snap = await fetch(`${base}/runs/${runId}`).then((r) => r.json());
      console.log("poll", snap.status, snap.step);
    }
  }
}
if (runId) {
  const final = await fetch(`${base}/runs/${runId}`).then((r) => r.json());
  console.log("FINAL", JSON.stringify(final));
}
