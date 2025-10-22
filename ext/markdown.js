(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node / CommonJS
    module.exports = factory();
  } else {
    // Browser global
    root.simpleMarkdownToHtml = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function simpleMarkdownToHtml(text) {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>') // Bold
      .replace(/(^|[^*])\*(.*?)\*(?!\*)/g, '$1<em>$2</em>') // Italic
      .replace(/`([^`]+)`/g, '<code class="bg-gray-200 text-sm p-1 rounded">$1</code>') // Inline code
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        // Escape HTML entities
        code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // Highlight jika highlight.js tersedia
        if (typeof hljs !== "undefined" && lang && hljs.getLanguage(lang)) {
          const highlighted = hljs.highlight(code, { language: lang }).value;
          return `<pre class="code-block bg-gray-900 text-white p-4 rounded-lg my-4 overflow-x-auto"><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } else if (typeof hljs !== "undefined") {
          const highlighted = hljs.highlightAuto(code).value;
          return `<pre class="code-block bg-gray-900 text-white p-4 rounded-lg my-4 overflow-x-auto"><code class="hljs">${highlighted}</code></pre>`;
        }
        return `<pre class="code-block bg-gray-900 text-white p-4 rounded-lg my-4 overflow-x-auto"><code>${code}</code></pre>`;
      })
      .replace(/^\* (.*)$/gm, '<li class="ml-5 list-disc">$1</li>');

    // Gabungkan list items ke dalam satu <ul>
    html = html.replace(/(<li.*<\/li>\s*)+/g, match => `<ul>${match}</ul>`);

    // Ganti newline dengan <br> kecuali dalam <pre>
    const parts = html.split(/(<pre[\s\S]*?<\/pre>)/);
    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].startsWith('<pre')) {
        parts[i] = parts[i].replace(/\n/g, '<br>');
      }
    }
    return parts.join('');
  }

  return simpleMarkdownToHtml;
}));
