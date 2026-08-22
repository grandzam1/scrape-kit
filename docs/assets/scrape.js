const STEPS = [
  { id: "queued", label: "Got your URL" },
  { id: "scrape", label: "Reading the page" },
  { id: "write", label: "Saving markdown" },
  { id: "commit", label: "Pushing to GitHub" },
  { id: "pages", label: "GitHub Pages building" },
  { id: "done", label: "Live page ready" },
];

function $(id) {
  return document.getElementById(id);
}

function setBar(pct) {
  const bar = $("scrape-bar");
  if (bar) bar.style.width = `${pct}%`;
}

function setStep(id, state) {
  const li = document.querySelector(`[data-step="${id}"]`);
  if (!li) return;
  li.dataset.state = state;
}

function resetUi() {
  STEPS.forEach((s) => setStep(s.id, "wait"));
  setBar(0);
  $("scrape-progress").hidden = false;
  $("scrape-done").hidden = true;
  $("scrape-error").hidden = true;
  $("scrape-status").textContent = "Connecting…";
}

function startScrape(url) {
  const wsUrl = window.SCRAPE_WS;
  if (!wsUrl) {
    $("scrape-error").hidden = false;
    $("scrape-error").textContent = "Missing scrape server.";
    return;
  }

  const go = $("scrape-go");
  go.disabled = true;
  resetUi();

  const ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    $("scrape-status").textContent = "Connected. Sending URL…";
    ws.send(JSON.stringify({ url }));
  };
  ws.onmessage = (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.step === "error") {
      $("scrape-error").hidden = false;
      $("scrape-error").textContent = msg.error || "Scrape failed.";
      $("scrape-status").textContent = "Stopped.";
      go.disabled = false;
      return;
    }
    const idx = STEPS.findIndex((s) => s.id === msg.step);
    STEPS.forEach((s, i) => {
      if (i < idx) setStep(s.id, "done");
      else if (i === idx) setStep(s.id, "now");
    });
    setBar(typeof msg.pct === "number" ? msg.pct : 0);
    $("scrape-status").textContent = msg.label || msg.step;
    if (msg.step === "done" && msg.pageUrl) {
      STEPS.forEach((s) => setStep(s.id, "done"));
      setBar(100);
      $("scrape-done").hidden = false;
      const a = $("scrape-live");
      a.href = msg.pageUrl;
      a.textContent = msg.pageUrl;
      $("scrape-status").textContent = "Live page ready.";
      go.disabled = false;
    }
  };
  ws.onerror = () => {
    $("scrape-error").hidden = false;
    $("scrape-error").textContent = "Could not reach the scrape server.";
    go.disabled = false;
  };
  ws.onclose = () => {
    go.disabled = false;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("scrape-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const url = $("scrape-url").value.trim();
    if (url) startScrape(url);
  });
});
