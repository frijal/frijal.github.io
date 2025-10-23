/*!
 * markdown-enhancer.js frijal
 * 🌿 Meningkatkan konten HTML yang berisi sintaks Markdown & blok kode.
 * Otomatis memuat highlight.js bila perlu.
 */
(async function () {
  // Muat highlight.js otomatis bila belum tersedia
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

  // Konversi inline Markdown → HTML ringan
  function convertInlineMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
  }

  // Proses <p>, <li>, <blockquote> yang berisi Markdown
  function enhanceMarkdown() {
    document.querySelectorAll("p, li, blockquote").forEach(el => {
      if (!el.classList.contains("no-md")) {
        el.innerHTML = convertInlineMarkdown(el.innerHTML);
      }
    });
  }

  // Proses highlight untuk <pre><code>
  async function enhanceCodeBlocks() {
    const hljs = await ensureHighlightJS();
    document.querySelectorAll("pre code").forEach(el => {
      try { hljs.highlightElement(el); } catch {}
    });
  }

  // Jalankan setelah DOM siap
  document.addEventListener("DOMContentLoaded", async () => {
    enhanceMarkdown();
    await enhanceCodeBlocks();
  });
})();

