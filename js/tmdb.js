/**
 * TMDB (The Movie Database) 热门推荐功能
 * 替换原有的豆瓣推荐功能
 */

// TMDB 标签列表
let movieGenres = [
    { id: 'trending', name: '今日趋势' },
    { id: 'popular', name: '热门精选' },
    { id: 'top_rated', name: '高分经典' },
    { id: 28, name: '动作' },
    { id: 35, name: '喜剧' },
    { id: 27, name: '恐怖' },
    { id: 10749, name: '爱情' },
    { id: 878, name: '科幻' },
    { id: 53, name: '悬疑' }
];

let tvGenres = [
    { id: 'trending', name: '今日趋势' },
    { id: 'popular', name: '热门精选' },
    { id: 'top_rated', name: '口碑好剧' },
    { id: 10759, name: '动作冒险' },
    { id: 35, name: '喜剧' },
    { id: 18, name: '剧情' },
    { id: 10765, name: '科幻奇幻' },
    { id: 9648, name: '悬疑' }
];

let tmdbCurrentType = 'movie'; // 'movie' or 'tv'
let tmdbCurrentCategory = 'trending'; // Genre ID or 'trending', 'popular', 'top_rated'
let tmdbCurrentPage = 1;

/**
 * 初始化 TMDB 功能
 */
function initTMDB() {
    // 设置 TMDB 开关的初始状态 (复用原有 doubanEnabled 存储键以保持用户设置，或者迁移到新键)
    const tmdbToggle = document.getElementById('tmdbToggle') || document.getElementById('doubanToggle');
    if (tmdbToggle) {
        // 为了迁移，先检查新键，再检查旧键
        let isEnabled = localStorage.getItem('tmdbEnabled');
        if (isEnabled === null) {
            isEnabled = localStorage.getItem('doubanEnabled') === 'true';
            localStorage.setItem('tmdbEnabled', isEnabled);
        } else {
            isEnabled = isEnabled === 'true';
        }

        tmdbToggle.checked = isEnabled;

        // 设置开关外观
        const toggleBg = tmdbToggle.nextElementSibling;
        const toggleDot = toggleBg?.nextElementSibling;
        if (isEnabled && toggleBg && toggleDot) {
            toggleBg.classList.add('bg-pink-600');
            toggleDot.classList.add('translate-x-6');
        }

        // 添加事件监听
        tmdbToggle.addEventListener('change', function (e) {
            const isChecked = e.target.checked;
            localStorage.setItem('tmdbEnabled', isChecked);

            // 更新开关外观
            if (toggleBg && toggleDot) {
                if (isChecked) {
                    toggleBg.classList.add('bg-pink-600');
                    toggleDot.classList.add('translate-x-6');
                } else {
                    toggleBg.classList.remove('bg-pink-600');
                    toggleDot.classList.remove('translate-x-6');
                }
            }

            // 更新显示状态
            updateTMDBVisibility();
        });

        // 初始更新显示状态
        updateTMDBVisibility();
    }

    // 渲染电影/电视剧切换
    renderTMDBTypeSwitch();

    // 渲染标签
    renderTMDBTags();

    // 换一批按钮事件监听
    setupTMDBRefreshBtn();

    // 初始加载内容
    if (localStorage.getItem('tmdbEnabled') === 'true') {
        // 检查是否需要等待密码验证
        if (window.isPasswordProtected && window.isPasswordProtected() &&
            window.isPasswordVerified && !window.isPasswordVerified()) {
            console.log('TMDB: 等待密码验证成功事件...');
            document.addEventListener('passwordVerified', () => {
                console.log('TMDB: 密码验证成功，开始加载内容');
                loadTMDBContent();
            }, { once: true });
        } else {
            loadTMDBContent();
        }
    }
}

/**
 * 根据设置更新 TMDB 区域的显示状态
 */
function updateTMDBVisibility() {
    // 同样复用 doubanArea ID 以减少 index.html 修改，或者在 index.html 中更改 ID
    const tmdbArea = document.getElementById('tmdbArea') || document.getElementById('doubanArea');
    if (!tmdbArea) return;

    const isEnabled = localStorage.getItem('tmdbEnabled') === 'true';
    const isSearching = document.getElementById('resultsArea') &&
        !document.getElementById('resultsArea').classList.contains('hidden');

    // 只有在启用且没有搜索结果显示时才显示推荐区域
    if (isEnabled && !isSearching) {
        tmdbArea.classList.remove('hidden');
        const resultsContainer = document.getElementById('tmdb-results') || document.getElementById('douban-results');
        // 如果推荐结果为空，重新加载
        if (resultsContainer && resultsContainer.children.length === 0) {
            loadTMDBContent();
        }
    } else {
        tmdbArea.classList.add('hidden');
    }
}

/**
 * 渲染类型切换器 (电影/电视剧)
 */
function renderTMDBTypeSwitch() {
    const movieToggle = document.getElementById('tmdb-movie-toggle') || document.getElementById('douban-movie-toggle');
    const tvToggle = document.getElementById('tmdb-tv-toggle') || document.getElementById('douban-tv-toggle');

    if (!movieToggle || !tvToggle) return;

    movieToggle.onclick = function () {
        if (tmdbCurrentType !== 'movie') {
            typeSwitch('movie', movieToggle, tvToggle);
        }
    };

    tvToggle.onclick = function () {
        if (tmdbCurrentType !== 'tv') {
            typeSwitch('tv', tvToggle, movieToggle);
        }
    };
}

function typeSwitch(type, activeBtn, inactiveBtn) {
    activeBtn.classList.add('bg-pink-600', 'text-white');
    activeBtn.classList.remove('text-gray-300');

    inactiveBtn.classList.remove('bg-pink-600', 'text-white');
    inactiveBtn.classList.add('text-gray-300');

    tmdbCurrentType = type;
    tmdbCurrentCategory = 'trending';
    tmdbCurrentPage = 1;

    renderTMDBTags();
    loadTMDBContent();
}

/**
 * 渲染标签选择器
 */
function renderTMDBTags() {
    const tagContainer = document.getElementById('tmdb-tags') || document.getElementById('douban-tags');
    if (!tagContainer) return;

    const tags = tmdbCurrentType === 'movie' ? movieGenres : tvGenres;
    tagContainer.innerHTML = '';

    tags.forEach(tag => {
        const btn = document.createElement('button');
        let isSelected = tmdbCurrentCategory === tag.id;

        btn.className = `py-1.5 px-3.5 rounded text-sm font-medium transition-all duration-300 border ${isSelected
            ? 'bg-pink-600 text-white shadow-md border-white'
            : 'bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border-[#333] hover:border-white'
            }`;

        btn.textContent = tag.name;
        btn.onclick = function () {
            if (tmdbCurrentCategory !== tag.id) {
                tmdbCurrentCategory = tag.id;
                tmdbCurrentPage = 1;
                loadTMDBContent();
                renderTMDBTags();
            }
        };

        tagContainer.appendChild(btn);
    });
}

/**
 * 设置换一批按钮事件
 */
function setupTMDBRefreshBtn() {
    const btn = document.getElementById('tmdb-refresh') || document.getElementById('douban-refresh');
    if (!btn) return;

    btn.onclick = function () {
        tmdbCurrentPage++;
        if (tmdbCurrentPage > 5) tmdbCurrentPage = 1; // 简单限制页数
        loadTMDBContent();
    };
}

/**
 * 加载 TMDB 内容
 */
async function loadTMDBContent() {
    const container = document.getElementById('tmdb-results') || document.getElementById('douban-results');
    if (!container) return;

    // 显示加载中
    const loadingHtml = `
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
            <div class="flex items-center">
                <div class="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-pink-500 ml-3">加载中...</span>
            </div>
        </div>
    `;
    container.classList.add('relative', 'min-h-[200px]');
    container.innerHTML = loadingHtml;

    try {
        const config = window.TMDB_CONFIG || TMDB_CONFIG;
        if (!config || !config.API_KEY) {
            throw new Error("TMDB 配置缺失，请检查 js/config.js");
        }

        let endpoint = '';
        const params = {
            api_key: config.API_KEY,
            language: config.LANGUAGE || 'zh-CN',
            page: tmdbCurrentPage
        };

        if (tmdbCurrentCategory === 'trending') {
            endpoint = `/trending/${tmdbCurrentType}/day`;
        } else if (tmdbCurrentCategory === 'popular') {
            endpoint = `/${tmdbCurrentType}/popular`;
        } else if (tmdbCurrentCategory === 'top_rated') {
            endpoint = `/${tmdbCurrentType}/top_rated`;
        } else {
            // Genre filtering
            endpoint = `/discover/${tmdbCurrentType}`;
            params.with_genres = tmdbCurrentCategory;
            params.sort_by = 'popularity.desc';
        }

        const url = new URL(`${config.BASE_URL}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const data = await fetchTMDBData(url.toString());
        renderTMDBCards(data.results, container);
    } catch (error) {
        console.error("获取 TMDB 数据失败：", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-red-400">❌ 获取推荐数据失败，请检查网络或 API Key</div>
                <div class="text-gray-500 text-sm mt-2">${error.message}</div>
            </div>
        `;
    }
}

/**
 * 请求 TMDB API 数据
 */
async function fetchTMDBData(url) {
    // 尝试通过内置代理请求，以解决 CORS 或区域访问问题
    try {
        const proxiedUrl = await window.ProxyAuth?.addAuthToProxyUrl ?
            await window.ProxyAuth.addAuthToProxyUrl(PROXY_URL + encodeURIComponent(url)) :
            PROXY_URL + encodeURIComponent(url);

        const response = await fetch(proxiedUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (err) {
        console.warn("TMDB 代理请求失败，尝试直接请求：", err);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`TMDB 接口响应错误: ${response.status}`);
        return await response.json();
    }
}

/**
 * 渲染内容卡片
 */
function renderTMDBCards(items, container) {
    if (!items || items.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-pink-500">❌ 暂无数据</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const config = window.TMDB_CONFIG || TMDB_CONFIG;
        const title = item.title || item.name;
        const rate = item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
        const posterPath = item.poster_path ? `${config.IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

        const card = document.createElement('div');
        card.className = "bg-[#111] hover:bg-[#222] transition-all duration-300 rounded-lg overflow-hidden flex flex-col transform hover:scale-105 shadow-md hover:shadow-lg";

        const safeTitle = title.replace(/"/g, '&quot;');

        card.innerHTML = `
            <div class="relative w-full aspect-[2/3] overflow-hidden cursor-pointer" onclick="fillAndSearchWithTMDB('${safeTitle}')">
                <img src="${posterPath}" alt="${safeTitle}" 
                    class="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onerror="this.src='https://via.placeholder.com/500x750?text=Image+Error'"
                    loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-sm">
                    <span class="text-yellow-400">★</span> ${rate}
                </div>
            </div>
            <div class="p-2 text-center bg-[#111]">
                <button onclick="fillAndSearchWithTMDB('${safeTitle}')" 
                        class="text-xs font-medium text-white truncate w-full hover:text-pink-400 transition"
                        title="${safeTitle}">
                    ${safeTitle}
                </button>
            </div>
        `;
        fragment.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
}

/**
 * 填充并搜索
 */
function fillAndSearchWithTMDB(title) {
    if (!title) return;

    const input = document.getElementById('searchInput');
    if (input) {
        input.value = title;
        // 触发搜索
        if (typeof search === 'function') {
            search();

            // 更新标题和历史
            try {
                const encoded = encodeURIComponent(title);
                window.history.pushState({ search: title }, `搜索: ${title} - LibreTV`, `/s=${encoded}`);
                document.title = `搜索: ${title} - LibreTV`;
            } catch (e) { }

            // 移动端滚动到顶部
            if (window.innerWidth <= 768) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }
}

// 首页重置函数
function resetToHome() {
    if (typeof resetSearchArea === 'function') {
        resetSearchArea();
    }
    updateTMDBVisibility();
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', initTMDB);
