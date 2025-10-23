/*!
  simple-markdown.js — Markdown ringan + highlight.js otomatis (CDN)
  Fitur:
  ✅ Auto-load highlight.js jika belum tersedia
  ✅ Highlight blok kode setelah disisipkan ke DOM
  ✅ Callback onHighlighted() ketika highlight selesai
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.simpleMarkdownToHtml = factory();
}(typeof self !== 'undefined' ? self : this, function () {

  // -------------------------------
  // 🔸 Loader highlight.js (Promise)
  // -------------------------------
  let hljsReady;
  (function ensureHljs() {
    if (typeof window === 'undefined') {
      hljsReady = Promise.resolve();
      return;
    }
    if (typeof hljs !== 'undefined') {
      hljsReady = Promise.resolve(hljs);
      return;
    }

    hljsReady = new Promise((resolve) => {
      try {
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js";
        script.async = true;
        script.onload = () => {
          if (typeof hljs !== 'undefined') {
            hljs.configure?.({ ignoreUnescapedHTML: true });
            console.log('✅ highlight.js loaded from CDN');
          }
          resolve(window.hljs);
        };
        script.onerror = (ev) => {
          console.warn('⚠️ Gagal memuat highlight.js dari CDN', ev);
          resolve(undefined);
        };
        document.head.appendChild(script);

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github-dark.min.css";
        document.head.appendChild(link);
      } catch {
        resolve(undefined);
      }
    });
  })();

  // -------------------------------
  // 🔸 Util: ID unik per pemanggilan
  // -------------------------------
  function makeId() {
    return 'sm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------------------------------
  // 🔹 Fungsi utama: Markdown → HTML
  // ---------------------------------
  function simpleMarkdownToHtml(text, options = {}) {
    const { onHighlighted } = options;
    if (typeof text !== 'string') text = String(text || '');
    const callId = makeId();

    let html = text
      // Heading
      .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')

      // Gambar
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-3 rounded-lg max-w-full">')

      // Link
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')

      // Bold / Italic / Inline Code
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-sm p-1 rounded">$1</code>')

      // Code block ```
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const esc = code
          .replace(/&/g, '&amp;')
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<pre class="code-block bg-gray-900 text-white p-4 rounded-lg my-4 overflow-x-auto"><code data-smid="${callId}" class="language-${lang || 'text'}">${esc}</code></pre>`;
      })

      // List item
      .replace(/^\* (.*)$/gm, '<li class="ml-5 list-disc">$1</li>');

    // Gabungkan list item jadi <ul>
    html = html.replace(/(<li.*?<\/li>\s*)+/g, match => `<ul>${match}</ul>`);

    // Jaga agar newline di luar <pre> menjadi <br>
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('<pre')) {
        parts[i] = parts[i].replace(/\n/g, '<br>');
      }
    }
    const result = parts.join('');

    // ---------------------------------
    // 🔸 Highlight setelah DOM update
    // ---------------------------------
    setTimeout(() => {
      hljsReady.then((hljsObj) => {
        if (!hljsObj) return onHighlighted?.(false);

        const els = document.querySelectorAll(`code[data-smid="${callId}"]`);
        const highlightFn = (node) => {
          try { hljsObj.highlightElement(node); } catch { }
        };

        if (els.length > 0) {
          els.forEach(highlightFn);
          onHighlighted?.(true);
        } else {
          // Jika HTML belum disisipkan ke DOM, coba lagi sedikit kemudian
          setTimeout(() => {
            const els2 = document.querySelectorAll(`code[data-smid="${callId}"]`);
            els2.forEach(highlightFn);
            onHighlighted?.(els2.length > 0);
          }, 300);
        }
      }).catch(() => onHighlighted?.(false));
    }, 30);

    return result;
  }

  // ---------------------------------
  // Ekspor
  // ---------------------------------
  return simpleMarkdownToHtml;
}));
