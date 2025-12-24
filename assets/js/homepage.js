/**
 * assets/js/homepage.js
 * FINAL: details/summary + filter counter (no JS toggle)
 */
(function (global) {
  'use strict';

  const CONFIG = {
    jsonPath: './artikel.json',
    pageSize: 8,
    thumbnailSidebarCount: 10,
    placeholderImage: './thumbnail.webp'
  };

  let ALL_ARTICLES = [];
  let FILTERED = [];
  let CURRENT_PAGE = 1;
  let ARCHIVE_YEARS = [];

  const qs = sel => document.querySelector(sel);
  const qsa = sel => document.querySelectorAll(sel);

  const escapeHtml = s =>
  String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

  const safeDate = iso => {
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  };

  const fmtDate = iso => {
    const d = safeDate(iso);
    return d
    ? d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    : (iso || '');
  };

  /* =====================================================
   * THEME
   * ===================================================== */
  function initTheme() {
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = e =>
    document.documentElement.classList.toggle('dark-mode', e.matches);

    updateTheme(themeMedia);
    themeMedia.addEventListener('change', updateTheme);
  }

  /* =====================================================
   * LOAD DATA
   * ===================================================== */
  async function loadArticles() {
    try {
      const res = await fetch(CONFIG.jsonPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      normalizeAndInit(data);
    } catch (err) {
      console.error('Gagal memuat artikel:', err);
      const feed = qs('#main-feed');
      if (feed) feed.innerHTML = `<div class="error">Gagal memuat data.</div>`;
    }
  }

  function normalizeAndInit(data) {
    ALL_ARTICLES = [];
    const seenTitles = new Set();
    const yearSet = new Set();

    for (const category in data) {
      if (!Array.isArray(data[category])) continue;

      data[category].forEach(item => {
        const title = item[0] || 'Untitled';
        const key = title.trim().toLowerCase();
        if (seenTitles.has(key)) return;

        seenTitles.add(key);
        const d = safeDate(item[3]);
        if (d) yearSet.add(String(d.getFullYear()));

        ALL_ARTICLES.push({
          title,
          url: item[1] || '#',
          image: item[2] || CONFIG.placeholderImage,
          datetime: item[3] || '',
          desc: item[4] || '',
          category,
          timestamp: d ? d.getTime() : 0
        });
      });
    }

    ALL_ARTICLES.sort((a, b) => b.timestamp - a.timestamp);
    ARCHIVE_YEARS = [...yearSet].sort((a, b) => b - a);

    renderFiltersUI();
    applyFilters();
  }

  /* =====================================================
   * FILTER UI
   * ===================================================== */
  function renderFiltersUI() {
    const yearSel = qs('#filter-year');
    const monthSel = qs('#filter-month');
    const catSel = qs('#filter-category');
    const searchBox = qs('#search-box');
    const btnReset = qs('#btn-reset');

    if (!yearSel || !monthSel || !catSel) return;

    yearSel.innerHTML =
    '<option value="">Tahun</option>' +
    ARCHIVE_YEARS.map(y => `<option value="${y}">${y}</option>`).join('');

    const updateDropdowns = () => {
      const y = yearSel.value;
      const m = monthSel.value;
      const c = catSel.value;

      const inYear = ALL_ARTICLES.filter(a => {
        const d = safeDate(a.datetime);
        return !y || (d && String(d.getFullYear()) === y);
      });

      const months = new Set();
      inYear.forEach(a => {
        const d = safeDate(a.datetime);
        if (d) months.add(String(d.getMonth() + 1).padStart(2, '0'));
      });

        monthSel.innerHTML = '<option value="">Bulan</option>';
        [...months].sort().forEach(mm => {
          const label = new Date(2000, mm - 1).toLocaleString('id-ID', { month: 'long' });
          monthSel.innerHTML += `<option value="${mm}" ${mm === m ? 'selected' : ''}>${label}</option>`;
        });

        monthSel.disabled = !y;
        monthSel.style.opacity = y ? '1' : '0.5';

        const inMonth = inYear.filter(a => {
          const d = safeDate(a.datetime);
          return !m || (d && String(d.getMonth() + 1).padStart(2, '0') === m);
        });

        const catCount = {};
        inMonth.forEach(a => {
          catCount[a.category] = (catCount[a.category] || 0) + 1;
        });

        catSel.innerHTML = '<option value="">Kategori</option>';
        Object.entries(catCount).sort().forEach(([name, count]) => {
          catSel.innerHTML += `<option value="${name}" ${name === c ? 'selected' : ''}>${name} (${count})</option>`;
        });
    };

    yearSel.onchange = () => {
      monthSel.value = '';
      updateDropdowns();
      applyFilters();
    };

    monthSel.onchange = () => {
      updateDropdowns();
      applyFilters();
    };

    catSel.onchange = applyFilters;

    if (btnReset) {
      btnReset.onclick = () => {
        if (searchBox) searchBox.value = '';
        yearSel.value = '';
        monthSel.value = '';
        catSel.value = '';
        updateDropdowns();
        applyFilters();
      };
    }

    if (searchBox) searchBox.oninput = debounce(applyFilters, 300);

    updateDropdowns();
  }

  /* =====================================================
   * FILTER LOGIC
   * ===================================================== */
  function applyFilters() {
    const q = (qs('#search-box')?.value || '').toLowerCase();
    const y = qs('#filter-year')?.value || '';
    const m = qs('#filter-month')?.value || '';
    const c = qs('#filter-category')?.value || '';

    FILTERED = ALL_ARTICLES.filter(a => {
      const d = safeDate(a.datetime);
      return (
        (!q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q)) &&
        (!y || (d && String(d.getFullYear()) === y)) &&
        (!m || (d && String(d.getMonth() + 1).padStart(2, '0') === m)) &&
        (!c || a.category === c)
      );
    });

    updateFilterCount();
    renderArticlesPage(1);
  }

  /* =====================================================
   * FILTER COUNT BADGE (details summary)
   * ===================================================== */
  function updateFilterCount() {
    const details = qs('.mobile-filter');
    if (!details) return;

    const count = [
      qs('#filter-year')?.value,
 qs('#filter-month')?.value,
 qs('#filter-category')?.value
    ].filter(Boolean).length;

    details.setAttribute('data-count', count);
  }

  /* =====================================================
   * RENDER CONTENT
   * ===================================================== */
  function renderArticlesPage(page = 1) {
    CURRENT_PAGE = page;
    const container = qs('#main-feed');
    if (!container) return;

    const start = (page - 1) * CONFIG.pageSize;
    const items = FILTERED.slice(start, start + CONFIG.pageSize);

    container.innerHTML =
    items
    .map(
      a => `
      <article class="news-card">
      <img src="${a.image}" alt="${escapeHtml(a.title)}"
      loading="lazy"
      onerror="this.src='${CONFIG.placeholderImage}'">
      <div class="news-info">
      <span class="badge">${escapeHtml(a.category)}</span>
      <small class="meta-date">${fmtDate(a.datetime)}</small>
      <h3><a href="${a.url}">${escapeHtml(a.title)}</a></h3>
      <p>${escapeHtml(a.desc.slice(0, 110))}...</p>
      </div>
      </article>`
    )
    .join('') || `<div class="no-results">Tidak ada artikel ditemukan.</div>`;

    const countEl = qs('#results-count');
    if (countEl) countEl.textContent = `Total: ${FILTERED.length} artikel`;

    renderSidebarThumbnails();
    renderPagination();
  }

  function renderSidebarThumbnails() {
    const el = qs('#sidebar-list');
    if (!el) return;

    const shuffled = [...ALL_ARTICLES]
    .sort(() => 0.5 - Math.random())
    .slice(0, CONFIG.thumbnailSidebarCount);

    el.innerHTML = shuffled
    .map(
      a => `
      <div class="side-item">
      <img src="${a.image}" loading="lazy"
      onerror="this.src='${CONFIG.placeholderImage}'">
      <h4><a href="${a.url}">${escapeHtml(a.title)}</a></h4>
      </div>`
    )
    .join('');
  }

  function renderPagination() {
    const el = qs('#pagination');
    const total = Math.ceil(FILTERED.length / CONFIG.pageSize);
    if (!el || total <= 1) {
      if (el) el.innerHTML = '';
      return;
    }

    el.innerHTML = '';

    const nav = (label, page, disabled = false) => {
      const b = document.createElement('button');
      b.innerHTML = label;
      b.className = 'page-nav-btn';
      b.disabled = disabled;
      b.onclick = () => goToPage(page);
      el.appendChild(b);
    };

    nav('&laquo;', CURRENT_PAGE - 1, CURRENT_PAGE === 1);

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - CURRENT_PAGE) <= 1) {
        const b = document.createElement('button');
        b.textContent = i;
        b.className = `page-num-btn ${i === CURRENT_PAGE ? 'active' : ''}`;
        b.onclick = () => goToPage(i);
        el.appendChild(b);
      }
    }

    nav('&raquo;', CURRENT_PAGE + 1, CURRENT_PAGE === total);
  }

  function goToPage(p) {
    renderArticlesPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  /* =====================================================
   * INIT
   * ===================================================== */
  initTheme();
  loadArticles();

})(window);
