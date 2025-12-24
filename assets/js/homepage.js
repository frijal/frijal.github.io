/* ===============================
 *   KONFIG
 *   =============================== */
const DATA_URL = "/artikel.json";
const PER_PAGE = 10;
const SIDEBAR_LIMIT = 12;

let ALL = [];
let FILTERED = [];
let PAGE = 1;

/* ===============================
 *   UTIL
 *   =============================== */
function parseDate(iso) {
  const d = new Date(iso);
  return {
    raw: d,
    year: d.getFullYear(),
    month: String(d.getMonth() + 1).padStart(2, "0"),
    label: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  };
}

/* ===============================
 *   LOAD DATA
 *   =============================== */
async function loadArticles() {
  const res = await fetch(DATA_URL);
  const json = await res.json();

  const out = [];
  Object.entries(json).forEach(([cat, items]) => {
    items.forEach(([title, slug, img, pub]) => {
      out.push({
        title,
        slug,
        url: "/" + slug,
        image: img,
        category: cat,
        date: parseDate(pub)
      });
    });
  });

  return out.sort((a, b) => b.date.raw - a.date.raw);
}

/* ===============================
 *   FILTER + ARCHIVE
 *   =============================== */
function applyFilter() {
  const cat = categorySelect.value;
  const ym = monthSelect.value;

  FILTERED = ALL.filter(a => {
    const matchCat = !cat || a.category === cat;
    const matchMonth = !ym || `${a.date.year}-${a.date.month}` === ym;
    return matchCat && matchMonth;
  });

  PAGE = 1;
  renderMain();
  renderPagination();
}

/* ===============================
 *   PAGINATION
 *   =============================== */
function pagedData() {
  const start = (PAGE - 1) * PER_PAGE;
  return FILTERED.slice(start, start + PER_PAGE);
}

/* ===============================
 *   RENDER MAIN
 *   =============================== */
function renderMain() {
  main.innerHTML = "";

  pagedData().forEach(a => {
    main.insertAdjacentHTML("beforeend", `
    <article class="news-card">
    <img src="${a.image}" alt="${a.title}">
    <div>
    <span class="cat">${a.category}</span>
    <h2><a href="${a.url}">${a.title}</a></h2>
    <time>${a.date.label}</time>
    </div>
    </article>
    `);
  });
}

/* ===============================
 *   SIDEBAR STICKY
 *   =============================== */
function renderSidebar() {
  sidebar.innerHTML = "<h3>Terbaru</h3>";
  ALL.slice(0, SIDEBAR_LIMIT).forEach(a => {
    sidebar.insertAdjacentHTML("beforeend", `
    <a href="${a.url}" class="mini">
    <img src="${a.image}" alt="">
    <span>${a.title}</span>
    </a>
    `);
  });
}

/* ===============================
 *   PAGINATION UI
 *   =============================== */
function renderPagination() {
  const total = Math.ceil(FILTERED.length / PER_PAGE);
  pagination.innerHTML = "";

  if (total <= 1) return;

  pagination.innerHTML = `
  <button ${PAGE === 1 ? "disabled" : ""} id="prev">←</button>
  <span>${PAGE} / ${total}</span>
  <button ${PAGE === total ? "disabled" : ""} id="next">→</button>
  `;

  prev.onclick = () => { PAGE--; renderMain(); renderPagination(); };
  next.onclick = () => { PAGE++; renderMain(); renderPagination(); };
}

/* ===============================
 *   INIT
 *   =============================== */
document.addEventListener("DOMContentLoaded", async () => {
  ALL = await loadArticles();
  FILTERED = ALL;

  // kategori
  [...new Set(ALL.map(a => a.category))]
  .forEach(c => categorySelect.insertAdjacentHTML("beforeend", `<option>${c}</option>`));

  // archive tahun-bulan
  [...new Set(ALL.map(a => `${a.date.year}-${a.date.month}`))]
  .forEach(m => monthSelect.insertAdjacentHTML("beforeend", `<option value="${m}">${m}</option>`));

  renderMain();
  renderSidebar();
  renderPagination();

  categorySelect.onchange = monthSelect.onchange = applyFilter;
});
