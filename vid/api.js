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

{
  "success": true,
  "category": "trending",
  "items": [
    {
      "id": "7190341461727398056",
      "title": "Algojo",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvYzI4NGZiOTNiNGU3MzU0MzkyZTI4ZmQwNjhjZTMzZTIuanBn",
      "rating": "6.1",
      "year": "2026",
      "type": "tv",
      "detailPath": "algojo-Ewi77E5Q9z8",
      "genre": "Tindakan,Drama",
      "description": "Zar, an Anjelo who escorts sex workers, discovers his father was attacked by a mysterious assailant. Searching for answers, he infiltrates the Algojo assassin syndicate and is drawn into a world of danger and deception."
    },
    {
      "id": "8992509766509417240",
      "title": "Bridgerton",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMzAvMTM0YWI1NzkwZmQ3YzQ5MTBlMjZjOTA4N2ZlYmJmNjMuanBn",
      "rating": "7.4",
      "year": "2020",
      "type": "tv",
      "detailPath": "bridgerton-E4I97hZMhIa",
      "genre": "Drama,Percintaan",
      "description": "Kekayaan, nafsu, dan pengkhianatan bertentangan dengan latar belakang Negara-era Inggris, terlihat melalui mata keluarga Bridgerton yang kuat."
    },
    {
      "id": "7203867877110698320",
      "title": "Pernikahan Dini Gen Z",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvMmY5OWY3NzM2MDQwZDYyM2Y1NWQxNjdiOWE2N2UwM2EuanBn",
      "rating": "2.9",
      "year": "2025",
      "type": "tv",
      "detailPath": "pernikahan-dini-gen-z-Ia0T3M3N9A8",
      "genre": "Drama,Percintaan",
      "description": "Dini, a high-achieving student, is romantically involved with Rangga, a popular senior and aspiring national basketball player."
    },
    {
      "id": "4275368203272048936",
      "title": "Spring Fever",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjgvZDRjNzI0MTdjZTQzOThhZTQwODU5MmE3OWE0Yjg0YmEuanBn",
      "rating": "7.6",
      "year": "2026",
      "type": "tv",
      "detailPath": "spring-fever-EkaYALmeP55",
      "genre": "Komedi,Drama,Percintaan",
      "description": "Follows Yun Bom, who, after enduring emotional turmoil in Seoul, moves to the small town of Sinsu to begin anew as an exchange teacher. Initially detached and cold toward everything, she gradually opens her heart after meeting Seon Jae Gyu"
    },
    {
      "id": "6869974044322974224",
      "title": "Affinity",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvMDFmZjk0NGI4ODk4NGRhOGI4MTBjYzBlMTY4MzUyMGYuanBlZw==",
      "rating": "6.1",
      "year": "2026",
      "type": "tv",
      "detailPath": "affinity-ah8HEBlyub8",
      "genre": "Sci-Fi & Fantasy,Drama",
      "description": "In 2051, bioengineering student Wu Nongyu and sociopath Xie Xinxu are drawn together by a mysterious genetic attraction. As their relationship grows, they must confront their pasts and navigate love, trust, and redemption while racing to find a way to break the powerful bond that threatens to control their lives."
    },
    {
      "id": "4408660795316406000",
      "title": "Can This Love Be Translated?",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjgvODg0MDVmNmJkNzFjZmU3NjM0NTkzMmEzOTM1NDNiYTMuanBn",
      "rating": "8.1",
      "year": "2026",
      "type": "tv",
      "detailPath": "can-this-love-be-translated-qbRn7BdIFf5",
      "genre": "Komedi,Drama,Percintaan",
      "description": "A man with a job interpreting other languages meets a woman who speaks love in a completely opposite way to him, but they understand each other."
    },
    {
      "id": "5217887006021370904",
      "title": "The Wrecking Crew",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjEvYzFmOGRkZmM5NTc0NzhlNjA4NzA0Y2Y4N2RkNGU4YmIuanBn",
      "rating": "6.2",
      "year": "2026",
      "type": "movie",
      "detailPath": "the-wrecking-crew-q7LAVPCYrd6",
      "genre": "Tindakan,Komedi,Kejahatan",
      "description": "Estranged half-brothers Jonny and James reunite after their father's mysterious death. As they search for the truth, buried secrets reveal a conspiracy threatening to tear their family apart."
    },
    {
      "id": "1066136032309136976",
      "title": "I Idoli",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvMmYxNDY0ZDFkZDI4MWZmNjJmNTNlODVkZTliOTViNDUuanBn",
      "rating": "7.5",
      "year": "2025",
      "type": "tv",
      "detailPath": "idol-i-uz4fyIGUKg1",
      "genre": "Komedi,Drama,Misteri",
      "description": "A virtuous star lawyer and devoted fan, defends her favorite idol after he is accused of murder."
    },
    {
      "id": "7502382447225994944",
      "title": "Greenland 2: Migration",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvYjgxZjg3ZDE2YTk4OTM0N2U1M2ZiYzA2YmE1YWQ0YTAuanBn",
      "rating": "5.7",
      "year": "2026",
      "type": "movie",
      "detailPath": "greenland-2-migration-KV3XnbsZcW8",
      "genre": "Tindakan,Petualangan,Fiksi Ilmiah",
      "description": "The surviving Garrity family must leave the safety of the Greenland bunker and embark on a perilous journey across the decimated frozen wasteland of Europe to find a new home."
    },
    {
      "id": "2940730861303595960",
      "title": "Single's Inferno",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvMDZiMmU3YmFlNTVmOWMxNDg3MjNkMTAxNjBiZjZjOTEuanBn",
      "rating": "7.3",
      "year": "2021",
      "type": "tv",
      "detailPath": "singles-inferno-KJLF9VRzev3",
      "genre": "Acara realita",
      "description": "Sembilan orang yang tinggal bersama di sebuah pulau dan mencoba menemukan cinta dalam hidup mereka."
    },
    {
      "id": "1046733397290373416",
      "title": "Love Between Lines",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvOWZlZGQ2ZDQ5MTkyYzQwZDg5NTUwYjQzYTBlODUxZWQuanBn",
      "rating": "8.4",
      "year": "2026",
      "type": "tv",
      "detailPath": "love-between-lines-ODlMNr63kf1",
      "genre": "Komedi,Drama,Percintaan",
      "description": "Two strangers meet at Republic of China-themed murder mystery game, playing fictional roles. As they grow curious about each other's real identities, fate brings them together outside game, weaving parallel stories of fantasy and reality."
    },
    {
      "id": "4672203330083602624",
      "title": "Sugar Baby",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjgvNGJhNDAwNTMwMzdhYWEzMGNkZTM1M2E1MzEyYjc3MDQuanBn",
      "rating": "6.8",
      "year": "2025",
      "type": "tv",
      "detailPath": "sugar-baby-2FsmdIVJ8z5",
      "genre": "Komedi,Drama",
      "description": "Darma, a loyal driver and personal aide, finds his name entangled in his boss's secret financial scheme. Posing as a Sugar Daddy to get close to Susan, he's drawn into a dangerous web of deception that could destroy everything he's built."
    },
    {
      "id": "8129642223186132944",
      "title": "Pertaruhan: The Series",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvZDY1NGJkZWMxYTcyNDU2Zjg1NzQ5NjcyNTZmZTg4ODguanBn",
      "rating": "8.1",
      "year": "2022",
      "type": "tv",
      "detailPath": "pertaruhan-the-series-Qw5ljiyQxG9",
      "genre": "Tindakan,Kejahatan,Drama",
      "description": "In this story, Elzan fights for the integrity of his family by risking everything to defend his family home against a bank's attempts to confiscate their property and ruin their lives."
    },
    {
      "id": "1140015036077868784",
      "title": "No Tail to Tell",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvMzdmYmRkOWE5YzkyZTNiOTMxMTJlOTMwOGE4MzU2M2QuanBn",
      "rating": "7.5",
      "year": "2026",
      "type": "tv",
      "detailPath": "no-tail-to-tell-MepdC0qhdm1",
      "genre": "Komedi,Drama,Fantasi",
      "description": "Eun Ho, a gumiho with nine tails, embraces her eternal youth and avoids human experiences. Kang Si Yeol, a successful soccer player, lives a perfect life until Eun Ho enters, altering the course of his life unexpectedly."
    },
    {
      "id": "2867356962868579120",
      "title": "One Piece",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjcvOTRjMGM5NjYwNDU5NDY1YzA2M2E3MDhkOTk3NjQ4NTYuanBn",
      "rating": "9.0",
      "year": "1999",
      "type": "tv",
      "detailPath": "one-piece-CTqWaizwOp3",
      "genre": "Anime,Tindakan,Petualangan",
      "description": "Gold Roger dikenal sebagai Raja Bajak Laut, makhluk terkuat dan paling terkenal telah mengarungi Grand Line"
    },
    {
      "id": "134079758618484744",
      "title": "Jujutsu Kaisen",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvYmM5NDI3NjAzNjEzYzhjOWMyMzlhODViMmJiYzU1MmIuanBn",
      "rating": "8.5",
      "year": "2020",
      "type": "tv",
      "detailPath": "jujutsu-kaisen-gCBS4ln5U9",
      "genre": "Anime,Tindakan,Petualangan",
      "description": "Seorang anak laki-laki menelan jimat terkutuk - jari iblis - dan menjadi mengutuk dirinya sendiri. Dia memasuki sekolah dukun untuk dapat menemukan bagian tubuh iblis yang lain dan dengan demikian mengusir dirinya sendiri."
    },
    {
      "id": "8879793253067931848",
      "title": "The Judge Returns",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMzAvMGUyN2VmN2Q1MzkyM2FhY2U2Nzg3YTdhM2Y5MzhhMTQuanBn",
      "rating": "8.3",
      "year": "2026",
      "type": "tv",
      "detailPath": "the-judge-returns-8C3WxQVxXza",
      "genre": "Drama,Fantasi",
      "description": "Judge Lee, who believed justice could be achieved in the courtroom, defied his superiors' orders and sentenced a conglomerate chairman to life in prison, only to be killed for it. But was it because of the secrets he overheard as a child?"
    },
    {
      "id": "838644997758012464",
      "title": "Positively Yours",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMTgvMWM5MWU1ZjkzYmU3YzVkOWM0YTVhNDQ4MzZlYzRmNjQuanBlZw==",
      "rating": "6.3",
      "year": "2026",
      "type": "tv",
      "detailPath": "positively-yours-QsHzUtb0XZ",
      "genre": "Komedi,Keluarga",
      "description": "A man and a woman who swore off marriage find their carefully controlled lives overturned after a one-night mistake forces them into an unexpected, reverse romance neither planned nor wanted."
    },
    {
      "id": "6642751429658696096",
      "title": "Mobeomtaeksi",
      "poster": "https://zeldvorik.ru/apiv3/image-proxy.php?url=aHR0cHM6Ly9wYmNkbncuYW9uZXJvb20uY29tL2ltYWdlLzIwMjYvMDEvMjYvN2JmNDFmYjQ3ZTg2NzZjNDE2YWQxMjE3YWY5ZDRiMGMuanBn",
      "rating": "8.1",
      "year": "2021",
      "type": "tv",
      "detailPath": "taxi-driver-STi4l34SHU7",
      "genre": "Tindakan,Kejahatan,Drama",
      "description": "Kisah seorang sopir taksi deluxe yang membalas dendam atas nama penumpangnya. Ini didasarkan pada webtoon Deluxe Taxi oleh Carlos dan Lee Jae-jin"
    }
  ],
  "total": 19,
  "page": 1,
  "hasMore": false
}
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
