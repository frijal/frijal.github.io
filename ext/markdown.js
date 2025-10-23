/*!
 * markdown-enhancer-plus-safe.js
 * 🌿 Markdown → HTML enhancer yang aman untuk <img>, <video>, <iframe>, dll.
 * ✅ Otomatis muat highlight.js bila belum ada
 * ✅ Tidak merusak konten yang sudah dimuat (lazy load tetap berfungsi)
 * ✅ Mendukung heading, list, blockquote, code, link, tabel, dsb.
 */

(async function () {
  /* -----------------------------
     🌈 Auto-load highlight.js
  ----------------------------- */
  async function ensureHighlightJS() {
    if (window.hljs) return window.hljs;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js";
    script.defer = true;
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github-dark.min.css";
    document.head.appendChild(link);

    await new Promise(res => (script.onload = res));
    return window.hljs;
  }

  /* -----------------------------
     🧩 Helper: escape HTML
  ----------------------------- */
  function escapeHTML(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
  }

  /* -----------------------------
     ✨ Konversi Markdown → HTML
  ----------------------------- */
  function convertMarkdown(text) {
    let html = text
      // Heading
      .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
      .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
      .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')

      // Bold / Italic
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, "$1<em>$2</em>")

      // Inline code
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')

      // Link
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener" class="text-blue-600 hover:underline">$1</a>'
      )

      // Unordered list
      .replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')

      // Blockquote
      .replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')

      // Code block ```
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
        code = escapeHTML(code.trim());
        const language = lang || "plaintext";
        return `<pre><code class="language-${language}">${code}</code></pre>`;
      })

      // Table
      .replace(/((?:\|.*\|\n)+)/g, tableMatch => {
        const rows = tableMatch.trim().split("\n").filter(r => r.trim());
        if (rows.length < 2) return tableMatch;
        const header = rows[0].split("|").filter(Boolean)
          .map(c => `<th>${c.trim()}</th>`).join("");
        const body = rows.slice(2).map(r =>
          "<tr>" + r.split("|").filter(Boolean)
          .map(c => `<td>${c.trim()}</td>`).join("") + "</tr>"
        ).join("");
        return `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
      })

      // Line breaks
      .replace(/\n{2,}/g, "<br><br>")
      .replace(/\n/g, "<br>");

    return html;
  }

  /* -----------------------------
     🧱 Enhance elemen Markdown (aman)
  ----------------------------- */
  function enhanceMarkdownSafe() {
    document.querySelectorAll(".markdown, .markdown-body").forEach(block => {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null);
      const textNodes = [];

      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parentTag = node.parentElement?.tagName?.toLowerCase();

        // 🚫 Skip text di dalam elemen sensitif
        if (["script", "style", "code", "pre", "img", "video", "audio", "iframe"].includes(parentTag))
          continue;
        textNodes.push(node);
      }

      // Ubah setiap node teks Markdown → HTML
      for (const node of textNodes) {
        const raw = node.nodeValue;
        if (!raw.trim()) continue;
        const html = convertMarkdown(raw);
        if (html !== raw) {
          const span = document.createElement("span");
          span.innerHTML = html;
          node.replaceWith(...span.childNodes);
        }
      }
    });
  }

  /* -----------------------------
     🌟 Highlight semua blok kode
  ----------------------------- */
  async function enhanceCodeBlocks() {
    const hljs = await ensureHighlightJS();
    document.querySelectorAll("pre code").forEach(el => {
      try { hljs.highlightElement(el); } catch {}
    });
  }

  /* -----------------------------
     🚀 Jalankan otomatis saat DOM siap
  ----------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    enhanceMarkdownSafe();
    await enhanceCodeBlocks();
  });
})();

