// app.js

document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('artikel.json');
  const data = await response.json();

  let allArticles = [];
  Object.keys(data).forEach(category => {
    data[category].forEach(article => {
      allArticles.push({
        title: article[0],
        slug: article[1],
        imageUrl: article[2],
        date: article[3],
        summary: article[4],
        category: category
      });
    });
  });

  // Filter articles <= current date (use browser date, or hardcode for test)
  const currentDate = new Date(); // Real: new Date(); Test: new Date('2025-12-24')
allArticles = allArticles.filter(a => new Date(a.date) <= currentDate);

// Sort descending by date
allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

// Extract unique years and months
const years = [...new Set(allArticles.map(a => new Date(a.date).getFullYear()))].sort((a, b) => b - a);
const monthsByYear = {};
years.forEach(year => {
  monthsByYear[year] = [...new Set(allArticles.filter(a => new Date(a.date).getFullYear() === year).map(a => new Date(a.date).getMonth() + 1))].sort((a, b) => b - a);
});

const categories = Object.keys(data);

let currentPage = 1;
const articlesPerPage = 10;
let filteredArticles = [...allArticles];

const renderArticles = (articles, page = 1) => {
  const start = (page - 1) * articlesPerPage;
  const end = start + articlesPerPage;
  const paginated = articles.slice(start, end);

  const mainGrid = document.getElementById('main-grid');
  mainGrid.innerHTML = '';
  paginated.forEach(article => {
    const card = document.createElement('div');
    card.className = 'article-card';
    card.innerHTML = `
    <img src="${article.imageUrl}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image';">
    <h3>${article.title}</h3>
    <p>${article.summary.substring(0, 100)}...</p>
    <span>${new Date(article.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span class="category">${article.category}</span>
    `;
    card.addEventListener('click', () => window.location.href = `${article.slug}`); // Real link to slug
    mainGrid.appendChild(card);
  });

  const totalPages = Math.ceil(articles.length / articlesPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === page ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      renderArticles(filteredArticles, currentPage);
    });
    pagination.appendChild(btn);
  }
};

const renderSidebar = (id, articles, max = 5) => {
  const sidebar = document.getElementById(id);
  sidebar.innerHTML = '';
  articles.slice(0, max).forEach(article => {
    const thumb = document.createElement('div');
    thumb.className = 'thumbnail';
    thumb.innerHTML = `
    <img src="${article.imageUrl}" alt="${article.title}" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image';">
    <p>${article.title.substring(0, 50)}...</p>
    `;
    thumb.addEventListener('click', () => window.location.href = `${article.slug}`);
    sidebar.appendChild(thumb);
  });
};

const renderArchive = () => {
  const archive = document.getElementById('archive');
  archive.innerHTML = '';
  years.forEach(year => {
    const yearDiv = document.createElement('div');
    yearDiv.className = 'archive-year';
    yearDiv.innerHTML = `<h4>${year}</h4>`;
    monthsByYear[year].forEach(month => {
      const link = document.createElement('a');
      link.textContent = `Bulan ${month}`;
      link.href = '#';
      link.addEventListener('click', (e) => {
        e.preventDefault();
        filterArticles({ year, month });
      });
      yearDiv.appendChild(link);
    });
    archive.appendChild(yearDiv);
  });
};

const renderSortControls = () => {
  const categorySelect = document.getElementById('sort-category');
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  categorySelect.addEventListener('change', (e) => {
    const selectedCat = e.target.value;
    const yearSelect = document.getElementById('sort-year');
    yearSelect.innerHTML = '<option value="">Pilih Tahun</option>';
    if (selectedCat) {
      const catArticles = allArticles.filter(a => a.category === selectedCat);
      const catYears = [...new Set(catArticles.map(a => new Date(a.date).getFullYear()))].sort((a, b) => b - a);
      catYears.forEach(y => {
        const opt = document.createElement('option');
        opt.value = y;
        opt.textContent = y;
        yearSelect.appendChild(opt);
      });
    }
    filterArticles({ category: selectedCat });
  });

  const yearSelect = document.getElementById('sort-year');
  yearSelect.addEventListener('change', (e) => {
    const selectedYear = e.target.value;
    const monthSelect = document.getElementById('sort-month');
    monthSelect.innerHTML = '<option value="">Pilih Bulan</option>';
    if (selectedYear) {
      const cat = document.getElementById('sort-category').value;
      const yearArticles = allArticles.filter(a => (cat ? a.category === cat : true) && new Date(a.date).getFullYear() === parseInt(selectedYear));
      const months = [...new Set(yearArticles.map(a => new Date(a.date).getMonth() + 1))].sort((a, b) => b - a);
      months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = `Bulan ${m}`;
        monthSelect.appendChild(opt);
      });
    }
    filterArticles({ year: parseInt(selectedYear) });
  });

  document.getElementById('sort-month').addEventListener('change', (e) => {
    const selectedMonth = e.target.value;
    if (selectedMonth) {
      const cat = document.getElementById('sort-category').value;
      const year = document.getElementById('sort-year').value;
      filterArticles({ category: cat, year: parseInt(year), month: parseInt(selectedMonth) });
    }
  });
};

const filterArticles = (filters = {}) => {
  filteredArticles = allArticles.filter(a => {
    const aDate = new Date(a.date);
    return (filters.category ? a.category === filters.category : true) &&
    (filters.year ? aDate.getFullYear() === filters.year : true) &&
    (filters.month ? aDate.getMonth() + 1 === filters.month : true);
  });
  currentPage = 1;
  renderArticles(filteredArticles, currentPage);
};

// Initial render
renderArticles(allArticles);
renderSidebar('left-sidebar', allArticles.slice(0, 5)); // Recent for left
renderSidebar('right-sidebar', allArticles.sort(() => 0.5 - Math.random()).slice(0, 5)); // Random mix for right, biar variatif
renderArchive();
renderSortControls();
});
