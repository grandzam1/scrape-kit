(function () {
  function pageText() {
    var body = document.querySelector(".changelog-body");
    if (!body) return "";
    var clone = body.cloneNode(true);
    clone.querySelectorAll(".copy-btn, .copy-page").forEach(function (node) {
      node.remove();
    });
    return (clone.innerText || clone.textContent || "").trim();
  }

  function blockText(node) {
    if (!node) return "";
    var pre = node.matches && node.matches("pre") ? node : node.querySelector && node.querySelector("pre");
    if (pre) return (pre.innerText || pre.textContent || "").replace(/\n$/, "");
    if (node.getAttribute && node.getAttribute("data-copy-source")) {
      return node.getAttribute("data-copy-source");
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

  function wrap(el, label) {
    if (!el || el.closest(".copy-block")) return;
    var text = blockText(el);
    if (!text) return;
    var wrapEl = document.createElement("div");
    wrapEl.className = "copy-block copy-block--code";
    el.parentNode.insertBefore(wrapEl, el);
    wrapEl.appendChild(el);
    wrapEl.appendChild(makeButton(label, function () {
      return blockText(el);
    }));
  }

  function enhance() {
    var body = document.querySelector(".changelog-body");
    if (!body) return;

    body.querySelectorAll(".mermaid").forEach(function (node) {
      if (!node.getAttribute("data-copy-source")) {
        node.setAttribute("data-copy-source", (node.textContent || "").trim());
      }
      wrap(node, "Copy diagram source");
    });

    body.querySelectorAll("pre").forEach(function (pre) {
      var box = pre.closest(".highlighter-rouge") || pre.closest(".highlight") || pre;
      wrap(box, "Copy code block");
    });

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
