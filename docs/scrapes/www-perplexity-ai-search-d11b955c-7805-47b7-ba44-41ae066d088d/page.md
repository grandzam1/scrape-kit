---
title: "Why do some .md page more beautiful than others even when using same .md data"
source: https://www.perplexity.ai/search/d11b955c-7805-47b7-ba44-41ae066d088d
scrapedAt: 2026-08-22T03:36:44.269Z
layout: scrape
---

![Profile avatar](https://imagedelivery.net/MPdwyYSWT8IY7lxgN3x3Uw/c3fc6512-d12e-40cc-bbe7-0150e2ba4400/thumbnail)

![Profile avatar](https://imagedelivery.net/MPdwyYSWT8IY7lxgN3x3Uw/c3fc6512-d12e-40cc-bbe7-0150e2ba4400/thumbnail)

Answer

Links

Images

Share

Why do some .md page more beautiful than others even when using same .md data

Looking up common reasons for varying Markdown page appearance

Some `.md` pages look more beautiful than others **even with the same Markdown content** because Markdown itself is just plain text—the _appearance_ comes entirely from how that text is **rendered into HTML and styled with CSS**.markdownmonster.west-wind+2

## Core reason: Markdown ≠ styling

Markdown defines **structure** (headings, lists, code blocks, etc.), not **visual design**. When you open a `.md` file:markdownmonster.west-wind+1

- One viewer may render it with GitHub’s `github-markdown.css` theme.deepwiki+1

- Another may use Jekyll’s `cayman` theme, Obsidian’s Minimal theme, or a custom stylesheet.stackoverflow+1

- A static site may inject extra CSS, Google Fonts, syntax highlighting, and layout rules.markdownviewer+1


Same `.md` data + different CSS/themes = different visual result.markdownmonster.west-wind+1

## What actually makes one page “prettier”

These are the main factors that vary between renderers:

- **Theme / CSS stylesheet** – Controls fonts, colors, spacing, line length, and element styles.stackoverflow+2

- **Typography** – Font family, size, line-height, and heading hierarchy dramatically affect readability and aesthetics.markdownviewer+1

- **Layout & spacing** – Max-width, margins, padding, and responsive behavior make content feel clean or cramped.md-converter+1

- **Syntax highlighting** – Code blocks can look basic or highly polished depending on the highlighter and theme.markdownviewer+1

- **Additional elements** – Tables, blockquotes, images, callouts, and custom HTML/CSS can enhance or break the design.md-converter+1

- **Render engine differences** – Even within the same app, “live preview” and “reading mode” may use different engines and HTML output.[forum.obsidian](https://forum.obsidian.md/t/how-to-avoid-different-formatting-in-reading-vs-live-preview-mode/69144)


## Example: same Markdown, different look

Imagine this Markdown:

````
text

# Heading

Some text with a [link](https://example.com) and a code block:

```js
console.log("hello");
```
````

- On **GitHub**, it gets GitHub’s standard typography, spacing, and code colors.deepwiki+1

- On a **Jekyll site** with a minimal theme, it may look sparse and wide.stackoverflow+1

- In a **custom docs site**, it might have a sidebar, custom fonts, colored callouts, and a narrow, readable text column.markdownviewer+1


The `.md` is identical; the surrounding HTML/CSS is not.

## How to make your own `.md` pages consistently beautiful

If you control the rendering environment:

- **Pick or create a good CSS theme** for your Markdown renderer (e.g., `github-markdown-css`, a docs theme, or your own).markdownlang+2

- **Set readable typography**: limit line length (~60–75 chars), use comfortable line-height, and choose clean fonts.markdownlang+1

- **Add syntax highlighting** for code blocks with a consistent theme.markdownviewer+1

- **Use a consistent renderer** (same app, same theme, same export settings) for all your pages.markdownmonster.west-wind+1

- For PDFs/exports, **tune print CSS**: margins, page breaks, fonts, and table widths.md-converter+1


If you tell me where you’re viewing these `.md` pages (GitHub, Obsidian, a static site, VS Code, etc.), I can suggest specific themes or CSS tweaks to make them consistently look great.

![](https://www.google.com/s2/favicons?sz=128&domain=markdownmonster.west-wind.com)

![](https://www.google.com/s2/favicons?sz=128&domain=markdownviewer.org)

![](https://www.google.com/s2/favicons?sz=128&domain=kevin.burke.dev)

15 sources

What’s the best style theme

Finding the best style theme

There’s no single “best” theme for everyone, but there _are_ clear winners depending on where you’re rendering your Markdown and what you care about (readability, code, aesthetics, minimalism).

Below are practical recommendations by context.

* * *

## If you’re rendering Markdown on the web (docs, READMEs, static sites)

**Best overall baseline:**

**`github-markdown-css`** (or a close GitHub-style theme)

- Very familiar, clean, and professional-looking.[reddit](https://www.reddit.com/r/UXDesign/comments/1nush9h/topnotch_uiux_for_documentation_on_the_web/)

- Good defaults for headings, lists, tables, and code blocks.[reddit](https://www.reddit.com/r/UXDesign/comments/1nush9h/topnotch_uiux_for_documentation_on_the_web/)

- Easy to customize with your own CSS on top.[deepwiki](https://deepwiki.com/sindresorhus/github-markdown-css/4-markdown-elements-styling)


**Good alternatives / upgrades:**

- **MD-Juice** – GitHub-style but explicitly designed to be easily customizable with CSS.[deepwiki](https://deepwiki.com/sindresorhus/github-markdown-css/4-markdown-elements-styling)

- **markdown-css collections** (e.g., the GitCode “8 CSS templates” set) – multiple ready-made themes you can drop in and switch between.[reddit](https://www.reddit.com/r/SideProject/comments/1q7d66x/githubstyle_markdown_easily_customizable_with_css/)


**When to choose what:**

- Want **standard, trustworthy docs look**: use GitHub-style (`github-markdown-css` or MD-Juice).reddit+1

- Want **multiple design options** to test: use a markdown-css theme pack and A/B test a few.[reddit](https://www.reddit.com/r/SideProject/comments/1q7d66x/githubstyle_markdown_easily_customizable_with_css/)

- Building a **full documentation site**: pair a Markdown CSS with a docs framework (e.g., Docusaurus, VitePress, Mintlify) that already has polished themes.


* * *

## If you’re using Obsidian for notes / knowledge base

For long-form writing and daily use, the community consistently recommends:

**Top picks in 2026:**

- **Minimal**

  - Extremely popular, clean, and highly configurable via the _Minimal Theme Settings_ plugin.[blog.gitcode](https://blog.gitcode.com/681c3995ca6e59739941af1a128e43bc.html)

  - Great for focusing on content; hides UI clutter; fine control over fonts, line width, and contrast.[blog.gitcode](https://blog.gitcode.com/681c3995ca6e59739941af1a128e43bc.html)
- **Evergreen**

  - Praised for serene aesthetic and excellent readability, especially for long writing sessions.[x](https://x.com/aoseluo/status/2044364746850459928)

  - Good balance of style and comfort; not overly flashy.[x](https://x.com/aoseluo/status/2044364746850459928)
- **Cupertino (light)**

  - Often cited as having a “fantastic aesthetic” and modern, IDE-like feel in light mode.[notes-automate](https://notes-automate.com/posts/best-obsidian-themes-for-long-form-writing-focus/)

**For programmers / technical notes:**

- Themes that emphasize:

  - Clear monospace fonts

  - Good code block padding

  - Readable syntax colors in both light and dark modesreddit+1

Many users end up choosing **Minimal** or **Evergreen** as their main theme, then tweaking fonts and spacing to taste.blog.gitcode+2

* * *

## If you’re in a code editor (VS Code, Zed, etc.)

- **VS Code’s built-in Markdown preview** is already quite decent and GitHub-like.[obsidianthemes](https://www.obsidianthemes.com/blog/best-obsidian-themes-for-programmers)

- For more control:

  - Use extensions that let you inject custom CSS into the preview.[obsidianthemes](https://www.obsidianthemes.com/blog/best-obsidian-themes-for-beginners)

  - Or export/render through a static site generator where you can apply a full theme.

* * *

## How to choose _your_ best theme

Ask yourself:

1. **Where will this be read?**

   - Web docs → GitHub-style / MD-Juice / docs-framework theme.reddit+1

   - Personal notes → Obsidian theme (Minimal, Evergreen, etc.).blog.gitcode+2

   - Code-heavy notes → programmer-focused theme with strong code styling.[reddit](https://www.reddit.com/r/ObsidianMD/comments/1of24xa/which_obsidian_theme_feels_most_like_a_modern_ide/)
2. **What matters most?**

   - Readability for long sessions → prioritize typography, line width, contrast.x+1

   - Aesthetic “wow” factor → look at theme screenshots and demos, but test with real content.[reddit](https://www.reddit.com/r/ObsidianMD/comments/1v4ktv5/looking_for_an_obsidian_theme_similar_to_octarine/)

   - Consistency with your brand → pick a theme you can customize with your colors/fonts.github+1
3. **Test with your actual content**

Open a few of your real `.md` files in 2–3 candidate themes and see which feels best after 10–15 minutes of reading/writing.x+1


* * *

If you tell me:

- where you’re viewing these `.md` files (GitHub, Obsidian, a website, VS Code, etc.), and

- whether you care more about **beauty**, **readability**, or **code presentation**,


I can recommend 1–2 specific themes and show you exactly how to apply them.

![](https://www.google.com/s2/favicons?sz=128&domain=reddit.com)

![](https://www.google.com/s2/favicons?sz=128&domain=deepwiki.com)

![](https://www.google.com/s2/favicons?sz=128&domain=blog.gitcode.com)

16 sources

What’s the cause of tis text and how to fix

![Attachment](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/images/71141857/521a1623-5fed-46b7-865e-ae1980d55ce2/image.jpeg?AWSAccessKeyId=ASIA2F3EMEYE346QTYNY&Signature=Hr4d3ynRkWRpGwBMGqE0VIcAvXU%3D&x-amz-security-token=IQoJb3JpZ2luX2VjEOz%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJIMEYCIQDuEnhPIYS5dmzVnMhGA6Oj1W3PLDF0v7PD%2Bwi8H0DCkwIhAMRz2FWZupsP2pO4o8cJFT5tIRagUknslm4SBpDtUoDRKvwECLX%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQARoMNjk5NzUzMzA5NzA1Igx56JW7FwTVPPOObzkq0AQ1ySDAJm65eDPDz5esQZwUGsIoIGGdjRNGY%2FfddkyarBRwTL%2FfgsPczA%2BMmHcJY14fpK8Zmc74kC81H28v0jA%2FBIO%2Bl0uc9K%2BCiORJflnaS2JmzR0l7K3QZzhkJAdrJjP1mYVWhWDFwzW0bvNhgyp2LarKbshaH09rWVeN%2Fb%2B7jso7ABy3jR1fg%2BgFAshh250D2nJTWOzl6p80ebyHRzh%2F1DEDl7TgdNeACreedWhhgRiaeGwWjYaT974O4ky5O1nwGv7CIOnFafQeUDF1otHi1STWfTwV%2Bd6jJQKPYVs2bK7UMiy9d6mEd1ODy5T8vU5rVx%2BACT%2F65QWt7FXIh%2BD3JCOC34aFTPXf4bo0qIJoFHEpuYsE4LdJhQmSpyJBOr13kwUAFxNOe0Xqozr0qQvUCLnl1hubDixclj1nPtaI6hwIc4a3rq9yLxWs5kWAhlmb1R8y90JwSDIE8tHh%2FV3zVDfTWFBuJsO%2FFcpreu1DSv%2BnkiRksXkAnuSShilSJTaRWmMWWGJLa4QsaWLjSxP4%2FVwaoDCtIh6kg2wboQZvxOKKS75oAfsidDxpYs%2BdlGa6CGW2LuchpSp%2B1WcTcbLkVlr%2FQmcpJadB7zNUo3W6vDSQxRSYDjMQ%2FaSkZRkkcmmL0Xs93sr7CKlCclq7dVFnFDXfMVJU0GiprFXxphHvKb5IvFPuSD29qQE%2B2b3nNg5oOSQ3w8NwB6TnciS7OoELqPwLhUfYDwIv3IoPFwYNIk8zsMtsApiQDOYHylX6WpRbVMgmYFSsIng4SF%2B0ytNsMNixpNQGOpcBJ8XNkN9Cw7pTieSBJU6Y%2BuVoFXchDZgBRuwtKwx7dvdws8NCqnTAgjpe04Nyal0hUOKOFqbnF8AcOrb4%2FldxsFaKiQQ9fszArYZ7no91UsREvOPxK1U36ispg3Un7E6iwcbPNoMVEQSkJS%2F%2FRqJoK4SqiN%2B3vSZamE36y%2FEhzW5Nyw9DHu4sPoQPhianh1Rii17Dss44Mw%3D%3D&Expires=1787370395)

image.jpeg

Checking available files

The strange text such as `’`, `“`, `—`, and `→` is caused by a **character-encoding mismatch**, commonly called _mojibake_. Your Markdown was probably saved as UTF‑8, but the HTML page or browser is interpreting it as Windows-1252/ISO-8859-1.

For example:

| Broken text | Intended text |
| --- | --- |
| `’` | `’` |
| `“` | `“` |
| `—` | `—` |
| `→` | `→` |

## Fix the HTML page

Add this inside the `<head>` section:

```
xml

<meta charset="UTF-8">
```

Example:

```
xml

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Page</title>
</head>
<body>
  ...
</body>
</html>
```

The charset declaration should appear as early as possible inside `<head>`.

## Fix the Markdown-to-HTML conversion

Make sure your converter reads and writes UTF‑8.

## Node.js example

```
js

import fs from "node:fs";

const markdown = fs.readFileSync("README.md", "utf8");
const html = markdownToHtml(markdown);

fs.writeFileSync("page.html", html, "utf8");
```

The important parts are:

```
js

readFileSync("README.md", "utf8")
writeFileSync("page.html", html, "utf8")
```

## Python example

```
python

from pathlib import Path

markdown = Path("README.md").read_text(encoding="utf-8")
html = convert_markdown(markdown)
Path("page.html").write_text(html, encoding="utf-8")
```

## Fix the HTTP response encoding

If the page is served by a web server, it should send:

```
text

Content-Type: text/html; charset=UTF-8
```

For an Express server:

```
js

app.use((req, res, next) => {
  res.set("Content-Type", "text/html; charset=UTF-8");
  next();
});
```

For PHP:

```
php

header("Content-Type: text/html; charset=UTF-8");
```

On GitHub Pages, the normal HTML metadata is usually enough:

```
xml

<meta charset="UTF-8">
```

## Check your source file

Open the `.md` and `.html` files in an editor such as VS Code.

In VS Code:

1. Open the file.

2. Look at the encoding indicator in the bottom-right corner.

3. Select it.

4. Choose **Save with Encoding**.

5. Select **UTF-8**.

6. Reload the page with `Ctrl + F5`.


Also ensure your files are not saved as:

- Windows-1252

- ISO-8859-1

- UTF-8 with an incorrectly handled BOM


## If the text is already corrupted

Adding `<meta charset="UTF-8">` will prevent future corruption, but it may not repair text that was already incorrectly decoded and saved.

You can repair common mojibake in Python like this:

```
python

text = "’ “Hello” — example"
fixed = text.encode("latin1").decode("utf8")
print(fixed)
```

This converts it to:

```
text

’ “Hello” — example
```

Only use this repair when the text is clearly mojibake. Applying it to correctly encoded text can damage the characters.

## Most likely fix for your page

Because the screenshot shows a generated `page.html`, check the HTML template first. Add:

```
xml

<meta charset="UTF-8">
```

Then ensure your script uses UTF‑8 when reading the Markdown and writing the HTML:

```
js

fs.readFileSync(file, "utf8");
fs.writeFileSync(output, html, "utf8");
```

Finally, regenerate `page.html` from the original `.md` file rather than trying to manually replace every `’` and `—`.

1 source

Same on the image
The pages is not using better markdown no blocks no buttons etc
Header for beginners

Checking available files

Yes—the screenshot shows **two separate issues**:

1. The `’`, `│`, `├`, etc. characters are an encoding problem.

2. The page is rendering Markdown too plainly: headings work, but the diagram is being shown as raw monospace text instead of a polished visual block, callout, table, or workflow diagram.


The page needs a better Markdown renderer **and** a design stylesheet. Markdown alone does not automatically create buttons, cards, colored callouts, or diagrams.

## What is happening in your screenshot

Your page currently has:

- Basic headings such as `Swimlane Workflow / Executable Process Map`

- Normal paragraphs

- A raw ASCII/Unicode workflow diagram

- No styled code container

- No callout boxes

- No visual buttons

- No card layout or content width control

- Broken UTF-8 characters in the workflow diagram and emoji heading


For a beginner-friendly page, this makes the important information look technical and confusing.

For example, this:

```
text

USER          APPLICATION         API SERVER
  [Submit URL] ───► [Validate URL]
```

should not appear as ordinary text in the middle of the page. It should become either:

- A properly styled code block, or

- A Mermaid diagram, or

- A visual HTML/CSS workflow with cards and arrows.


## Best beginner-friendly style

For your page, I recommend this style:

- **Clean documentation layout**

- A centred reading column, not text stretching full-screen

- Strong heading hierarchy

- Blue/indigo accent color

- Light gray code/diagram panels

- Colored “Note”, “Tip”, and “Warning” boxes

- Simple rounded buttons only for real actions

- Mermaid diagrams for workflows

- Mobile-friendly spacing


Think: GitHub documentation mixed with modern product documentation.

## The easiest upgrade

Use this basic page structure in your `page.html`. It gives you a professional look without requiring a heavy framework.

```
xml

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workflow Guide</title>

  <link rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.8.1/github-markdown-light.min.css">

  <style>
    :root {
      --accent: #2563eb;
      --accent-dark: #1d4ed8;
      --text: #172033;
      --muted: #5b6474;
      --background: #f5f7fb;
      --surface: #ffffff;
      --border: #dbe2ef;
      --code-bg: #111827;
    }

    body {
      margin: 0;
      background: var(--background);
      color: var(--text);
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
    }

    .page-shell {
      max-width: 920px;
      margin: 40px auto;
      padding: 22px;
    }

    .article-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 40px;
      box-shadow: 0 12px 35px rgba(15, 23, 42, 0.07);
    }

    .markdown-body {
      font-family: inherit;
      font-size: 17px;
      line-height: 1.75;
      color: var(--text);
    }

    .markdown-body h1,
    .markdown-body h2,
    .markdown-body h3 {
      font-family: inherit;
      color: #111827;
      border-bottom: 0;
      margin-top: 2em;
    }

    .markdown-body h1 {
      font-size: clamp(2rem, 5vw, 3rem);
      line-height: 1.15;
      letter-spacing: -0.04em;
    }

    .markdown-body h2 {
      font-size: 1.65rem;
      border-top: 1px solid var(--border);
      padding-top: 1.4em;
    }

    .markdown-body p {
      color: var(--muted);
    }

    .markdown-body pre {
      background: var(--code-bg);
      color: #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      overflow-x: auto;
      border: 1px solid #263244;
    }

    .markdown-body code {
      border-radius: 5px;
    }

    .markdown-body blockquote {
      background: #eff6ff;
      border-left: 4px solid var(--accent);
      color: #1e3a8a;
      border-radius: 0 10px 10px 0;
      padding: 14px 18px;
      margin: 24px 0;
    }

    .button {
      display: inline-block;
      padding: 11px 17px;
      background: var(--accent);
      color: white;
      text-decoration: none;
      font-weight: 700;
      border-radius: 9px;
      margin: 8px 8px 8px 0;
      transition: background 0.2s ease;
    }

    .button:hover {
      background: var(--accent-dark);
    }

    .callout {
      margin: 24px 0;
      padding: 18px;
      border-radius: 12px;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
    }

    .callout-title {
      display: block;
      color: #1d4ed8;
      font-weight: 800;
      margin-bottom: 6px;
    }

    @media (max-width: 600px) {
      .page-shell {
        margin: 0;
        padding: 0;
      }

      .article-card {
        border-radius: 0;
        border-left: 0;
        border-right: 0;
        padding: 24px 18px;
      }
    }
  </style>
</head>

<body>
  <main class="page-shell">
    <article class="markdown-body article-card">
      <!-- Your converted Markdown HTML goes here -->
    </article>
  </main>
</body>
</html>
```

This alone will fix the “plain page” feeling: it gives your content proper width, spacing, modern typography, panels, and readable code blocks.

## Use proper headers

For beginners, do not jump directly from a big heading into long paragraphs. Use a simple hierarchy:

```
text

# Build an Executable Swimlane Workflow

A beginner-friendly guide to mapping a workflow where each action can later become an n8n node.

> **Quick idea:** A lane shows who owns an action. A node shows the action itself.

## What you will build

- A workflow with User, Application, and API Server lanes
- A flow that checks and validates a submitted URL
- A structure that can be recreated in n8n

## The workflow

## Step 1: User submits a URL

The user enters a URL and clicks **Submit**.

## Step 2: Application validates it

The application checks whether the URL format is valid.

## Step 3: API server fetches data

If valid, the application sends an HTTP request to the API server.
```

This is much easier for beginners to scan than a page with a big diagram first.

## Make the workflow diagram beautiful

Your screenshot uses box-drawing characters like `─`, `│`, `└`, and arrows. They broke because of the UTF‑8 issue, and even when fixed, they will still look like terminal text.

Use **Mermaid** instead. It is ideal for Markdown documentation and workflow pages.

Put this in the Markdown:

````
text

```mermaid
flowchart LR
    U[👤 User<br/>Submit URL]
    A[🖥️ Application<br/>Validate URL]
    D{Valid URL?}
    E[⚠️ Return Error]
    H[🌐 API Server<br/>Fetch Data]
    R[📦 Response]
    V[✅ Display Data]

    U --> A
    A --> D
    D -- No --> E
    D -- Yes --> H
    H --> R
    R --> V
```
````

Then add Mermaid before `</body>` in your HTML:

```
xml

<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

  mermaid.initialize({
    startOnLoad: true,
    theme: "base",
    themeVariables: {
      primaryColor: "#dbeafe",
      primaryTextColor: "#172033",
      primaryBorderColor: "#2563eb",
      lineColor: "#64748b",
      tertiaryColor: "#f8fafc",
      fontFamily: "Inter, Arial, sans-serif"
    }
  });
</script>
```

Your Markdown conversion tool must preserve the Mermaid block as:

```
xml

<pre class="mermaid">
flowchart LR
    U[User]
    A[Application]
    U --> A
</pre>
```

When the browser loads the page, Mermaid changes that text into a real responsive diagram.

## Add useful beginner callouts

Markdown does not have universal support for colored callout blocks. The most reliable approach is to allow a little HTML inside your `.md` file.

```
xml

<div class="callout">
  <span class="callout-title">💡 Beginner tip</span>
  Do not begin by drawing arrows. First list every action in the workflow. Each action can become one node in n8n.
</div>
```

For a warning:

```
xml

<div class="callout" style="background:#fff7ed; border-color:#fed7aa;">
  <span class="callout-title" style="color:#c2410c;">⚠️ Important</span>
  Validate a URL before sending a request to an external API.
</div>
```

## Add buttons only for actions

Buttons should lead somewhere or start an action—not just decorate text.

In Markdown/HTML:

```
xml

<a class="button" href="#workflow">View workflow</a>
<a class="button" href="https://n8n.io/" target="_blank" rel="noopener">
  Open n8n
</a>
```

For internal page navigation:

```
text

[Go to the workflow](#the-workflow)
```

If your renderer allows HTML, use the `.button` class to make it look like a button.

## Fix the broken characters first

Keep this near the top of your HTML `<head>`:

```
xml

<meta charset="UTF-8">
```

Then regenerate the HTML from the original Markdown file saved as UTF‑8.

Do not copy the already broken `’`, `│`, or `💡` characters back into your source. Replace them with the real characters, such as:

```
text

’  “  ”  —  →  │  ├  └  💡  ⚠️  ✅
```

Or, even better for workflow diagrams, stop relying on text-drawn boxes and use Mermaid.

## Best setup for your specific page

For the page in the photo, the most effective setup is:

| Part | Recommended choice |
| --- | --- |
| Basic Markdown appearance | `github-markdown-css` |
| Page look | White rounded content card on a soft gray background |
| Fonts | Inter or system font stack |
| Workflow visual | Mermaid `flowchart LR` |
| Beginner explanation | Short sections plus colored callout boxes |
| Buttons | Blue rounded links for real actions only |
| Encoding | UTF‑8 in Markdown, HTML meta tag, and HTTP response |

That combination will make your page look like a modern documentation page rather than a raw Markdown conversion.

I’m doing fiercwer api web scrape and save as .md on GitHub folder and that file will be rendered like auto deploy page on GitHub page but I’m making some mistakes

Looking for help with GitHub Pages render issues

You are very close. Your main mistake is treating the **scraped Markdown file itself** as the finished website. GitHub Pages can display Markdown, but for a polished page with cards, buttons, callouts, diagrams, navigation, and consistent styling, you need a small **site template** around the scraped `.md` content.

The broken characters in the photo are a separate UTF‑8 problem. The “plain/no blocks/buttons” problem is because the generated HTML has little or no CSS/layout and is likely printing Mermaid/box characters as ordinary text.

## Recommended workflow

Use this pipeline:

```
text

Firecrawl API
   ↓
Save raw scrape as UTF-8 Markdown
   ↓
Clean/format Markdown for beginners
   ↓
Convert Markdown → HTML
   ↓
Inject it into a styled HTML template
   ↓
GitHub Actions deploys the finished site to GitHub Pages
```

GitHub Pages serves static files. If you use an Actions deployment, your workflow should output a folder containing an `index.html`; GitHub’s Pages deployment then publishes that build output.github+3

## Good folder structure

Set your repository up like this:

```
text

your-repo/
│
├── content/
│   └── workflow-guide.md          # Firecrawl output / cleaned Markdown
│
├── src/
│   ├── template.html              # Your nice page shell
│   ├── styles.css                 # Your design
│   └── build.mjs                  # Converts Markdown into a web page
│
├── public/
│   └── index.html                 # Generated file; do not edit manually
│
├── package.json
│
└── .github/
    └── workflows/
        └── pages.yml              # Auto-build and deploy
```

Important distinction:

- `content/workflow-guide.md` = source content from Firecrawl.

- `src/template.html` and `src/styles.css` = the design.

- `public/index.html` = what GitHub Pages actually publishes.


## Do not use raw ASCII diagrams

Your screenshot contains characters such as:

```
text

│
├
└
→
```

Those are supposed to be box and arrow characters, but their encoding has been misread. More importantly, even when they work, terminal-style diagrams are not the best format for beginner documentation.

Ask Firecrawl/your AI formatting step to return a Mermaid diagram instead:

````
text

## Workflow diagram

```mermaid
flowchart LR
    U[User submits URL]
    A[Application validates URL]
    D{Is URL valid?}
    E[Return validation error]
    F[API server fetches data]
    R[Return response]
    V[Display saved data]

    U --> A --> D
    D -- No --> E
    D -- Yes --> F --> R --> V
```
````

GitHub’s repository Markdown renderer supports Mermaid, but GitHub Pages/Jekyll does **not** automatically turn Mermaid Markdown fences into diagrams; for Pages you generally add Mermaid JavaScript in your template/layout or convert diagrams during your build.[xjavascript](https://www.xjavascript.com/blog/how-to-make-github-pages-markdown-support-mermaid-diagram/)

## Firecrawl output prompt

When you scrape a page, do not ask Firecrawl or the AI to save “whatever content it found” directly as final website Markdown.

Use an instruction similar to this:

```
text

Convert the extracted page into clean beginner-friendly Markdown.

Rules:
- Use UTF-8 characters only.
- Start with one H1 title.
- Use H2 headings for major sections.
- Keep paragraphs short: maximum 3 sentences.
- Use bullet lists for steps and features.
- Turn warnings, tips, and important notes into blockquotes.
- Use fenced code blocks only for actual code.
- Do not use terminal/ASCII box diagrams.
- For workflows, use Mermaid flowchart syntax.
- Remove navigation, cookie banners, repeated headers, footers,
  advertisements, and unrelated links.
- Preserve useful source links.
- Do not use raw HTML unless explicitly requested.
```

For example, instead of this plain text:

```
text

Important: Validate the URL before calling the API.
```

generate this:

```
text

> **Important:** Validate the URL before calling the API.
```

Your CSS can then turn every blockquote into a blue “Important” box.

## Fix UTF‑8 in your scraper

When saving Firecrawl output, always save the file in UTF‑8.

## Node.js

```
js

import fs from "node:fs/promises";

const markdown = firecrawlResponse.markdown;

await fs.writeFile(
  "content/workflow-guide.md",
  markdown,
  { encoding: "utf8" }
);
```

If you fetch Firecrawl with `fetch()`, use:

```
js

const response = await fetch(url, options);
const data = await response.json();

await fs.writeFile(
  "content/workflow-guide.md",
  data.markdown,
  "utf8"
);
```

Do **not** convert the returned text using `latin1`, `binary`, `Buffer.from(...)` unnecessarily, or manual decode/encode functions. That is often how UTF‑8 characters become `’`, `—`, and `│`.

## Simple Markdown build script

Install a Markdown converter:

```
bash

npm init -y
npm install marked
```

Create `src/build.mjs`:

```
js

import fs from "node:fs/promises";
import { marked } from "marked";

const markdown = await fs.readFile(
  "content/workflow-guide.md",
  "utf8"
);

const template = await fs.readFile(
  "src/template.html",
  "utf8"
);

const articleHtml = marked.parse(markdown);

const finalHtml = template.replace(
  "<!-- MARKDOWN_CONTENT -->",
  articleHtml
);

await fs.mkdir("public", { recursive: true });

await fs.writeFile(
  "public/index.html",
  finalHtml,
  "utf8"
);
```

The critical detail is that both read and write operations explicitly use `"utf8"`.

## Your styled HTML template

Create `src/template.html`:

```
xml

<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Scraped Knowledge Guide</title>
  <meta name="description" content="A beginner-friendly guide.">

  <link rel="stylesheet" href="./styles.css">

  <script type="module">
    import mermaid from
      "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";

    mermaid.initialize({
      startOnLoad: true,
      theme: "base",
      themeVariables: {
        primaryColor: "#dbeafe",
        primaryTextColor: "#172033",
        primaryBorderColor: "#2563eb",
        lineColor: "#64748b",
        tertiaryColor: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif"
      }
    });
  </script>
</head>

<body>
  <header class="site-header">
    <a class="brand" href="./">Knowledge Hub</a>
    <a class="header-button" href="#guide">Read guide</a>
  </header>

  <main class="page-shell">
    <article id="guide" class="markdown-body">
      <!-- MARKDOWN_CONTENT -->
    </article>
  </main>

  <footer class="site-footer">
    Content generated from a reviewed Firecrawl scrape.
  </footer>
</body>
</html>
```

The `<meta charset="UTF-8">` directly addresses the character issue. It must remain in the final `public/index.html`, near the beginning of `<head>`.

## CSS for blocks and beginner layout

Create `src/styles.css`:

```
css

:root {
  --page-bg: #f6f8fc;
  --surface: #ffffff;
  --text: #172033;
  --muted: #5f6b7a;
  --border: #dce3ef;
  --accent: #2563eb;
  --accent-dark: #1d4ed8;
  --tip-bg: #eff6ff;
  --code-bg: #111827;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--page-bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.site-header {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 800;
  text-decoration: none;
}

.header-button {
  padding: 10px 15px;
  border-radius: 9px;
  background: var(--accent);
  color: white;
  font-weight: 700;
  text-decoration: none;
}

.header-button:hover {
  background: var(--accent-dark);
}

.page-shell {
  width: min(920px, calc(100% - 32px));
  margin: 20px auto 48px;
}

.markdown-body {
  padding: clamp(24px, 5vw, 56px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
  font-size: 17px;
  line-height: 1.75;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3 {
  color: #101828;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.markdown-body h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  margin: 0 0 0.7em;
}

.markdown-body h2 {
  margin-top: 2.3em;
  padding-top: 1.25em;
  border-top: 1px solid var(--border);
  font-size: 1.65rem;
}

.markdown-body h3 {
  margin-top: 1.8em;
  font-size: 1.2rem;
}

.markdown-body p,
.markdown-body li {
  color: var(--muted);
}

.markdown-body a {
  color: var(--accent);
  font-weight: 650;
}

.markdown-body blockquote {
  margin: 24px 0;
  padding: 16px 18px;
  background: var(--tip-bg);
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
  border-left: 5px solid var(--accent);
  border-radius: 0 12px 12px 0;
}

.markdown-body blockquote p {
  margin: 0;
  color: #1e3a8a;
}

.markdown-body pre {
  margin: 24px 0;
  padding: 20px;
  overflow-x: auto;
  background: var(--code-bg);
  border-radius: 12px;
  color: #e5e7eb;
}

.markdown-body code {
  padding: 0.15em 0.38em;
  background: #eef2f7;
  border-radius: 5px;
  font-size: 0.9em;
}

.markdown-body pre code {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-body table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.markdown-body th,
.markdown-body td {
  padding: 12px 14px;
  border: 1px solid var(--border);
  text-align: left;
}

.markdown-body th {
  background: #f8fafc;
}

.mermaid {
  margin: 30px 0;
  padding: 18px;
  overflow-x: auto;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 14px;
}

.site-footer {
  padding: 0 16px 32px;
  color: #667085;
  font-size: 0.9rem;
  text-align: center;
}

@media (max-width: 600px) {
  .site-header {
    padding: 14px 0;
  }

  .markdown-body {
    border-radius: 12px;
  }
}
```

Copy `styles.css` into `public` during your build:

```
js

await fs.copyFile("src/styles.css", "public/styles.css");
```

Add that line before writing `index.html` in `src/build.mjs`.

## Make Mermaid work in the converter

A standard Markdown converter may render Mermaid like this:

```
xml

<pre><code class="language-mermaid">...</code></pre>
```

But Mermaid expects this:

```
xml

<pre class="mermaid">...</pre>
```

Modify the converter logic after `marked.parse()`:

```
js

const articleHtml = marked.parse(markdown).replace(
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
  (_, diagram) => `<pre class="mermaid">${diagram}</pre>`
);
```

Your full relevant build portion becomes:

```
js

const rawHtml = marked.parse(markdown);

const articleHtml = rawHtml.replace(
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
  (_, diagram) => `<pre class="mermaid">${diagram}</pre>`
);
```

Now your Markdown Mermaid blocks will render as real diagrams on GitHub Pages.

## GitHub Actions auto-deploy

Create `.github/workflows/pages.yml`:

```
text

name: Build and deploy GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Build website
        run: node src/build.mjs

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Then in your repository:

1. Go to **Settings** → **Pages**.

2. Under **Build and deployment**, choose **GitHub Actions** as the source.

3. Commit and push the files.

4. Open **Actions** and wait for the deployment workflow to turn green.

5. Open the URL shown in the deploy job.


GitHub’s current Pages setup supports selecting GitHub Actions as the publishing source, then deploying the built artifact through the Pages Actions workflow.github+4

## Common mistakes to avoid

| Mistake | Result | Correct approach |
| --- | --- | --- |
| Publishing the raw `.md` as the whole site | Plain-looking page | Convert Markdown into a styled HTML template |
| No `<meta charset="UTF-8">` | `’`, `→`, `│`, broken emoji | Include UTF‑8 metadata in the final HTML |
| Saving scraped response with non-UTF‑8 encoding | Corrupt special characters before deployment | Always read/write with `"utf8"` |
| Drawing workflow with terminal characters | Fragile, ugly, and encoding-sensitive diagram | Use Mermaid flowcharts |
| Expecting Markdown to create buttons automatically | No buttons/cards/callouts | Add CSS classes and small HTML where appropriate |
| Editing `public/index.html` manually | Changes disappear at the next build | Edit Markdown, template, CSS, or build script instead |
| Deploying source instead of `public/` | GitHub Pages does not show expected page | Upload the generated output folder containing `index.html` |
| Pushing raw scraped text automatically | Poor structure, irrelevant sections, unsafe/unreviewed content | Clean and validate scrape output before publishing |

## Your immediate next steps

1. Save Firecrawl output as `content/workflow-guide.md` using UTF‑8.

2. Remove the existing text-box workflow diagrams.

3. Replace workflow diagrams with Mermaid blocks.

4. Add `src/template.html`, `src/styles.css`, and `src/build.mjs`.

5. Confirm `node src/build.mjs` creates `public/index.html` and `public/styles.css`.

6. Add the GitHub Actions workflow.

7. Set GitHub Pages source to **GitHub Actions**.

8. Push to `main`.


That setup means every time your scraper updates the Markdown, GitHub Actions can rebuild your polished site automatically—while your content, presentation, and deployment stay cleanly separated.

![](https://www.google.com/s2/favicons?sz=128&domain=github.blog)

![](https://www.google.com/s2/favicons?sz=128&domain=blog.drinkbird.com)

![](https://www.google.com/s2/favicons?sz=128&domain=github-help-wanted.com)

15 sources

Right now on this workflow process do I need ai like groq to help me make things better since I may be scraping multiple pages types
And give me example workflow for this setup make it a prod like
Right now I’m also use deno for calling actions

Completed 2 steps

Yes—using an AI step such as **Groq** can make this much better when you scrape many different page types. But do not use AI as the scraper or as the only source of truth. Use it as a controlled **normalizer, classifier, editor, and content-structure generator** after Firecrawl has extracted the page.

The production approach is:

```
text

Fetch/scrape → validate → classify page → AI transform → validate again
→ generate Markdown + HTML → deploy → monitor
```

Deno is a good fit for this because it can call APIs with native `fetch`, work with UTF‑8 text using `Deno.readTextFile()`/`Deno.writeTextFile()`, and run inside GitHub Actions. Deno’s text-file APIs decode text as UTF‑8, which directly helps avoid the `’` / broken-arrow issue from your screenshot.docs.deno+2

## Should you use Groq?

**Yes, for content cleanup and standardization.** You may scrape product pages, documentation, blogs, category pages, landing pages, error pages, or JavaScript-heavy pages. Their Markdown structures will vary wildly.

Groq can turn inconsistent scrape output into one predictable content format:

| Stage | Use AI? | Why |
| --- | --- | --- |
| URL fetching / crawling | No | Firecrawl or your scraper should collect the real source data |
| Detect page type | Yes | Identify product, guide, category, FAQ, article, login/error, etc. |
| Remove junk | Yes | Remove headers, footer links, cookie text, repeated navigation, related posts |
| Create clear headings | Yes | Turn messy text into beginner-friendly `#`, `##`, and `###` sections |
| Create Mermaid workflow | Yes | Replace fragile text-box diagrams with Mermaid syntax |
| Extract factual fields | Yes, with validation | Extract price, SKU, availability, specifications, contacts, links |
| Invent missing product data | Never | AI should say “not found,” not make up information |
| Validate URLs, prices, source fields | Mostly code | Deterministic rules are safer than AI guesses |
| Publish directly | Not initially | Start with a review queue; automate only after testing |

For your use case, the AI output should be **structured JSON first**, then your Deno code should generate Markdown from that JSON. Do not let the model return free-form Markdown as the only output. Structured output/JSON mode is designed for output that conforms to a schema, though you should still validate and retry failed responses in production.docs.agno+4

## Production architecture

A scalable setup could look like this:

```
text

                 ┌─────────────────────────────┐
                 │ GitHub Actions schedule      │
                 │ manual / daily / hourly      │
                 └──────────────┬──────────────┘
                                │
                                ▼
                 ┌─────────────────────────────┐
                 │ Deno pipeline                │
                 │ scripts/run.ts               │
                 └──────────────┬──────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              ▼                 ▼                  ▼
    ┌────────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │ Load URL queue │ │ Fetch Firecrawl  │ │ Read old content│
    │ sources.json   │ │ Markdown/content │ │ and content hash│
    └───────┬────────┘ └────────┬─────────┘ └────────┬────────┘
            └───────────────────┼─────────────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ Deterministic validation │
                  │ URL, length, status, hash│
                  └─────────────┬────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ Groq AI normalization    │
                  │ JSON schema response     │
                  └─────────────┬────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ Validate JSON in Deno    │
                  │ required fields, URLs,   │
                  │ price format, max length │
                  └─────────────┬────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ Generate content/*.md    │
                  │ Generate site public/    │
                  └─────────────┬────────────┘
                                ▼
                  ┌──────────────────────────┐
                  │ GitHub Pages deployment  │
                  └──────────────────────────┘
```

For a product-sourcing site, you can later add a data layer:

```
text

Scrape product page
  → AI extracts standard product fields
  → product.json
  → product.md
  → product detail page
  → searchable category/index page
```

This matters for your e-commerce research because one supplier may write “MOQ,” another “minimum order,” another only gives a quantity selector; the AI can normalize those into one field while preserving the original evidence.

## Use a review gate first

Because scraped web content can be wrong, stale, incomplete, or manipulated, do not automatically publish every AI-formatted result at the beginning.

Use these content states:

```
text

draft → validated → review → published → archived
```

A safe initial policy:

- **New URL:** create a draft only.

- **Existing URL with small changes:** update automatically after validation.

- **Price, availability, policy, contact details, or important claims changed:** send to `review/`.

- **Scrape failed or content is too short:** keep the previous published page; log the failure.

- **AI output invalid:** retry once with a stricter prompt, then save as draft/error.


This prevents one bad scrape, Firecrawl response, or AI hallucination from replacing a good live page.

## Recommended project structure

This works well with Deno and GitHub Pages:

```
text

scrape-kit/
│
├── config/
│   ├── sources.json
│   ├── site.json
│   └── prompts.ts
│
├── content/
│   ├── published/
│   │   └── workflow-guide.md
│   ├── drafts/
│   ├── review/
│   └── failed/
│
├── data/
│   ├── pages/
│   │   └── workflow-guide.json
│   ├── manifests/
│   │   └── pages.json
│   └── cache/
│       └── source-hashes.json
│
├── src/
│   ├── run.ts
│   ├── scrape.ts
│   ├── groq.ts
│   ├── validate.ts
│   ├── markdown.ts
│   ├── build.ts
│   └── types.ts
│
├── site/
│   ├── template.html
│   └── styles.css
│
├── public/                    # Generated; deployed to GitHub Pages
│   ├── index.html
│   └── guides/
│
├── deno.json
│
└── .github/
    └── workflows/
        └── pipeline.yml
```

Keep `public/` generated. Edit only:

- `config/`

- `content/`

- `src/`

- `site/`


Never manually edit the generated HTML inside `public/`, because every deployment will overwrite it.

## Source configuration example

Create `config/sources.json`:

```
json

[\
  {\
    "id": "n8n-workflow-guide",\
    "url": "https://example.com/workflow-guide",\
    "type": "auto",\
    "enabled": true,\
    "publishMode": "review",\
    "tags": ["automation", "n8n", "beginner"],\
    "maxAgeDays": 14\
  },\
  {\
    "id": "supplier-product-001",\
    "url": "https://example.com/product-page",\
    "type": "product",\
    "enabled": true,\
    "publishMode": "review",\
    "tags": ["electronics", "sourcing"],\
    "maxAgeDays": 2\
  }\
]
```

The `type: "auto"` option tells Groq to classify the page. For sources you already understand, use explicit types such as:

```
text

product
article
guide
category
faq
policy
documentation
```

Explicit types usually give more reliable output and cheaper AI calls.

## JSON schema for AI output

Your AI should return a predictable object like this:

```
json

{
  "pageType": "guide",
  "title": "Build an Executable Swimlane Workflow",
  "summary": "A beginner-friendly explanation of swimlane workflows.",
  "slug": "executable-swimlane-workflow",
  "sections": [\
    {\
      "heading": "What you will build",\
      "body": "You will map each business action to a node and assign ownership.",\
      "bullets": [\
        "Identify the actor for each step",\
        "Define validation and error paths"\
      ]\
    }\
  ],
  "callouts": [\
    {\
      "kind": "tip",\
      "title": "Beginner tip",\
      "text": "List the actions before drawing arrows."\
    }\
  ],
  "mermaid": "flowchart LR\nA[User] --> B[Application]",
  "sourceUrl": "https://example.com/workflow-guide",
  "sourceFacts": [\
    {\
      "claim": "The application validates the submitted URL.",\
      "evidence": "Validate URL"\
    }\
  ],
  "warnings": [],
  "needsReview": false
}
```

For product pages, use a separate schema:

```
json

{
  "pageType": "product",
  "title": "Product name",
  "slug": "product-name",
  "summary": "Short factual summary based only on source content.",
  "product": {
    "priceText": "$12.50",
    "currency": "USD",
    "minimumOrderQuantity": "10 units",
    "availability": "In stock",
    "specifications": [\
      { "name": "Color", "value": "Black" },\
      { "name": "Material", "value": "ABS plastic" }\
    ]
  },
  "sourceUrl": "https://example.com/product",
  "sourceFacts": [],
  "warnings": [\
    "Shipping cost was not available on the source page."\
  ],
  "needsReview": true
}
```

Notice the difference:

- `priceText` preserves the source’s exact wording.

- Fields can be empty or `null`.

- Missing data becomes a warning.

- AI must not invent shipping cost, MOQ, stock level, product dimensions, or supplier claims.


## Deno configuration

Create `deno.json`:

```
json

{
  "tasks": {
    "run": "deno run -A src/run.ts",
    "check": "deno check src/run.ts",
    "fmt": "deno fmt",
    "lint": "deno lint",
    "build": "deno run -A src/build.ts"
  },
  "fmt": {
    "lineWidth": 90,
    "semiColons": true,
    "singleQuote": true
  }
}
```

Run locally:

```
bash

deno task run
deno task build
```

Before every production deploy:

```
bash

deno task fmt
deno task lint
deno task check
deno task run
deno task build
```

Deno includes native linting and formatting tools, so you can keep the pipeline lightweight without adding a large Node setup.[deepwiki](https://deepwiki.com/denoland/docs/4.6-code-quality-and-cicd)

## Deno scraper example

This simplified script calls your scrape API and saves a raw UTF‑8 Markdown copy.

Create `src/scrape.ts`:

```
ts

export type ScrapedPage = {
  url: string;
  markdown: string;
  title?: string;
  fetchedAt: string;
};

export async function scrapePage(url: string): Promise<ScrapedPage> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY is missing');
  }

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true
    })
  });

  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();

  const markdown = result.data?.markdown?.trim();

  if (!markdown || markdown.length < 200) {
    throw new Error('Scrape returned too little usable Markdown');
  }

  return {
    url,
    markdown,
    title: result.data?.metadata?.title,
    fetchedAt: new Date().toISOString()
  };
}
```

Your exact Firecrawl endpoint or response shape may differ depending on the API version you use; adapt the `result.data.markdown` path to match the response you receive.

## Groq formatter example

Create `src/groq.ts`:

```
ts

type SourceInput = {
  url: string;
  title?: string;
  markdown: string;
};

export async function normalizeWithGroq(source: SourceInput) {
  const apiKey = Deno.env.get('GROQ_API_KEY');

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing');
  }

  const systemPrompt = `
You are a careful content normalization system for a static documentation site.

Rules:
- Use only facts visible in the supplied source text.
- Never invent prices, dates, availability, specifications, links, quotations,
  names, or claims.
- If a fact is missing, use null or place a clear message in warnings.
- Remove navigation, cookie notices, ads, unrelated footer text, repeated links,
  and boilerplate.
- Output valid JSON only. No Markdown fences. No explanation outside JSON.
- Classify pageType as one of:
  guide, article, product, category, faq, policy, documentation, unknown.
- Produce beginner-friendly wording.
- For a workflow, generate Mermaid only when the source actually describes steps.
- Never use ASCII box characters or text-art diagrams.
`;

  const userPrompt = JSON.stringify({
    sourceUrl: source.url,
    sourceTitle: source.title ?? null,
    sourceMarkdown: source.markdown.slice(0, 45000),
    requiredOutput: {
      pageType: 'string',
      title: 'string',
      slug: 'string',
      summary: 'string',
      sections: [\
        {\
          heading: 'string',\
          body: 'string',\
          bullets: ['string']\
        }\
      ],
      callouts: [\
        {\
          kind: 'tip | important | warning',\
          title: 'string',\
          text: 'string'\
        }\
      ],
      mermaid: 'string | null',
      sourceUrl: 'string',
      warnings: ['string'],
      needsReview: 'boolean'
    }
  });

  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'YOUR_GROQ_MODEL_NAME',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [\
          { role: 'system', content: systemPrompt },\
          { role: 'user', content: userPrompt }\
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Groq error: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Groq returned no content');
  }

  return JSON.parse(content);
}
```

Use the currently supported model name from your Groq account rather than copying the placeholder literally. JSON mode requires your prompt to explicitly instruct the model to return JSON, and the returned content should still be parsed and validated by your application.tessl+3

## Validate the AI response

Never trust `JSON.parse()` alone. It only proves that the response is valid JSON—not that it contains safe, usable data.

Create `src/validate.ts`:

```
ts

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validatePage(page: Record<string, unknown>) {
  const errors: string[] = [];

  if (typeof page.title !== 'string' || page.title.trim().length < 3) {
    errors.push('Missing or invalid title');
  }

  if (typeof page.summary !== 'string' || page.summary.trim().length < 20) {
    errors.push('Missing or too-short summary');
  }

  if (typeof page.sourceUrl !== 'string') {
    errors.push('Missing source URL');
  } else {
    try {
      new URL(page.sourceUrl);
    } catch {
      errors.push('Invalid source URL');
    }
  }

  if (!Array.isArray(page.sections) || page.sections.length === 0) {
    errors.push('No sections generated');
  }

  const unsafeTerms = [\
    'ignore previous instructions',\
    '<script',\
    'javascript:',\
    'system prompt'\
  ];

  const serialized = JSON.stringify(page).toLowerCase();

  for (const term of unsafeTerms) {
    if (serialized.includes(term)) {
      errors.push(`Potential unsafe content detected: ${term}`);
    }
  }

  const title = String(page.title ?? '');
  const slug = slugify(String(page.slug || title));

  return {
    valid: errors.length === 0,
    errors,
    page: {
      ...page,
      slug,
      needsReview: Boolean(page.needsReview) || errors.length > 0
    }
  };
}
```

For stronger production validation, use a schema library or Deno-friendly validation approach, but this illustrates the important rule: **AI response → validation → content generation**, never AI response → immediate publish.

## Generate Markdown from verified JSON

Do not rely on a random Markdown structure coming from scraped pages. Generate your own consistent Markdown.

Create `src/markdown.ts`:

````
ts

function escapeMd(value: string): string {
  return value.replace(/\r\n/g, '\n').trim();
}

export function pageToMarkdown(page: any): string {
  const lines: string[] = [];

  lines.push(`# ${escapeMd(page.title)}`);
  lines.push('');
  lines.push(escapeMd(page.summary));
  lines.push('');

  for (const callout of page.callouts ?? []) {
    const icon =
      callout.kind === 'warning'
        ? '⚠️'
        : callout.kind === 'important'
        ? '❗'
        : '💡';

    lines.push(`> ${icon} **${escapeMd(callout.title)}:** ${escapeMd(callout.text)}`);
    lines.push('');
  }

  for (const section of page.sections ?? []) {
    lines.push(`## ${escapeMd(section.heading)}`);
    lines.push('');
    lines.push(escapeMd(section.body));
    lines.push('');

    if (Array.isArray(section.bullets) && section.bullets.length > 0) {
      for (const bullet of section.bullets) {
        lines.push(`- ${escapeMd(bullet)}`);
      }
      lines.push('');
    }
  }

  if (page.mermaid) {
    lines.push('## Workflow diagram');
    lines.push('');
    lines.push('```mermaid');
    lines.push(page.mermaid.trim());
    lines.push('```');
    lines.push('');
  }

  if (page.warnings?.length) {
    lines.push('## Notes');
    lines.push('');

    for (const warning of page.warnings) {
      lines.push(`- ${escapeMd(warning)}`);
    }

    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push(`Source: [${page.sourceUrl}](${page.sourceUrl})`);
  lines.push('');

  return lines.join('\n');
}
````

This guarantees every page has:

- One clean H1

- A summary

- Proper H2 sections

- Styled blockquotes/callouts

- Optional Mermaid workflow

- A source link

- No broken ASCII workflow art


## Main Deno pipeline

Create `src/run.ts`:

```
ts

import { scrapePage } from './scrape.ts';
import { normalizeWithGroq } from './groq.ts';
import { validatePage } from './validate.ts';
import { pageToMarkdown } from './markdown.ts';

type Source = {
  id: string;
  url: string;
  enabled: boolean;
  publishMode: 'auto' | 'review';
};

const sources: Source[] = JSON.parse(
  await Deno.readTextFile('config/sources.json')
);

await Deno.mkdir('content/drafts', { recursive: true });
await Deno.mkdir('content/review', { recursive: true });
await Deno.mkdir('data/pages', { recursive: true });

for (const source of sources.filter((item) => item.enabled)) {
  try {
    console.log(`Processing: ${source.id}`);

    const scraped = await scrapePage(source.url);

    await Deno.writeTextFile(
      `data/pages/${source.id}.raw.md`,
      scraped.markdown
    );

    const aiPage = await normalizeWithGroq(scraped);
    const result = validatePage(aiPage);

    if (!result.valid) {
      console.error(`Validation failed for ${source.id}:`, result.errors);

      await Deno.writeTextFile(
        `content/review/${source.id}.json`,
        JSON.stringify(
          {
            source,
            scrapedAt: scraped.fetchedAt,
            errors: result.errors,
            aiOutput: aiPage
          },
          null,
          2
        )
      );

      continue;
    }

    const markdown = pageToMarkdown(result.page);

    const folder =
      source.publishMode === 'auto' && !result.page.needsReview
        ? 'content/drafts'
        : 'content/review';

    await Deno.writeTextFile(
      `${folder}/${result.page.slug}.md`,
      markdown
    );

    await Deno.writeTextFile(
      `data/pages/${result.page.slug}.json`,
      JSON.stringify(
        {
          source,
          scrapedAt: scraped.fetchedAt,
          sourceHash: await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(scraped.markdown)
          ).then((buffer) =>
            [...new Uint8Array(buffer)]
              .map((byte) => byte.toString(16).padStart(2, '0'))
              .join('')
          ),
          page: result.page
        },
        null,
        2
      )
    );

    console.log(`Saved: ${result.page.slug}`);
  } catch (error) {
    console.error(`Failed: ${source.id}`, error);
  }
}
```

For the first version, send all generated pages to `content/review/`. After you have reviewed enough successful examples, change some known reliable sources to `"publishMode": "auto"`.

## GitHub Actions with Deno

Create `.github/workflows/pipeline.yml`:

```
text

name: Scrape, format, build, and deploy

on:
  workflow_dispatch:
  schedule:
    - cron: "0 3 * * *"
  push:
    branches: ["main"]
    paths:
      - "src/**"
      - "site/**"
      - "config/**"
      - "content/**"
      - ".github/workflows/pipeline.yml"

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: github-pages
  cancel-in-progress: false

jobs:
  process-content:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Deno
        uses: denoland/setup-deno@v2
        with:
          deno-version: v2.x

      - name: Format check
        run: deno fmt --check

      - name: Lint
        run: deno lint

      - name: Type check
        run: deno check src/run.ts

      - name: Scrape and normalize
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
        run: deno task run

      - name: Build static website
        run: deno task build

      - name: Commit generated reviewed changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add content data public
          git diff --cached --quiet || git commit -m "chore: update scraped content"
          git push

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: public

  deploy:
    needs: process-content
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Set your repository’s **Settings → Pages → Build and deployment → Source** to **GitHub Actions**. GitHub’s Pages workflow model supports building a static artifact and deploying it from Actions; Deno can also be integrated with GitHub-based CI/deployment flows.github+3

## Important deployment caution

The workflow above commits generated changes back to the repository. That is useful for keeping a history of scraped content, but it can cause repeated workflow runs if your trigger listens to all pushes.

The `paths:` filter helps reduce that, but a cleaner production pattern is:

- `workflow_dispatch` \+ scheduled scrape workflow creates a pull request with content changes.

- You review and merge the pull request.

- A separate deploy workflow runs only after merge to `main`.


That is safer than giving the scraping workflow unrestricted auto-publish power.

## Store secrets correctly

Never put these inside `sources.json`, Deno files, Markdown files, or commits:

```
text

FIRECRAWL_API_KEY
GROQ_API_KEY
GITHUB_TOKEN
```

Put API keys in:

```
text

Repository → Settings → Secrets and variables → Actions → New repository secret
```

Then reference them only through:

```
text

${{ secrets.FIRECRAWL_API_KEY }}
${{ secrets.GROQ_API_KEY }}
```

And in Deno:

```
ts

Deno.env.get('GROQ_API_KEY');
```

## Cost and reliability controls

AI becomes expensive and unnecessary if you run it on every page every day. Add these rules:

- Hash raw Markdown; skip Groq when the source content did not change.

- Limit the text sent to Groq, for example 30,000–45,000 characters.

- Use one AI call to classify and structure a page, not several calls by default.

- Retry only transient errors such as 429/5xx responses.

- Keep raw scrape output, AI JSON, generated Markdown, and deployment logs.

- Use low temperature, around `0` to `0.2`, for predictable formatting.

- Require manual review for important product price, MOQ, stock, supplier, shipping, policy, medical, legal, or financial information.

- Record the original source URL and scrape timestamp on every page.


## Best practical version for you now

Start with this smaller production-minded version:

```
text

1. GitHub Action runs once per day.
2. Deno reads 5–20 URLs from sources.json.
3. Firecrawl retrieves main Markdown content.
4. Deno hashes the raw content.
5. Only changed pages go to Groq.
6. Groq returns structured JSON.
7. Deno validates it.
8. Deno generates clean Markdown with headings, callouts, and Mermaid.
9. New/changed pages go into content/review/.
10. You review and move approved pages to content/published/.
11. Deno builds static HTML from published content.
12. GitHub Pages deploys public/.
```

That gives you AI benefits without letting AI silently publish unreliable scraped data. Once the output becomes consistent, you can safely automate publication for trusted page types while keeping high-value sourcing and product pages in review.

![](https://www.google.com/s2/favicons?sz=128&domain=docs.deno.com)

![](https://www.google.com/s2/favicons?sz=128&domain=oneuptime.com)

![](https://www.google.com/s2/favicons?sz=128&domain=jsonic.io)

16 sources

Follow-ups

How to handle rate limits and retries when calling Groq API

Using JSON mode with Groq for strict data extraction schemas

Best practices for cleaning messy HTML markdown with LLMs

Sources

![](https://www.google.com/s2/favicons?sz=128&domain=deepwiki.com)

![](https://www.google.com/s2/favicons?sz=128&domain=docs.deno.com)

![](https://www.google.com/s2/favicons?sz=128&domain=reddit.com)

63

Viewing a shared session. Your follow-ups will be private to you.

Ask a follow-up

SearchComputer

Model

![](https://edge.perplexity.ai/image)

## Cookie Policy

We and our partners use cookies, pixels, SDKs, APIs, and server-to-server integrations. Perplexity does not use these technologies to sell third party ads on our services. Perplexity uses them to measure our ad performance on third party partner websites and to improve our services. If you continue using Perplexity, without adjusting your settings, you are consenting to these technologies.

Cookie Policy

We and our partners use cookies, pixels, SDKs, APIs, and server-to-server integrations. Perplexity does not use these technologies to sell third party ads on our services. Perplexity uses them to measure our ad performance on third party partner websites and to improve our services. If you continue using Perplexity, without adjusting your settings, you are consenting to these technologies.

Decline optional

Got it

Instant answers at your fingertips

By continuing, you agree to our [privacy policy](https://www.perplexity.com/hub/legal/privacy-policy).

Continue with Google

Continue with Apple

Continue with email

Single sign-on (SSO)

Close
