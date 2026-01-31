/**
 * API Configuration
 * Base URL: https://zeldvorik.ru/apiv3/api.php
 */

const API_BASE_URL = 'https://zeldvorik.ru/apiv3/api.php';

// Cache untuk menyimpan hasil API
const apiCache = {
    trending: {},
    'indonesian-movies': {},
    'indonesian-drama': {},
    kdrama: {},
    anime: {},
    'short-tv': {},
    search: {},
    detail: {}
};

/**
 * Fetch data dari API dengan caching
 * @param {string} endpoint - Endpoint API
 * @param {Object} params - Parameter query string
 * @returns {Promise<Object>} - Data response
 */
async function fetchFromAPI(endpoint, params = {}) {
    // Membuat cache key berdasarkan endpoint dan params
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Cek cache terlebih dahulu
    if (apiCache[endpoint] && apiCache[endpoint][cacheKey]) {
        console.log(`Cache hit: ${cacheKey}`);
        return apiCache[endpoint][cacheKey];
    }
    
    // Membangun URL
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}?action=${endpoint}&${queryString}`;
    
    try {
        console.log(`Fetching: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Simpan ke cache
        if (!apiCache[endpoint]) {
            apiCache[endpoint] = {};
        }
        apiCache[endpoint][cacheKey] = data;
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        
        // Return data fallback jika API gagal
        return getFallbackData(endpoint, params);
    }
}

/**
 * Mendapatkan data fallback jika API gagal
 */
function getFallbackData(endpoint, params) {
    const fallbackData = {
        success: true,
        items: [],
        page: params.page || 1,
        hasMore: false
    };
    
    // Data fallback berdasarkan endpoint
    switch (endpoint) {
        case 'trending':
            fallbackData.items = Array(6).fill(null).map((_, i) => ({
                id: `fallback-trending-${i + 1}`,
                title: `Film Trending ${i + 1}`,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UG9zdGVyIEltYWdlPC90ZXh0Pjwvc3ZnPg==',
                rating: 7.5,
                year: '2023',
                type: i % 2 === 0 ? 'movie' : 'tv',
                genre: i % 2 === 0 ? 'Action, Adventure' : 'Drama, Romance',
                detailPath: `/fallback/detail/${i + 1}`
            }));
            break;
            
        case 'indonesian-movies':
            fallbackData.items = Array(6).fill(null).map((_, i) => ({
                id: `fallback-indo-movie-${i + 1}`,
                title: `Film Indonesia ${i + 1}`,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RmlsbSBJbmRvbmVzaWE8L3RleHQ+PC9zdmc+',
                rating: 7.0 + (i * 0.5),
                year: '2022',
                type: 'movie',
                genre: 'Drama, Family',
                detailPath: `/fallback/indonesian-movie/${i + 1}`
            }));
            break;
            
        case 'kdrama':
            fallbackData.items = Array(6).fill(null).map((_, i) => ({
                id: `fallback-kdrama-${i + 1}`,
                title: `K-Drama ${i + 1}`,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+S2RyYW1hPC90ZXh0Pjwvc3ZnPg==',
                rating: 8.0 + (i * 0.3),
                year: '2023',
                type: 'tv',
                genre: 'Drama, Romance',
                detailPath: `/fallback/kdrama/${i + 1}`
            }));
            break;
            
        default:
            fallbackData.items = Array(6).fill(null).map((_, i) => ({
                id: `fallback-${endpoint}-${i + 1}`,
                title: `${endpoint.charAt(0).toUpperCase() + endpoint.slice(1)} ${i + 1}`,
                poster: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWkdZGxlIiBkeT0iLjNlbSI+UG9zdGVyPC90ZXh0Pjwvc3ZnPg==',
                rating: 7.0,
                year: '2023',
                type: 'movie',
                genre: 'Drama',
                detailPath: `/fallback/${endpoint}/${i + 1}`
            }));
    }
    
    return fallbackData;
}

/**
 * Mendapatkan data trending
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getTrending(page = 1) {
    return await fetchFromAPI('trending', { page });
}

/**
 * Mendapatkan data film Indonesia
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getIndonesianMovies(page = 1) {
    return await fetchFromAPI('indonesian-movies', { page });
}

/**
 * Mendapatkan data drama Indonesia
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getIndonesianDrama(page = 1) {
    return await fetchFromAPI('indonesian-drama', { page });
}

/**
 * Mendapatkan data K-Drama
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getKdrama(page = 1) {
    return await fetchFromAPI('kdrama', { page });
}

/**
 * Mendapatkan data Anime
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getAnime(page = 1) {
    return await fetchFromAPI('anime', { page });
}

/**
 * Mendapatkan data Short TV
 * @param {number} page - Halaman
 * @returns {Promise<Object>}
 */
async function getShortTV(page = 1) {
    return await fetchFromAPI('short-tv', { page });
}

/**
 * Mencari konten
 * @param {string} query - Kata kunci pencarian
 * @returns {Promise<Object>}
 */
async function searchContent(query) {
    return await fetchFromAPI('search', { q: query });
}

/**
 * Mendapatkan detail konten
 * @param {string} detailPath - Path detail
 * @returns {Promise<Object>}
 */
async function getDetail(detailPath) {
    return await fetchFromAPI('detail', { detailPath });
}

// Export fungsi API
window.StreamFlixAPI = {
    getTrending,
    getIndonesianMovies,
    getIndonesianDrama,
    getKdrama,
    getAnime,
    getShortTV,
    searchContent,
    getDetail
};
