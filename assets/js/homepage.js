/* gabungan homepage + articles (non-module) */
(function(){
  const CONFIG = { jsonPath: './artikel.json', pageSize:12, thumbnailSidebarCount:12 };
  let ALL_ARTICLES=[], FILTERED=[], CURRENT_PAGE=1, CURRENT_SORT={field:'date',dir:'desc'}, ARCHIVE={};

  const qs = s=>document.querySelector(s), qsa=s=>Array.from(document.querySelectorAll(s));
  const fmtDate = iso=>{ const d=new Date(iso); return isNaN(d)?iso:d.toLocaleString(); };
  function esc(s=''){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  async function loadArticles(){
    try{
      const res = await fetch(CONFIG.jsonPath, {cache:'no-store'});
      if(!res.ok) throw new Error('HTTP '+res.status);
      const data = await res.json();
      ALL_ARTICLES = (Array.isArray(data)?data:[]).map(a=>({
        title: a.title||a.judul||'',
        slug: a.slug||'',
        url: a.url||a.link||'#',
        image: a.image||a.gambar||a.thumbnail||'',
        datetime: a.datetime||a.published_at||a.tanggal||'',
        category: a.category||a.kategori||'Uncategorized'
      }));
      FILTERED = ALL_ARTICLES.slice();
      buildArchiveAndFilters();
      renderAll();
    }catch(err){
      console.error(err);
      const el = qs('#main')||qs('main');
      if(el) el.innerHTML = `<div class="error">Gagal memuat data: ${esc(err.message)}</div>`;
    }
  }

  function renderAll(){
    renderSidebarThumbnails(); renderArchive(); renderFiltersUI(); renderArticlesPage(1); renderPagination();
  }

  function articleCardHTML(a){ return `<article class="article-card"><a href="${esc(a.url)}" target="_blank" rel="noopener"><img src="${esc(a.image)}" alt="${esc(a.title)}"><div class="card-body"><h3 class="card-title">${esc(a.title)}</h3><div class="card-meta"><span>${esc(a.category)}</span><time datetime="${esc(a.datetime)}">${esc(fmtDate(a.datetime))}</time></div></div></a></article>`; }

  function renderArticlesPage(page=1){
    CURRENT_PAGE=page;
    const container = qs('#articles-grid'); if(!container) return;
    const sorted = applySort(FILTERED);
    const start = (page-1)*CONFIG.pageSize;
    const pageItems = sorted.slice(start, start+CONFIG.pageSize);
    container.innerHTML = pageItems.map(a=>articleCardHTML(a)).join('');
    qsa('.article-card img').forEach(i=>i.setAttribute('loading','lazy'));
    const countEl = qs('#results-count'); if(countEl) countEl.textContent = `${FILTERED.length} artikel`;
  }

  function renderSidebarThumbnails(){
    const el = qs('#sidebar-thumbs'); if(!el) return;
    const thumbs = ALL_ARTICLES.slice().sort((a,b)=>new Date(b.datetime)-new Date(a.datetime)).slice(0,CONFIG.thumbnailSidebarCount);
    el.innerHTML = thumbs.map(t=>`<a class="thumb-item" href="${esc(t.url)}" target="_blank" rel="noopener"><img src="${esc(t.image)}" alt="${esc(t.title)}"><div>${esc(t.title)}</div></a>`).join('');
  }

  function buildArchiveAndFilters(){
    ARCHIVE={};
    ALL_ARTICLES.forEach(a=>{
      const d=new Date(a.datetime); const year = isNaN(d)?'Unknown':d.getFullYear(); const month = isNaN(d)?'Unknown':(d.getMonth()+1);
      ARCHIVE[year]=ARCHIVE[year]||{}; ARCHIVE[year][month]=ARCHIVE[year][month]||[]; ARCHIVE[year][month].push(a);
    });
  }

  function renderArchive(){
    const el = qs('#archive'); if(!el) return;
    const years = Object.keys(ARCHIVE).sort((a,b)=>b-a);
    el.innerHTML = years.map(y=>{ const months = Object.keys(ARCHIVE[y]).sort((a,b)=>b-a); const monthsHtml = months.map(m=>{ const count=ARCHIVE[y][m].length; const label = m==='Unknown'?'Unknown':new Date(y,m-1).toLocaleString(undefined,{month:'short'}); return `<button class="archive-month" data-year="${y}" data-month="${m}">${label} (${count})</button>`; }).join(''); return `<div class="archive-year"><div class="year-label">${y}</div><div class="year-months">${monthsHtml}</div></div>`; }).join('');
    qsa('.archive-month').forEach(btn=>btn.addEventListener('click',()=>{ applyCascadingFilter({ year: btn.dataset.year, month: btn.dataset.month }); }));
  }

  function renderFiltersUI(){
    const catSet = new Set(ALL_ARTICLES.map(a=>a.category));
    const catSelect = qs('#filter-category'); if(catSelect){ catSelect.innerHTML = `<option value="">Semua Kategori</option>` + Array.from(catSet).sort().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join(''); catSelect.addEventListener('change', ()=>applyCascadingFilter({ category: catSelect.value||null })); }
    const years = Object.keys(ARCHIVE).sort((a,b)=>b-a);
    const yearSelect = qs('#filter-year'); if(yearSelect){ yearSelect.innerHTML = `<option value="">Semua Tahun</option>` + years.map(y=>`<option value="${y}">${y}</option>`).join(''); yearSelect.addEventListener('change', ()=>{ populateMonthSelect(yearSelect.value||null); applyCascadingFilter({ year: yearSelect.value||null }); }); }
    const monthSelect = qs('#filter-month'); if(monthSelect){ monthSelect.addEventListener('change', ()=>applyCascadingFilter({ month: monthSelect.value||null })); }
    const sortSelect = qs('#sort-select'); if(sortSelect){ sortSelect.addEventListener('change', ()=>{ const val=sortSelect.value; if(val==='newest') CURRENT_SORT={field:'date',dir:'desc'}; if(val==='oldest') CURRENT_SORT={field:'date',dir:'asc'}; if(val==='title-asc') CURRENT_SORT={field:'title',dir:'asc'}; if(val==='title-desc') CURRENT_SORT={field:'title',dir:'desc'}; renderArticlesPage(1); renderPagination(); }); }
    const searchBox = qs('#search-box'); if(searchBox){ let t; searchBox.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(()=>applyCascadingFilter({ q: searchBox.value.trim()||null }),300); }); }
  }

  function populateMonthSelect(year){
    const monthSelect = qs('#filter-month'); if(!monthSelect) return; monthSelect.innerHTML = `<option value="">Semua Bulan</option>`; if(!year||!ARCHIVE[year]) return; Object.keys(ARCHIVE[year]).sort((a,b)=>b-a).forEach(m=>{ const label = m==='Unknown'?'Unknown':new Date(year,m-1).toLocaleString(undefined,{month:'long'}); monthSelect.insertAdjacentHTML('beforeend', `<option value="${m}">${label}</option>`); });
  }

  function applyCascadingFilter({ category=null, year=null, month=null, q=null }={}) {
    const catSel = qs('#filter-category'), yearSel = qs('#filter-year'), monthSel = qs('#filter-month'), searchBox = qs('#search-box');
    const catVal = category!==null?category:(catSel?catSel.value||null:null);
    const yearVal = year!==null?year:(yearSel?yearSel.value||null:null);
    const monthVal = month!==null?month:(monthSel?monthSel.value||null:null);
    const qVal = q!==null?q:(searchBox?searchBox.value.trim()||null:null);
    FILTERED = ALL_ARTICLES.filter(a=>{
      if(catVal && a.category!==catVal) return false;
      if(yearVal){ const d=new Date(a.datetime); if(isNaN(d)||String(d.getFullYear())!==String(yearVal)) return false; }
      if(monthVal){ const d=new Date(a.datetime); const m = isNaN(d)?'Unknown':(d.getMonth()+1); if(String(m)!==String(monthVal)) return false; }
      if(qVal){ const ql=qVal.toLowerCase(); if(!(a.title.toLowerCase().includes(ql) || (a.category && a.category.toLowerCase().includes(ql)))) return false; }
      return true;
    });
    renderArticlesPage(1); renderPagination();
  }

  function applySort(list){
    const copy=list.slice();
    if(CURRENT_SORT.field==='date'){ copy.sort((a,b)=>{ const da=new Date(a.datetime), db=new Date(b.datetime); return CURRENT_SORT.dir==='desc'?db-da:da-db; }); }
    else { copy.sort((a,b)=>{ const A=a.title.toLowerCase(), B=b.title.toLowerCase(); if(A<B) return CURRENT_SORT.dir==='asc'?-1:1; if(A>B) return CURRENT_SORT.dir==='asc'?1:-1; return 0; }); }
    return copy;
  }

  function renderPagination(){
    const total = FILTERED.length; const pages = Math.max(1, Math.ceil(total/CONFIG.pageSize)); const el = qs('#pagination'); if(!el) return;
    const current = CURRENT_PAGE; const range=2; const start=Math.max(1,current-range); const end=Math.min(pages,current+range);
    const parts=[];
    if(current>1) parts.push(`<button class="page-btn" data-page="${current-1}">Prev</button>`);
    for(let p=start;p<=end;p++) parts.push(`<button class="page-btn ${p===current?'active':''}" data-page="${p}">${p}</button>`);
    if(current<pages) parts.push(`<button class="page-btn" data-page="${current+1}">Next</button>`);
    el.innerHTML = parts.join('');
    qsa('#pagination .page-btn').forEach(b=>b.addEventListener('click', ()=>{ const p=Number(b.dataset.page); renderArticlesPage(p); renderPagination(); window.scrollTo({top:0,behavior:'smooth'}); }));
  }

  // theme toggle + init
  document.addEventListener('DOMContentLoaded', ()=>{
    const themeToggle = document.getElementById('theme-toggle'); const htmlEl = document.documentElement;
    const saved = localStorage.getItem('theme-mode'); if(saved==='light') htmlEl.classList.add('light-mode');
    if(themeToggle) themeToggle.addEventListener('click', ()=>{ const isLight = htmlEl.classList.toggle('light-mode'); localStorage.setItem('theme-mode', isLight?'light':'dark'); themeToggle.setAttribute('aria-pressed', String(isLight)); });
    loadArticles();
  });

  // expose for debugging
  window.AppArticles = { loadArticles, applyCascadingFilter, renderAll };
})();
