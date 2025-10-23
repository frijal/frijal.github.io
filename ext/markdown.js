/*!
 * markdown-enhancer-plus.js frijal
 * 🌿 Markdown enhancer ringan + heading, tabel, list, dan highlight.js otomatis.
 * ⚡ Aman untuk HTML statis — tidak mengganti seluruh struktur DOM.
 */

(async function () {

  // ------------------------------------
  // 🔹 Pastikan highlight.js termuat
  // ------------------------------------
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

  // ------------------------------------
  // 🔸 Inline markdown converter
  // ------------------------------------
  function convertInlineMarkdown(text) {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  // ------------------------------------
  // 🔹 Markdown tabel parser
  // ------------------------------------
  function parseMarkdownTable(markdown) {
    const lines = markdown.trim().split("\n");
    if (lines.length < 2) return markdown;

    const header = lines[0].split("|").filter(Boolean).map(c => c.trim());
    const divider = lines[1].trim();
    if (!divider.match(/^(\|\s*:?-+:?\s*)+$/)) return markdown;

    const rows = lines.slice(2).map(line =>
      line.split("|").filter(Boolean).map(c => c.trim())
    );

    let html = `<table class="md-table border border-gray-500 border-collapse my-4 w-full">`;
    html += "<thead><tr>" + header.map(h => `<th class="border px-2 py-1 bg-gray-800 text-white">${h}</th>`).join("") + "</tr></thead>";
    html += "<tbody>";
    html += rows.map(r => "<tr>" + r.map(c => `<td class="border px-2 py-1">${c}</td>`).join("") + "</tr>").join("");
    html += "</tbody></table>";
    return html;
  }

  // ------------------------------------
  // 🔸 Konversi blok markdown dasar
  // ------------------------------------
  function enhanceBlockMarkdown(el) {
    let html = el.innerHTML;

    // Code block (```js ... ```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
      const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre><code class="language-${lang || "plaintext"}">${escaped}</code></pre>`;
    });

    // Headings
    html = html
      .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
      .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
      .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>");

    // Blockquote
    html = html.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

    // Horizontal rule
    html = html.replace(/^-{3,}$/gm, "<hr>");

    // Tabel markdown
    html = html.replace(/((?:^\|.*\n)+)/gm, block => parseMarkdownTable(block));

    // Daftar berurutan
    html = html.replace(/(^\d+\.\s.+(?:\n\d+\.\s.+)*)/gm, match => {
      const items = match.split("\n").map(line => line.replace(/^\d+\.\s(.+)/, "<li>$1</li>")).join("");
      return `<ol class="list-decimal ml-5">${items}</ol>`;
    });

    // Daftar tidak berurutan
    html = html.replace(/(^\*\s.+(?:\n\*\s.+)*)/gm, match => {
      const items = match.split("\n").map(line => line.replace(/^\*\s(.+)/, "<li>$1</li>")).join("");
      return `<ul class="list-disc ml-5">${items}</ul>`;
    });

    el.innerHTML = html;
  }

  // ------------------------------------
  // 🔹 Proses semua elemen
  // ------------------------------------
  function enhanceMarkdown() {
    // Proses heading, list, table, blockquote
    document.querySelectorAll(".markdown, article, section").forEach(el => {
      enhanceBlockMarkdown(el);
    });

    // Inline markdown di <p>, <li>, <blockquote>
    document.querySelectorAll("p, li, blockquote").forEach(el => {
      if (!el.classList.contains("no-md")) {
        el.innerHTML = convertInlineMarkdown(el.innerHTML);
      }
    });
  }

  // ------------------------------------
  // 🔸 Highlight semua blok kode
  // ------------------------------------
  async function enhanceCodeBlocks() {
    const hljs = await ensureHighlightJS();
    document.querySelectorAll("pre code").forEach(el => {
      try { hljs.highlightElement(el); } catch {}
    });
  }

  // ------------------------------------
  // 🚀 Jalankan setelah DOM siap
  // ------------------------------------
  document.addEventListener("DOMContentLoaded", async () => {
    enhanceMarkdown();
    await enhanceCodeBlocks();
  });

})();

