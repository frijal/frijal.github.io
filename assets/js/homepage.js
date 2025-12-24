/* scripts/articles.js
 *   Versi non-module, expose API di window.AppArticles
 */
(function (global) {
  'use strict';

  // Default config (bisa di-override lewat AppArticles.init)
  const DEFAULT_CONFIG = {
    jsonPath: './artikel.json',
    pageSize: 12,
    thumbnailSidebarCount: 12,
    placeholderImage: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240"><rect width="100%" height="100%" fill="%230b1220"/><text x="50%" y="50%" fill="%23ffffff" font-size="18" font-family="Arial" dominant-baseline="middle" text-anchor="middle">No Image</text></svg>',
    fetchFallbackUrl: null // optional fallback URL (string) jika fetch lokal gagal
  };

  let CONFIG = Object.assign({}, DEFAULT_CONFIG);

  let ALL_ARTICLES = [];
  let FILTERED = [];
  let CURRENT_PAGE = 1;
  let CURRENT_SORT = { field: 'date', dir: 'desc' };
  let ARCHIVE = {};

  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));

  /* ---------- Utilities ---------- */
  const fmtDate = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso || '';
    return d.toLocaleString();
  };

  function safeDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }

  function escapeHtml(s = '') {
    return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  }

  /* ---------- Data loading ---------- */
  async function fetchJson(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      // show a preview to help debugging
      const preview = text.slice(0, 500);
      throw new Error(`Invalid JSON: ${err.message}. Preview: ${preview}`);
    }
  }

  async function loadArticles() {
    try {
      const data = await fetchJson(CONFIG.jsonPath);
      normalizeAndInit(data);
    } catch (err) {
      console.warn('Gagal memuat', CONFIG.jsonPath, err.message);
      if (CONFIG.fetchFallbackUrl) {
        try {
          const data = await fetchJson(CONFIG.fetchFallbackUrl);
          normalizeAndInit(data);
          return;
        } catch (err2) {
          console.error('Fallback juga gagal:', err2);
          showLoadError(err2);
          return;
        }
      }
      showLoadError(err);
    }
  }

  function showLoadError(err) {
    console.error(err);
    const el = qs('#main') || qs('main') || qs('body');
    if (el) {
      const msg = escapeHtml(err.message || 'Unknown error');
      el.insertAdjacentHTML('afterbegin', `<div class="error">Terjadi kesalahan saat memuat data: ${msg}</div>`);
    }
  }

  function normalizeAndInit(data) {
    ALL_ARTICLES = Array.isArray(data) ? data.slice() : [];
    ALL_ARTICLES = ALL_ARTICLES.map(a => {
      const datetime = a.datetime || a.published_at || a.tanggal || a.date || '';
      return {
        title: a.title || a.judul || '',
        slug: a.slug || '',
        url: a.url || a.link || '#',
        image: a.image || a.gambar || a.thumbnail || CONFIG.placeholderImage,
        datetime: datetime,
        category: a.category || a.kategori || 'Uncategorized',
        // keep original object for future use if needed
        __raw: a
      };
    });
    FILTERED = ALL_ARTICLES.slice();
    buildArchiveAndFilters();
    renderAll();
  }

  /* ---------- Rendering ---------- */
  function renderAll() {
    renderSidebarThumbnails();
    renderArchive();
    renderFiltersUI();
    renderArticlesPage(CURRENT_PAGE);
    renderPagination();
  }

  function articleCardHTML(a) {
    const img = a.image || CONFIG.placeholderImage;
    const title = escapeHtml(a.title || 'Untitled');
    const url = escapeHtml(a.url || '#');
    const cat = escapeHtml(a.category || 'Uncategorized');
    const dt = escapeHtml(fmtDate(a.datetime));
    return `
    <article class="article-card">
    <a href="${url}" class="card-link" target="_blank" rel="noopener">
    <div class="card-media">
    <img src="${escapeHtml(img)}" alt="${title}" loading="lazy" />
    </div>
    <div class="card-body">
    <h3 class="card-title">${title}</h3>
    <div class="card-meta">
    <span class="cat">${cat}</span>
    <time datetime="${escapeHtml(a.datetime)}">${dt}</time>
    </div>
    </div>
    </a>
    </article>`;
  }

  function renderArticlesPage(page = 1) {
    CURRENT_PAGE = page;
    const container = qs('#articles-grid');
    if (!container) return;
    const sorted = applySort(FILTERED);
    const start = (page - 1) * CONFIG.pageSize;
    const pageItems = sorted.slice(start, start + CONFIG.pageSize);
    container.innerHTML = pageItems.map(a => articleCardHTML(a)).join('') || `<div class="no-results">Tidak ada artikel.</div>`;
    qsa('.article-card img').forEach(img => img.setAttribute('loading', 'lazy'));
    const countEl = qs('#results-count');
    if (countEl) countEl.textContent = `${FILTERED.length} artikel`;
  }

  function renderSidebarThumbnails() {
    const el = qs('#sidebar-thumbs');
    if (!el) return;
    const thumbs = ALL_ARTICLES
    .slice()
    .sort((a, b) => {
      const da = safeDate(a.datetime) || new Date(0);
      const db = safeDate(b.datetime) || new Date(0);
      return db - da;
    })
    .slice(0, CONFIG.thumbnailSidebarCount);
    el.innerHTML = thumbs.map(t => {
      const img = escapeHtml(t.image || CONFIG.placeholderImage);
      const title = escapeHtml(t.title || 'Untitled');
      const url = escapeHtml(t.url || '#');
      return `
      <a class="thumb-item" href="${url}" target="_blank" rel="noopener">
      <img src="${img}" alt="${title}" loading="lazy" />
      <div class="thumb-title">${title}</div>
      </a>`;
    }).join('');
  }

  function buildArchiveAndFilters() {
    ARCHIVE = {};
    ALL_ARTICLES.forEach(a => {
      const d = safeDate(a.datetime);
      const year = d ? String(d.getFullYear()) : 'Unknown';
      const month = d ? String(d.getMonth() + 1) : 'Unknown';
      ARCHIVE[year] = ARCHIVE[year] || {};
      ARCHIVE[year][month] = ARCHIVE[year][month] || [];
      ARCHIVE[year][month].push(a);
    });
  }

  function renderArchive() {
    const el = qs('#archive');
    if (!el) return;
    const years = Object.keys(ARCHIVE).sort((a, b) => Number(b) - Number(a));
    el.innerHTML = years.map(y => {
      const months = Object.keys(ARCHIVE[y]).sort((a, b) => Number(b) - Number(a));
      const monthsHtml = months.map(m => {
        const count = ARCHIVE[y][m].length;
        const monthLabel = m === 'Unknown' ? 'Unknown' : new Date(Number(y), Number(m) - 1).toLocaleString(undefined, { month: 'short' });
        return `<button class="archive-month" data-year="${escapeHtml(y)}" data-month="${escapeHtml(m)}">${escapeHtml(monthLabel)} (${count})</button>`;
      }).join('');
      return `<div class="archive-year">
      <div class="year-label">${escapeHtml(y)}</div>
      <div class="year-months">${monthsHtml}</div>
      </div>`;
    }).join('');
    // bind handlers after DOM insertion
    qsa('.archive-month').forEach(btn => {
      btn.addEventListener('click', () => {
        const y = btn.dataset.year;
        const m = btn.dataset.month;
        applyCascadingFilter({ year: y, month: m });
      });
    });
  }

  function renderFiltersUI() {
    const catSet = new Set(ALL_ARTICLES.map(a => a.category));
    const catSelect = qs('#filter-category');
    if (catSelect) {
      catSelect.innerHTML = `<option value="">Semua Kategori</option>` +
      Array.from(catSet).sort().map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
      catSelect.addEventListener('change', () => {
        applyCascadingFilter({ category: catSelect.value || null });
      });
    }

    const years = Object.keys(ARCHIVE).sort((a, b) => Number(b) - Number(a));
    const yearSelect = qs('#filter-year');
    if (yearSelect) {
      yearSelect.innerHTML = `<option value="">Semua Tahun</option>` +
      years.map(y => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`).join('');
      yearSelect.addEventListener('change', () => {
        const y = yearSelect.value || null;
        populateMonthSelect(y);
        applyCascadingFilter({ year: y });
      });
    }

    const monthSelect = qs('#filter-month');
    if (monthSelect) {
      monthSelect.addEventListener('change', () => {
        const m = monthSelect.value || null;
        applyCascadingFilter({ month: m });
      });
    }

    const sortSelect = qs('#sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const val = sortSelect.value;
        if (val === 'newest') CURRENT_SORT = { field: 'date', dir: 'desc' };
        if (val === 'oldest') CURRENT_SORT = { field: 'date', dir: 'asc' };
        if (val === 'title-asc') CURRENT_SORT = { field: 'title', dir: 'asc' };
        if (val === 'title-desc') CURRENT_SORT = { field: 'title', dir: 'desc' };
        renderArticlesPage(1);
        renderPagination();
      });
    }

    const searchBox = qs('#search-box');
    if (searchBox) {
      let timer;
      searchBox.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          applyCascadingFilter({ q: searchBox.value.trim() || null });
        }, 300);
      });
    }
  }

  function populateMonthSelect(year) {
    const monthSelect = qs('#filter-month');
    if (!monthSelect) return;
    monthSelect.innerHTML = `<option value="">Semua Bulan</option>`;
    if (!year || !ARCHIVE[year]) return;
    const months = Object.keys(ARCHIVE[year]).sort((a, b) => Number(b) - Number(a));
    months.forEach(m => {
      const label = m === 'Unknown' ? 'Unknown' : new Date(Number(year), Number(m) - 1).toLocaleString(undefined, { month: 'long' });
      monthSelect.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(m)}">${escapeHtml(label)}</option>`);
    });
  }

  function applyCascadingFilter({ category = null, year = null, month = null, q = null } = {}) {
    const catSel = qs('#filter-category');
    const yearSel = qs('#filter-year');
    const monthSel = qs('#filter-month');
    const searchBox = qs('#search-box');

    const catVal = category !== null ? category : (catSel ? catSel.value || null : null);
    const yearVal = year !== null ? year : (yearSel ? yearSel.value || null : null);
    const monthVal = month !== null ? month : (monthSel ? monthSel.value || null : null);
    const qVal = q !== null ? q : (searchBox ? searchBox.value.trim() || null : null);

    FILTERED = ALL_ARTICLES.filter(a => {
      if (catVal && a.category !== catVal) return false;
      if (yearVal) {
        const d = safeDate(a.datetime);
        if (!d || String(d.getFullYear()) !== String(yearVal)) return false;
      }
      if (monthVal) {
        const d = safeDate(a.datetime);
        const m = d ? String(d.getMonth() + 1) : 'Unknown';
        if (String(m) !== String(monthVal)) return false;
      }
      if (qVal) {
        const ql = qVal.toLowerCase();
        if (!(String(a.title || '').toLowerCase().includes(ql) || (a.category && a.category.toLowerCase().includes(ql)))) return false;
      }
      return true;
    });

    renderArticlesPage(1);
    renderPagination();
  }

  function applySort(list) {
    const copy = list.slice();
    if (CURRENT_SORT.field === 'date') {
      copy.sort((a, b) => {
        const da = safeDate(a.datetime) || new Date(0);
        const db = safeDate(b.datetime) || new Date(0);
        return CURRENT_SORT.dir === 'desc' ? db - da : da - db;
      });
    } else if (CURRENT_SORT.field === 'title') {
      copy.sort((a, b) => {
        const A = String(a.title || '').toLowerCase();
        const B = String(b.title || '').toLowerCase();
        if (A < B) return CURRENT_SORT.dir === 'asc' ? -1 : 1;
        if (A > B) return CURRENT_SORT.dir === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return copy;
  }

  function renderPagination() {
    const total = FILTERED.length;
    const pages = Math.max(1, Math.ceil(total / CONFIG.pageSize));
    const el = qs('#pagination');
    if (!el) return;
    const pageButtons = [];
    const current = CURRENT_PAGE;
    const range = 2;
    const start = Math.max(1, current - range);
    const end = Math.min(pages, current + range);

    if (current > 1) pageButtons.push(`<button class="page-btn" data-page="${current - 1}">Prev</button>`);
    for (let p = start; p <= end; p++) {
      pageButtons.push(`<button class="page-btn ${p === current ? 'active' : ''}" data-page="${p}">${p}</button>`);
    }
    if (current < pages) pageButtons.push(`<button class="page-btn" data-page="${current + 1}">Next</button>`);

    el.innerHTML = pageButtons.join('');
    qsa('#pagination .page-btn').forEach(b => b.addEventListener('click', () => {
      const p = Number(b.dataset.page);
      renderArticlesPage(p);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  /* ---------- Public API ---------- */
  global.AppArticles = {
    init(options = {}) {
      CONFIG = Object.assign({}, CONFIG, options || {});
      // If DOM already ready, start loading; otherwise caller should call loadArticles after DOMContentLoaded
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // small timeout to ensure elements exist
        setTimeout(() => loadArticles(), 0);
      }
    },
    loadArticles,
    renderAll,
    applyCascadingFilter,
    // expose internals for debugging (read-only)
    _internals: {
      get CONFIG() { return CONFIG; },
 get ALL_ARTICLES() { return ALL_ARTICLES.slice(); },
 get FILTERED() { return FILTERED.slice(); },
 get ARCHIVE() { return Object.assign({}, ARCHIVE); }
    }
  };

})(window);
