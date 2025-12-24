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
async function loadArticles() {
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

  // urutkan terbaru
  articles.sort((a, b) => b.date.raw - a.date.raw);

  return articles.slice(0, MAX_ARTICLES);
}

/* ===============================
   RENDER ARTIKEL
   =============================== */
function renderArticles(data) {
  const container = document.getElementById("articleGrid");
  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = `<p class="empty">Artikel tidak ditemukan.</p>`;
    return;
  }

  data.forEach(article => {
    const card = document.createElement("article");
    card.className = "card";

    card.innerHTML = `
      <a href="${article.url}" class="thumb">
        <img src="${article.image}" alt="${article.title}" loading="lazy">
      </a>
      <div class="card-body">
        <span class="category">${article.category}</span>
        <h2 class="title">
          <a href="${article.url}">${article.title}</a>
        </h2>
        <time datetime="${article.date.raw.toISOString()}">
          ${article.date.readable}
        </time>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ===============================
   FILTER & SEARCH
   =============================== */
function applyFilter(allArticles) {
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
