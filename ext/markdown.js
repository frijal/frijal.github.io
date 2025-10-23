/*!
 * markdown-enhancer.js — Full Markdown → HTML + Table + Highlight + Remote .md
 * 🌿 Auto konversi elemen .markdown dan <article data-md="...">
 *   <article data-md="url/artikel-sample.md"></article>
 * by frijal + GPT-5
 */

(async function () {
  // --- Auto-load highlight.js bila belum ada ---
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

  // --- Parser tabel Markdown ---
  function parseMarkdownTable(markdown) {
    const lines = markdown.trim().split("\n");
    if (lines.length < 2) return markdown;

    const header = lines[0]
      .trim()
      .split("|")
      .filter(Boolean)
      .map(cell => cell.trim());
    const divider = lines[1].trim();
    if (!divider.match(/^(\|\s*:?-+:?\s*)+$/)) return markdown;

    const rows = lines.slice(2).map(line =>
      line
        .trim()
        .split("|")
        .filter(Boolean)
        .map(cell => cell.trim())
    );

    let html = `<table class="md-table border border-gray-400 border-collapse my-4 w-full">`;
    html += "<thead><tr>" + header.map(h => `<th class="border px-2 py-1 bg-gray-800 text-white">${h}</th>`).join("") + "</tr></thead>";
    html += "<tbody>";
    html += rows
      .map(r => "<tr>" + r.map(c => `<td class="border px-2 py-1">${c}</td>`).join("") + "</tr>")
      .join("");
    html += "</tbody></table>";
    return html;
  }

  // --- Markdown → HTML converter lengkap ---
  function markdownToHtml(text) {
    if (!text) return "";

    text = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Code block
    text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (m, lang, code) => {
      const codeEsc = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre><code class="language-${lang || "plaintext"}">${codeEsc}</code></pre>`;
    });

    // Table
    text = text.replace(/((?:^\|.*\n)+)/gm, block => parseMarkdownTable(block));

    // Headings
    text = text
      .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
      .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
      .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>");

    // Horizontal rule
    text = text.replace(/^-{3,}$/gm, "<hr>");

    // Bold / Italic / Strike / Inline code
    text = text
      .replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/~~(.*?)~~/g, "<del>$1</del>")
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>');

    // Links & Images
    text = text
      .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-3 rounded">')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Blockquote
    text = text.replace(/^> (.*)$/gm, "<blockquote>$1</blockquote>");

    // Ordered list
    text = text.replace(/^\d+\. (.*)$/gm, "<li>$1</li>");
    text = text.replace(/(<li>.*<\/li>)/gs, m => `<ol>${m}</ol>`);

    // Unordered list
    text = text.replace(/^\* (.*)$/gm, "<li>$1</li>");
    text = text.replace(/(<li>.*<\/li>)/gs, m => `<ul>${m}</ul>`);

    // Paragraphs
    text = text
      .split(/\n{2,}/)
      .map(p => (p.match(/^<h|^<ul|^<ol|^<pre|^<blockquote|^<hr|^<table/) ? p : `<p>${p}</p>`))
      .join("\n");

    return text;
  }

  // --- Proses semua elemen .markdown dan [data-md] ---
  async function enhanceMarkdownElements() {
    const hljs = await ensureHighlightJS();
    const elements = [...document.querySelectorAll(".markdown"), ...document.querySelectorAll("[data-md]")];

    for (const el of elements) {
      let raw = "";

      if (el.hasAttribute("data-md")) {
        const url = el.getAttribute("data-md");
        try {
          const res = await fetch(url);
          raw = await res.text();
        } catch {
          el.innerHTML = `<p style="color:red;">⚠️ Gagal memuat ${url}</p>`;
          continue;
        }
      } else {
        raw = el.textContent.trim();
      }

      el.innerHTML = markdownToHtml(raw);
      el.querySelectorAll("pre code").forEach(codeEl => {
        try { hljs.highlightElement(codeEl); } catch {}
      });
    }
  }

  // --- Jalankan otomatis setelah DOM siap ---
  document.addEventListener("DOMContentLoaded", () => {
    enhanceMarkdownElements();
  });
})();

