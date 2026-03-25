// 从API获取美食数据
let foods = [];

// 显示加载状态
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading">加载中...</div>';
    }
}

// 显示错误信息
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p class="error">${message}</p>`;
    }
}

// 显示空数据提示
function showEmpty(elementId, message = '暂无数据') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<p class="empty">${message}</p>`;
    }
}

// 从API获取美食数据
function fetchFoods(categoryId = null, searchQuery = null, tagId = null) {
    const apiBaseUrl = getApiBaseUrl();
    let url = `${apiBaseUrl}/food/api/foods/`;
    const params = [];
    
    if (categoryId) {
        params.push(`category_id=${categoryId}`);
    }
    
    if (tagId) {
        params.push(`tag_id=${tagId}`);
    }
    
    if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
    }
    
    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }
    
    // 显示加载状态
    showLoading('foodList');
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                foods = data.data;
                if (foods.length === 0) {
                    showEmpty('foodList', '暂无美食数据');
                } else {
                    renderFoodList(foods);
                }
            } else {
                showError('foodList', `获取美食数据失败: ${data.message}`);
                console.error('获取美食数据失败:', data.message);
            }
        })
        .catch(error => {
            console.error('获取美食数据失败:', error);
            showError('foodList', `获取美食数据失败: ${error.message}`);
        });
}

// 获取分类数据
function fetchCategories() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/categories/`;
    
    // 显示加载状态
    const categoryFilter = document.querySelector('.category-filter');
    const categoryGrid = document.getElementById('categoryGrid');
    if (categoryFilter) {
        categoryFilter.innerHTML = '<div class="loading">加载中...</div>';
    }
    if (categoryGrid) {
        categoryGrid.innerHTML = '<div class="loading">加载中...</div>';
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const categories = data.data;
                renderCategoryFilter(categories);
                if (categories.length === 0) {
                    showEmpty('categoryGrid', '暂无分类数据');
                } else {
                    renderCategoryGrid(categories);
                }
            } else {
                console.error('获取分类数据失败:', data.message);
                if (categoryFilter) {
                    categoryFilter.innerHTML = '<button class="active" data-category="all">全部</button>';
                    setupCategoryFilter();
                }
                showError('categoryGrid', `获取分类数据失败: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('获取分类数据失败:', error);
            if (categoryFilter) {
                categoryFilter.innerHTML = '<button class="active" data-category="all">全部</button>';
                setupCategoryFilter();
            }
            showError('categoryGrid', `获取分类数据失败: ${error.message}`);
        });
}

// 渲染分类筛选器
function renderCategoryFilter(categories) {
    const categoryFilter = document.querySelector('.category-filter');
    if (!categoryFilter) return;
    
    // 保留"全部"按钮
    let html = '<button class="active" data-category="all">全部</button>';
    
    categories.forEach(category => {
        html += `<button data-category="${category.id}">${category.name}</button>`;
    });
    
    categoryFilter.innerHTML = html;
    // 重新设置分类筛选事件
    setupCategoryFilter();
}

// 渲染美食列表
function renderFoodList(foodList) {
    const foodListElement = document.getElementById('foodList');
    if (!foodListElement) return;
    
    foodListElement.innerHTML = '';
    
    foodList.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        
        // 生成标签HTML
        let tagsHtml = '';
        if (food.tags && food.tags.length > 0) {
            food.tags.forEach(tag => {
                tagsHtml += `<span class="tag">${tag.name}</span>`;
            });
        }
        
        foodItem.innerHTML = `
            ${food.image || food.image_url ? `
            <div class="food-image-container">
                <img src="${food.image || food.image_url}" alt="${food.name}" class="food-image">
            </div>` : ''}
            <h3>${food.name}</h3>
            <div class="food-tags">
                <span class="tag location-tag">位置: ${food.categoryName}</span>
                <span class="tag price-tag">价格: ¥${food.price.toFixed(2)}</span>
                <span class="tag rating-tag">评分: ${food.average_rating}★</span>
                ${food.distance ? `<span class="tag distance-tag">距离: ${food.distance}km</span>` : ''}
                ${tagsHtml}
            </div>
            <p class="food-review-count">${food.review_count || 0}条评价</p>
            ${food.address ? `<p class="food-address">地址: ${food.address}</p>` : ''}
            <button class="btn" onclick="viewFoodDetail(${food.id})">查看详情</button>
        `;
        foodListElement.appendChild(foodItem);
    });
}

// 搜索美食
function searchFoods() {
    const searchQuery = document.getElementById('foodSearch').value.trim();
    
    // 获取当前选中的分类
    const categoryButtons = document.querySelectorAll('.category-filter button');
    let selectedCategory = 'all';
    categoryButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedCategory = btn.dataset.category;
        }
    });
    const categoryId = selectedCategory === 'all' ? null : selectedCategory;
    
    // 获取当前选中的标签
    const tagButtons = document.querySelectorAll('.tag-filter button');
    let selectedTag = 'all';
    tagButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedTag = btn.dataset.tag;
        }
    });
    const tagId = selectedTag === 'all' ? null : selectedTag;
    
    fetchFoods(categoryId, searchQuery, tagId);
}

// 设置分类筛选
function setupCategoryFilter() {
    const categoryButtons = document.querySelectorAll('.category-filter button');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            this.classList.add('active');
            
            const category = this.dataset.category;
            const searchQuery = document.getElementById('foodSearch')?.value.trim() || null;
            
            // 获取当前选中的标签
            const tagButtons = document.querySelectorAll('.tag-filter button');
            let selectedTag = 'all';
            tagButtons.forEach(btn => {
                if (btn.classList.contains('active')) {
                    selectedTag = btn.dataset.tag;
                }
            });
            const tagId = selectedTag === 'all' ? null : selectedTag;
            
            if (category === 'all') {
                fetchFoods(null, searchQuery, tagId);
            } else {
                fetchFoods(category, searchQuery, tagId);
            }
        });
    });
    
    // 添加搜索框键盘事件监听
    const searchInput = document.getElementById('foodSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFoods();
            }
        });
    }
}

// 查看美食详情
function viewFoodDetail(foodId) {
    window.location.href = `food_detail.html?id=${foodId}`;
}

// 获取推荐美食数据
function fetchRecommendFoods() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/recommendations/`;
    
    // 显示加载状态
    showLoading('recommendList');
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const recommendFoods = data.data;
                // 只显示前6个推荐美食
                const topFoods = recommendFoods.slice(0, 6);
                
                if (topFoods.length === 0) {
                    showEmpty('recommendList', '暂无推荐美食');
                } else {
                    renderRecommendFoodList(topFoods);
                }
            } else {
                showError('recommendList', `获取推荐美食失败: ${data.message}`);
                console.error('获取推荐美食失败:', data.message);
            }
        })
        .catch(error => {
            console.error('获取推荐美食失败:', error);
            showError('recommendList', `获取推荐美食失败: ${error.message}`);
        });
}

// 渲染推荐美食列表
function renderRecommendFoodList(foodList) {
    const recommendListElement = document.getElementById('recommendList');
    if (!recommendListElement) return;
    
    recommendListElement.innerHTML = '';
    
    foodList.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        
        // 生成标签HTML
        let tagsHtml = '';
        if (food.tags && food.tags.length > 0) {
            food.tags.forEach(tag => {
                tagsHtml += `<span class="tag">${tag.name}</span>`;
            });
        }
        
        foodItem.innerHTML = `
            ${food.image || food.image_url ? `
            <div class="food-image-container">
                <img src="${food.image || food.image_url}" alt="${food.name}" class="food-image">
            </div>` : ''}
            <h3>${food.name}</h3>
            <div class="food-tags">
                <span class="tag location-tag">位置: ${food.categoryName}</span>
                <span class="tag price-tag">价格: ¥${food.price.toFixed(2)}</span>
                <span class="tag rating-tag">评分: ${food.average_rating}★</span>
                ${food.distance ? `<span class="tag distance-tag">距离: ${food.distance}km</span>` : ''}
                ${tagsHtml}
            </div>
            <p class="food-review-count">${food.review_count || 0}条评价</p>
            ${food.address ? `<p class="food-address">地址: ${food.address}</p>` : ''}
            <button class="btn" onclick="viewFoodDetail(${food.id})">查看详情</button>
        `;
        recommendListElement.appendChild(foodItem);
    });
}

// 渲染分类卡片
function renderCategoryGrid(categories) {
    const categoryGridElement = document.getElementById('categoryGrid');
    if (!categoryGridElement) return;
    
    categoryGridElement.innerHTML = '';
    
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        
        categoryCard.innerHTML = `
            ${category.image ? `
            <div class="category-image-container">
                <img src="${category.image}" alt="${category.name}" class="category-image">
            </div>` : ''}
            <h3>${category.name}</h3>
            <p>${category.description}</p>
            <p class="food-count">${category.food_count || 0} 个美食</p>
            <div class="category-buttons">
                <button class="btn" onclick="filterByCategory(${category.id})">查看美食</button>
                <button class="btn btn-secondary" onclick="gotoRecommendPage(${category.id})">推荐筛选</button>
            </div>
        `;
        categoryGridElement.appendChild(categoryCard);
    });
}

// 根据分类筛选美食
function filterByCategory(categoryId) {
    // 跳转到全部美食页面，并带上分类参数
    window.location.href = `all_foods.html?category=${categoryId}`;
}

// 跳转到推荐页面并应用分类筛选
function gotoRecommendPage(categoryId) {
    const prefix = getRelativePathPrefix();
    window.location.href = `${prefix}recommend.html?category=${categoryId}`;
}

// 获取热门评价数据
function fetchPopularReviews() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/popular-reviews/`;
    
    // 显示加载状态
    showLoading('popularReviews');
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                if (data.data.length === 0) {
                    showEmpty('popularReviews', '暂无评价数据');
                } else {
                    renderPopularReviews(data.data);
                }
            } else {
                showError('popularReviews', `获取热门评价失败: ${data.message}`);
                console.error('获取热门评价失败:', data.message);
            }
        })
        .catch(error => {
            console.error('获取热门评价失败:', error);
            showError('popularReviews', `获取热门评价失败: ${error.message}`);
        });
}

// 渲染热门评价列表
function renderPopularReviews(reviews) {
    const reviewsListElement = document.getElementById('popularReviews');
    if (!reviewsListElement) return;
    
    reviewsListElement.innerHTML = '';
    
    reviews.forEach(review => {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        reviewItem.innerHTML = `
            <div class="review-header">
                <div class="food-info">
                    ${review.food_image ? `<img src="${review.food_image}" alt="${review.food_name}" class="food-thumbnail">` : ''}
                    <div class="food-details">
                        <h4>${review.food_name}</h4>
                        <div class="food-meta">
                            <span class="food-category">${review.food_category}</span>
                            <span class="food-price">¥${review.food_price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div class="rating-container">
                    <span class="rating-label">评分：</span>
                    <span class="rating">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </span>
                </div>
            </div>
            <div class="review-content">
                <p>${review.comment}</p>
            </div>
            <div class="review-meta">
                <div class="user-info">
                    <img src="${review.avatar || '../images/avatar_default.png'}" alt="${review.username}" class="user-avatar">
                    <span class="username">${review.username}</span>
                </div>
                <span class="date">${review.created_at}</span>
            </div>
        `;
        reviewsListElement.appendChild(reviewItem);
    });
}

// 获取标签数据
function fetchTags() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/tags/`;
    console.log('获取标签数据的URL:', url);
    
    fetch(url)
        .then(response => {
            console.log('获取标签数据的响应状态:', response.status);
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            console.log('获取标签数据的响应:', data);
            if (data.status === 'success') {
                const tags = data.data;
                console.log('获取到的标签:', tags);
                renderTagFilter(tags);
            } else {
                console.error('获取标签数据失败:', data.message);
            }
        })
        .catch(error => {
            console.error('获取标签数据失败:', error);
        });
}

// 渲染标签筛选器
function renderTagFilter(tags) {
    console.log('渲染标签筛选器，标签数据:', tags);
    
    let tagFilter = document.querySelector('.tag-filter');
    if (!tagFilter) {
        // 如果标签筛选器不存在，创建它
        const categoryFilter = document.querySelector('.category-filter');
        if (categoryFilter) {
            const tagFilterDiv = document.createElement('div');
            tagFilterDiv.className = 'tag-filter';
            tagFilterDiv.innerHTML = '<h4>标签筛选</h4>';
            categoryFilter.parentNode.insertBefore(tagFilterDiv, categoryFilter.nextSibling);
            tagFilter = tagFilterDiv;
            console.log('创建了标签筛选器');
        } else {
            console.error('找不到分类筛选器，无法创建标签筛选器');
            return;
        }
    }
    
    // 保留"全部"按钮
    let html = '<button class="active" data-tag="all">全部</button>';
    
    tags.forEach(tag => {
        html += `<button data-tag="${tag.id}">${tag.name} (${tag.food_count})</button>`;
    });
    
    tagFilter.innerHTML = '<h4>标签筛选</h4>' + html;
    console.log('标签筛选器HTML:', tagFilter.innerHTML);
    
    // 设置标签筛选事件
    setupTagFilter();
}

// 设置标签筛选
function setupTagFilter() {
    const tagButtons = document.querySelectorAll('.tag-filter button');
    console.log('设置标签筛选事件，找到的按钮数量:', tagButtons.length);
    
    tagButtons.forEach(button => {
        console.log('为按钮添加点击事件:', button.textContent, 'data-tag:', button.dataset.tag);
        button.addEventListener('click', function() {
            console.log('点击了标签按钮:', this.textContent, 'data-tag:', this.dataset.tag);
            
            // 移除所有按钮的active类
            tagButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            this.classList.add('active');
            
            const tag = this.dataset.tag;
            const category = document.querySelector('.category-filter button.active').dataset.category;
            const categoryId = category === 'all' ? null : category;
            const tagId = tag === 'all' ? null : tag;
            
            console.log('发送筛选请求，categoryId:', categoryId, 'tagId:', tagId);
            fetchFoods(categoryId, null, tagId);
        });
    });
}

// 页面初始化
function initPage() {
    fetchCategories();
    fetchTags();
    fetchFoods();
    fetchRecommendFoods();
    fetchPopularReviews();
}

// 初始化图片轮播
function initImageCarousel() {
    const carouselTrack = document.querySelector('.carousel-track');
    const container = document.querySelector('.carousel-container');
    
    if (!carouselTrack || !container) return;
    
    // 从API获取轮播图片数据
    fetch(`${getApiBaseUrl()}/food/api/carousel/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' && data.data.length > 0) {
                // 清空现有内容
                carouselTrack.innerHTML = '';
                
                // 动态生成轮播项
                data.data.forEach(carousel => {
                    const item = document.createElement('div');
                    item.className = 'carousel-item';
                    item.innerHTML = `
                        <a href="${carousel.link || '#'}" target="_blank">
                            <img src="${carousel.image}" alt="轮播图片">
                        </a>
                    `;
                    carouselTrack.appendChild(item);
                });
                
                // 初始化轮播功能
                initCarouselFunctionality();
            } else {
                // 如果没有轮播数据，使用默认图片
                const defaultImages = [
                    '../images/汉堡.jpg',
                    '../media/food_images/汉堡.jpg',
                    '../media/food_images/3421645_20251211180541044223_1.jpg',
                    '../media/food_images/1376263334534709258.jpeg',
                    '../media/food_images/生活照.jpg'
                ];
                
                // 清空现有内容
                carouselTrack.innerHTML = '';
                
                // 添加默认图片
                defaultImages.forEach((imageUrl, index) => {
                    const item = document.createElement('div');
                    item.className = 'carousel-item';
                    item.innerHTML = `
                        <img src="${imageUrl}" alt="美食图片${index + 1}">
                    `;
                    carouselTrack.appendChild(item);
                });
                
                // 初始化轮播功能
                initCarouselFunctionality();
            }
        })
        .catch(error => {
            console.error('获取轮播图片失败:', error);
            // 使用默认图片
            const defaultImages = [
                '../images/汉堡.jpg',
                '../media/food_images/汉堡.jpg',
                '../media/food_images/3421645_20251211180541044223_1.jpg',
                '../media/food_images/1376263334534709258.jpeg',
                '../media/food_images/生活照.jpg'
            ];
            
            // 清空现有内容
            carouselTrack.innerHTML = '';
            
            // 添加默认图片
            defaultImages.forEach((imageUrl, index) => {
                const item = document.createElement('div');
                item.className = 'carousel-item';
                item.innerHTML = `
                    <img src="${imageUrl}" alt="美食图片${index + 1}">
                `;
                carouselTrack.appendChild(item);
            });
            
            // 初始化轮播功能
            initCarouselFunctionality();
        });
    
    // 轮播功能初始化
    function initCarouselFunctionality() {
        const carouselItems = document.querySelectorAll('.carousel-item');
        if (!carouselItems.length) return;
        
        let currentIndex = 0;
        const itemHeight = container.offsetHeight;
        const totalItems = carouselItems.length;
        let autoplayInterval;
        
        // 复制所有项目以创建无缝循环效果
        carouselItems.forEach(item => {
            const clone = item.cloneNode(true);
            carouselTrack.appendChild(clone);
        });
        
        // 自动滚动函数
        function autoplay() {
            currentIndex++;
            if (currentIndex >= totalItems) {
                // 快速跳转到开始位置
                carouselTrack.style.transition = 'none';
                carouselTrack.style.transform = `translateY(0)`;
                currentIndex = 1;
                
                // 重新启用过渡效果
                setTimeout(() => {
                    carouselTrack.style.transition = 'transform 0.5s ease';
                    updateCarousel();
                }, 50);
            } else {
                updateCarousel();
            }
        }
        
        // 更新轮播位置
        function updateCarousel() {
            carouselTrack.style.transform = `translateY(-${currentIndex * itemHeight}px)`;
        }
        
        // 开始自动播放
        function startAutoplay() {
            autoplayInterval = setInterval(autoplay, 3000);
        }
        
        // 停止自动播放
        function stopAutoplay() {
            clearInterval(autoplayInterval);
        }
        
        // 添加鼠标悬停事件
        container.addEventListener('mouseenter', stopAutoplay);
        container.addEventListener('mouseleave', startAutoplay);
        
        // 开始自动播放
        startAutoplay();
    }
}

// 智能搜索功能
function initSearch() {
    const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('searchInput');
    
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                performSmartSearch(query);
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    performSmartSearch(query);
                }
            }
        });
    }
}

// 执行智能搜索
function performSmartSearch(query) {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/smart-search/?q=${encodeURIComponent(query)}`;
    
    // 跳转到搜索结果页面或显示搜索结果
    // 这里我们跳转到all_foods.html页面，并带上搜索参数
    window.location.href = `all_foods.html?search=${encodeURIComponent(query)}`;
}

// 页面初始化
function initPage() {
    fetchCategories();
    fetchTags();
    fetchFoods();
    fetchRecommendFoods();
    fetchPopularReviews();
    
    // 初始化搜索功能
    initSearch();
    
    // 初始化图片轮播
    setTimeout(initImageCarousel, 1000);
}

// 暴露初始化函数给全局，以便在HTML中调用
window.initPage = initPage;