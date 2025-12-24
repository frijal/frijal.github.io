/**
 * assets/js/homepage.js
 * Perbaikan: Cascading Filter & Fix Toggle Mobile
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

  // --- FUNGSI TOGGLE MOBILE ---
  function initMobileToggle() {
    const filterToggle = document.getElementById('mobile-filter-toggle');
    const filterContent = document.getElementById('filter-content');

    if (filterToggle && filterContent) {
      // Kita pakai onclick langsung agar lebih bandel
      filterToggle.onclick = () => {
        const isVisible = filterContent.classList.toggle('show');
        const chevron = filterToggle.querySelector('.chevron');
        if (chevron) {
          chevron.textContent = isVisible ? '▲' : '▼';
        }
      };
    }
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
    const yearSet = new Set();

    for (const category in data) {
      if (Array.isArray(data[category])) {
        data[category].forEach(item => {
          const title = item[0] || 'Untitled';
          const titleKey = title.trim().toLowerCase();
          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            const d = safeDate(item[3]);
            if(d) yearSet.add(String(d.getFullYear()));

            ALL_ARTICLES.push({
              title: title,
              url: item[1] || '#',
              image: item[2] || CONFIG.placeholderImage,
              datetime: item[3] || '',
              desc: item[4] || '',
              category: category,
              timestamp: d ? d.getTime() : 0
            });
          }
        });
      }
    }

    ALL_ARTICLES.sort((a, b) => b.timestamp - a.timestamp);
    ARCHIVE_YEARS = [...yearSet].sort((a, b) => b - a);

    // Urutan pemanggilan sangat penting
    renderFiltersUI();
    applyFilters();
  }

  function renderFiltersUI() {
    const yearSel = qs('#filter-year');
    const monthSel = qs('#filter-month');
    const catSel = qs('#filter-category');
    const searchBox = qs('#search-box');
    const btnReset = qs('#btn-reset');

    if (!yearSel || !monthSel || !catSel) return;

    yearSel.innerHTML = '<option value="">Tahun</option>' +
    ARCHIVE_YEARS.map(y => `<option value="${y}">${y}</option>`).join('');

    const updateDropdowns = () => {
      const selectedYear = yearSel.value;
      const selectedMonth = monthSel.value;
      const selectedCat = catSel.value;

      const articlesInYear = ALL_ARTICLES.filter(a => {
        const d = safeDate(a.datetime);
        return !selectedYear || (d && String(d.getFullYear()) === selectedYear);
      });

      const availableMonths = new Set();
      articlesInYear.forEach(a => {
        const d = safeDate(a.datetime);
        if (d) availableMonths.add(String(d.getMonth() + 1).padStart(2, '0'));
      });

        monthSel.innerHTML = '<option value="">Bulan</option>';
        [...availableMonths].sort((a, b) => a - b).forEach(m => {
          const mName = new Date(2000, parseInt(m) - 1).toLocaleString('id-ID', { month: 'long' });
          monthSel.innerHTML += `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${mName}</option>`;
        });
        monthSel.disabled = !selectedYear;
        monthSel.style.opacity = selectedYear ? "1" : "0.5";

        const articlesInMonth = articlesInYear.filter(a => {
          const d = safeDate(a.datetime);
          return !selectedMonth || (d && String(d.getMonth() + 1).padStart(2, '0') === selectedMonth);
        });

        const catCounts = {};
        articlesInMonth.forEach(a => {
          catCounts[a.category] = (catCounts[a.category] || 0) + 1;
        });

        catSel.innerHTML = '<option value="">Kategori</option>';
        Object.entries(catCounts).sort().forEach(([name, count]) => {
          catSel.innerHTML += `<option value="${name}" ${name === selectedCat ? 'selected' : ''}>${name} (${count})</option>`;
        });
    };

    yearSel.onchange = () => { monthSel.value = ""; updateDropdowns(); applyFilters(); };
    monthSel.onchange = () => { updateDropdowns(); applyFilters(); };
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

  function applyFilters() {
    const q = (qs('#search-box')?.value || '').toLowerCase();
    const y = qs('#filter-year')?.value || '';
    const m = qs('#filter-month')?.value || '';
    const c = qs('#filter-category')?.value || '';

    FILTERED = ALL_ARTICLES.filter(a => {
      const d = safeDate(a.datetime);
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
      const matchesYear = !y || (d && String(d.getFullYear()) === y);
      const matchesMonth = !m || (d && String(d.getMonth() + 1).padStart(2, '0') === m);
      const matchesCat = !c || a.category === c;
      return matchesSearch && matchesYear && matchesMonth && matchesCat;
    });
    renderArticlesPage(1);
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

  function renderPagination() {
    const totalPages = Math.ceil(FILTERED.length / CONFIG.pageSize);
    const el = qs('#pagination');
    if (!el || totalPages <= 1) { if(el) el.innerHTML=''; return; }
    el.innerHTML = '';
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = CURRENT_PAGE === 1;
    prevBtn.className = 'page-nav-btn';
    prevBtn.onclick = () => goToPage(CURRENT_PAGE - 1);
    el.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= CURRENT_PAGE - 1 && i <= CURRENT_PAGE + 1)) {
        const numBtn = document.createElement('button');
        numBtn.innerText = i;
        numBtn.className = `page-num-btn ${i === CURRENT_PAGE ? 'active' : ''}`;
        numBtn.onclick = () => goToPage(i);
        el.appendChild(numBtn);
      }
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
    initMobileToggle(); // Panggil fungsi toggle di sini
    loadArticles();
  });

})(window);
