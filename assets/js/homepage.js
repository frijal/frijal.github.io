/* ===============================
   KONFIGURASI
   =============================== */
const DATA_URL = "/artikel.json";
const MAX_ARTICLES = 28;

/* ===============================
   UTILITAS
   =============================== */
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
   LOAD & NORMALISASI DATA
   =============================== */
function showSkeleton() {
  const grid = document.getElementById("articleGrid");
  grid.innerHTML = "";
  for (let i = 0; i < 8; i++) {
    const s = document.createElement("div");
    s.className = "card skeleton";
    grid.appendChild(s);
  }
}


async function loadArticles() {
  const cached = await loadCache();
  if (cached) return cached;

  const res = await fetch(DATA_URL);
  const json = await res.json();

  const articles = [];
  Object.entries(json).forEach(([category, items]) => {
    items.forEach(item => {
      const [title, slug, image, published, excerpt] = item;
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

  articles.sort((a,b)=>b.date.raw-a.date.raw);
  saveCache(articles);
  return articles;
}


let CURRENT_PAGE = 1;
const PER_PAGE = 12;

function paginate(data) {
  const start = (CURRENT_PAGE - 1) * PER_PAGE;
  return data.slice(start, start + PER_PAGE);
}


/* ===============================
   RENDER ARTIKEL
   =============================== */
function renderArticles(data) {
  const container = document.getElementById("articleGrid");
  container.innerHTML = "";

  const pageData = paginate(data);

  if (!pageData.length) {
    container.innerHTML = `<p class="empty">Tidak ada artikel.</p>`;
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
    container.appendChild(card);
  });

  renderPagination(data.length);
}

function renderPagination(total) {
  const nav = document.getElementById("pagination");
  const totalPages = Math.ceil(total / PER_PAGE);

  nav.innerHTML = `
  <button ${CURRENT_PAGE === 1 ? "disabled" : ""} id="prev">←</button>
  <span>Hal ${CURRENT_PAGE} / ${totalPages}</span>
  <button ${CURRENT_PAGE === totalPages ? "disabled" : ""} id="next">→</button>
  `;

  document.getElementById("prev")?.onclick = () => {
    CURRENT_PAGE--;
    applyFilter(window.__ARTICLES__);
  };

  document.getElementById("next")?.onclick = () => {
    CURRENT_PAGE++;
    applyFilter(window.__ARTICLES__);
  };
}


/* ===============================
   FILTER & SEARCH
   =============================== */
function applyFilter(allArticles) {
  let filtered = filterByArchive(allArticles);
    const q = document.getElementById("search").value.toLowerCase();
  const cat = document.getElementById("filterCategory").value;
  const ym = document.getElementById("filterMonth").value;

  const filtered = allArticles.filter(a => {
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
   INIT
   =============================== */
document.addEventListener("DOMContentLoaded", async () => {
  const articles = await loadArticles();

  window.__ARTICLES__ = articles;
  CURRENT_PAGE = 1;
  showSkeleton();


  // isi filter kategori
  const categories = [...new Set(articles.map(a => a.category))];
  const catSelect = document.getElementById("filterCategory");
  categories.forEach(c => {
    catSelect.insertAdjacentHTML("beforeend", `<option>${c}</option>`);
  });

  // isi filter bulan
  const months = [...new Set(articles.map(a => `${a.date.year}-${a.date.month}`))];
  const monthSelect = document.getElementById("filterMonth");
  months.forEach(m => {
    monthSelect.insertAdjacentHTML("beforeend", `<option value="${m}">${m}</option>`);
  });

  renderArticles(articles);

  ["search", "filterCategory", "filterMonth"].forEach(id => {
    document.getElementById(id).addEventListener("input", () => {
      applyFilter(articles);
    });
  });
});

const DB_NAME = "artikel-cache";
const STORE = "posts";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      e.target.result.createObjectStore(STORE);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = reject;
  });
}

async function saveCache(data) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(data, "all");
}

async function loadCache() {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  return new Promise(res => {
    const req = tx.objectStore(STORE).get("all");
    req.onsuccess = () => res(req.result || null);
  });
}

function filterByArchive(all) {
  const hash = location.hash.replace("#/", "");
  if (!hash) return all;

  const [y, m] = hash.split("/");
  return all.filter(a =>
  a.date.year == y && (!m || a.date.month == m)
  );
}

window.addEventListener("hashchange", () => {
  CURRENT_PAGE = 1;
  applyFilter(window.__ARTICLES__);
});
