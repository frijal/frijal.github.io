/* ===============================
 *   KONFIGURASI
 *   =============================== */
const DATA_URL = "/artikel.json";
const PER_PAGE = 12;

/* ===============================
 *   STATE GLOBAL
 *   =============================== */
let CURRENT_PAGE = 1;
let ALL_ARTICLES = [];

/* ===============================
 *   UTILITAS
 *   =============================== */
function parseDate(iso) {
  const d = new Date(iso);
  return {
    raw: d,
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    readable: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  };
}

/* ===============================
 *   SKELETON
 *   =============================== */
function showSkeleton(count = 8) {
  const grid = document.getElementById("articleGrid");
  if (!grid) return;

  grid.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const s = document.createElement("div");
    s.className = "card skeleton";
    grid.appendChild(s);
  }
}

/* ===============================
 *   INDEXED DB CACHE
 *   =============================== */
const DB_NAME = "artikel-cache";
const STORE = "posts";

function openDB() {
  return new Promise(resolve => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e =>
    e.target.result.createObjectStore(STORE);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => resolve(null);
  });
}

async function saveCache(data) {
  const db = await openDB();
  if (!db) return;
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(data, "all");
}

async function loadCache() {
  const db = await openDB();
  if (!db) return null;

  const tx = db.transaction(STORE, "readonly");
  return new Promise(resolve => {
    const req = tx.objectStore(STORE).get("all");
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

/* ===============================
 *   LOAD & NORMALISASI
 *   =============================== */
async function loadArticles() {
  const cached = await loadCache();
  if (cached) return cached;

  const res = await fetch(DATA_URL);
  const json = await res.json();

  const articles = [];
  Object.entries(json).forEach(([category, items]) => {
    items.forEach(([title, slug, image, published, excerpt]) => {
      articles.push({
        title,
        slug,
        url: "/" + slug,
        image,
        excerpt,
        category,
        date: parseDate(published)
      });
    });
  });

  articles.sort((a, b) => b.date.raw - a.date.raw);
  saveCache(articles);
  return articles;
}

/* ===============================
 *   FILTER & ARCHIVE
 *   =============================== */
function filterByArchive(data) {
  const hash = location.hash.replace("#/", "");
  if (!hash) return data;

  const [y, m] = hash.split("/");
  return data.filter(a =>
  a.date.year == y && (!m || a.date.month == m)
  );
}

function applyFilter() {
  CURRENT_PAGE = 1;

  const q = document.getElementById("search").value.toLowerCase();
  const cat = document.getElementById("filterCategory").value;
  const ym = document.getElementById("filterMonth").value;

  let filtered = filterByArchive(ALL_ARTICLES);

  filtered = filtered.filter(a => {
    const matchText =
    a.title.toLowerCase().includes(q) ||
    a.category.toLowerCase().includes(q);

    const matchCategory = !cat || a.category === cat;
    const matchMonth = !ym || `${a.date.year}-${a.date.month}` === ym;

    return matchText && matchCategory && matchMonth;
  });

  renderArticles(filtered);
}

/* ===============================
 *   PAGINATION
 *   =============================== */
function paginate(data) {
  const start = (CURRENT_PAGE - 1) * PER_PAGE;
  return data.slice(start, start + PER_PAGE);
}

/* ===============================
 *   RENDER
 *   =============================== */
function renderArticles(data) {
  const grid = document.getElementById("articleGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const pageData = paginate(data);

  if (!pageData.length) {
    grid.innerHTML = `<p class="empty">Tidak ada artikel.</p>`;
    renderPagination(0);
    return;
  }

  pageData.forEach(article => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
    <a href="${article.url}" class="thumb">
    <img src="${article.image}" alt="${article.title}" loading="lazy">
    </a>
    <div class="card-body">
    <span class="category">${article.category}</span>
    <h2 class="title"><a href="${article.url}">${article.title}</a></h2>
    <time>${article.date.readable}</time>
    </div>
    `;
    grid.appendChild(card);
  });

  renderPagination(data.length);
}

function renderPagination(total) {
  const nav = document.getElementById("pagination");
  if (!nav || total === 0) {
    if (nav) nav.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  nav.innerHTML = `
  <button ${CURRENT_PAGE === 1 ? "disabled" : ""} id="prev">←</button>
  <span>Hal ${CURRENT_PAGE} / ${totalPages}</span>
  <button ${CURRENT_PAGE === totalPages ? "disabled" : ""} id="next">→</button>
  `;

  nav.querySelector("#prev")?.addEventListener("click", () => {
    CURRENT_PAGE--;
    applyFilter();
  });

  nav.querySelector("#next")?.addEventListener("click", () => {
    CURRENT_PAGE++;
    applyFilter();
  });
}

/* ===============================
 *   INIT
 *   =============================== */
document.addEventListener("DOMContentLoaded", async () => {
  showSkeleton();

  ALL_ARTICLES = await loadArticles();

  // isi filter kategori
  const catSelect = document.getElementById("filterCategory");
  [...new Set(ALL_ARTICLES.map(a => a.category))]
  .forEach(c => catSelect.insertAdjacentHTML("beforeend", `<option>${c}</option>`));

  // isi filter bulan
  const monthSelect = document.getElementById("filterMonth");
  [...new Set(ALL_ARTICLES.map(a => `${a.date.year}-${a.date.month}`))]
  .forEach(m => monthSelect.insertAdjacentHTML("beforeend", `<option value="${m}">${m}</option>`));

  renderArticles(ALL_ARTICLES);

  ["search", "filterCategory", "filterMonth"].forEach(id =>
  document.getElementById(id).addEventListener("input", applyFilter)
  );
});

window.addEventListener("hashchange", applyFilter);
