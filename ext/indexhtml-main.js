import { IDX_FILENAME, IDX_DATE } from 'ext/indexhtml-util.js';
import { createArticleCard, createQuickNav } from 'ext/indexhtml-render.js';

document.addEventListener('DOMContentLoaded', async () => {
  const mainContainer = document.getElementById('main-container');
  if (!mainContainer) return;

  try {
    const response = await fetch('artikel.json');
    if (!response.ok) throw new Error('Gagal memuat artikel.json');
    const data = await response.json();

    const allCategories = Object.keys(data).sort();
    let allArticles = [];

    for (const category in data) {
      data[category].forEach(item => {
        if (item[IDX_DATE]) {
          allArticles.push({ item, date: new Date(item[IDX_DATE]) });
        }
      });
    }

    allArticles.sort((a, b) => b.date.getTime() - a.date.getTime());

    const displayedInLatest = new Set();

    // Artikel Terbaru
    if (allArticles.length > 0) {
      const latestSection = document.createElement('section');
      latestSection.className = 'category-section';
      latestSection.innerHTML = `<h2 id="terbaru"><span>💥</span> Artikel Terbaru</h2><div class="article-grid"></div>`;
      const latestGrid = latestSection.querySelector('.article-grid');
      
      allArticles.slice(0, 12).forEach(articleObj => {
        latestGrid.appendChild(createArticleCard(articleObj.item));
        displayedInLatest.add(articleObj.item[IDX_FILENAME]);
      });
      mainContainer.appendChild(latestSection);
    }

    // Artikel per Kategori
    allCategories.forEach(category => {
      const articlesToShow = data[category].filter(item => !displayedInLatest.has(item[IDX_FILENAME]));
      if (articlesToShow.length === 0) return;

      articlesToShow.sort((a, b) => new Date(b[IDX_DATE] || 0) - new Date(a[IDX_DATE] || 0));

      const section = document.createElement('section');
      section.className = 'category-section';
      section.innerHTML = `<h2 id="${category.toLowerCase().replace(/\s+/g,'-')}">${category}</h2><div class="article-grid"></div>`;
      
      const grid = section.querySelector('.article-grid');
      articlesToShow.forEach(item => {
        grid.appendChild(createArticleCard(item));
      });
      mainContainer.appendChild(section);
    });

    createQuickNav(allCategories);

  } catch (error) {
    console.error('Ada kendala saat memuat artikel.json:', error);
    mainContainer.innerHTML = `<p style="text-align: center; color: red;">Gagal memuat daftar artikel. (${error.message})</p>`;
  }
});
