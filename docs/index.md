---
layout: default
title: Scrapes
---

<section class="hero">
  <h1>Scraped pages</h1>
  <p class="lede">Paste a URL. Watch it scrape. Open the live page.</p>
  <button class="theme-toggle" type="button" data-theme-toggle>Dark mode</button>
</section>

<form id="scrape-form" class="scrape-form">
  <label for="scrape-url">Page URL</label>
  <input id="scrape-url" name="url" type="url" required placeholder="https://example.com/article" autocomplete="url">
  <button class="theme-toggle" type="submit" id="scrape-go">Scrape</button>
</form>

<div id="scrape-progress" class="scrape-progress" hidden>
  <div class="scrape-meter" aria-hidden="true"><span id="scrape-bar"></span></div>
  <p id="scrape-status" class="scrape-status">Connecting…</p>
  <ol class="scrape-steps">
    <li data-step="queued" data-state="wait">Got your URL</li>
    <li data-step="scrape" data-state="wait">Reading the page</li>
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

<ul class="list">
{% for p in site.pages %}
  {% if p.path contains "scrapes/" and p.path contains "page.md" %}
  <li>
    <a href="{{ p.url | relative_url }}">
      <strong>{{ p.title | default: p.path }}</strong>
      <span>{{ p.source | default: p.path }}</span>
    </a>
  </li>
  {% endif %}
{% endfor %}
</ul>
