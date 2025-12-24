/**
 * script.js - Light Version
 * Tanpa IndexedDB, fokus pada kecepatan render data JSON.
 */

const CONFIG = {
  jsonUrl: 'artikel.json',
  itemsPerPage: 9
};

let state = {
  articles: [],
  filteredArticles: [],
  currentPage: 1,
  categories: new Set(),
  archives: new Set()
};

// --- DATA PROCESSING ---

function flattenData(jsonData) {
  let flatList = [];
  state.categories = new Set();
  state.archives = new Set();

  for (const [category, items] of Object.entries(jsonData)) {
    state.categories.add(category);
    items.forEach(item => {
      if (!item[0]) return; // Skip jika data rusak

      const dateObj = new Date(item[3]);
      const yearMonth = !isNaN(dateObj)
      ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
      : 'Uncategorized';

      if(yearMonth !== 'Uncategorized') state.archives.add(yearMonth);

      flatList.push({
        category: category,
        title: item[0],
        url: item[1],
        image: item[2] || 'https://via.placeholder.com/400x200?text=No+Image',
        date: item[3],
        desc: item[4],
        timestamp: !isNaN(dateObj) ? dateObj.getTime() : 0,
                    yearMonth: yearMonth
      });
    });
  }
  return flatList.sort((a, b) => b.timestamp - a.timestamp);
}

async function initApp() {
  const loader = document.getElementById('loader');
  const grid = document.getElementById('article-grid');

  loader.classList.remove('hidden');
  grid.style.opacity = '0.3';

  try {
    const response = await fetch(CONFIG.jsonUrl);
    if (!response.ok) throw new Error('Gagal mengambil file JSON');

    const jsonData = await response.json();
    state.articles = flattenData(jsonData);
    state.filteredArticles = [...state.articles];

    populateFilters();
    renderPage(1);

  } catch (error) {
    console.error("Error:", error);
    grid.innerHTML = `<p class="error">Gagal memuat artikel: ${error.message}</p>`;
  } finally {
    loader.classList.add('hidden');
    grid.style.opacity = '1';
  }
}

// --- UI RENDERING ---

function populateFilters() {
  const archiveSelect = document.getElementById('filter-archive');
  const categorySelect = document.getElementById('filter-category');

  archiveSelect.innerHTML = '<option value="">Semua Waktu</option>';
  categorySelect.innerHTML = '<option value="">Semua Kategori</option>';

  const sortedArchives = Array.from(state.archives).sort().reverse();
  sortedArchives.forEach(ym => {
    const [year, month] = ym.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
    const option = document.createElement('option');
    option.value = ym;
    option.textContent = `${monthName} ${year}`;
    archiveSelect.appendChild(option);
  });

  Array.from(state.categories).sort().forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categorySelect.appendChild(option);
  });
}

function renderArticleCard(article) {
  const dateFormatted = new Date(article.date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return `
  <article class="card">
  <div class="card-image-wrapper">
  <img src="${article.image}" alt="${article.title}" loading="lazy">
  <span class="category-tag">${article.category}</span>
  </div>
  <div class="card-content">
  <div class="card-meta">📅 ${dateFormatted}</div>
  <h2 class="card-title"><a href="${article.url}">${article.title}</a></h2>
  <p class="card-desc">${article.desc}</p>
  <a href="${article.url}" class="read-more">Baca Selengkapnya →</a>
  </div>
  </article>
  `;
}

function renderPage(pageNumber) {
  state.currentPage = pageNumber;
  const container = document.getElementById('article-grid');
  const resultCount = document.getElementById('result-count');

  const start = (pageNumber - 1) * CONFIG.itemsPerPage;
  const end = start + CONFIG.itemsPerPage;
  const paginatedItems = state.filteredArticles.slice(start, end);

  container.innerHTML = paginatedItems.map(renderArticleCard).join('');
  resultCount.innerHTML = `Menampilkan <b>${state.filteredArticles.length}</b> artikel`;

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(state.filteredArticles.length / CONFIG.itemsPerPage);
  const container = document.getElementById('pagination');
  container.innerHTML = '';

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    // Hanya tampilkan beberapa tombol jika halaman terlalu banyak
    if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (i === state.currentPage) btn.classList.add('active');
      btn.onclick = () => {
        renderPage(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
      container.appendChild(btn);
    }
  }
}

// --- SEARCH & FILTER ---

const handleSearchAndFilter = () => {
  const searchVal = document.getElementById('search-input').value.toLowerCase();
  const archiveVal = document.getElementById('filter-archive').value;
  const categoryVal = document.getElementById('filter-category').value;

  state.filteredArticles = state.articles.filter(article => {
    const matchesSearch = !searchVal || article.title.toLowerCase().includes(searchVal) || article.desc.toLowerCase().includes(searchVal);
    const matchesArchive = !archiveVal || article.yearMonth === archiveVal;
    const matchesCategory = !categoryVal || article.category === categoryVal;
    return matchesSearch && matchesArchive && matchesCategory;
  });

  state.currentPage = 1;
  renderPage(1);
};

function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  document.getElementById('search-input').addEventListener('input', debounce(handleSearchAndFilter, 300));
  document.getElementById('filter-archive').addEventListener('change', handleSearchAndFilter);
  document.getElementById('filter-category').addEventListener('change', handleSearchAndFilter);
});
