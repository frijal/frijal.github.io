/**
 * Main JavaScript untuk halaman utama StreamFlix
 */

document.addEventListener('DOMContentLoaded', function() {
    // State aplikasi
    const state = {
        currentPage: {
            trending: 1,
            'indonesian-movies': 1,
            'indonesian-drama': 1,
            kdrama: 1,
            anime: 1,
            'short-tv': 1,
            search: 1
        },
        hasMore: {
            trending: true,
            'indonesian-movies': true,
            'indonesian-drama': true,
            kdrama: true,
            anime: true,
            'short-tv': true,
            search: true
        },
        isLoading: false,
        isSearching: false,
        searchQuery: '',
        heroSlider: {
            currentSlide: 0,
            slides: [],
            interval: null
        }
    };

    // Elemen DOM
    const elements = {
        // Hero slider
        heroSlider: document.querySelector('.hero-slider'),
        heroDots: document.querySelector('.hero-dots'),
        heroPrevBtn: document.querySelector('.hero-prev'),
        heroNextBtn: document.querySelector('.hero-next'),
        
        // Search
        searchInput: document.getElementById('search-input'),
        searchButton: document.getElementById('search-button'),
        clearSearchButton: document.getElementById('clear-search'),
        
        // Mobile menu
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileMenuCloseBtn: document.getElementById('mobile-menu-close'),
        mobileMenu: document.getElementById('mobile-menu'),
        
        // Section containers
        trendingContent: document.getElementById('trending-content'),
        indonesianMoviesContent: document.getElementById('indonesian-movies-content'),
        indonesianDramaContent: document.getElementById('indonesian-drama-content'),
        kdramaContent: document.getElementById('kdrama-content'),
        animeContent: document.getElementById('anime-content'),
        shortTvContent: document.getElementById('short-tv-content'),
        searchResultsContent: document.getElementById('search-results-content'),
        
        // Skeleton loaders
        trendingSkeleton: document.getElementById('trending-skeleton'),
        indonesianMoviesSkeleton: document.getElementById('indonesian-movies-skeleton'),
        indonesianDramaSkeleton: document.getElementById('indonesian-drama-skeleton'),
        kdramaSkeleton: document.getElementById('kdrama-skeleton'),
        animeSkeleton: document.getElementById('anime-skeleton'),
        shortTvSkeleton: document.getElementById('short-tv-skeleton'),
        searchResultsSkeleton: document.getElementById('search-results-skeleton'),
        
        // Sections
        searchResultsSection: document.getElementById('search-results'),
        noResults: document.getElementById('no-results'),
        
        // Scroll to top
        scrollTopBtn: document.getElementById('scroll-top'),
        
        // Navigation links
        navLinks: document.querySelectorAll('.nav-link'),
        mobileNavLinks: document.querySelectorAll('.mobile-nav-link'),
        
        // Category sections
        categorySections: document.querySelectorAll('.category-section')
    };

    // Debounce function untuk pencarian
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

    /**
     * Inisialisasi aplikasi
     */
    function init() {
        loadAllContent();
        setupEventListeners();
        setupScrollTop();
        setupIntersectionObserver();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Hero slider controls
        if (elements.heroPrevBtn) {
            elements.heroPrevBtn.addEventListener('click', () => changeHeroSlide(-1));
        }
        
        if (elements.heroNextBtn) {
            elements.heroNextBtn.addEventListener('click', () => changeHeroSlide(1));
        }
        
        // Search functionality
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', debounce(handleSearch, 500));
        }
        
        if (elements.searchButton) {
            elements.searchButton.addEventListener('click', handleSearch);
        }
        
        if (elements.clearSearchButton) {
            elements.clearSearchButton.addEventListener('click', clearSearch);
        }
        
        // Mobile menu
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }
        
        if (elements.mobileMenuCloseBtn) {
            elements.mobileMenuCloseBtn.addEventListener('click', toggleMobileMenu);
        }
        
        // Navigation links
        elements.navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
                setActiveNavLink(this);
            });
        });
        
        elements.mobileNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                scrollToSection(targetId);
                setActiveNavLink(this, true);
                toggleMobileMenu();
            });
        });
        
        // Section controls (prev/next buttons)
        document.querySelectorAll('.section-prev').forEach(btn => {
            btn.addEventListener('click', function() {
                const sectionId = this.closest('.category-section').id;
                scrollContentHorizontal(sectionId, -1);
            });
        });
        
        document.querySelectorAll('.section-next').forEach(btn => {
            btn.addEventListener('click', function() {
                const sectionId = this.closest('.category-section').id;
                scrollContentHorizontal(sectionId, 1);
            });
        });
        
        // Handle enter key pada search input
        if (elements.searchInput) {
            elements.searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
    }

    /**
     * Setup scroll to top button
     */
    function setupScrollTop() {
        if (!elements.scrollTopBtn) return;
        
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                elements.scrollTopBtn.classList.add('visible');
            } else {
                elements.scrollTopBtn.classList.remove('visible');
            }
        });
        
        elements.scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    /**
     * Setup Intersection Observer untuk infinite scroll
     */
    function setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    if (state.hasMore[sectionId] && !state.isLoading) {
                        loadMoreContent(sectionId);
                    }
                }
            });
        }, {
            threshold: 0.5
        });
        
        // Observe setiap section
        elements.categorySections.forEach(section => {
            observer.observe(section);
        });
    }

    /**
     * Memuat semua konten awal
     */
    async function loadAllContent() {
        try {
            // Tampilkan skeleton loader
            showSkeletonLoaders();
            
            // Load trending untuk hero slider
            const trendingData = await StreamFluxAPI.getTrending();
            
            if (trendingData.success) {
                // Setup hero slider dengan 5 item pertama
                const heroItems = trendingData.items.slice(0, 5);
                setupHeroSlider(heroItems);
                
                // Load konten untuk setiap kategori
                await Promise.all([
                    loadContent('trending', elements.trendingContent),
                    loadContent('indonesian-movies', elements.indonesianMoviesContent),
                    loadContent('indonesian-drama', elements.indonesianDramaContent),
                    loadContent('kdrama', elements.kdramaContent),
                    loadContent('anime', elements.animeContent),
                    loadContent('short-tv', elements.shortTvContent)
                ]);
            }
        } catch (error) {
            console.error('Error loading content:', error);
        } finally {
            // Sembunyikan skeleton loader
            hideSkeletonLoaders();
        }
    }

    /**
     * Menampilkan skeleton loader
     */
    function showSkeletonLoaders() {
        const skeletons = [
            elements.trendingSkeleton,
            elements.indonesianMoviesSkeleton,
            elements.indonesianDramaSkeleton,
            elements.kdramaSkeleton,
            elements.animeSkeleton,
            elements.shortTvSkeleton
        ];
        
        skeletons.forEach(skeleton => {
            if (skeleton) {
                skeleton.classList.remove('hidden');
                
                // Tambahkan skeleton cards
                skeleton.innerHTML = '';
                for (let i = 0; i < 6; i++) {
                    skeleton.innerHTML += `
                        <div class="skeleton-card">
                            <div class="skeleton-poster"></div>
                            <div class="skeleton-info">
                                <div class="skeleton-title"></div>
                                <div class="skeleton-meta"></div>
                            </div>
                        </div>
                    `;
                }
            }
        });
    }

    /**
     * Menyembunyikan skeleton loader
     */
    function hideSkeletonLoaders() {
        const skeletons = [
            elements.trendingSkeleton,
            elements.indonesianMoviesSkeleton,
            elements.indonesianDramaSkeleton,
            elements.kdramaSkeleton,
            elements.animeSkeleton,
            elements.shortTvSkeleton
        ];
        
        skeletons.forEach(skeleton => {
            if (skeleton) {
                skeleton.classList.add('hidden');
            }
        });
    }

    /**
     * Memuat konten untuk kategori tertentu
     */
    async function loadContent(category, container) {
        if (!container) return;
        
        state.isLoading = true;
        
        try {
            let data;
            
            switch (category) {
                case 'trending':
                    data = await StreamFluxAPI.getTrending(state.currentPage[category]);
                    break;
                case 'indonesian-movies':
                    data = await StreamFluxAPI.getIndonesianMovies(state.currentPage[category]);
                    break;
                case 'indonesian-drama':
                    data = await StreamFluxAPI.getIndonesianDrama(state.currentPage[category]);
                    break;
                case 'kdrama':
                    data = await StreamFluxAPI.getKdrama(state.currentPage[category]);
                    break;
                case 'anime':
                    data = await StreamFluxAPI.getAnime(state.currentPage[category]);
                    break;
                case 'short-tv':
                    data = await StreamFluxAPI.getShortTV(state.currentPage[category]);
                    break;
                default:
                    return;
            }
            
            if (data.success) {
                state.hasMore[category] = data.hasMore;
                
                if (data.items && data.items.length > 0) {
                    renderContentItems(data.items, container);
                    
                    if (data.page > 1) {
                        // Tambahkan konten baru ke yang sudah ada
                        state.currentPage[category] = data.page;
                    }
                } else if (state.currentPage[category] === 1) {
                    // Tampilkan pesan jika tidak ada konten
                    container.innerHTML = `
                        <div class="no-results">
                            <i class="fas fa-film"></i>
                            <h3>Tidak ada konten yang tersedia</h3>
                            <p>Coba kategori lain atau cek kembali nanti.</p>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error(`Error loading ${category}:`, error);
            
            // Tampilkan pesan error
            if (state.currentPage[category] === 1) {
                container.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Gagal memuat konten</h3>
                        <p>Terjadi kesalahan saat memuat data. Coba refresh halaman.</p>
                    </div>
                `;
            }
        } finally {
            state.isLoading = false;
        }
    }

    /**
     * Memuat lebih banyak konten (infinite scroll)
     */
    async function loadMoreContent(category) {
        if (state.isLoading || !state.hasMore[category]) return;
        
        state.currentPage[category]++;
        
        const containerMap = {
            trending: elements.trendingContent,
            'indonesian-movies': elements.indonesianMoviesContent,
            'indonesian-drama': elements.indonesianDramaContent,
            kdrama: elements.kdramaContent,
            anime: elements.animeContent,
            'short-tv': elements.shortTvContent
        };
        
        await loadContent(category, containerMap[category]);
    }

    /**
     * Render konten items ke container
     */
    function renderContentItems(items, container) {
        items.forEach(item => {
            const card = createContentCard(item);
            container.appendChild(card);
        });
    }

    /**
     * Membuat card konten
     */
    function createContentCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        card.dataset.id = item.id;
        
        const rating = item.rating ? item.rating.toFixed(1) : 'N/A';
        const type = item.type === 'tv' ? 'TV Series' : 'Film';
        
        card.innerHTML = `
            <div class="card-poster-container">
                <img class="card-poster" src="${item.poster || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'}" alt="${item.title}" loading="lazy">
                <div class="card-overlay">
                    <a href="detail.html?detailPath=${encodeURIComponent(item.detailPath)}" class="card-play-btn">
                        <i class="fas fa-play"></i>
                    </a>
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title">${item.title}</h3>
                <div class="card-meta">
                    <span class="card-rating">
                        <i class="fas fa-star"></i> ${rating}
                    </span>
                    <span>${item.year || 'N/A'}</span>
                </div>
                <div class="card-type">${type}</div>
            </div>
        `;
        
        return card;
    }

    /**
     * Setup hero slider
     */
    function setupHeroSlider(items) {
        if (!elements.heroSlider || items.length === 0) return;
        
        elements.heroSlider.innerHTML = '';
        elements.heroDots.innerHTML = '';
        
        state.heroSlider.slides = items;
        
        items.forEach((item, index) => {
            // Create slide
            const slide = document.createElement('div');
            slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
            
            const rating = item.rating ? item.rating.toFixed(1) : 'N/A';
            const type = item.type === 'tv' ? 'TV Series' : 'Film';
            const genre = item.genre || 'Drama';
            
            slide.innerHTML = `
                <img class="hero-slide-bg" src="${item.poster}" alt="${item.title}">
                <div class="hero-content">
                    <h1 class="hero-title">${item.title}</h1>
                    <div class="hero-meta">
                        <span class="hero-rating">
                            <i class="fas fa-star"></i> ${rating}
                        </span>
                        <span class="hero-year">
                            <i class="fas fa-calendar-alt"></i> ${item.year || 'N/A'}
                        </span>
                        <span class="hero-type">
                            <i class="fas fa-tv"></i> ${type}
                        </span>
                    </div>
                    <p class="hero-description">${item.title} adalah ${type.toLowerCase()} ${item.genre ? `bergenre ${genre}` : 'terbaru'} yang tayang pada tahun ${item.year || '2023'}.</p>
                    <div class="hero-buttons">
                        <a href="detail.html?detailPath=${encodeURIComponent(item.detailPath)}" class="hero-btn hero-btn-primary">
                            <i class="fas fa-play"></i> Tonton Sekarang
                        </a>
                        <button class="hero-btn hero-btn-secondary info-btn" data-id="${item.id}">
                            <i class="fas fa-info-circle"></i> Info Lebih Lanjut
                        </button>
                    </div>
                </div>
            `;
            
            elements.heroSlider.appendChild(slide);
            
            // Create dot
            const dot = document.createElement('div');
            dot.className = `hero-dot ${index === 0 ? 'active' : ''}`;
            dot.dataset.index = index;
            dot.addEventListener('click', () => goToSlide(index));
            elements.heroDots.appendChild(dot);
            
            // Add event listener to info button
            slide.querySelector('.info-btn')?.addEventListener('click', function() {
                const detailPath = item.detailPath;
                window.location.href = `detail.html?detailPath=${encodeURIComponent(detailPath)}`;
            });
        });
        
        // Start auto slide
        startAutoSlide();
    }

    /**
     * Ganti slide hero
     */
    function changeHeroSlide(direction) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        
        if (slides.length === 0) return;
        
        slides[state.heroSlider.currentSlide].classList.remove('active');
        dots[state.heroSlider.currentSlide].classList.remove('active');
        
        state.heroSlider.currentSlide += direction;
        
        if (state.heroSlider.currentSlide < 0) {
            state.heroSlider.currentSlide = slides.length - 1;
        } else if (state.heroSlider.currentSlide >= slides.length) {
            state.heroSlider.currentSlide = 0;
        }
        
        slides[state.heroSlider.currentSlide].classList.add('active');
        dots[state.heroSlider.currentSlide].classList.add('active');
        
        // Reset auto slide timer
        resetAutoSlide();
    }

    /**
     * Pergi ke slide tertentu
     */
    function goToSlide(index) {
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        
        if (index < 0 || index >= slides.length) return;
        
        slides[state.heroSlider.currentSlide].classList.remove('active');
        dots[state.heroSlider.currentSlide].classList.remove('active');
        
        state.heroSlider.currentSlide = index;
        slides[state.heroSlider.currentSlide].classList.add('active');
        dots[state.heroSlider.currentSlide].classList.add('active');
        
        // Reset auto slide timer
        resetAutoSlide();
    }

    /**
     * Mulai auto slide
     */
    function startAutoSlide() {
        if (state.heroSlider.interval) {
            clearInterval(state.heroSlider.interval);
        }
        
        state.heroSlider.interval = setInterval(() => {
            changeHeroSlide(1);
        }, 5000);
    }

    /**
     * Reset auto slide timer
     */
    function resetAutoSlide() {
        if (state.heroSlider.interval) {
            clearInterval(state.heroSlider.interval);
            startAutoSlide();
        }
    }

    /**
     * Handle pencarian
     */
    async function handleSearch() {
        const query = elements.searchInput.value.trim();
        
        if (!query) {
            clearSearch();
            return;
        }
        
        state.searchQuery = query;
        state.isSearching = true;
        
        // Sembunyikan semua kategori
        elements.categorySections.forEach(section => {
            if (section.id !== 'search-results') {
                section.classList.add('hidden');
            }
        });
        
        // Tampilkan search results section
        elements.searchResultsSection.classList.remove('hidden');
        elements.searchResultsContent.innerHTML = '';
        elements.noResults.classList.add('hidden');
        
        // Tampilkan skeleton loader
        elements.searchResultsSkeleton.classList.remove('hidden');
        elements.searchResultsSkeleton.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            elements.searchResultsSkeleton.innerHTML += `
                <div class="skeleton-card">
                    <div class="skeleton-poster"></div>
                    <div class="skeleton-info">
                        <div class="skeleton-title"></div>
                        <div class="skeleton-meta"></div>
                    </div>
                </div>
            `;
        }
        
        try {
            const searchData = await StreamFluxAPI.searchContent(query);
            
            // Sembunyikan skeleton loader
            elements.searchResultsSkeleton.classList.add('hidden');
            
            if (searchData.success && searchData.items && searchData.items.length > 0) {
                // Render hasil pencarian
                renderContentItems(searchData.items, elements.searchResultsContent);
            } else {
                // Tampilkan pesan tidak ada hasil
                elements.noResults.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error searching:', error);
            elements.noResults.classList.remove('hidden');
            elements.searchResultsSkeleton.classList.add('hidden');
        }
    }

    /**
     * Clear pencarian
     */
    function clearSearch() {
        elements.searchInput.value = '';
        state.isSearching = false;
        state.searchQuery = '';
        
        // Tampilkan semua kategori
        elements.categorySections.forEach(section => {
            section.classList.remove('hidden');
        });
        
        // Sembunyikan search results section
        elements.searchResultsSection.classList.add('hidden');
        elements.noResults.classList.add('hidden');
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        elements.mobileMenu.classList.toggle('active');
        document.body.style.overflow = elements.mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    /**
     * Scroll ke section tertentu
     */
    function scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const sectionTop = section.offsetTop - navbarHeight - 20;
            
            window.scrollTo({
                top: sectionTop,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Set active nav link
     */
    function setActiveNavLink(activeLink, isMobile = false) {
        const links = isMobile ? elements.mobileNavLinks : elements.navLinks;
        
        links.forEach(link => {
            link.classList.remove('active');
        });
        
        activeLink.classList.add('active');
    }

    /**
     * Scroll konten horizontal
     */
    function scrollContentHorizontal(sectionId, direction) {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const contentGrid = section.querySelector('.content-grid');
        if (!contentGrid) return;
        
        const scrollAmount = 300; // Jarak scroll per klik
        contentGrid.scrollLeft += direction * scrollAmount;
    }

    // Inisialisasi aplikasi
    init();
});