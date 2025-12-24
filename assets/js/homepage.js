/**
 * script.js
 * Menangani logika aplikasi: Fetch, IndexedDB, Rendering, Search, Pagination
 */

// Konfigurasi
const CONFIG = {
  jsonUrl: 'artikel.json',
  itemsPerPage: 9, // Jumlah artikel per halaman
  dbName: 'LayarKosongDB',
  storeName: 'articles',
  version: 1
};

// State Aplikasi
let state = {
  articles: [], // Semua artikel yang sudah diratakan (flattened)
  filteredArticles: [], // Artikel setelah difilter pencarian/arsip
  currentPage: 1,
  categories: new Set(),
  archives: new Set() // Format: "YYYY-MM"
};

// --- BAGIAN 1: INDEXED DB (Offline Cache) ---
const dbPromise = new Promise((resolve, reject) => {
  const request = indexedDB.open(CONFIG.dbName, CONFIG.version);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    if (!db.objectStoreNames.contains(CONFIG.storeName)) {
      db.createObjectStore(CONFIG.storeName, { keyPath: 'url' }); // Gunakan slug/url sebagai key
    }
  };

  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = (e) => reject(e.target.error);
});

async function saveToCache(articles) {
  const db = await dbPromise;
  const tx = db.transaction(CONFIG.storeName, 'readwrite');
  const store = tx.objectStore(CONFIG.storeName);
  // Simpan data mentah JSON structure atau flattened, kita simpan flattened biar cepat
  // Untuk demo ini, kita simpan wrapper data
  store.put({ url: 'cached_data', data: articles, timestamp: Date.now() });
  return tx.complete;
}

async function getFromCache() {
  const db = await dbPromise;
  return new Promise((resolve) => {
    const tx = db.transaction(CONFIG.storeName, 'readonly');
    const store = tx.objectStore(CONFIG.storeName);
    const request = store.get('cached_data');
    request.onsuccess = () => resolve(request.result ? request.result.data : null);
    request.onerror = () => resolve(null);
  });
}

// --- BAGIAN 2: DATA PROCESSING ---

// Mengubah struktur JSON { "Kategori": [[Array]] } menjadi [{obj}, {obj}]
function flattenData(jsonData) {
  let flatList = [];

  for (const [category, items] of Object.entries(jsonData)) {
    state.categories.add(category);

    items.forEach(item => {
      // Struktur item: [Title, Slug, Image, Date, Desc]
      const dateObj = new Date(item[3]);
      const yearMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      state.archives.add(yearMonth);

      flatList.push({
        category: category,
        title: item[0],
        url: item[1],
        image: item[2],
        date: item[3],
        desc: item[4],
        timestamp: dateObj.getTime(),
                    yearMonth: yearMonth
      });
    });
  }

  // Urutkan berdasarkan tanggal terbaru
  return flatList.sort((a, b) => b.timestamp - a.timestamp);
}

async function initApp() {
  showLoading(true);

  try {
    // Coba fetch network dulu
    const response = await fetch(CONFIG.jsonUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const jsonData = await response.json();

    // Proses data
    state.articles = flattenData(jsonData);

    // Simpan ke cache
    await saveToCache(state.articles);
    console.log("Data loaded from Network & Cached");

  } catch (error) {
    console.warn("Network failed, trying cache...", error);
    const cachedData = await getFromCache();
    if (cachedData) {
      state.articles = cachedData;
      // Re-populate sets karena data dari IDB
      state.articles.forEach(art => {
        state.categories.add(art.category);
        state.archives.add(art.yearMonth);
      });
      console.log("Data loaded from IndexedDB");
    } else {
      document.getElementById('article-grid').innerHTML = '<p class="error">Gagal memuat data. Periksa koneksi internet.</p>';
      return;
    }
  }

  state.filteredArticles = [...state.articles];
  populateFilters();
  renderPage(1);
  showLoading(false);
}

// --- BAGIAN 3: UI & RENDERING ---

function showLoading(isLoading) {
  const loader = document.getElementById('loader');
  if(isLoading) loader.classList.remove('hidden');
  else loader.classList.add('hidden');
}

function populateFilters() {
  const archiveSelect = document.getElementById('filter-archive');
  const categorySelect = document.getElementById('filter-category');

  // Populate Archive (Sort descending)
  const sortedArchives = Array.from(state.archives).sort().reverse();
  sortedArchives.forEach(ym => {
    const [year, month] = ym.split('-');
    const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
    const option = document.createElement('option');
    option.value = ym;
    option.textContent = `${monthName} ${year}`;
    archiveSelect.appendChild(option);
  });

  // Populate Category
  state.categories.forEach(cat => {
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
  <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'">
  <span class="category-tag">${article.category}</span>
  </div>
  <div class="card-content">
  <div class="card-meta">
  <span class="date">📅 ${dateFormatted}</span>
  </div>
  <h2 class="card-title">
  <a href="${article.url}">${article.title}</a>
  </h2>
  <p class="card-desc">${article.desc}</p>
  <a href="${article.url}" class="read-more">Baca Selengkapnya →</a>
  </div>
  </article>
  `;
}

function renderPagination() {
  const totalPages = Math.ceil(state.filteredArticles.length / CONFIG.itemsPerPage);
  const paginationContainer = document.getElementById('pagination');
  paginationContainer.innerHTML = '';

  if (totalPages <= 1) return;

  // Tombol Previous
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '&laquo;';
  prevBtn.disabled = state.currentPage === 1;
  prevBtn.onclick = () => renderPage(state.currentPage - 1);
  paginationContainer.appendChild(prevBtn);

  // Page Numbers (Sederhana: Tampilkan range sekitar current page)
  let startPage = Math.max(1, state.currentPage - 2);
  let endPage = Math.min(totalPages, state.currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === state.currentPage) btn.classList.add('active');
    btn.onclick = () => renderPage(i);
    paginationContainer.appendChild(btn);
  }

  // Tombol Next
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '&raquo;';
  nextBtn.disabled = state.currentPage === totalPages;
  nextBtn.onclick = () => renderPage(state.currentPage + 1);
  paginationContainer.appendChild(nextBtn);
}

function renderPage(pageNumber) {
  state.currentPage = pageNumber;
  const container = document.getElementById('article-grid');
  const resultCount = document.getElementById('result-count');

  const start = (pageNumber - 1) * CONFIG.itemsPerPage;
  const end = start + CONFIG.itemsPerPage;
  const paginatedItems = state.filteredArticles.slice(start, end);

  container.innerHTML = paginatedItems.map(renderArticleCard).join('');
  resultCount.textContent = `Menampilkan ${state.filteredArticles.length} artikel`;

  renderPagination();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- BAGIAN 4: SEARCH & FILTER LOGIC ---

function handleSearchAndFilter() {
  const searchVal = document.getElementById('search-input').value.toLowerCase();
  const archiveVal = document.getElementById('filter-archive').value;
  const categoryVal = document.getElementById('filter-category').value;

  state.filteredArticles = state.articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchVal) ||
    article.desc.toLowerCase().includes(searchVal);
    const matchesArchive = archiveVal === '' || article.yearMonth === archiveVal;
    const matchesCategory = categoryVal === '' || article.category === categoryVal;

    return matchesSearch && matchesArchive && matchesCategory;
  });

  state.currentPage = 1; // Reset ke halaman 1
  renderPage(1);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  initApp();

  document.getElementById('search-input').addEventListener('input', debounce(handleSearchAndFilter, 300));
  document.getElementById('filter-archive').addEventListener('change', handleSearchAndFilter);
  document.getElementById('filter-category').addEventListener('change', handleSearchAndFilter);
});

// Utility: Debounce untuk search agar tidak lag
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
