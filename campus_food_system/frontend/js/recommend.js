// 分页相关变量
let currentPage = 1;
const pageSize = 6;

// 筛选相关变量
let selectedCategory = 'all';
let selectedPrice = 'all';
let selectedTags = []; // 存储选中的标签ID数组
let selectedSort = 'rating'; // 默认按评分排序
let selectedRecommend = 'normal'; // 默认普通推荐

// 页面加载完成后初始化
window.onload = function() {
    setupNavbar(); // 使用utils.js中的setupNavbar函数
    fetchCategories();
    fetchTags();
    loadRecommendedFoods(1);
    setupFilterEvents(); // 绑定价格筛选事件
    
    // 处理URL参数，应用分类筛选
    handleUrlParams();
};

// 处理URL参数
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');
    
    if (categoryId) {
        // 设置选中的分类
        selectedCategory = categoryId;
        currentPage = 1;
        
        // 等待分类数据加载完成后更新按钮状态
        setTimeout(() => {
            const categoryButtons = document.querySelectorAll('#categoryFilter button');
            categoryButtons.forEach(btn => {
                if (btn.dataset.category === categoryId) {
                    btn.click(); // 触发点击事件，更新状态并加载数据
                }
            });
        }, 500);
    }
}

// 获取分类数据
function fetchCategories() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/categories/`;
    const categoryFilter = document.getElementById('categoryFilter');
    
    if (!categoryFilter) return;
    
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
                let html = '<button class="active" data-category="all">全部食堂</button>';
                
                categories.forEach(category => {
                    html += `<button data-category="${category.id}">${category.name}</button>`;
                });
                
                categoryFilter.innerHTML = html;
                // 绑定分类筛选事件
                bindCategoryFilterEvents();
            }
        })
        .catch(error => {
            console.error('获取分类数据失败:', error);
        });
}

// 获取标签数据
function fetchTags() {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}/food/api/tags/`;
    const tagFilter = document.getElementById('tagFilter');
    
    if (!tagFilter) return;
    
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
                let html = '<label><input type="checkbox" class="tag-checkbox" data-tag="all"> 全部标签</label>';
                
                tags.forEach(tag => {
                    html += `<label><input type="checkbox" class="tag-checkbox" data-tag="${tag.id}"> ${tag.name}</label>`;
                });
                
                tagFilter.innerHTML = html;
                // 绑定标签筛选事件
                bindTagFilterEvents();
            }
        })
        .catch(error => {
            console.error('获取标签数据失败:', error);
        });
}

// 绑定分类筛选事件
function bindCategoryFilterEvents() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                console.log('分类按钮被点击:', e.target.textContent);
                console.log('分类ID:', e.target.dataset.category);
                const buttons = categoryFilter.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                selectedCategory = e.target.dataset.category;
                console.log('selectedCategory:', selectedCategory);
                currentPage = 1;
                loadRecommendedFoods(1);
            }
        });
    }
}

// 绑定价格筛选事件
function bindPriceFilterEvents() {
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const buttons = priceFilter.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                selectedPrice = e.target.dataset.price;
                currentPage = 1;
                loadRecommendedFoods(1);
            }
        });
    }
}

// 绑定标签筛选事件
function bindTagFilterEvents() {
    const tagFilter = document.getElementById('tagFilter');
    if (tagFilter) {
        tagFilter.addEventListener('change', function(e) {
            if (e.target.classList.contains('tag-checkbox')) {
                const checkboxes = tagFilter.querySelectorAll('.tag-checkbox');
                const allCheckbox = tagFilter.querySelector('[data-tag="all"]');
                
                // 处理全选/取消全选
                if (e.target.dataset.tag === 'all') {
                    const isChecked = e.target.checked;
                    checkboxes.forEach(checkbox => {
                        if (checkbox !== e.target) {
                            checkbox.checked = isChecked;
                        }
                    });
                } else {
                    // 如果有任何标签未选中，取消全选
                    const allChecked = Array.from(checkboxes).every(checkbox => 
                        checkbox === allCheckbox || checkbox.checked
                    );
                    allCheckbox.checked = allChecked;
                }
                
                // 更新选中的标签数组
                selectedTags = [];
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked && checkbox.dataset.tag !== 'all') {
                        selectedTags.push(checkbox.dataset.tag);
                    }
                });
                
                console.log('选中的标签:', selectedTags);
                currentPage = 1;
                loadRecommendedFoods(1);
            }
        });
    }
}

// 设置筛选事件
function setupFilterEvents() {
    // 绑定价格筛选事件（静态按钮）
    bindPriceFilterEvents();
    // 绑定排序事件
    bindSortEvents();
    // 绑定推荐方式事件
    bindRecommendEvents();
}

// 绑定排序事件
function bindSortEvents() {
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const buttons = sortFilter.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                selectedSort = e.target.dataset.sort;
                currentPage = 1;
                loadRecommendedFoods(1);
            }
        });
    }
}

// 绑定推荐方式事件
function bindRecommendEvents() {
    const recommendFilter = document.getElementById('recommendFilter');
    if (recommendFilter) {
        recommendFilter.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const buttons = recommendFilter.querySelectorAll('button');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                selectedRecommend = e.target.dataset.recommend;
                currentPage = 1;
                loadRecommendedFoods(1);
            }
        });
    }
}

// 加载推荐美食
function loadRecommendedFoods(page = 1) {
    const apiBaseUrl = getApiBaseUrl();
    const recommendedFoodsElement = document.getElementById('recommendedFoods');
    
    // 显示加载状态
    recommendedFoodsElement.innerHTML = '<div class="loading">加载中...</div>';
    
    // 构建API请求URL
    let url;
    if (selectedRecommend === 'personalized') {
        // 个性化推荐API
        url = `${apiBaseUrl}/food/api/personalized-recommendations/`;
    } else {
        // 普通推荐API
        url = `${apiBaseUrl}/food/api/recommendations/?page=${page}&page_size=${pageSize}`;
        
        // 添加筛选参数
        if (selectedCategory !== 'all') {
            url += `&category_id=${selectedCategory}`;
        }
        
        // 添加多个标签ID参数
        if (selectedTags.length > 0) {
            url += `&tag_ids=${selectedTags.join(',')}`;
        }
        
        // 添加排序参数
        let orderBy = '';
        switch (selectedSort) {
            case 'rating':
                orderBy = '-average_rating';
                break;
            case 'distance':
                orderBy = 'distance';
                break;
            case 'price_asc':
                orderBy = 'price';
                break;
            case 'price_desc':
                orderBy = '-price';
                break;
            default:
                orderBy = '-average_rating';
        }
        url += `&order_by=${orderBy}`;
    }
    
    console.log('API请求URL:', url);
    console.log('筛选参数 - category:', selectedCategory, 'tags:', selectedTags, 'price:', selectedPrice, 'recommend:', selectedRecommend);
    
    // 从后端API获取推荐美食
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                let recommendedFoods = data.data;
                
                // 处理价格筛选
                if (selectedPrice !== 'all') {
                    recommendedFoods = filterFoodsByPrice(recommendedFoods, selectedPrice);
                }
                
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                const paginatedFoods = recommendedFoods.slice(start, end);
                
                recommendedFoodsElement.innerHTML = '';
                
                if (paginatedFoods.length === 0) {
                    recommendedFoodsElement.innerHTML = '<div class="empty-message">暂无推荐美食</div>';
                    removePagination();
                    return;
                }
                
                paginatedFoods.forEach(food => {
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
                    recommendedFoodsElement.appendChild(foodItem);
                });
                
                // 渲染分页控件
                renderPagination(recommendedFoods.length, page);
            } else {
                recommendedFoodsElement.innerHTML = `<div class="error-message">加载失败: ${data.message}</div>`;
                removePagination();
            }
        })
        .catch(error => {
            console.error('加载推荐美食失败:', error);
            recommendedFoodsElement.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
            removePagination();
        });
}

// 根据价格筛选美食
function filterFoodsByPrice(foods, priceRange) {
    return foods.filter(food => {
        const price = food.price;
        switch (priceRange) {
            case '0-10':
                return price >= 0 && price <= 10;
            case '10-20':
                return price > 10 && price <= 20;
            case '20-30':
                return price > 20 && price <= 30;
            case '30+':
                return price > 30;
            default:
                return true;
        }
    });
}

// 渲染分页控件
function renderPagination(totalItems, currentPage) {
    const recommendedFoodsElement = document.getElementById('recommendedFoods');
    if (!recommendedFoodsElement) return;
    
    // 移除旧的分页控件
    removePagination();
    
    const totalPages = Math.ceil(totalItems / pageSize);
    
    if (totalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 24px;
        gap: 8px;
        padding: 16px;
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
            font-size: 13px;
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
            loadRecommendedFoods(currentPage - 1);
        };
        paginationDiv.appendChild(prevButton);
    }
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'pagination-btn';
        pageButton.textContent = i;
        pageButton.style.cssText = `
            padding: 8px 12px;
            background: ${i === currentPage ? '#0099ff' : '#ffffff'};
            border: 1px solid ${i === currentPage ? '#0099ff' : '#e8e8e8'};
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            color: ${i === currentPage ? '#ffffff' : '#666'};
            font-size: 13px;
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
            loadRecommendedFoods(i);
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
            font-size: 13px;
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
            loadRecommendedFoods(currentPage + 1);
        };
        paginationDiv.appendChild(nextButton);
    }
    
    // 添加分页控件
    recommendedFoodsElement.parentNode.insertBefore(paginationDiv, recommendedFoodsElement.nextSibling);
}

// 移除分页控件
function removePagination() {
    const oldPagination = document.querySelector('.pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
}

// 查看美食详情
function viewFoodDetail(foodId) {
    const prefix = getRelativePathPrefix();
    window.location.href = `${prefix}food_detail.html?id=${foodId}`;
}