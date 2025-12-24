/* scripts/articles.js
 *   Versi non-module: expose API di window.AppArticles
 */
(function (global) {
  const CONFIG = {
    jsonPath: 'artikel.json',
    pageSize: 12,
    thumbnailSidebarCount: 12
  };

  let ALL_ARTICLES = [];
  let FILTERED = [];
  let CURRENT_PAGE = 1;
  let CURRENT_SORT = { field: 'date', dir: 'desc' };

  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));
  const fmtDate = iso => {
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString();
  };

  function escapeHtml(s='') {
    return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
  }

  async function loadArticles() {
    try {
      const res = await fetch(CONFIG.jsonPath, { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat artikel.json: ' + res.status);
      const data = await res.json();
      ALL_ARTICLES = Array.isArray(data) ? data.slice() : [];
      ALL_ARTICLES = ALL_ARTICLES.map(a => ({
        title: a.title || a.judul || '',
        slug: a.slug || '',
        url: a.url || a.link || '#',
        image: a.image || a.gambar || a.thumbnail || '',
        datetime: a.datetime || a.published_at || a.tanggal || '',
        category: a.category || a.kategori || 'Uncategorized'
      }));
      FILTERED = ALL_ARTICLES.slice();
      buildArchiveAndFilters();
      renderAll();
    } catch (err) {
      console.error(err);
      const el = qs('#main') || qs('main');
      if (el) el.innerHTML = `<div class="error">Terjadi kesalahan saat memuat data: ${escapeHtml(err.message)}</div>`;
    }
  }

  function renderAll() {
    renderSidebarThumbnails();
    renderArchive();
    renderFiltersUI();
    renderArticlesPage(CURRENT_PAGE);
    renderPagination();
  }

  function articleCardHTML(a) {
    return `
    <article class="article-card">
    <a href="${escapeHtml(a.url)}" class="card-link" target="_blank" rel="noopener">
    <div class="card-media">
    <img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}" />
    </div>
    <div class="card-body">
    <h3 class="card-title">${escapeHtml(a.title)}</h3>
    <div class="card-meta">
    <span class="cat">${escapeHtml(a.category)}</span>
    <time datetime="${escapeHtml(a.datetime)}">${escapeHtml(fmtDate(a.datetime))}</time>
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
    container.innerHTML = pageItems.map(a => articleCardHTML(a)).join('');
    qsa('.article-card img').forEach(img => img.setAttribute('loading', 'lazy'));
    const countEl = qs('#results-count');
    if (countEl) countEl.textContent = `${FILTERED.length} artikel`;
  }

  function renderSidebarThumbnails() {
    const el = qs('#sidebar-thumbs');
    if (!el) return;
    const thumbs = ALL_ARTICLES
    .slice()
    .sort((a,b) => new Date(b.datetime) - new Date(a.datetime))
    .slice(0, CONFIG.thumbnailSidebarCount);
    el.innerHTML = thumbs.map(t => `
    <a class="thumb-item" href="${escapeHtml(t.url)}" target="_blank" rel="noopener">
    <img src="${escapeHtml(t.image)}" alt="${escapeHtml(t.title)}" loading="lazy" />
    <div class="thumb-title">${escapeHtml(t.title)}</div>
    </a>
    `).join('');
  }

  let ARCHIVE = {};
  function buildArchiveAndFilters() {
    ARCHIVE = {};
    ALL_ARTICLES.forEach(a => {
      const d = new Date(a.datetime);
      const year = isNaN(d) ? 'Unknown' : d.getFullYear();
      const month = isNaN(d) ? 'Unknown' : (d.getMonth() + 1);
      ARCHIVE[year] = ARCHIVE[year] || {};
      ARCHIVE[year][month] = ARCHIVE[year][month] || [];
      ARCHIVE[year][month].push(a);
    });
  }

  function renderArchive() {
    const el = qs('#archive');
    if (!el) return;
    const years = Object.keys(ARCHIVE).sort((a,b) => b - a);
    el.innerHTML = years.map(y => {
      const months = Object.keys(ARCHIVE[y]).sort((a,b) => b - a);
      const monthsHtml = months.map(m => {
        const count = ARCHIVE[y][m].length;
        const monthLabel = m === 'Unknown' ? 'Unknown' : new Date(y, m-1).toLocaleString(undefined, { month: 'short' });
        return `<button class="archive-month" data-year="${y}" data-month="${m}">${monthLabel} (${count})</button>`;
      }).join('');
      return `<div class="archive-year">
      <div class="year-label">${y}</div>
      <div class="year-months">${monthsHtml}</div>
      </div>`;
    }).join('');
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

    const years = Object.keys(ARCHIVE).sort((a,b) => b - a);
    const yearSelect = qs('#filter-year');
    if (yearSelect) {
      yearSelect.innerHTML = `<option value="">Semua Tahun</option>` +
      years.map(y => `<option value="${y}">${y}</option>`).join('');
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
    const months = Object.keys(ARCHIVE[year]).sort((a,b) => b - a);
    months.forEach(m => {
      const label = m === 'Unknown' ? 'Unknown' : new Date(year, m-1).toLocaleString(undefined, { month: 'long' });
      monthSelect.insertAdjacentHTML('beforeend', `<option value="${m}">${label}</option>`);
    });
  }

  function applyCascadingFilter({ category=null, year=null, month=null, q=null } = {}) {
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
        const d = new Date(a.datetime);
        if (isNaN(d) || String(d.getFullYear()) !== String(yearVal)) return false;
      }
      if (monthVal) {
        const d = new Date(a.datetime);
        const m = isNaN(d) ? 'Unknown' : (d.getMonth() + 1);
        if (String(m) !== String(monthVal)) return false;
      }
      if (qVal) {
        const ql = qVal.toLowerCase();
        if (!(a.title.toLowerCase().includes(ql) || (a.category && a.category.toLowerCase().includes(ql)))) return false;
      }
      return true;
    });

    renderArticlesPage(1);
    renderPagination();
  }

  function applySort(list) {
    const copy = list.slice();
    if (CURRENT_SORT.field === 'date') {
      copy.sort((a,b) => {
        const da = new Date(a.datetime), db = new Date(b.datetime);
        return CURRENT_SORT.dir === 'desc' ? db - da : da - db;
      });
    } else if (CURRENT_SORT.field === 'title') {
      copy.sort((a,b) => {
        const A = a.title.toLowerCase(), B = b.title.toLowerCase();
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

    if (current > 1) pageButtons.push(`<button class="page-btn" data-page="${current-1}">Prev</button>`);
    for (let p = start; p <= end; p++) {
      pageButtons.push(`<button class="page-btn ${p===current ? 'active' : ''}" data-page="${p}">${p}</button>`);
    }
    if (current < pages) pageButtons.push(`<button class="page-btn" data-page="${current+1}">Next</button>`);

    el.innerHTML = pageButtons.join('');
    qsa('#pagination .page-btn').forEach(b => b.addEventListener('click', () => {
      const p = Number(b.dataset.page);
      renderArticlesPage(p);
      renderPagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  // expose API
  global.AppArticles = {
    loadArticles,
 renderAll,
 applyCascadingFilter
  };

})(window);
