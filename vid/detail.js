/**
 * JavaScript untuk halaman detail StreamFlix
 */

document.addEventListener('DOMContentLoaded', function() {
    // State aplikasi
    const state = {
        detailData: null,
        isPlaying: false,
        watchlist: JSON.parse(localStorage.getItem('streamflix_watchlist') || '[]')
    };

    // Elemen DOM
    const elements = {
        // Skeleton
        detailSkeleton: document.getElementById('detail-skeleton'),
        detailContent: document.getElementById('detail-content'),
        
        // Detail info
        detailPoster: document.getElementById('detail-poster'),
        detailTitle: document.getElementById('detail-title'),
        detailRating: document.getElementById('detail-rating'),
        detailYear: document.getElementById('detail-year'),
        detailType: document.getElementById('detail-type'),
        detailGenre: document.getElementById('detail-genre'),
        detailDescription: document.getElementById('detail-description'),
        
        // Buttons
        playButton: document.getElementById('play-button'),
        watchTrailerBtn: document.getElementById('watch-trailer'),
        addToListBtn: document.getElementById('add-to-list'),
        shareBtn: document.getElementById('share-btn'),
        
        // Modal
        videoModal: document.getElementById('video-modal'),
        modalClose: document.getElementById('modal-close'),
        videoPlayer: document.getElementById('video-player'),
        modalTitle: document.getElementById('modal-title'),
        
        // Seasons & episodes
        seasonsContainer: document.getElementById('seasons-container'),
        seasonsList: document.getElementById('seasons-list'),
        
        // Recommendations
        recommendationsContainer: document.getElementById('recommendations-container'),
        recommendationsGrid: document.getElementById('recommendations-grid'),
        
        // Error state
        detailError: document.getElementById('detail-error'),
        
        // Mobile menu (detail page)
        mobileMenuBtn: document.getElementById('detail-mobile-menu-btn'),
        mobileMenuCloseBtn: document.getElementById('detail-mobile-menu-close'),
        mobileMenu: document.getElementById('detail-mobile-menu'),
        
        // Search (detail page)
        searchInput: document.getElementById('detail-search-input'),
        searchButton: document.getElementById('detail-search-button')
    };

    /**
     * Inisialisasi aplikasi
     */
    function init() {
        loadDetailContent();
        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Play button
        if (elements.playButton) {
            elements.playButton.addEventListener('click', playContent);
        }
        
        // Watch trailer button
        if (elements.watchTrailerBtn) {
            elements.watchTrailerBtn.addEventListener('click', watchTrailer);
        }
        
        // Add to list button
        if (elements.addToListBtn) {
            elements.addToListBtn.addEventListener('click', toggleWatchlist);
            updateWatchlistButton();
        }
        
        // Share button
        if (elements.shareBtn) {
            elements.shareBtn.addEventListener('click', shareContent);
        }
        
        // Modal close button
        if (elements.modalClose) {
            elements.modalClose.addEventListener('click', closeVideoModal);
        }
        
        // Close modal when clicking outside
        if (elements.videoModal) {
            elements.videoModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeVideoModal();
                }
            });
        }
        
        // Mobile menu
        if (elements.mobileMenuBtn) {
            elements.mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        }
        
        if (elements.mobileMenuCloseBtn) {
            elements.mobileMenuCloseBtn.addEventListener('click', toggleMobileMenu);
        }
        
        // Search
        if (elements.searchButton) {
            elements.searchButton.addEventListener('click', handleSearch);
        }
        
        if (elements.searchInput) {
            elements.searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    handleSearch();
                }
            });
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !elements.videoModal.classList.contains('hidden')) {
                closeVideoModal();
            }
        });
    }

    /**
     * Memuat konten detail
     */
    async function loadDetailContent() {
        const urlParams = new URLSearchParams(window.location.search);
        const detailPath = urlParams.get('detailPath');
        
        if (!detailPath) {
            showError();
            return;
        }
        
        try {
            const detailData = await StreamFluxAPI.getDetail(detailPath);
            
            if (detailData.success) {
                state.detailData = detailData;
                renderDetailContent(detailData);
                
                // Load rekomendasi berdasarkan genre
                loadRecommendations(detailData);
                
                // Jika ini TV series, load seasons & episodes
                if (detailData.type === 'tv' || detailData.type === 'series') {
                    loadSeasonsAndEpisodes(detailData);
                }
                
                // Update meta tags untuk SEO
                updateMetaTags(detailData);
            } else {
                showError();
            }
        } catch (error) {
            console.error('Error loading detail:', error);
            showError();
        }
    }

    /**
     * Render konten detail
     */
    function renderDetailContent(data) {
        // Sembunyikan skeleton, tampilkan konten
        elements.detailSkeleton.classList.add('hidden');
        elements.detailContent.classList.remove('hidden');
        
        // Set detail info
        if (elements.detailPoster) {
            elements.detailPoster.src = data.poster || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
            elements.detailPoster.alt = data.title || 'Film Poster';
        }
        
        if (elements.detailTitle) {
            elements.detailTitle.textContent = data.title || 'Judul tidak tersedia';
        }
        
        if (elements.detailRating) {
            const rating = data.rating ? data.rating.toFixed(1) : 'N/A';
            elements.detailRating.innerHTML = `<i class="fas fa-star"></i> ${rating}`;
        }
        
        if (elements.detailYear) {
            elements.detailYear.innerHTML = `<i class="fas fa-calendar-alt"></i> ${data.year || 'N/A'}`;
        }
        
        if (elements.detailType) {
            const type = (data.type === 'tv' || data.type === 'series') ? 'TV Series' : 'Film';
            elements.detailType.innerHTML = `<i class="fas fa-tv"></i> ${type}`;
        }
        
        if (elements.detailGenre) {
            elements.detailGenre.innerHTML = `<i class="fas fa-tags"></i> ${data.genre || 'Drama'}`;
        }
        
        if (elements.detailDescription) {
            elements.detailDescription.textContent = data.description || 
                `${data.title || 'Film ini'} adalah ${(data.type === 'tv' || data.type === 'series') ? 'series' : 'film'} ${data.genre ? `bergenre ${data.genre}` : 'terbaru'} yang tayang pada tahun ${data.year || '2023'}.`;
        }
        
        // Update judul halaman
        document.title = `${data.title || 'Detail Film'} - StreamFlix`;
    }

    /**
     * Memuat rekomendasi
     */
    async function loadRecommendations(detailData) {
        if (!elements.recommendationsContainer || !elements.recommendationsGrid) return;
        
        try {
            // Coba dapatkan rekomendasi berdasarkan kategori
            let recommendationData;
            const genre = detailData.genre ? detailData.genre.split(',')[0].trim() : 'drama';
            
            if (genre.toLowerCase().includes('anime') || detailData.type === 'anime') {
                recommendationData = await StreamFluxAPI.getAnime(1);
            } else if (genre.toLowerCase().includes('drama')) {
                recommendationData = await StreamFluxAPI.getKdrama(1);
            } else {
                recommendationData = await StreamFluxAPI.getTrending(1);
            }
            
            if (recommendationData.success && recommendationData.items && recommendationData.items.length > 0) {
                // Filter out current item
                const filteredItems = recommendationData.items.filter(item => 
                    item.id !== detailData.id
                ).slice(0, 5);
                
                if (filteredItems.length > 0) {
                    elements.recommendationsContainer.classList.remove('hidden');
                    
                    // Render rekomendasi
                    filteredItems.forEach(item => {
                        const card = createRecommendationCard(item);
                        elements.recommendationsGrid.appendChild(card);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading recommendations:', error);
        }
    }

    /**
     * Membuat card rekomendasi
     */
    function createRecommendationCard(item) {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        const rating = item.rating ? item.rating.toFixed(1) : 'N/A';
        const type = item.type === 'tv' ? 'TV Series' : 'Film';
        
        card.innerHTML = `
            <div class="card-poster-container">
                <img class="card-poster" src="${item.poster}" alt="${item.title}" loading="lazy">
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
     * Memuat seasons dan episodes (untuk TV series)
     */
    function loadSeasonsAndEpisodes(data) {
        if (!elements.seasonsContainer || !elements.seasonsList) return;
        
        // Jika API menyediakan data seasons, gunakan itu
        // Jika tidak, buat data dummy untuk demonstrasi
        const seasons = data.seasons || [
            { number: 1, episodeCount: 10, title: 'Musim 1' },
            { number: 2, episodeCount: 12, title: 'Musim 2' }
        ];
        
        if (seasons.length > 0) {
            elements.seasonsContainer.classList.remove('hidden');
            
            seasons.forEach(season => {
                const seasonItem = document.createElement('div');
                seasonItem.className = 'season-item';
                
                seasonItem.innerHTML = `
                    <div class="season-header">
                        <h3>${season.title || `Musim ${season.number}`}</h3>
                        <span class="season-toggle"><i class="fas fa-chevron-down"></i></span>
                    </div>
                    <div class="episodes-grid">
                        ${generateEpisodesHTML(season.episodeCount || 10, season.number)}
                    </div>
                `;
                
                elements.seasonsList.appendChild(seasonItem);
                
                // Add toggle functionality
                const seasonHeader = seasonItem.querySelector('.season-header');
                const episodesGrid = seasonItem.querySelector('.episodes-grid');
                const seasonToggle = seasonItem.querySelector('.season-toggle');
                
                seasonHeader.addEventListener('click', function() {
                    episodesGrid.classList.toggle('active');
                    seasonToggle.classList.toggle('active');
                });
            });
        }
    }

    /**
     * Generate HTML untuk episodes
     */
    function generateEpisodesHTML(episodeCount, seasonNumber) {
        let episodesHTML = '';
        
        for (let i = 1; i <= episodeCount; i++) {
            episodesHTML += `
                <div class="episode-card">
                    <a href="#" class="episode-link" data-season="${seasonNumber}" data-episode="${i}">
                        <div class="episode-number">${i}</div>
                        <div class="episode-info">
                            <h4 class="episode-title">Episode ${i}</h4>
                            <div class="episode-meta">Durasi: 45m</div>
                        </div>
                        <div class="episode-play">
                            <i class="fas fa-play"></i>
                        </div>
                    </a>
                </div>
            `;
        }
        
        return episodesHTML;
        
        // Add event listeners untuk episode play buttons
        setTimeout(() => {
            document.querySelectorAll('.episode-link').forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const season = this.dataset.season;
                    const episode = this.dataset.episode;
                    playEpisode(season, episode);
                });
            });
        }, 100);
    }

    /**
     * Play konten utama
     */
    function playContent() {
        if (!state.detailData) return;
        
        // Jika ada videoUrl dari API, gunakan itu
        if (state.detailData.videoUrl) {
            openVideoModal(state.detailData.videoUrl, state.detailData.title);
        } else {
            // Fallback: Gunakan trailer atau video placeholder
            openVideoModal('https://www.youtube.com/embed/dQw4w9WgXcQ', state.detailData.title);
        }
    }

    /**
     * Play episode tertentu
     */
    function playEpisode(season, episode) {
        if (!state.detailData) return;
        
        const title = `${state.detailData.title} - S${season}E${episode}`;
        openVideoModal('https://www.youtube.com/embed/dQw4w9WgXcQ', title);
    }

    /**
     * Watch trailer
     */
    function watchTrailer() {
        if (!state.detailData) return;
        
        openVideoModal('https://www.youtube.com/embed/dQw4w9WgXcQ', `${state.detailData.title} - Trailer`);
    }

    /**
     * Buka video modal
     */
    function openVideoModal(videoUrl, title) {
        if (!elements.videoModal || !elements.videoPlayer) return;
        
        elements.videoPlayer.src = videoUrl;
        elements.modalTitle.textContent = title || 'Video Player';
        elements.videoModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        state.isPlaying = true;
    }

    /**
     * Tutup video modal
     */
    function closeVideoModal() {
        if (!elements.videoModal || !elements.videoPlayer) return;
        
        elements.videoPlayer.src = '';
        elements.videoModal.classList.add('hidden');
        document.body.style.overflow = '';
        
        state.isPlaying = false;
    }

    /**
     * Toggle watchlist
     */
    function toggleWatchlist() {
        if (!state.detailData) return;
        
        const itemId = state.detailData.id;
        const itemIndex = state.watchlist.indexOf(itemId);
        
        if (itemIndex === -1) {
            // Tambahkan ke watchlist
            state.watchlist.push(itemId);
            elements.addToListBtn.innerHTML = '<i class="fas fa-check"></i> Ditambahkan';
            elements.addToListBtn.classList.add('active');
            
            // Tampilkan notifikasi
            showNotification('Ditambahkan ke Daftar Tonton');
        } else {
            // Hapus dari watchlist
            state.watchlist.splice(itemIndex, 1);
            elements.addToListBtn.innerHTML = '<i class="fas fa-plus"></i> Daftar Tonton';
            elements.addToListBtn.classList.remove('active');
            
            // Tampilkan notifikasi
            showNotification('Dihapus dari Daftar Tonton');
        }
        
        // Simpan ke localStorage
        localStorage.setItem('streamflix_watchlist', JSON.stringify(state.watchlist));
    }

    /**
     * Update watchlist button state
     */
    function updateWatchlistButton() {
        if (!state.detailData || !elements.addToListBtn) return;
        
        const itemId = state.detailData.id;
        const isInWatchlist = state.watchlist.includes(itemId);
        
        if (isInWatchlist) {
            elements.addToListBtn.innerHTML = '<i class="fas fa-check"></i> Ditambahkan';
            elements.addToListBtn.classList.add('active');
        } else {
            elements.addToListBtn.innerHTML = '<i class="fas fa-plus"></i> Daftar Tonton';
            elements.addToListBtn.classList.remove('active');
        }
    }

    /**
     * Share konten
     */
    function shareContent() {
        if (!state.detailData) return;
        
        const title = state.detailData.title || 'Film menarik';
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: `Tonton "${title}" di StreamFlix`,
                url: url
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(url).then(() => {
                showNotification('Link berhasil disalin ke clipboard');
            });
        }
    }

    /**
     * Tampilkan notifikasi
     */
    function showNotification(message) {
        // Cek apakah sudah ada notifikasi
        let notification = document.querySelector('.notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    /**
     * Handle search (di halaman detail)
     */
    function handleSearch() {
        const query = elements.searchInput.value.trim();
        
        if (query) {
            window.location.href = `index.html?search=${encodeURIComponent(query)}`;
        }
    }

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        if (!elements.mobileMenu) return;
        
        elements.mobileMenu.classList.toggle('active');
        document.body.style.overflow = elements.mobileMenu.classList.contains('active') ? 'hidden' : '';
    }

    /**
     * Tampilkan error state
     */
    function showError() {
        elements.detailSkeleton.classList.add('hidden');
        elements.detailContent.classList.add('hidden');
        elements.detailError.classList.remove('hidden');
    }

    /**
     * Update meta tags untuk SEO
     */
    function updateMetaTags(data) {
        // Update meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.name = 'description';
            document.head.appendChild(metaDescription);
        }
        
        metaDescription.content = data.description || 
            `Tonton ${data.title || 'film ini'} di StreamFlix. ${data.genre ? `Genre: ${data.genre}.` : ''} Rating: ${data.rating || 'N/A'}.`;
        
        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.content = data.title || 'StreamFlix';
        
        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription) ogDescription.content = metaDescription.content;
        
        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && data.poster) ogImage.content = data.poster;
        
        // Update Twitter cards
        const twitterTitle = document.querySelector('meta[name="twitter:title"]');
        if (twitterTitle) twitterTitle.content = data.title || 'StreamFlix';
    }

    // Inisialisasi aplikasi
    init();
});

// Tambahkan style untuk notifikasi
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background-color: var(--primary-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-lg);
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s ease, opacity 0.3s ease;
        z-index: 9999;
        max-width: 300px;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
`;
document.head.appendChild(notificationStyle);