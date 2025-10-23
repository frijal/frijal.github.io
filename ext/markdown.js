/*!
  simple-markdown.js — Markdown ringan dengan highlight.js otomatis
  ✅ Auto-load highlight.js dari CDN jika belum ada
  ✅ Auto-highlight setelah konten dimasukkan ke DOM
  ✅ Callback onHighlighted() saat selesai
*/

(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.simpleMarkdownToHtml = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  // ==========================================================
  // 🔹 Loader Highlight.js (hanya sekali)
  // ==========================================================
  let hljsReady = null;
  function loadHighlightJs() {
    if (hljsReady) return hljsReady;
    if (typeof hljs !== "undefined") {
      hljsReady = Promise.resolve(window.hljs);
      return hljsReady;
    }

    hljsReady = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js";
      script.onload = () => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github-dark.min.css";
        document.head.appendChild(link);
        resolve(window.hljs);
      };
      script.onerror = () => {
        console.warn("⚠️ highlight.js gagal dimuat dari CDN");
        resolve(undefined);
      };
      document.head.appendChild(script);
    });
    return hljsReady;
  }

  // ==========================================================
  // 🔹 Fungsi utama: Markdown → HTML
  // ==========================================================
  function simpleMarkdownToHtml(text, options = {}) {
    const { onHighlighted } = options;
    if (typeof text !== "string") text = String(text || "");

    let html = text
      // Heading
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      // Bold / Italic / Code
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')
      // Link dan Gambar
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Code block ```
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
        code = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<pre><code class="language-${lang || 'text'}">${code}</code></pre>`;
      })
      // Lists
      .replace(/^\* (.*)$/gm, "<li>$1</li>")
      .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");

    // Ganti newline menjadi <br> (kecuali dalam <pre>)
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith("<pre")) parts[i] = parts[i].replace(/\n/g, "<br>");
    }
    html = parts.join("");

    // ==========================================================
    // 🔹 Tunda highlight sampai DOM siap
    // ==========================================================
    setTimeout(async () => {
      const hljsObj = await loadHighlightJs();
      if (!hljsObj) {
        onHighlighted?.(false);
        return;
      }

      document.querySelectorAll("pre code").forEach(el => {
        try { hljsObj.highlightElement(el); } catch {}
      });

      onHighlighted?.(true);
    }, 100);

    return html;
  }

  return simpleMarkdownToHtml;
}));
