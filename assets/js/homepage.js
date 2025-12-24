/**
 * script.js - Portal Berita Engine
 */

const CONFIG = {
  jsonUrl: 'artikel.json',
  itemsPerPage: 8,
  sidebarItems: 10 // Jumlah thumbnail kecil di sidebar
};

let state = {
  allArticles: [],
  filteredArticles: [],
  currentPage: 1,
  categories: new Set(),
  archives: {} // Struktur: { "2025": ["01", "02"], "2024": [...] }
};

// 1. Ambil & Olah Data
async function initApp() {
  try {
    const response = await fetch(CONFIG.jsonUrl);
    const jsonData = await response.json();

    // Flatten data
    state.allArticles = [];
    for (const [cat, items] of Object.entries(jsonData)) {
      state.categories.add(cat);
      items.forEach(item => {
        const d = new Date(item[3]);
        const year = d.getFullYear().toString();
        const month = String(d.getMonth() + 1).padStart(2, '0');

        // Build cascading archive data
        if (!state.archives[year]) state.archives[year] = new Set();
        state.archives[year].add(month);

        state.allArticles.push({
          category: cat,
          title: item[0],
          url: item[1],
          image: item[2],
          date: item[3],
          desc: item[4],
          timestamp: d.getTime(),
                               year: year,
                               month: month
        });
      });
    }

    // Urutkan terbaru
    state.allArticles.sort((a, b) => b.timestamp - a.timestamp);
    state.filteredArticles = [...state.allArticles];

    setupFilters();
    renderSidebar();
    renderPage(1);
  } catch (e) {
    console.error("Gagal memuat data:", e);
  }
}

// 2. Setup Filter Cascading
function setupFilters() {
  const yearSelect = document.getElementById('filter-year');
  const monthSelect = document.getElementById('filter-month');
  const catSelect = document.getElementById('filter-category');

  // Populate Year
  Object.keys(state.archives).sort().reverse().forEach(y => {
    yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
  });

  // Populate Category
  Array.from(state.categories).sort().forEach(c => {
    catSelect.innerHTML += `<option value="${c}">${c}</option>`;
  });

  // Event Year change -> Update Month
  yearSelect.addEventListener('change', () => {
    const selectedYear = yearSelect.value;
    monthSelect.innerHTML = '<option value="">Semua Bulan</option>';
    if (selectedYear && state.archives[selectedYear]) {
      Array.from(state.archives[selectedYear]).sort().reverse().forEach(m => {
        const monthName = new Date(2000, parseInt(m) - 1).toLocaleString('id-ID', {month: 'long'});
        monthSelect.innerHTML += `<option value="${m}">${monthName}</option>`;
      });
    }
    applyFilters();
  });

  [monthSelect, catSelect].forEach(el => el.addEventListener('change', applyFilters));
  document.getElementById('search-input').addEventListener('input', debounce(applyFilters, 300));
}

function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const year = document.getElementById('filter-year').value;
  const month = document.getElementById('filter-month').value;
  const cat = document.getElementById('filter-category').value;

  state.filteredArticles = state.allArticles.filter(a => {
    return (!search || a.title.toLowerCase().includes(search)) &&
    (!year || a.year === year) &&
    (!month || a.month === month) &&
    (!cat || a.category === cat);
  });

  state.currentPage = 1;
  renderPage(1);
}

// 3. Rendering
function renderPage(page) {
  state.currentPage = page;
  const start = (page - 1) * CONFIG.itemsPerPage;
  const items = state.filteredArticles.slice(start, start + CONFIG.itemsPerPage);

  const container = document.getElementById('main-feed');
  container.innerHTML = items.map(a => `
  <article class="news-card">
  <img src="${a.image}" alt="" loading="lazy">
  <div class="news-info">
  <span class="badge">${a.category}</span>
  <h3><a href="${a.url}">${a.title}</a></h3>
  <p>${a.desc.substring(0, 100)}...</p>
  <small>📅 ${new Date(a.date).toLocaleDateString('id-ID')}</small>
  </div>
  </article>
  `).join('');

  renderPagination();
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar-list');
  const recent = state.allArticles.slice(0, CONFIG.sidebarItems);

  sidebar.innerHTML = recent.map(a => `
  <div class="side-item">
  <img src="${a.image}" alt="">
  <div>
  <h4><a href="${a.url}">${a.title}</a></h4>
  <small>${a.category}</small>
  </div>
  </div>
  `).join('');
}

function renderPagination() {
  const total = Math.ceil(state.filteredArticles.length / CONFIG.itemsPerPage);
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  for(let i=1; i<=total; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    if(i === state.currentPage) btn.className = 'active';
    btn.onclick = () => { renderPage(i); window.scrollTo(0,0); };
    container.appendChild(btn);
  }
}

function debounce(f, ms) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); };
}

document.addEventListener('DOMContentLoaded', initApp);
