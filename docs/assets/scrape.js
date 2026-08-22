const STEPS = [
  { id: "queued", label: "Got your URL" },
  { id: "scrape", label: "Firecrawl reading the page" },
  { id: "layout", label: "Groq shaping the page" },
  { id: "write", label: "Saving markdown" },
  { id: "commit", label: "Pushing to GitHub" },
  { id: "pages", label: "GitHub Pages building" },
  { id: "done", label: "Live page ready" },
];

const RING = 2 * Math.PI * 18;

function $(id) {
  return document.getElementById(id);
}

let displayPct = 0;
let targetPct = 0;
let crawlTimer = 0;
let raf = 0;
let busy = false;

function applyVisual(pct) {
  const bar = $("scrape-bar");
  const ring = $("scrape-ring-fill");
  const clamped = Math.max(0, Math.min(100, pct));
  if (bar) bar.style.width = `${clamped}%`;
  if (ring) {
    ring.style.strokeDasharray = String(RING);
    ring.style.strokeDashoffset = String(RING * (1 - clamped / 100));
  }
}

function tick() {
  displayPct += (targetPct - displayPct) * 0.18;
  if (Math.abs(targetPct - displayPct) < 0.2) displayPct = targetPct;
  else raf = requestAnimationFrame(tick);
  applyVisual(displayPct);
}

function setTarget(pct) {
  targetPct = Math.max(0, Math.min(100, pct));
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(tick);
}

function stopCrawl() {
  if (crawlTimer) {
    clearInterval(crawlTimer);
    crawlTimer = 0;
  }
}

function startCrawl(fromPct, ceiling) {
  stopCrawl();
  let n = fromPct;
  crawlTimer = setInterval(() => {
    n = Math.min(ceiling, n + 0.35);
    setTarget(n);
    if (n >= ceiling) stopCrawl();
  }, 120);
}

function setBusy(on) {
  busy = on;
  const spin = $("scrape-spinner");
  const progress = $("scrape-progress");
  if (spin) spin.hidden = !on;
  if (progress) progress.dataset.busy = on ? "true" : "false";
}

function setCount(current, total) {
  const el = $("scrape-count");
  if (el) el.textContent = `${current} / ${total}`;
}

function setStep(id, state) {
  const li = document.querySelector(`[data-step="${id}"]`);
  if (!li) return;
  li.dataset.state = state;
}

function resetUi() {
  stopCrawl();
  displayPct = 0;
  targetPct = 0;
  applyVisual(0);
  STEPS.forEach((s) => setStep(s.id, "wait"));
  setCount(0, STEPS.length);
  setBusy(true);
  $("scrape-progress").hidden = false;
  $("scrape-done").hidden = true;
  $("scrape-error").hidden = true;
  const warn = $("scrape-warn");
  if (warn) {
    warn.hidden = true;
    warn.textContent = "";
  }
  $("scrape-status").textContent = "Connecting…";
}

function applyStep(msg) {
  const total = typeof msg.total === "number" ? msg.total : STEPS.length;
  const idx = STEPS.findIndex((s) => s.id === msg.step);
  const current = idx < 0 ? 0 : idx + 1;

  STEPS.forEach((s, i) => {
    if (idx < 0) setStep(s.id, "wait");
    else if (i < idx) setStep(s.id, "done");
    else if (i === idx) setStep(s.id, "now");
    else setStep(s.id, "wait");
  });

  setCount(current, total);
  $("scrape-status").textContent = msg.label || STEPS[idx]?.label || msg.step;

  const floor = idx < 0 ? 0 : (idx / total) * 100;
  const stepPct = typeof msg.pct === "number" ? msg.pct : (current / total) * 100;
  setTarget(Math.max(floor, stepPct * 0.92));
  const ceiling = Math.min(99, stepPct - 0.5);
  startCrawl(Math.max(displayPct, floor), Math.max(ceiling, floor + 1));
}

function finishOk(msg) {
  stopCrawl();
  STEPS.forEach((s) => setStep(s.id, "done"));
  setCount(STEPS.length, STEPS.length);
  setTarget(100);
  setBusy(false);
  $("scrape-done").hidden = false;
  const a = $("scrape-live");
  a.href = msg.pageUrl;
  a.textContent = msg.pageUrl;
  $("scrape-status").textContent =
    msg.status === "degraded" ? "Live, with problems. Check the note below." : "Live page ready.";
  if (msg.status === "degraded") {
    const warn = $("scrape-warn");
    if (warn) {
      warn.hidden = false;
      const bits = [];
      if (msg.layoutSource === "raw") bits.push("Groq did not layout this page (raw Firecrawl).");
      if (msg.groqError) bits.push(msg.groqError);
      if (msg.sheetOk === "false" || msg.sheetError) bits.push("Runs log write failed.");
      warn.textContent = bits.join(" ") || "This scrape finished as degraded.";
    }
  }
}

function fail(text) {
  stopCrawl();
  setBusy(false);
  $("scrape-error").hidden = false;
  $("scrape-error").textContent = text;
  $("scrape-status").textContent = "Stopped.";
}

function startScrape(rawUrl) {
  const wsUrl = window.SCRAPE_WS;
  if (!wsUrl) {
    fail("Missing scrape server.");
    return;
  }

  let url = String(rawUrl || "").trim();
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    new URL(url);
  } catch {
    fail("That does not look like a web address.");
    return;
  }

  const go = $("scrape-go");
  go.disabled = true;
  resetUi();
  startCrawl(0, 8);

  let settled = false;
  const waitFor = url.includes("#") ? 8000 : 3000;
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    $("scrape-status").textContent = "Connected. Sending URL…";
    setCount(0, STEPS.length);
    ws.send(JSON.stringify({ url, waitFor }));
  };
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.step === "error") {
      settled = true;
      fail(msg.error || "Scrape failed.");
      go.disabled = false;
      return;
    }
    applyStep(msg);
    if (msg.step === "done" && msg.pageUrl) {
      settled = true;
      finishOk(msg);
      go.disabled = false;
    }
  };
  ws.onerror = () => {
    if (settled) return;
    settled = true;
    fail("Could not reach the scrape server.");
    go.disabled = false;
  };
  ws.onclose = () => {
    go.disabled = false;
    if (busy) setBusy(false);
    if (!settled) fail("The scrape stopped before it finished.");
  };
}

document.addEventListener("DOMContentLoaded", () => {
  applyVisual(0);
  const form = $("scrape-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = $("scrape-url").value.trim();
      if (url) startScrape(url);
    });
  }

  const pages = $("pages");
  const viewBtns = document.querySelectorAll(".view-btn");
  if (!pages || !viewBtns.length) return;

  const applyView = (view) => {
    const next = view === "grid" ? "grid" : "list";
    pages.dataset.view = next;
    viewBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.view === next));
    });
    try {
      localStorage.setItem("scrape-kit-view", next);
    } catch (e) {}
  };

  let saved = "list";
  try {
    saved = localStorage.getItem("scrape-kit-view") || "list";
  } catch (e) {}
  applyView(saved);
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => applyView(btn.dataset.view));
  });
});
