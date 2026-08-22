---
layout: default
title: Scrapes
---

<section class="hero">
  <h1>Scraped pages</h1>
  <p class="lede">scrapes, rendered like a cobalt changelog — no nested cards.</p>
</section>

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
