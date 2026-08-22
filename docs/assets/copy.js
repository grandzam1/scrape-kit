(function () {
  function pageText() {
    var article = document.querySelector(".changelog");
    if (!article) return "";
    var title = (article.querySelector(".changelog-version") || {}).textContent || "";
    var date = (article.querySelector(".changelog-date") || {}).textContent || "";
    var source = article.querySelector(".changelog-source");
    var body = article.querySelector(".changelog-body");
    var lines = [title.trim()];
    if (date.trim()) lines.push(date.trim());
    if (source && source.href) lines.push(source.href);
    lines.push("");
    lines.push(blockText(body));
    return lines.join("\n").trim();
  }

  function blockText(node) {
    if (!node) return "";
    var pre = node.matches && node.matches("pre") ? node : node.querySelector && node.querySelector("pre");
    if (pre && (node === pre || node.classList.contains("copy-block--code"))) {
      return (pre.innerText || pre.textContent || "").replace(/\n$/, "");
    }
    var mermaid = node.querySelector && node.querySelector(".mermaid");
    if (mermaid && mermaid.getAttribute("data-copy-source")) {
      return mermaid.getAttribute("data-copy-source");
    }
    return (node.innerText || node.textContent || "").trim();
  }

  function writeClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        area.remove();
      }
    });
  }

  function flash(button, ok) {
    var prev = button.textContent;
    button.textContent = ok ? "Copied" : "Failed";
    button.dataset.copied = ok ? "true" : "false";
    window.setTimeout(function () {
      button.textContent = prev;
      delete button.dataset.copied;
    }, 1400);
  }

  function makeButton(label, getText) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "copy-btn";
    button.textContent = "Copy";
    button.setAttribute("aria-label", label);
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      writeClipboard(getText()).then(function () {
        flash(button, true);
      }).catch(function () {
        flash(button, false);
      });
    });
    return button;
  }

  function wrap(el, kind, label) {
    if (!el || el.closest(".copy-block") || el.closest(".scrape-flag")) return;
    var text = blockText(el);
    if (!text) return;
    var wrapEl = document.createElement("div");
    wrapEl.className = "copy-block copy-block--" + kind;
    el.parentNode.insertBefore(wrapEl, el);
    wrapEl.appendChild(el);
    wrapEl.appendChild(makeButton(label, function () {
      return blockText(el);
    }));
  }

  function wrapInlineCode(code) {
    if (!code || code.closest("pre") || code.closest(".copy-inline")) return;
    var text = (code.textContent || "").trim();
    if (!text) return;
    var wrapEl = document.createElement("span");
    wrapEl.className = "copy-inline";
    code.parentNode.insertBefore(wrapEl, code);
    wrapEl.appendChild(code);
    wrapEl.appendChild(makeButton("Copy code", function () {
      return (code.textContent || "").trim();
    }));
  }

  function enhance() {
    var body = document.querySelector(".changelog-body");
    if (!body) return;

    body.querySelectorAll(".mermaid").forEach(function (node) {
      if (!node.getAttribute("data-copy-source")) {
        node.setAttribute("data-copy-source", (node.textContent || "").trim());
      }
    });

    body.querySelectorAll("pre").forEach(function (node) {
      wrap(node, "code", "Copy code block");
    });
    body.querySelectorAll("p, blockquote, table, ul, ol, h1, h2, h3, h4").forEach(function (node) {
      if (node.closest("li") && (node.matches("p") || node.matches("ul") || node.matches("ol"))) return;
      wrap(node, "text", "Copy text");
    });
    body.querySelectorAll(".mermaid").forEach(function (node) {
      wrap(node, "code", "Copy diagram source");
    });
    body.querySelectorAll("code").forEach(wrapInlineCode);

    var pageBtn = document.querySelector("[data-copy-page]");
    if (pageBtn && !pageBtn.dataset.bound) {
      pageBtn.dataset.bound = "true";
      pageBtn.addEventListener("click", function () {
        writeClipboard(pageText()).then(function () {
          flash(pageBtn, true);
        }).catch(function () {
          flash(pageBtn, false);
        });
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
