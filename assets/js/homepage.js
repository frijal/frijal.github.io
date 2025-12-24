/**
 * assets/js/homepage.js
 * Perbaikan: Urutan Bulan, Counter Kategori, & Fix Cascading Filter
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
  let ARCHIVE = {};

  const qs = sel => document.querySelector(sel);
  const escapeHtml = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeDate = iso => { const d = new Date(iso); return isNaN(d) ? null : d; };
  const fmtDate = iso => {
    const d = safeDate(iso);
    return d ? d.toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : (iso || '');
  };

  function initTheme() {
    const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e) => document.documentElement.classList.toggle('dark-mode', e.matches);
    updateTheme(themeMedia);
    themeMedia.addEventListener('change', updateTheme);
  }

  async function loadArticles() {
    try {
      const res = await fetch(CONFIG.jsonPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      normalizeAndInit(data);
    } catch (err) {
      console.error('Gagal memuat artikel:', err);
      if (qs('#main-feed')) qs('#main-feed').innerHTML = `<div class="error">Gagal memuat data.</div>`;
    }
  }

  function normalizeAndInit(data) {
    ALL_ARTICLES = [];
    const seenTitles = new Set();

    for (const category in data) {
      if (Array.isArray(data[category])) {
        data[category].forEach(item => {
          const title = item[0] || 'Untitled';
          const titleKey = title.trim().toLowerCase();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            ALL_ARTICLES.push({
              title: title,
              url: item[1] || '#',
              image: item[2] || CONFIG.placeholderImage,
              datetime: item[3] || '',
              desc: item[4] || '',
              category: category,
              timestamp: new Date(item[3]).getTime() || 0
            });
          }
        });
      }
    }

    ALL_ARTICLES.sort((a, b) => b.timestamp - a.timestamp);
    FILTERED = [...ALL_ARTICLES];
    buildArchiveData();
    renderAll();
  }

  function buildArchiveData() {
    ARCHIVE = {};
    ALL_ARTICLES.forEach(a => {
      const d = safeDate(a.datetime);
      if(!d) return;
      const year = String(d.getFullYear());
      const month = String(d.getMonth() + 1).padStart(2, '0');

      if (!ARCHIVE[year]) {
        ARCHIVE[year] = { months: new Set(), categories: {} };
      }
      ARCHIVE[year].months.add(month);
      // Hitung jumlah per kategori di tahun tersebut
      ARCHIVE[year].categories[a.category] = (ARCHIVE[year].categories[a.category] || 0) + 1;
    });
  }

  function renderAll() {
    renderFiltersUI();
    applyFilters(); // Pastikan filter dipanggil di awal
  }

  function renderArticlesPage(page = 1) {
    CURRENT_PAGE = page;
    const container = qs('#main-feed');
    if (!container) return;

    const start = (page - 1) * CONFIG.pageSize;
    const items = FILTERED.slice(start, start + CONFIG.pageSize);

    container.innerHTML = items.map(a => `
    <article class="news-card">
    <img src="${a.image}" alt="${escapeHtml(a.title)}" loading="lazy" onerror="this.src='${CONFIG.placeholderImage}'">
    <div class="news-info">
    <div class="meta-row">
    <span class="badge">${escapeHtml(a.category)}</span>
    <span class="date-sep">•</span>
    <small class="meta-date">📅 ${fmtDate(a.datetime)}</small>
    </div>
    <h3><a href="${a.url}">${escapeHtml(a.title)}</a></h3>
    <p>${escapeHtml(a.desc.substring(0, 110))}...</p>
    </div>
    </article>
    `).join('') || `<div class="no-results">Tidak ada artikel ditemukan.</div>`;

    if (qs('#results-count')) qs('#results-count').textContent = `Total: ${FILTERED.length} artikel`;
    renderSidebarThumbnails();
    renderPagination();
  }

  function renderSidebarThumbnails() {
    const el = qs('#sidebar-list');
    if (!el) return;
    const shuffled = [...ALL_ARTICLES].sort(() => 0.5 - Math.random()).slice(0, CONFIG.thumbnailSidebarCount);
    el.innerHTML = shuffled.map(a => `
    <div class="side-item">
    <img src="${a.image}" alt="" onerror="this.src='${CONFIG.placeholderImage}'" loading="lazy">
    <div>
    <h4><a href="${a.url}">${escapeHtml(a.title)}</a></h4>
    <small class="side-badge">${escapeHtml(a.category)}</small>
    </div>
    </div>
    `).join('');
  }

  function renderFiltersUI() {
    const yearSel = qs('#filter-year');
    const monthSel = qs('#filter-month');
    const catSel = qs('#filter-category');
    const searchBox = qs('#search-box');
    const btnReset = qs('#btn-reset');

    if (!yearSel || !monthSel || !catSel) return;

    // Load Tahun Awal (Urutan Terbaru ke Lama)
    const years = Object.keys(ARCHIVE).sort((a,b) => b - a);
    yearSel.innerHTML = '<option value="">Tahun</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    const resetDropdown = (el, label, disabled = true) => {
      el.innerHTML = `<option value="">${label}</option>`;
      el.disabled = disabled;
      el.style.opacity = disabled ? "0.5" : "1";
    };

    yearSel.onchange = () => {
      const y = yearSel.value;
      resetDropdown(monthSel, "Bulan", true);

      if (y && ARCHIVE[y]) {
        // 1. Cascading Bulan (Januari -> Desember)
        monthSel.disabled = false;
        monthSel.style.opacity = "1";
        [...ARCHIVE[y].months].sort((a,b) => a - b).forEach(m => {
          const mName = new Date(2000, parseInt(m)-1).toLocaleString('id-ID', {month:'long'});
          monthSel.innerHTML += `<option value="${m}">${mName}</option>`;
        });

        // 2. Cascading Kategori dengan Jumlah
        catSel.innerHTML = '<option value="">Kategori</option>';
        Object.entries(ARCHIVE[y].categories).sort().forEach(([name, count]) => {
          catSel.innerHTML += `<option value="${name}">${name} (${count})</option>`;
        });
      } else {
        // Tampilkan semua kategori jika tahun kosong
        const allCats = {};
        ALL_ARTICLES.forEach(a => allCats[a.category] = (allCats[a.category] || 0) + 1);
        catSel.innerHTML = '<option value="">Kategori</option>' +
        Object.entries(allCats).sort().map(([n, c]) => `<option value="${n}">${n} (${c})</option>`).join('');
      }
      applyFilters();
    };

    if (btnReset) {
      btnReset.onclick = () => {
        if (searchBox) searchBox.value = '';
        yearSel.value = '';
        yearSel.dispatchEvent(new Event('change'));
      };
    }

    catSel.onchange = applyFilters;
    monthSel.onchange = applyFilters;
    if (searchBox) searchBox.oninput = debounce(applyFilters, 300);

    // Initial load kategori
    yearSel.dispatchEvent(new Event('change'));
  }

  function applyFilters() {
    const q = (qs('#search-box')?.value || '').toLowerCase();
    const y = qs('#filter-year')?.value || '';
    const m = qs('#filter-month')?.value || '';
    const c = qs('#filter-category')?.value || '';

    FILTERED = ALL_ARTICLES.filter(a => {
      const d = safeDate(a.datetime);
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
      const matchesYear = !y || (d && String(d.getFullYear()) === y);
      const matchesMonth = !m || (d && String(d.getMonth() + 1).padStart(2,'0') === m);
      const matchesCat = !c || a.category === c;
      return matchesSearch && matchesYear && matchesMonth && matchesCat;
    });
    renderArticlesPage(1);
  }

  function renderPagination() {
    const totalPages = Math.ceil(FILTERED.length / CONFIG.pageSize);
    const el = qs('#pagination');
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML=''; return; }

    el.innerHTML = '';
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = CURRENT_PAGE === 1;
    prevBtn.className = 'page-nav-btn';
    prevBtn.onclick = () => goToPage(CURRENT_PAGE - 1);
    el.appendChild(prevBtn);

    let startPage = Math.max(1, CURRENT_PAGE - 2);
    let endPage = Math.min(totalPages, startPage + 3);
    if (endPage - startPage < 3) startPage = Math.max(1, endPage - 3);

    for (let i = startPage; i <= endPage; i++) {
      const numBtn = document.createElement('button');
      numBtn.innerText = i;
      numBtn.className = `page-num-btn ${i === CURRENT_PAGE ? 'active' : ''}`;
      numBtn.onclick = () => goToPage(i);
      el.appendChild(numBtn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = CURRENT_PAGE === totalPages;
    nextBtn.className = 'page-nav-btn';
    nextBtn.onclick = () => goToPage(CURRENT_PAGE + 1);
    el.appendChild(nextBtn);
  }

  function goToPage(p) { renderArticlesPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function debounce(f, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadArticles();
  });

})(window);
