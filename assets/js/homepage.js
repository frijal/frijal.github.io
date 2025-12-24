/**
 * assets/js/homepage.js
 * Versi Perbaikan untuk struktur artikel.json (Object > Array of Arrays)
 */
(function (global) {
  'use strict';

  const CONFIG = {
    jsonPath: './artikel.json',
    pageSize: 8,
    thumbnailSidebarCount: 10,
    placeholderImage: 'https://via.placeholder.com/400x240?text=No+Image'
  };

  let ALL_ARTICLES = [];
  let FILTERED = [];
  let CURRENT_PAGE = 1;
  let CURRENT_SORT = { field: 'date', dir: 'desc' };
  let ARCHIVE = {};

  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));
  const escapeHtml = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const safeDate = iso => { const d = new Date(iso); return isNaN(d) ? null : d; };
  const fmtDate = iso => {
    const d = safeDate(iso);
    return d ? d.toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }) : (iso || '');
  };

  async function loadArticles() {
    try {
      const res = await fetch(CONFIG.jsonPath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      normalizeAndInit(data);
    } catch (err) {
      console.error('Gagal memuat artikel:', err);
      qs('#main-feed').innerHTML = `<div class="error">Gagal memuat data. Pastikan artikel.json tersedia.</div>`;
    }
  }

  function normalizeAndInit(data) {
    ALL_ARTICLES = [];
    const seenTitles = new Set(); // Tempat menyimpan judul unik

    for (const category in data) {
      if (Array.isArray(data[category])) {
        data[category].forEach(item => {
          const title = item[0] || 'Untitled';

          // --- CEK DUPLIKAT ---
          // Kita bersihkan whitespace dan ubah ke lowercase agar pengecekan lebih akurat
          const titleKey = title.trim().toLowerCase();

          if (!seenTitles.has(titleKey)) {
            seenTitles.add(titleKey); // Tandai judul sudah ada

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

    // Urutkan terbaru
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
      if (!ARCHIVE[year]) ARCHIVE[year] = new Set();
      ARCHIVE[year].add(month);
    });
  }

  function renderAll() {
    renderFiltersUI();
    renderSidebarThumbnails();
    renderArticlesPage(1);
  }

  function renderArticlesPage(page = 1) {
    CURRENT_PAGE = page;
    const container = qs('#main-feed');
    const start = (page - 1) * CONFIG.pageSize;
    const sorted = applySort(FILTERED);
    const items = sorted.slice(start, start + CONFIG.pageSize);

    container.innerHTML = items.map(a => `
    <article class="news-card">
    <img src="${a.image}" alt="${escapeHtml(a.title)}" loading="lazy" onerror="this.src='${CONFIG.placeholderImage}'">
    <div class="news-info">
    <span class="badge">${escapeHtml(a.category)}</span>
    <h3><a href="${a.url}">${escapeHtml(a.title)}</a></h3>
    <p>${escapeHtml(a.desc.substring(0, 120))}...</p>
    <small>📅 ${fmtDate(a.datetime)}</small>
    </div>
    </article>
    `).join('') || `<div class="no-results">Tidak ada artikel ditemukan.</div>`;

    qs('#results-count').textContent = `Total: ${FILTERED.length} artikel`;
    renderPagination();
  }

  function renderSidebarThumbnails() {
    const el = qs('#sidebar-list');
    const recent = ALL_ARTICLES.slice(0, CONFIG.thumbnailSidebarCount);
    el.innerHTML = recent.map(a => `
    <div class="side-item">
    <img src="${a.image}" alt="" onerror="this.src='${CONFIG.placeholderImage}'">
    <div>
    <h4><a href="${a.url}">${escapeHtml(a.title)}</a></h4>
    <small>${escapeHtml(a.category)}</small>
    </div>
    </div>
    `).join('');
  }

  function renderFiltersUI() {
    const yearSel = qs('#filter-year');
    const monthSel = qs('#filter-month');
    const catSel = qs('#filter-category');

    // Category
    const cats = [...new Set(ALL_ARTICLES.map(a => a.category))].sort();
    catSel.innerHTML = '<option value="">Kategori</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');

    // Years
    const years = Object.keys(ARCHIVE).sort((a,b) => b - a);
    yearSel.innerHTML = '<option value="">Tahun</option>' + years.map(y => `<option value="${y}">${y}</option>`).join('');

    yearSel.onchange = () => {
      const y = yearSel.value;
      monthSel.innerHTML = '<option value="">Bulan</option>';
      if(y && ARCHIVE[y]) {
        [...ARCHIVE[y]].sort((a,b) => b - a).forEach(m => {
          const mName = new Date(2000, parseInt(m)-1).toLocaleString('id-ID', {month:'long'});
          monthSel.innerHTML += `<option value="${m}">${mName}</option>`;
        });
      }
      applyFilters();
    };

    [monthSel, catSel].forEach(el => el.onchange = applyFilters);
    qs('#search-box').oninput = debounce(applyFilters, 300);
  }

  function applyFilters() {
    const q = qs('#search-box').value.toLowerCase();
    const y = qs('#filter-year').value;
    const m = qs('#filter-month').value;
    const c = qs('#filter-category').value;

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

  function applySort(list) {
    return list.slice().sort((a,b) => b.timestamp - a.timestamp);
  }

  function renderPagination() {
    const totalPages = Math.ceil(FILTERED.length / CONFIG.pageSize);
    const el = qs('#pagination');
    el.innerHTML = '';

    if (totalPages <= 1) return;

    // --- Tombol SEBELUMNYA ---
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = CURRENT_PAGE === 1;
    prevBtn.className = 'page-nav-btn';
    prevBtn.onclick = () => goToPage(CURRENT_PAGE - 1);
    el.appendChild(prevBtn);

    // --- Logika Angka Dinamis (Maks 4-5 angka) ---
    let startPage = Math.max(1, CURRENT_PAGE - 2);
    let endPage = Math.min(totalPages, startPage + 3);

    // Koreksi jika di akhir halaman agar tetap tampil 4 angka
    if (endPage - startPage < 3) {
      startPage = Math.max(1, endPage - 3);
    }

    for (let i = startPage; i <= endPage; i++) {
      const numBtn = document.createElement('button');
      numBtn.innerText = i;
      numBtn.className = `page-num-btn ${i === CURRENT_PAGE ? 'active' : ''}`;
      numBtn.onclick = () => goToPage(i);
      el.appendChild(numBtn);
    }

    // --- Tombol SESUDAHNYA ---
    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = CURRENT_PAGE === totalPages;
    nextBtn.className = 'page-nav-btn';
    nextBtn.onclick = () => goToPage(CURRENT_PAGE + 1);
    el.appendChild(nextBtn);
  }

  // Helper agar tidak duplikasi code scroll
  function goToPage(p) {
    renderArticlesPage(p);
    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function debounce(f, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); };
  }

  document.addEventListener('DOMContentLoaded', loadArticles);

})(window);
