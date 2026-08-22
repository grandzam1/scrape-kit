---
layout: default
title: Scrapes
---

<section class="hero">
  <h1>Scraped pages</h1>
  <p class="lede">Paste a URL. Watch it scrape. Open the live page.</p>
</section>

<form id="scrape-form" class="scrape-form" novalidate>
  <label for="scrape-url">Page URL</label>
  <input id="scrape-url" name="url" type="text" inputmode="url" required placeholder="https://example.com/article" autocomplete="url">
  <button class="scrape-go" type="submit" id="scrape-go">Scrape</button>
</form>

<div id="scrape-progress" class="scrape-progress" hidden>
  <div class="scrape-gauge">
    <div class="scrape-ring" aria-hidden="true">
      <svg viewBox="0 0 48 48" width="48" height="48">
        <circle class="scrape-ring-track" cx="24" cy="24" r="18" />
        <circle id="scrape-ring-fill" class="scrape-ring-fill" cx="24" cy="24" r="18" />
      </svg>
      <span id="scrape-spinner" class="scrape-spinner"></span>
    </div>
    <div class="scrape-gauge-copy">
      <p id="scrape-count" class="scrape-count">0 / 7</p>
      <p id="scrape-status" class="scrape-status">Connecting…</p>
    </div>
  </div>
  <div class="scrape-meter" aria-hidden="true"><span id="scrape-bar"></span></div>
  <ol class="scrape-steps">
    <li data-step="queued" data-state="wait">Got your URL</li>
    <li data-step="scrape" data-state="wait">Firecrawl reading the page</li>
    <li data-step="layout" data-state="wait">Groq shaping the page</li>
    <li data-step="write" data-state="wait">Saving markdown</li>
    <li data-step="commit" data-state="wait">Pushing to GitHub</li>
    <li data-step="pages" data-state="wait">GitHub Pages building</li>
    <li data-step="done" data-state="wait">Live page ready</li>
  </ol>
</div>
<p id="scrape-error" class="scrape-error" hidden></p>
<p id="scrape-done" class="scrape-done" hidden>
  Your page:
  <a id="scrape-live" href="#"></a>
</p>

<div class="pages-head">
  <p class="pages-label">Your pages</p>
  <div class="view-switch" role="group" aria-label="How to show pages">
    <button type="button" class="view-btn" data-view="list" aria-pressed="true">List</button>
    <button type="button" class="view-btn" data-view="grid" aria-pressed="false">Grid</button>
  </div>
</div>
<ul class="pages" id="pages" data-view="list">
{% for p in site.pages %}
  {% if p.path contains "scrapes/" and p.path contains "page.md" %}
  <li>
    <a href="{{ p.url | relative_url }}">
      <strong>{{ p.title | default: p.path }}</strong>
      <span>{{ p.source | default: "" }}</span>
    </a>
  </li>
  {% endif %}
{% endfor %}
</ul>
