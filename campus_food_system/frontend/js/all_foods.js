// 从API获取美食数据
let foods = [];

// 分页相关变量
let currentPage = 1;
const pageSize = 6;
let totalPages = 1;
let totalCount = 0;

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
function fetchFoods(categoryId = null, searchQuery = null, tagId = null, page = 1) {
    const apiBaseUrl = getApiBaseUrl();
    let url;
    const params = [];
    
    // 如果有搜索查询，使用智能搜索API
    if (searchQuery) {
        url = `${apiBaseUrl}/food/api/smart-search/`;
        params.push(`q=${encodeURIComponent(searchQuery)}`);
    } else {
        url = `${apiBaseUrl}/food/api/foods/`;
        
        if (categoryId) {
            params.push(`category_id=${categoryId}`);
        }
        
        if (tagId) {
            params.push(`tag_id=${tagId}`);
        }
        
        // 添加分页参数
        params.push(`page=${page}`);
        params.push(`page_size=${pageSize}`);
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
                
                // 获取分页信息
                if (data.pagination) {
                    totalCount = data.pagination.total_count || foods.length;
                    totalPages = data.pagination.total_pages || 1;
                    currentPage = data.pagination.current_page || 1;
                } else {
                    totalCount = foods.length;
                    totalPages = 1;
                    currentPage = 1;
                }
                
                if (foods.length === 0) {
                    showEmpty('foodList', '暂无美食数据');
                    removePagination();
                } else {
                    renderFoodList(foods);
                    renderPagination();
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
    if (categoryFilter) {
        categoryFilter.innerHTML = '<div class="loading">加载中...</div>';
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
            } else {
                console.error('获取分类数据失败:', data.message);
                if (categoryFilter) {
                    categoryFilter.innerHTML = '<button class="active" data-category="all">全部</button>';
                    setupCategoryFilter();
                }
            }
        })
        .catch(error => {
            console.error('获取分类数据失败:', error);
            if (categoryFilter) {
                categoryFilter.innerHTML = '<button class="active" data-category="all">全部</button>';
                setupCategoryFilter();
            }
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

// 渲染分页控件
function renderPagination() {
    const foodListElement = document.getElementById('foodList');
    if (!foodListElement) return;
    
    // 移除旧的分页控件
    removePagination();
    
    // 如果只有一页，不显示分页控件
    if (totalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 30px;
        gap: 8px;
        padding: 20px;
        background: #fafafa;
        border-radius: 12px;
        border: 1px solid #e8e8e8;
    `;
    
    // 上一页按钮
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'pagination-btn';
        prevButton.textContent = '上一页';
        prevButton.style.cssText = `
            padding: 8px 16px;
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #666;
            font-size: 14px;
            font-weight: 500;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        `;
        prevButton.onmouseover = () => {
            prevButton.style.background = '#f0f0f0';
            prevButton.style.borderColor = '#0099ff';
            prevButton.style.color = '#0099ff';
        };
        prevButton.onmouseout = () => {
            prevButton.style.background = '#ffffff';
            prevButton.style.borderColor = '#e8e8e8';
            prevButton.style.color = '#666';
        };
        prevButton.onclick = () => {
            goToPage(currentPage - 1);
        };
        paginationDiv.appendChild(prevButton);
    }
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        pageButton.textContent = i;
        pageButton.style.cssText = `
            padding: 8px 14px;
            background: ${i === currentPage ? '#0099ff' : '#ffffff'};
            border: 1px solid ${i === currentPage ? '#0099ff' : '#e8e8e8'};
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: ${i === currentPage ? '#ffffff' : '#666'};
            font-size: 14px;
            font-weight: 500;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        `;
        pageButton.onmouseover = () => {
            if (i !== currentPage) {
                pageButton.style.background = '#f0f0f0';
                pageButton.style.borderColor = '#0099ff';
                pageButton.style.color = '#0099ff';
            }
        };
        pageButton.onmouseout = () => {
            if (i !== currentPage) {
                pageButton.style.background = '#ffffff';
                pageButton.style.borderColor = '#e8e8e8';
                pageButton.style.color = '#666';
            }
        };
        pageButton.onclick = () => {
            goToPage(i);
        };
        paginationDiv.appendChild(pageButton);
    }
    
    // 下一页按钮
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.className = 'pagination-btn';
        nextButton.textContent = '下一页';
        nextButton.style.cssText = `
            padding: 8px 16px;
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: #666;
            font-size: 14px;
            font-weight: 500;
            font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
        `;
        nextButton.onmouseover = () => {
            nextButton.style.background = '#f0f0f0';
            nextButton.style.borderColor = '#0099ff';
            nextButton.style.color = '#0099ff';
        };
        nextButton.onmouseout = () => {
            nextButton.style.background = '#ffffff';
            nextButton.style.borderColor = '#e8e8e8';
            nextButton.style.color = '#666';
        };
        nextButton.onclick = () => {
            goToPage(currentPage + 1);
        };
        paginationDiv.appendChild(nextButton);
    }
    
    // 添加分页控件
    foodListElement.parentNode.insertBefore(paginationDiv, foodListElement.nextSibling);
}

// 移除分页控件
function removePagination() {
    const oldPagination = document.querySelector('.pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
}

// 跳转到指定页
function goToPage(page) {
    currentPage = page;
    
    // 获取当前筛选条件
    const categoryButtons = document.querySelectorAll('.category-filter button');
    let selectedCategory = 'all';
    categoryButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedCategory = btn.dataset.category;
        }
    });
    const categoryId = selectedCategory === 'all' ? null : selectedCategory;
    
    const tagButtons = document.querySelectorAll('.tag-filter button');
    let selectedTag = 'all';
    tagButtons.forEach(btn => {
        if (btn.classList.contains('active')) {
            selectedTag = btn.dataset.tag;
        }
    });
    const tagId = selectedTag === 'all' ? null : selectedTag;
    
    const searchQuery = document.getElementById('foodSearch')?.value.trim() || null;
    
    fetchFoods(categoryId, searchQuery, tagId, page);
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
    
    // 重置到第一页
    currentPage = 1;
    
    fetchFoods(categoryId, searchQuery, tagId, currentPage);
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
                currentPage = 1;
                fetchFoods(null, searchQuery, tagId, currentPage);
            } else {
                currentPage = 1;
                fetchFoods(category, searchQuery, tagId, currentPage);
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

// 获取标签数据
function fetchTags() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/tags/`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const tags = data.data;
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
    
    // 设置标签筛选事件
    setupTagFilter();
}

// 设置标签筛选
function setupTagFilter() {
    const tagButtons = document.querySelectorAll('.tag-filter button');
    
    tagButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 移除所有按钮的active类
            tagButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            this.classList.add('active');
            
            const tag = this.dataset.tag;
            const category = document.querySelector('.category-filter button.active').dataset.category;
            const categoryId = category === 'all' ? null : category;
            const tagId = tag === 'all' ? null : tag;
            
            // 重置到第一页
            currentPage = 1;
            
            fetchFoods(categoryId, null, tagId, currentPage);
        });
    });
}

// 页面初始化
function initPage() {
    fetchCategories();
    fetchTags();
    
    // 解析URL中的参数
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    const searchQuery = urlParams.get('search');
    
    // 如果有search参数，设置搜索框的值
    if (searchQuery) {
        const searchInput = document.getElementById('foodSearch');
        if (searchInput) {
            searchInput.value = searchQuery;
        }
    }
    
    // 根据参数筛选美食
    if (categoryId || searchQuery) {
        fetchFoods(categoryId, searchQuery);
    } else {
        fetchFoods();
    }
}

// 暴露初始化函数给全局，以便在HTML中调用
window.initPage = initPage;
window.searchFoods = searchFoods;
window.viewFoodDetail = viewFoodDetail;