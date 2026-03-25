/**
 * food_detail.js
 * 负责：加载美食详情、收藏功能、初始化评价列表
 */

window.onload = async function() {
    await setupNavbar();
    const foodId = getFoodId();
    if (foodId) {
        loadFoodDetail(foodId);
        loadReviews(foodId, 1);
        if (typeof initReviewSystem === 'function') {
            initReviewSystem();
        }
    }
};

function getFoodId() {
    return new URLSearchParams(window.location.search).get('id');
}

async function loadFoodDetail(foodId) {
    const apiBaseUrl = getApiBaseUrl();
    const container = document.getElementById('foodDetail');

    try {
        const res = await fetch(`${apiBaseUrl}/food/api/foods/${foodId}/`);
        const result = await res.json();

        if (result.status === 'success') {
            const food = result.data;
            // 处理图片路径
            let imageUrl = food.image;
            console.log('原始图片路径:', imageUrl);
            // 如果图片路径不是以http开头，则添加apiBaseUrl
            if (imageUrl && !imageUrl.startsWith('http')) {
                // 确保路径以/开头
                if (!imageUrl.startsWith('/')) {
                    imageUrl = '/' + imageUrl;
                }
                imageUrl = apiBaseUrl + imageUrl;
                console.log('处理后的图片路径:', imageUrl);
            }
            // 确保有默认图片
            const finalImageUrl = imageUrl || '../images/avatar_default.png';
            console.log('最终使用的图片路径:', finalImageUrl);
            container.innerHTML = `
                <div class="food-info-card">
                    <div class="food-image-container">
                        <img src="${finalImageUrl}" class="food-image" onerror="this.src='../images/avatar_default.png'">
                    </div>
                    <div class="food-text">
                        <h2>${food.name}</h2>
                        <div class="food-tags">
                            <span class="tag location-tag">位置: ${food.categoryName || '未知'}</span>
                            <span class="tag price-tag">价格: ¥${food.price}</span>
                            <span class="tag rating-tag">评分: ${food.average_rating || 0}★</span>
                            <span class="tag review-tag">评价: ${food.review_count || 0}条</span>
                            ${food.address ? `<span class="tag address-tag">地址: ${food.address}</span>` : ''}
                        </div>
                        <div class="food-intro">
                            <h4>美食介绍</h4>
                            <p class="food-description">${food.description || '暂无介绍'}</p>
                        </div>
                        <div class="action-buttons">
                            <button id="favoriteBtn" class="btn" onclick="toggleFavorite(${food.id})">收藏</button>
                            <button class="btn" onclick="exportFoodImage('${finalImageUrl}')">导出图片</button>
                        </div>
                    </div>
                </div>`;
            checkFavoriteStatus(foodId);
        } else {
            container.innerHTML = `<div class="error-message">加载失败: ${result.message || '未知错误'}</div>`;
        }
    } catch (e) {
        console.error('获取美食详情失败:', e);
        container.innerHTML = `<div class="error-message">加载失败: ${e.message || '网络请求失败'}</div>`;
    }
}

// 评价分页相关变量
let currentReviewPage = 1;
const reviewPageSize = 5;

async function loadReviews(foodId, page = 1) {
    const apiBaseUrl = getApiBaseUrl();
    const list = document.getElementById('reviewsList');

    fetch(`${apiBaseUrl}/food/api/foods/${foodId}/reviews/`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const reviews = data.data;
            
            if (reviews.length > 0) {
                // 为每个评价添加情感分析
                const reviewPromises = reviews.map(async (r) => {
                    try {
                        // 调用情感分析API
                        const sentimentResponse = await fetch(`${apiBaseUrl}/food/api/sentiment-analysis/`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ comment: r.comment })
                        });
                        const sentimentData = await sentimentResponse.json();
                        if (sentimentData.status === 'success') {
                            r.sentiment = sentimentData.data.sentiment;
                            r.sentiment_label = sentimentData.data.sentiment_label;
                        }
                    } catch (error) {
                        console.error('情感分析失败:', error);
                    }
                    return r;
                });

                // 等待所有情感分析完成
                Promise.all(reviewPromises).then(processedReviews => {
                    list.innerHTML = processedReviews.map(r => {
                        // 根据情感类型生成不同的样式
                        let sentimentClass = 'sentiment-neutral';
                        if (r.sentiment === 'positive') {
                            sentimentClass = 'sentiment-positive';
                        } else if (r.sentiment === 'negative') {
                            sentimentClass = 'sentiment-negative';
                        }

                        return `
                            <div class="review-item" data-review-id="${r.id}">
                                <div class="review-header">
                                    <div class="user-info">
                                        <img src="${r.avatar || '../images/avatar_default.png'}" alt="${r.username}" class="user-avatar">
                                        <strong>${r.username}</strong>
                                    </div>
                                    <div class="review-rating">评分：${'★'.repeat(r.rating)}</div>
                                </div>
                                <p class="review-content">${r.comment}</p>
                                ${r.sentiment_label ? `<div class="review-sentiment ${sentimentClass}">情感：${r.sentiment_label}</div>` : ''}
                                ${r.image ? `<div class="review-image"><img src="${r.image}" alt="评价图片" class="review-image-img"></div>` : ''}
                                <small class="review-date">${r.created_at}</small>
                                
                                <!-- 回复区域 -->
                                <div class="review-actions">
                                    <button class="btn btn-sm reply-btn" onclick="toggleReplyForm(${r.id})">回复</button>
                                </div>
                                
                                <!-- 回复表单 -->
                                <div class="reply-form" id="replyForm-${r.id}" style="display: none;">
                                    <textarea class="reply-textarea" placeholder="写下你的回复..."></textarea>
                                    <div class="reply-form-actions">
                                        <button class="btn btn-sm" onclick="submitReply(${r.id})")>提交回复</button>
                                        <button class="btn btn-sm btn-secondary" onclick="toggleReplyForm(${r.id})")>取消</button>
                                    </div>
                                </div>
                                
                                <!-- 回复列表 -->
                                <div class="replies-list">
                                    ${r.replies && r.replies.length > 0 ? r.replies.map(reply => `
                                        <div class="reply-item">
                                            <div class="reply-header">
                                                <div class="user-info">
                                                    <img src="${reply.avatar || '../images/avatar_default.png'}" alt="${reply.username}" class="user-avatar small">
                                                    <strong>${reply.username}</strong>
                                                </div>
                                            </div>
                                            <p class="reply-content">${reply.comment}</p>
                                            ${reply.image ? `<div class="review-image"><img src="${reply.image}" alt="回复图片" class="review-image-img small"></div>` : ''}
                                            <small class="review-date">${reply.created_at}</small>
                                        </div>
                                    `).join('') : '<p class="no-replies">暂无回复</p>'}
                                </div>
                            </div>
                        `;
                    }).join('');
                });
            } else {
                list.innerHTML = "<p>暂无评价</p>";
            }
        } else {
            list.innerHTML = "<p>暂无评价</p>";
        }
    });
}

// 渲染评价分页控件
function renderReviewPagination(foodId, currentPage, totalPages) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    // 移除旧的分页控件
    removeReviewPagination();
    
    // 如果只有一页，不显示分页控件
    if (totalPages <= 1) return;
    
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'review-pagination';
    paginationDiv.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 30px;
        gap: 10px;
    `;
    
    // 上一页按钮
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.className = 'btn btn-secondary';
        prevButton.textContent = '上一页';
        prevButton.onclick = () => {
            currentReviewPage = currentPage - 1;
            loadReviews(foodId, currentReviewPage);
        };
        paginationDiv.appendChild(prevButton);
    }
    
    // 页码按钮
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `btn ${i === currentPage ? 'btn-primary' : 'btn-secondary'}`;
        pageButton.textContent = i;
        pageButton.onclick = () => {
            currentReviewPage = i;
            loadReviews(foodId, currentReviewPage);
        };
        paginationDiv.appendChild(pageButton);
    }
    
    // 下一页按钮
    if (currentPage < totalPages) {
        const nextButton = document.createElement('button');
        nextButton.className = 'btn btn-secondary';
        nextButton.textContent = '下一页';
        nextButton.onclick = () => {
            currentReviewPage = currentPage + 1;
            loadReviews(foodId, currentReviewPage);
        };
        paginationDiv.appendChild(nextButton);
    }
    
    // 添加分页控件
    reviewsList.parentNode.insertBefore(paginationDiv, reviewsList.nextSibling);
}

// 移除评价分页控件
function removeReviewPagination() {
    const oldPagination = document.querySelector('.review-pagination');
    if (oldPagination) {
        oldPagination.remove();
    }
}

// 收藏逻辑
async function toggleFavorite(foodId) {
    const apiBaseUrl = getApiBaseUrl();
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    try {
        const response = await fetch(`${apiBaseUrl}/food/api/favorites/add/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ food_id: foodId })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            createErrorMessage('收藏成功', 'success');
            checkFavoriteStatus(foodId);
        } else {
            createErrorMessage(result.message || '收藏失败');
        }
    } catch (error) {
        console.error('收藏操作失败:', error);
        createErrorMessage('网络请求失败，请稍后重试');
    }
}

// 检查收藏状态
async function checkFavoriteStatus(foodId) {
    const apiBaseUrl = getApiBaseUrl();
    const favoriteBtn = document.getElementById('favoriteBtn');
    
    if (!favoriteBtn) return;
    
    try {
        const response = await fetch(`${apiBaseUrl}/food/api/favorites/`, {
            credentials: 'include'
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            const favorites = result.data;
            const isFavorite = favorites.some(fav => fav.food_id === foodId);
            
            if (isFavorite) {
                favoriteBtn.textContent = '已收藏';
                favoriteBtn.classList.add('favorited');
            } else {
                favoriteBtn.textContent = '收藏';
                favoriteBtn.classList.remove('favorited');
            }
        }
    } catch (error) {
        console.error('检查收藏状态失败:', error);
        // 不显示错误信息，保持默认状态
    }
}

// 导出美食图片
function exportFoodImage(imageUrl) {
    // 创建下载链接
    const link = document.createElement('a');
    link.href = imageUrl;
    // 从URL中提取文件名或生成一个唯一的文件名
    const fileName = imageUrl.split('/').pop() || `food_image_${Date.now()}.jpg`;
    link.download = fileName;
    link.click();
    
    // 显示成功提示
    createErrorMessage('图片导出成功', 'success');
}

// 切换回复表单显示/隐藏
function toggleReplyForm(reviewId) {
    const form = document.getElementById(`replyForm-${reviewId}`);
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
}

// 提交回复
async function submitReply(reviewId) {
    const apiBaseUrl = getApiBaseUrl();
    const form = document.getElementById(`replyForm-${reviewId}`);
    const textarea = form.querySelector('.reply-textarea');
    const comment = textarea.value.trim();
    
    if (!comment) {
        createErrorMessage('回复内容不能为空');
        return;
    }
    
    try {
        showLoading('提交回复中...');
        const response = await fetch(`${apiBaseUrl}/food/api/reviews/reply/`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ parent_id: reviewId, comment: comment })
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.status === 'success') {
            createErrorMessage('回复提交成功', 'success');
            // 重新加载评论列表
            const foodId = getFoodId();
            loadReviews(foodId);
        } else {
            createErrorMessage(result.message || '回复提交失败');
        }
    } catch (error) {
        hideLoading();
        console.error('回复提交失败:', error);
        createErrorMessage('网络请求失败，请稍后重试');
    }
}

// 添加评价图片样式
function addReviewImageStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .review-image {
            margin: 10px 0;
        }
        .review-image-img {
            max-width: 100%;
            max-height: 150px;
            object-fit: cover;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease;
        }
        .review-image-img:hover {
            transform: scale(1.02);
        }
        .review-image-img.small {
            max-height: 100px;
        }
        
        /* 情感分析样式 */
        .review-sentiment {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin: 5px 0;
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
        
        /* 回复相关样式 */
        .review-actions {
            margin-top: 10px;
            margin-bottom: 10px;
        }
        
        .reply-btn {
            font-size: 12px;
            padding: 4px 8px;
        }
        
        .reply-form {
            margin-top: 10px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .reply-textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            resize: vertical;
            min-height: 80px;
            margin-bottom: 10px;
        }
        
        .reply-form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        .replies-list {
            margin-top: 15px;
            padding-left: 20px;
            border-left: 2px solid #e0e0e0;
        }
        
        .reply-item {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 8px;
        }
        
        .reply-header {
            margin-bottom: 5px;
        }
        
        .reply-content {
            margin: 5px 0;
        }
        
        .user-avatar.small {
            width: 24px;
            height: 24px;
        }
        
        .no-replies {
            color: #999;
            font-size: 12px;
            margin: 5px 0;
        }
    `;
    document.head.appendChild(style);
}

// 页面加载时添加样式
window.addEventListener('load', addReviewImageStyles);