let currentSection = 'categorySection';
let currentPage = 1;
let totalPages = 1;
const pageSize = 6;

// 评价管理相关变量
let currentReviewPage = 1;
let totalReviewPages = 1;
const reviewPageSize = 10;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
});

// 检查管理员权限
async function checkAdminStatus() {
    showLoading('正在验证权限...');
    try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/food/api/user/info/`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.status !== 'success' || !data.data.is_superuser) {
            // 非管理员或未登录，跳转回首页
            hideLoading();
            alert('权限不足，正在返回首页...');
            window.location.href = 'index.html';
        } else {
            // 权限验证通过，初始化管理功能
            hideLoading();
            await initAdmin();
        }
    } catch (error) {
        console.error('检查权限失败:', error);
        hideLoading();
        alert('验证失败，正在返回首页...');
        window.location.href = 'index.html';
    }
}

// 初始化管理中心
async function initAdmin() {
    loadCategories();
    loadFoodList();
    loadAllTags(); // 加载所有标签
    setupFormSubmissions();
    updateSystemStats();
}

// 加载评价分析数据和列表
function loadReviews(page = 1) {
    console.log('开始加载评价数据，页码:', page);
    currentReviewPage = page;
    const apiBaseUrl = getApiBaseUrl();
    const reviewListElement = document.getElementById('reviewList');
    const paginationContainer = document.getElementById('reviewPagination');
    const sentimentFilter = document.getElementById('reviewFilter').value;
    const ratingFilter = document.getElementById('ratingFilter').value;
    
    // 显示加载状态
    reviewListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    // 加载评价分析数据
    console.log('调用loadReviewAnalysis函数');
    loadReviewAnalysis();
    
    // 加载评价列表
    let url = `${apiBaseUrl}/food/api/admin/reviews/?page=${page}&page_size=${reviewPageSize}`;
    if (sentimentFilter !== 'all') {
        url += `&sentiment=${sentimentFilter}`;
    }
    if (ratingFilter !== 'all') {
        url += `&rating=${ratingFilter}`;
    }
    
    fetch(url, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            reviewListElement.innerHTML = '';
            
            if (data.data.length === 0) {
                reviewListElement.innerHTML = '<p class="empty">暂无评价数据</p>';
                paginationContainer.style.display = 'none';
                return;
            }
            
            data.data.forEach(review => {
                // 分析情感
                analyzeReviewSentiment(review).then(analyzedReview => {
                    const reviewItem = document.createElement('div');
                    reviewItem.className = 'review-card';
                    
                    // 根据情感类型设置标签样式
                    let sentimentClass = 'neutral';
                    let sentimentLabel = '中性';
                    if (analyzedReview.sentiment === 'positive') {
                        sentimentClass = 'positive';
                        sentimentLabel = '正面';
                    } else if (analyzedReview.sentiment === 'negative') {
                        sentimentClass = 'negative';
                        sentimentLabel = '负面';
                    }
                    
                    reviewItem.innerHTML = `
                        <div class="review-card-header">
                            <div class="review-card-avatar">
                                <img src="${analyzedReview.avatar || '/static/images/avatar_default.png'}" alt="${analyzedReview.username}" class="review-avatar-image">
                            </div>
                            <div class="review-card-info">
                                <h4 class="review-card-user">${analyzedReview.username}</h4>
                                <p class="review-card-food">${analyzedReview.food_name}</p>
                                <div class="review-card-rating">
                                    ${'★'.repeat(analyzedReview.rating)}${'☆'.repeat(5 - analyzedReview.rating)}
                                    <span style="margin-left: 5px; font-size: 12px; color: #666;">(${analyzedReview.rating}星)</span>
                                </div>
                                <span class="review-card-sentiment ${sentimentClass}">${sentimentLabel}</span>
                            </div>
                        </div>
                        <div class="review-card-content">
                            ${analyzedReview.comment}
                        </div>
                        <div class="review-card-footer">
                            <span class="review-card-date">${analyzedReview.created_at}</span>
                            <div class="review-card-actions">
                                <button class="btn btn-sm btn-secondary" onclick="viewFoodDetail(${analyzedReview.food_id})">查看美食</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteReview(${analyzedReview.id})">删除</button>
                            </div>
                        </div>
                    `;
                    reviewListElement.appendChild(reviewItem);
                });
            });
            
            // 更新分页信息
            if (data.pagination) {
                totalReviewPages = data.pagination.total_pages;
                currentReviewPage = data.pagination.current_page;
                
                paginationContainer.style.display = 'flex';
                document.getElementById('reviewPageInfo').textContent = `第 ${currentReviewPage} / ${totalReviewPages} 页`;
                
                // 控制按钮禁用状态
                document.getElementById('prevReviewPage').disabled = (currentReviewPage <= 1);
                document.getElementById('nextReviewPage').disabled = (currentReviewPage >= totalReviewPages);
            } else {
                paginationContainer.style.display = 'none';
            }
        }
    });
}

// 加载评价分析数据并渲染图表
function loadReviewAnalysis() {
    console.log('开始加载评价分析数据');
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/admin/reviews/analysis/`, {
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        console.log('评价分析数据加载成功:', data);
        if (data.status === 'success') {
            const analysisData = data.data;
            
            // 渲染情感分布图表
            renderSentimentChart(analysisData.sentiment_distribution);
            
            // 渲染评分分布图表
            renderRatingChart(analysisData.rating_distribution);
            
            // 渲染评价趋势图表
            renderTrendChart(analysisData.review_trend);
        } else {
            console.log('API返回错误:', data.message);
            // 使用默认数据渲染图表
            renderSentimentChart({ positive: 10, negative: 5, neutral: 15 });
            renderRatingChart({ 1: 2, 2: 3, 3: 5, 4: 8, 5: 12 });
            renderTrendChart([
                { date: '2026-03-17', count: 2 },
                { date: '2026-03-18', count: 5 },
                { date: '2026-03-19', count: 3 },
                { date: '2026-03-20', count: 7 },
                { date: '2026-03-21', count: 4 },
                { date: '2026-03-22', count: 6 },
                { date: '2026-03-23', count: 8 }
            ]);
        }
    })
    .catch(error => {
        console.error('加载评价分析数据失败:', error);
        // 使用默认数据渲染图表
        console.log('使用默认数据渲染图表');
        renderSentimentChart({ positive: 10, negative: 5, neutral: 15 });
        renderRatingChart({ 1: 2, 2: 3, 3: 5, 4: 8, 5: 12 });
        renderTrendChart([
            { date: '2026-03-17', count: 2 },
            { date: '2026-03-18', count: 5 },
            { date: '2026-03-19', count: 3 },
            { date: '2026-03-20', count: 7 },
            { date: '2026-03-21', count: 4 },
            { date: '2026-03-22', count: 6 },
            { date: '2026-03-23', count: 8 }
        ]);
    });
}

// 渲染情感分布图表
function renderSentimentChart(data) {
    const ctx = document.createElement('canvas');
    const container = document.getElementById('sentimentChart');
    container.innerHTML = '';
    container.appendChild(ctx);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['正面', '负面', '中性'],
            datasets: [{
                data: [data.positive, data.negative, data.neutral],
                backgroundColor: ['#52c41a', '#f5222d', '#1890ff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 渲染评分分布图表
function renderRatingChart(data) {
    const ctx = document.createElement('canvas');
    const container = document.getElementById('ratingChart');
    container.innerHTML = '';
    container.appendChild(ctx);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1星', '2星', '3星', '4星', '5星'],
            datasets: [{
                label: '评价数量',
                data: [data[1], data[2], data[3], data[4], data[5]],
                backgroundColor: '#1890ff',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 渲染评价趋势图表
function renderTrendChart(data) {
    console.log('渲染评价趋势图表，数据:', data);
    const ctx = document.createElement('canvas');
    const container = document.getElementById('trendChart');
    container.innerHTML = '';
    container.appendChild(ctx);
    
    // 准备数据
    let labels = [];
    let counts = [];
    
    if (data && data.length > 0) {
        labels = data.map(item => item.date);
        counts = data.map(item => item.count);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '评价数量',
                data: counts,
                borderColor: '#1890ff',
                backgroundColor: 'rgba(24, 144, 255, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

// 分析评价情感
async function analyzeReviewSentiment(review) {
    const apiBaseUrl = getApiBaseUrl();
    try {
        const response = await fetch(`${apiBaseUrl}/food/api/sentiment-analysis/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment: review.comment })
        });
        const data = await response.json();
        if (data.status === 'success') {
            review.sentiment = data.data.sentiment;
            review.sentiment_label = data.data.sentiment_label;
        }
    } catch (error) {
        console.error('情感分析失败:', error);
        review.sentiment = 'neutral';
        review.sentiment_label = '中性';
    }
    return review;
}

// 删除评价
function deleteReview(reviewId) {
    if (confirm(`确定要删除该评价吗？`)) {
        const apiBaseUrl = getApiBaseUrl();
        fetch(`${apiBaseUrl}/food/api/admin/reviews/${reviewId}/delete/`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert('评价删除成功！');
                loadReviews(currentReviewPage);
            } else {
                alert(data.message);
            }
        });
    }
}

// 切换评价页码
function changeReviewPage(page) {
    if (page < 1 || page > totalReviewPages) return;
    loadReviews(page);
}

// 存储所有可用标签
let allTags = [];

// 加载所有标签
function loadAllTags() {
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/food/api/tags/`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                allTags = data.data;
                renderTagsSelection('foodTagsContainer');
            }
        });
}

// 渲染标签选择界面
function renderTagsSelection(containerId, selectedIds = []) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (allTags.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 13px;">暂无可用标签，请先在系统后台添加标签。</p>';
        return;
    }
    
    container.innerHTML = allTags.map(tag => `
        <label class="tag-checkbox-item">
            <input type="checkbox" name="food_tags" value="${tag.id}" ${selectedIds.includes(tag.id) ? 'checked' : ''}>
            <span>${tag.name}</span>
        </label>
    `).join('');
}

// 切换管理板块
function switchSection(sectionId) {
    console.log('切换到板块:', sectionId);
    // 隐藏所有板块
    document.querySelectorAll('.admin-card').forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示目标板块
    document.getElementById(sectionId).style.display = 'block';
    
    // 如果切换到运营洞察，加载数据
    if (sectionId === 'insightsSection') {
        loadInsights();
    }
    // 如果切换到评价管理，加载数据
    if (sectionId === 'reviewSection') {
        console.log('加载评价管理数据');
        loadReviews();
    }
    
    // 更新导航状态
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// 添加情感分析样式
function addSentimentStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .review-sentiment {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            margin: 8px 0;
        }
        .sentiment-positive {
            background-color: #e8f5e8;
            color: #2e7d32;
            border: 1px solid #c8e6c9;
        }
        .sentiment-negative {
            background-color: #ffebee;
            color: #c62828;
            border: 1px solid #ffcdd2;
        }
        .sentiment-neutral {
            background-color: #f5f5f5;
            color: #616161;
            border: 1px solid #e0e0e0;
        }
    `;
    document.head.appendChild(style);
}

// 页面加载时添加样式
window.addEventListener('load', addSentimentStyles);

// 更新系统概况统计
function updateSystemStats() {
    const apiBaseUrl = getApiBaseUrl();
    
    // 获取美食总数
    fetch(`${apiBaseUrl}/food/api/foods/`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('totalFoodCount').textContent = data.data.length;
                // 计算平均分
                if (data.data.length > 0) {
                    const avg = data.data.reduce((acc, curr) => acc + curr.average_rating, 0) / data.data.length;
                    document.getElementById('systemAverageRating').textContent = avg.toFixed(1);
                }
            }
        });
        
    // 获取分类总数
    fetch(`${apiBaseUrl}/food/api/categories/`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('totalCategoryCount').textContent = data.data.length;
            }
        });
}

// 设置表单提交事件
function setupFormSubmissions() {
    // 添加分类表单
    document.getElementById('addCategoryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addCategory();
    });
    
    // 添加美食表单
    document.getElementById('addFoodForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addFood();
    });
}

// 加载分类列表
function loadCategories() {
    const apiBaseUrl = getApiBaseUrl();
    const categoryListElement = document.getElementById('categoryList');
    
    categoryListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    fetch(`${apiBaseUrl}/food/api/categories/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                categoryListElement.innerHTML = '';
                
                if (data.data.length === 0) {
                    categoryListElement.innerHTML = '<p class="empty">暂无分类数据</p>';
                    return;
                }
                
                data.data.forEach(category => {
                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'admin-item-card';
                    categoryItem.innerHTML = `
                        <div class="admin-item-header">
                            <h4 class="admin-item-name">${category.name}</h4>
                            <span class="admin-item-tag">${category.food_count} 个菜品</span>
                        </div>
                        <p class="admin-item-desc">${category.description || '暂无描述'}</p>
                        <div class="admin-item-footer">
                            <div class="admin-item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="editCategory(${category.id})">编辑</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteCategory(${category.id})">删除</button>
                            </div>
                        </div>
                    `;
                    categoryListElement.appendChild(categoryItem);
                });
                updateSystemStats();
            }
        });
    
    updateFoodCategoryOptions();
}

// 更新美食添加表单中的分类下拉列表
function updateFoodCategoryOptions() {
    const apiBaseUrl = getApiBaseUrl();
    const categorySelects = [document.getElementById('foodCategory')];
    
    // 如果弹窗中有分类下拉框，也一并更新
    const modalCategorySelect = document.getElementById('editFoodCategory');
    if (modalCategorySelect) categorySelects.push(modalCategorySelect);
    
    fetch(`${apiBaseUrl}/food/api/categories/`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                categorySelects.forEach(select => {
                    if (!select) return;
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">请选择分类</option>';
                    data.data.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        select.appendChild(option);
                    });
                    if (currentValue) select.value = currentValue;
                });
            }
        });
}

// 加载美食列表
function loadFoodList(page = 1) {
    currentPage = page;
    const apiBaseUrl = getApiBaseUrl();
    const foodListElement = document.getElementById('foodList');
    const paginationContainer = document.getElementById('foodPagination');
    
    foodListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    fetch(`${apiBaseUrl}/food/api/foods/?page=${page}&page_size=${pageSize}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                foodListElement.innerHTML = '';
                
                if (data.data.length === 0) {
                    foodListElement.innerHTML = '<p class="empty">暂无美食数据</p>';
                    paginationContainer.style.display = 'none';
                    return;
                }
                
                data.data.forEach(food => {
                    const foodItem = document.createElement('div');
                    foodItem.className = 'admin-item-card';
                    foodItem.innerHTML = `
                        <div class="admin-item-header">
                            <h4 class="admin-item-name">${food.name}</h4>
                            <span class="admin-item-tag">${food.categoryName}</span>
                        </div>
                        <p class="admin-item-desc">${food.description.substring(0, 50)}${food.description.length > 50 ? '...' : ''}</p>
                        <div style="font-size: 13px; color: #f39c12; margin-bottom: 5px;">
                            ${'★'.repeat(Math.round(food.average_rating))}${'☆'.repeat(5 - Math.round(food.average_rating))} 
                            (${food.review_count} 条评价)
                        </div>
                        <div class="admin-item-footer">
                            <span class="admin-item-price">¥${food.price.toFixed(2)}</span>
                            <div class="admin-item-actions">
                                <button class="btn btn-sm btn-secondary" onclick="editFood(${food.id})">编辑</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteFood(${food.id})">删除</button>
                            </div>
                        </div>
                    `;
                    foodListElement.appendChild(foodItem);
                });
                
                // 更新分页信息
                if (data.pagination) {
                    totalPages = data.pagination.total_pages;
                    currentPage = data.pagination.current_page;
                    
                    paginationContainer.style.display = 'flex';
                    document.getElementById('pageInfo').textContent = `第 ${currentPage} / ${totalPages} 页`;
                    
                    // 控制按钮禁用状态
                    document.getElementById('prevPage').disabled = (currentPage <= 1);
                    document.getElementById('nextPage').disabled = (currentPage >= totalPages);
                } else {
                    paginationContainer.style.display = 'none';
                }
                
                updateSystemStats();
            }
        });
}

// 切换页码
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadFoodList(page);
}

// 查看美食详情
function viewFoodDetail(foodId) {
    const prefix = getRelativePathPrefix();
    window.location.href = `${prefix}food_detail.html?id=${foodId}`;
}

// 添加分类
function addCategory() {
    const apiBaseUrl = getApiBaseUrl();
    const name = document.getElementById('categoryName').value;
    const description = document.getElementById('categoryDescription').value;
    const messageDiv = document.getElementById('categoryMessage');
    
    if (!name) {
        messageDiv.textContent = '分类名称不能为空';
        messageDiv.className = 'error';
        return;
    }
    
    fetch(`${apiBaseUrl}/food/api/admin/categories/add/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, description })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            messageDiv.textContent = '分类添加成功！';
            messageDiv.className = 'success';
            document.getElementById('addCategoryForm').reset();
            loadCategories();
        } else {
            messageDiv.textContent = `添加失败：${data.message}`;
            messageDiv.className = 'error';
        }
    });
}

// 编辑分类
function editCategory(id) {
    const apiBaseUrl = getApiBaseUrl();
    
    // 我们可以直接从已有的分类列表中寻找，或者重新请求 API
    // 为了准确性，我们重新请求 API 获取最新详情（或者直接用之前加载的数据）
    // 这里简单起见，从 API 获取（虽然目前 api_get_categories 返回的是列表，没有单个获取的，
    // 但我们可以过滤列表或者在后端加一个，或者直接在前端找到那个对象）
    
    fetch(`${apiBaseUrl}/food/api/categories/`)
        .then(res => res.json())
        .then(data => {
            const category = data.data.find(c => c.id === id);
            if (!category) return;

            const modal = document.getElementById('editModal');
            const modalTitle = document.getElementById('modalTitle');
            const editForm = document.getElementById('editForm');
            
            modalTitle.textContent = '📂 编辑分类信息';
            editForm.innerHTML = `
                <div class="form-group">
                    <label for="editCategoryName">分类名称：</label>
                    <input type="text" id="editCategoryName" value="${category.name}" required>
                </div>
                <div class="form-group form-full-width">
                    <label for="editCategoryDescription">分类描述：</label>
                    <textarea id="editCategoryDescription" rows="4">${category.description || ''}</textarea>
                </div>
            `;
            
            modal.style.display = 'block';
            
            document.getElementById('saveEditBtn').onclick = function() {
                const newName = document.getElementById('editCategoryName').value;
                const newDescription = document.getElementById('editCategoryDescription').value;
                
                fetch(`${apiBaseUrl}/food/api/admin/categories/${id}/edit/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ name: newName, description: newDescription })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('分类更新成功！');
                        closeModal();
                        loadCategories();
                    } else {
                        alert(data.message);
                    }
                });
            };
        });
}

// 删除分类
function deleteCategory(categoryId) {
    if (confirm(`确定要删除该分类吗？`)) {
        const apiBaseUrl = getApiBaseUrl();
        fetch(`${apiBaseUrl}/food/api/admin/categories/${categoryId}/delete/`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert('分类删除成功！');
                loadCategories();
            } else {
                alert(data.message);
            }
        });
    }
}

// 添加美食
function addFood() {
    const apiBaseUrl = getApiBaseUrl();
    const form = document.getElementById('addFoodForm');
    const formData = new FormData();
    
    const name = document.getElementById('foodName').value;
    const category_id = document.getElementById('foodCategory').value;
    const description = document.getElementById('foodDescription').value;
    const price = document.getElementById('foodPrice').value;
    const image = document.getElementById('foodImage').files[0];
    
    // 获取选中的标签
    const selectedTags = Array.from(document.querySelectorAll('#foodTagsContainer input[name="food_tags"]:checked'))
        .map(cb => cb.value);
    
    if (!name || !category_id || !description || !price) {
        alert('请填写所有必填字段');
        return;
    }
    
    formData.append('name', name);
    formData.append('category_id', category_id);
    formData.append('description', description);
    formData.append('price', price);
    if (image) formData.append('image', image);
    if (selectedTags.length > 0) formData.append('tag_ids', selectedTags.join(','));
    
    fetch(`${apiBaseUrl}/food/api/admin/foods/add/`, {
        method: 'POST',
        credentials: 'include',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert('美食添加成功！');
            form.reset();
            loadFoodList();
        } else {
            alert(data.message);
        }
    });
}

// 编辑美食
function editFood(foodId) {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/foods/${foodId}/`)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                const food = data.data;
                const modal = document.getElementById('editModal');
                const modalTitle = document.getElementById('modalTitle');
                const editForm = document.getElementById('editForm');
                
                modalTitle.textContent = '🍴 编辑美食信息';
                
                // 获取全部分类以填充下拉框
                fetch(`${apiBaseUrl}/food/api/categories/`)
                    .then(res => res.json())
                    .then(catData => {
                        let options = catData.data.map(cat => 
                            `<option value="${cat.id}" ${cat.id === food.category ? 'selected' : ''}>${cat.name}</option>`
                        ).join('');
                        
                        // 获取当前美食已有的标签ID列表
                        const currentTagIds = food.tags.map(t => t.id);
                        
                        // 生成标签选择 HTML
                        const tagsHtml = allTags.map(tag => `
                            <label class="tag-checkbox-item">
                                <input type="checkbox" name="edit_food_tags" value="${tag.id}" ${currentTagIds.includes(tag.id) ? 'checked' : ''}>
                                <span>${tag.name}</span>
                            </label>
                        `).join('') || '<p style="color: #999; font-size: 13px;">暂无可用标签</p>';
                        
                        editForm.innerHTML = `
                            <div class="form-group">
                                <label for="editFoodName">美食名称：</label>
                                <input type="text" id="editFoodName" value="${food.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="editFoodCategory">所属分类：</label>
                                <select id="editFoodCategory" required>
                                    ${options}
                                </select>
                            </div>
                            <div class="form-group form-full-width">
                                <label for="editFoodDescription">美食描述：</label>
                                <textarea id="editFoodDescription" rows="4" required>${food.description}</textarea>
                            </div>
                            <div class="form-group">
                                <label for="editFoodPrice">价格 (¥)：</label>
                                <input type="number" id="editFoodPrice" step="0.01" value="${food.price}" required>
                            </div>
                            <div class="form-group form-full-width">
                                <label>美食标签：</label>
                                <div id="editFoodTagsContainer" class="tags-checkbox-group">
                                    ${tagsHtml}
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="editFoodImage">更新图片 (可选)：</label>
                                <input type="file" id="editFoodImage" accept="image/*">
                            </div>
                        `;
                        
                        modal.style.display = 'block';
                        
                        document.getElementById('saveEditBtn').onclick = function() {
                            const formData = new FormData();
                            formData.append('name', document.getElementById('editFoodName').value);
                            formData.append('category_id', document.getElementById('editFoodCategory').value);
                            formData.append('description', document.getElementById('editFoodDescription').value);
                            formData.append('price', document.getElementById('editFoodPrice').value);
                            
                            // 获取选中的标签
                            const selectedTags = Array.from(document.querySelectorAll('#editFoodTagsContainer input[name="edit_food_tags"]:checked'))
                                .map(cb => cb.value);
                            formData.append('tag_ids', selectedTags.join(','));

                            const newImage = document.getElementById('editFoodImage').files[0];
                            if (newImage) formData.append('image', newImage);
                            
                            fetch(`${apiBaseUrl}/food/api/admin/foods/${foodId}/edit/`, {
                                method: 'POST',
                                credentials: 'include',
                                body: formData
                            })
                            .then(res => res.json())
                            .then(updateData => {
                                if (updateData.status === 'success') {
                                    alert('美食更新成功！');
                                    closeModal();
                                    loadFoodList();
                                } else {
                                    alert(updateData.message);
                                }
                            });
                        };
                    });
            }
        });
}

// 删除美食
function deleteFood(foodId) {
    if (confirm(`确定要删除该美食吗？`)) {
        const apiBaseUrl = getApiBaseUrl();
        fetch(`${apiBaseUrl}/food/api/admin/foods/${foodId}/delete/`, {
            method: 'POST',
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                alert('美食删除成功！');
                loadFoodList();
            } else {
                alert(data.message);
            }
        });
    }
}

// 加载运营洞察数据
async function loadInsights() {
    try {
        const apiBaseUrl = getApiBaseUrl();
        const popularBody = document.getElementById('popularFoodsBody');
        const categoryList = document.getElementById('categoryInsightsList');
        
        popularBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">分析中...</td></tr>';
        categoryList.innerHTML = '<div style="text-align:center; grid-column: 1/-1;">分析中...</div>';
        
        const data = await apiRequest(`${apiBaseUrl}/food/api/admin/insights/`, {
            credentials: 'include'
        });
        
        if (data.status === 'success') {
            const { popular_foods, category_insights } = data.data;
            
            // 渲染热门排行
            popularBody.innerHTML = popular_foods.map(food => {
                let tagClass = 'suggestion-default';
                if (food.suggestion.includes('增加备货')) tagClass = 'suggestion-hot';
                else if (food.suggestion.includes('排查质量')) tagClass = 'suggestion-warning';
                else if (food.suggestion.includes('稳定供应')) tagClass = 'suggestion-stable';
                
                return `
                    <tr>
                        <td style="font-weight:600;">${food.name}</td>
                        <td>${food.category}</td>
                        <td>❤️ ${food.favorites} / 💬 ${food.reviews}</td>
                        <td><span class="suggestion-tag ${tagClass}">${food.suggestion}</span></td>
                    </tr>
                `;
            }).join('') || '<tr><td colspan="4" style="text-align:center;">暂无足够数据进行分析</td></tr>';
            
            // 渲染食堂洞察
            categoryList.innerHTML = category_insights.map(cat => `
                <div class="category-insight-card">
                    <h4>${cat.name}</h4>
                    <div class="category-insight-stats">
                        <span>菜品: <b>${cat.food_count}</b></span>
                        <span>均分: <b>${cat.avg_rating}</b></span>
                    </div>
                </div>
            `).join('') || '<div style="text-align:center; grid-column: 1/-1;">暂无分类动态数据</div>';
        } else {
            // 显示后端返回的错误信息
            const errorMsg = `<div style="color: #f5222d; padding: 20px; text-align: center; grid-column: 1/-1;">
                加载失败：${data.message || '未知错误'}
                ${data.message === '权限不足，需要超级管理员权限' ? '<br><small>请确保您已作为管理员登录</small>' : ''}
            </div>`;
            popularBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#f5222d;">${data.message}</td></tr>`;
            categoryList.innerHTML = errorMsg;
        }
    } catch (err) {
        console.error('加载洞察失败:', err);
        const popularBody = document.getElementById('popularFoodsBody');
        const categoryList = document.getElementById('categoryInsightsList');
        const errorHtml = `<div style="color: #f5222d; padding: 20px; text-align: center; grid-column: 1/-1;">
            网络请求失败，请检查后端服务是否正常启动
        </div>`;
        popularBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#f5222d;">请求失败</td></tr>`;
        categoryList.innerHTML = errorHtml;
    }
}

// 关闭弹窗
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 点击弹窗外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target == modal) {
        closeModal();
    }
};
