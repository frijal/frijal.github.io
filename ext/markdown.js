/*!
 * markdown-enhancer.js
 * 🌿 Meningkatkan konten HTML yang berisi sintaks Markdown & blok kode.
 * Otomatis memuat highlight.js bila perlu.
 */

(async function () {
  // Fungsi untuk memuat highlight.js dari CDN bila belum ada
  async function ensureHighlightJS() {
    if (window.hljs) return window.hljs;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js";
    document.head.appendChild(script);

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github-dark.min.css";
    document.head.appendChild(link);

    await new Promise(res => script.onload = res);
    return window.hljs;
  }

  // Fungsi konversi markdown sederhana ke HTML (hanya untuk paragraf/blockquote ringan)
  function convertInlineMarkdown(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>');
  }

  // Proses semua <p>, <li>, <blockquote> dsb yang mengandung markdown
  function enhanceMarkdown() {
    const selector = "p, li, blockquote";
    document.querySelectorAll(selector).forEach(el => {
      if (!el.classList.contains("no-md")) {
        el.innerHTML = convertInlineMarkdown(el.innerHTML);
      }
    });
  }

  // Highlight blok kode <pre><code>
  async function enhanceCodeBlocks() {
    const hljs = await ensureHighlightJS();
    document.querySelectorAll("pre code").forEach(el => {
      try { hljs.highlightElement(el); } catch (e) {}
    });
  }

  // Jalankan ketika DOM sudah siap
  document.addEventListener("DOMContentLoaded", async () => {
    enhanceMarkdown();
    await enhanceCodeBlocks();
    console.info("✅ Markdown enhancer aktif");
  });
})();
