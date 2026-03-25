// 用户中心相关功能

// 页面加载时初始化
window.onload = function() {
    init();
};

// 初始化函数
function init() {
    setupNavbar(); // 使用utils.js中的setupNavbar函数
    checkLoginStatus();
    setupTabs();
    loadUserInfo();
    loadUserReviews();
    loadFavorites();
    loadNotifications();
    loadCategories();
    setupFormHandlers();
    setupSearchAndFilter();
    setupNotificationHandlers();
    setupBackToTop();
    setupAvatarUpload();
}

// 设置导航栏 - 使用utils.js中的setupNavbar函数

// 检查用户登录状态
function checkLoginStatus() {
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/food/api/user/info/`, {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => response.json())
    .then(data => {
        if (data.status !== 'success') {
            // 未登录，跳转到登录页面
            localStorage.setItem('isLoggedIn', 'false');
            window.location.href = 'login.html';
        } else {
            localStorage.setItem('isLoggedIn', 'true');
        }
    })
    .catch(error => {
        console.error('检查登录状态失败:', error);
        window.location.href = 'login.html';
    });
}

// 检查是否为超级管理员
function checkIfSuperuser() {
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/food/api/user/info/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            if (data.data.is_superuser) {
                // 显示Django后台链接
                document.getElementById('admin-link').style.display = 'inline-block';
            } else {
                document.getElementById('admin-link').style.display = 'none';
            }
        }
    })
    .catch(error => {
        console.error('检查管理员权限失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            // 隐藏Django后台链接
            document.getElementById('admin-link').style.display = 'none';
        }
    });
}

// 设置选项卡
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // 移除所有按钮的active类
            tabBtns.forEach(b => b.classList.remove('active'));
            // 移除所有内容的active类
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 添加当前按钮和内容的active类
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// 加载用户信息
function loadUserInfo() {
    const apiBaseUrl = getApiBaseUrl();
    fetch(`${apiBaseUrl}/food/api/user/info/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const userInfo = data.data;
            
            // 更新信息展示
            document.getElementById('usernameDisplay').textContent = userInfo.username;
            document.getElementById('userTypeDisplay').textContent = userInfo.is_superuser ? '超级管理员' : '普通用户';
            document.getElementById('emailDisplay').textContent = userInfo.email || '未设置';
            document.getElementById('bioDisplay').textContent = userInfo.bio || '未设置';
            
            // 更新头像
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.src = userInfo.avatar;
            }
            
            // 更新表单数据
            document.getElementById('email').value = userInfo.email || '';
            document.getElementById('bio').value = userInfo.bio || '';
            
            // 更新统计数据
            updateStats(userInfo);
        }
    })
    .catch(error => {
        console.error('加载用户信息失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            // 使用模拟数据
            const mockUserInfo = {
                username: localStorage.getItem('username') || 'testuser',
                is_superuser: false,
                email: '',
                bio: '',
                avatar: '/static/images/avatars/default_avatar.jpg',
                review_count: 0,
                favorite_count: 0,
                visit_count: 0,
                date_joined: '2024-01-01'
            };
            
            // 更新信息展示
            document.getElementById('usernameDisplay').textContent = mockUserInfo.username;
            document.getElementById('userTypeDisplay').textContent = mockUserInfo.is_superuser ? '超级管理员' : '普通用户';
            document.getElementById('emailDisplay').textContent = mockUserInfo.email || '未设置';
            document.getElementById('bioDisplay').textContent = mockUserInfo.bio || '未设置';
            
            // 更新头像
            const avatarPreview = document.getElementById('avatarPreview');
            if (avatarPreview) {
                avatarPreview.src = mockUserInfo.avatar;
            }
            
            // 更新表单数据
            document.getElementById('email').value = mockUserInfo.email || '';
            document.getElementById('bio').value = mockUserInfo.bio || '';
            
            // 更新统计数据
            updateStats(mockUserInfo);
        }
    });
}

// 更新统计数据
function updateStats(userInfo) {
    // 这里可以通过API获取更详细的统计数据
    const reviewCount = userInfo.review_count || 0;
    const favoriteCount = userInfo.favorite_count || 0;
    const visitCount = userInfo.visit_count || 0;
    
    document.getElementById('reviewCount').textContent = reviewCount;
    document.getElementById('favoriteCount').textContent = favoriteCount;
    document.getElementById('visitCount').textContent = visitCount;
    document.getElementById('joinDate').textContent = userInfo.date_joined ? userInfo.date_joined.split(' ')[0] : '--';
    
    // 计算等级
    calculateUserLevel(reviewCount, favoriteCount, visitCount);
}

// 计算并显示用户等级
function calculateUserLevel(reviews, favorites, visits) {
    const points = (reviews * 5) + (favorites * 2) + (visits * 1);
    
    let level = 1;
    let levelName = '美食探险者';
    let badgeIcon = '🎖️';
    let nextLevelPoints = 20;
    let currentLevelPoints = 0;
    
    if (points > 200) {
        level = 5;
        levelName = '校园食神';
        badgeIcon = '👑';
        nextLevelPoints = points; // 已满级
        currentLevelPoints = 200;
    } else if (points > 100) {
        level = 4;
        levelName = '美食大师';
        badgeIcon = '🏅';
        nextLevelPoints = 200;
        currentLevelPoints = 100;
    } else if (points > 50) {
        level = 3;
        levelName = '美食达人';
        badgeIcon = '💎';
        nextLevelPoints = 100;
        currentLevelPoints = 50;
    } else if (points > 20) {
        level = 2;
        levelName = '美食鉴赏家';
        badgeIcon = '✨';
        nextLevelPoints = 50;
        currentLevelPoints = 20;
    }
    
    // 更新UI
    const badgeContainer = document.getElementById('userBadge');
    const levelSection = document.getElementById('levelProgressSection');
    
    if (badgeContainer && levelSection) {
        badgeContainer.style.display = 'flex';
        levelSection.style.display = 'block';
        
        document.getElementById('userLevelName').textContent = levelName;
        document.querySelector('.badge-icon').textContent = badgeIcon;
        document.getElementById('currentLevel').textContent = level;
        
        // 计算进度条百分比
        let progress = 0;
        if (level === 5) {
            progress = 100;
            document.getElementById('nextLevelProgress').textContent = '已达最高级';
        } else {
            progress = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;
            document.getElementById('nextLevelProgress').textContent = `${points}/${nextLevelPoints}`;
        }
        
        document.getElementById('levelProgressFill').style.width = `${progress}%`;
    }
}

// 设置表单处理器
function setupFormHandlers() {
    // 编辑个人信息表单
    const editProfileForm = document.getElementById('edit-profile-form');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateUserInfo();
        });
    }
    
    // 修改密码表单
    const changePasswordForm = document.getElementById('change-password-form');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }
}

// 表单验证
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 更新用户信息
function updateUserInfo() {
    const email = document.getElementById('email').value;
    const bio = document.getElementById('bio').value;
    const messageElement = document.getElementById('profile-message');
    const emailError = document.getElementById('emailError');
    
    // 前端验证
    if (email && !validateEmail(email)) {
        emailError.textContent = '请输入有效的邮箱地址';
        return;
    }
    
    emailError.textContent = '';
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/user/update-info/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // 携带cookie
        body: JSON.stringify({ email, bio })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            messageElement.className = 'message success';
            messageElement.textContent = data.message;
            // 重新加载用户信息
            loadUserInfo();
        } else {
            messageElement.className = 'message error';
            messageElement.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('更新用户信息失败:', error);
        messageElement.className = 'message error';
        messageElement.textContent = '更新失败，请重试';
    });
}

// 修改密码
function changePassword() {
    const oldPassword = document.getElementById('old-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const messageElement = document.getElementById('password-message');
    
    // 前端验证
    if (newPassword !== confirmPassword) {
        messageElement.className = 'message error';
        messageElement.textContent = '两次输入的新密码不一致';
        return;
    }
    
    if (newPassword.length < 6) {
        messageElement.className = 'message error';
        messageElement.textContent = '新密码长度至少为6位';
        return;
    }
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/user/change-password/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // 携带cookie
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword, confirm_password: confirmPassword })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            messageElement.className = 'message success';
            messageElement.textContent = data.message;
            // 清空表单
            document.getElementById('change-password-form').reset();
        } else {
            messageElement.className = 'message error';
            messageElement.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('修改密码失败:', error);
        messageElement.className = 'message error';
        messageElement.textContent = '修改失败，请重试';
    });
}

// 加载用户评价历史
function loadUserReviews() {
    const reviewsListElement = document.getElementById('reviews-list');
    reviewsListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/user/reviews/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const reviews = data.data;
            
            if (reviews.length === 0) {
                reviewsListElement.innerHTML = `<p class="empty-message">您还没有评价过任何美食</p>`;
            } else {
                let html = '';
                reviews.forEach(review => {
                    html += `
                        <div class="review-item">
                            <div class="review-header">
                                <h4><a href="food_detail.html?id=${review.food_id}">${review.food_name}</a></h4>
                                <div class="rating-container">
                                    <span class="rating-label">评分：</span>
                                    <span class="rating">
                                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                                    </span>
                                </div>
                            </div>
                            <div class="review-content">
                                <p>${review.comment}</p>
                                ${review.image ? `<div class="review-image"><img src="${review.image}" alt="评价图片" class="review-image-img"></div>` : ''}
                            </div>
                            <div class="review-meta">
                                <span>${review.created_at}</span>
                            </div>
                            <div class="review-actions">
                                <button class="btn btn-sm" onclick="openEditReviewModal(${review.id}, ${review.rating}, \`${review.comment}\`)" data-review-id="${review.id}">编辑</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteReview(${review.id})">删除</button>
                            </div>
                        </div>
                    `;
                });
                reviewsListElement.innerHTML = html;
            }
        } else {
            reviewsListElement.innerHTML = `<p class="error">${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('加载评价历史失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            reviewsListElement.innerHTML = `<p class="empty-message">您还没有评价过任何美食</p>`;
        } else {
            reviewsListElement.innerHTML = `<p class="error">加载失败，请重试</p>`;
        }
    });
}

// 打开编辑评价模态框
function openEditReviewModal(reviewId, rating, comment) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>编辑评价</h3>
                <span class="close" onclick="closeModal()">&times;</span>
            </div>
            <div class="modal-body">
                <form id="edit-review-form">
                    <input type="hidden" id="edit-review-id" value="${reviewId}">
                    <div class="form-group">
                        <label for="edit-rating">评分:</label>
                        <select id="edit-rating" required>
                            <option value="1" ${rating === 1 ? 'selected' : ''}>1星</option>
                            <option value="2" ${rating === 2 ? 'selected' : ''}>2星</option>
                            <option value="3" ${rating === 3 ? 'selected' : ''}>3星</option>
                            <option value="4" ${rating === 4 ? 'selected' : ''}>4星</option>
                            <option value="5" ${rating === 5 ? 'selected' : ''}>5星</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-comment">评价内容:</label>
                        <textarea id="edit-comment" rows="4" required>${comment}</textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                        <button type="submit" class="btn btn-primary">保存修改</button>
                    </div>
                </form>
                <div id="edit-review-message" class="message"></div>
            </div>
        </div>
    `;
    
    // 添加模态框样式
    const style = document.createElement('style');
    style.textContent = `
        .modal {
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }
        .modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 0;
            border: 1px solid #888;
            width: 80%;
            max-width: 500px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .modal-header {
            padding: 20px;
            background-color: #f39c12;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 {
            margin: 0;
            color: white;
        }
        .close {
            color: white;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .close:hover {
            color: #fef5e7;
        }
        .modal-body {
            padding: 20px;
        }
        .modal-footer {
            padding: 15px 20px;
            background-color: #f9f9f9;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        .modal .form-group {
            margin-bottom: 15px;
        }
        .modal label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #8b4513;
        }
        .modal input,
        .modal select,
        .modal textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #e0d2c3;
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // 添加表单提交事件
    document.getElementById('edit-review-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveEditReview();
    });
}

// 关闭模态框
function closeModal() {
    const modal = document.querySelector('.modal');
    const style = document.querySelector('style:last-child');
    if (modal) {
        modal.remove();
    }
    if (style && style.textContent.includes('.modal')) {
        style.remove();
    }
}

// 保存编辑的评价
function saveEditReview() {
    const reviewId = document.getElementById('edit-review-id').value;
    const rating = document.getElementById('edit-rating').value;
    const comment = document.getElementById('edit-comment').value;
    const messageElement = document.getElementById('edit-review-message');
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/reviews/${reviewId}/update/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // 携带cookie
        body: JSON.stringify({ rating, comment })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            messageElement.className = 'message success';
            messageElement.textContent = data.message;
            // 关闭模态框并重新加载评价列表
            setTimeout(() => {
                closeModal();
                loadUserReviews();
            }, 1500);
        } else {
            messageElement.className = 'message error';
            messageElement.textContent = data.message;
        }
    })
    .catch(error => {
        console.error('修改评价失败:', error);
        messageElement.className = 'message error';
        messageElement.textContent = '修改失败，请重试';
    });
}

// 删除评价
function deleteReview(reviewId) {
    // 使用更友好的确认提示
    const confirmDelete = confirm('确定要删除这条评价吗？此操作不可恢复。');
    if (confirmDelete) {
        const reviewsListElement = document.getElementById('reviews-list');
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.textContent = '删除中...';
        reviewsListElement.appendChild(loadingElement);
        
        const apiBaseUrl = getApiBaseUrl();
        
        fetch(`${apiBaseUrl}/food/api/reviews/${reviewId}/delete/`, {
            method: 'POST',
            credentials: 'include' // 携带cookie
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            loadingElement.remove();
            if (data.status === 'success') {
                // 重新加载评价列表
                loadUserReviews();
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            loadingElement.remove();
            console.error('删除评价失败:', error);
            alert('删除失败，请重试');
        });
    }
}

// 加载分类数据用于筛选
function loadCategories() {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/categories/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const categories = data.data;
            const favoriteFilter = document.getElementById('favoriteFilter');
            
            // 添加分类选项到收藏筛选
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                favoriteFilter.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('加载分类失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            // 使用模拟数据
            const mockCategories = [
                { id: 1, name: '第一食堂' },
                { id: 2, name: '第二食堂' },
                { id: 3, name: '第三食堂' }
            ];
            const favoriteFilter = document.getElementById('favoriteFilter');
            mockCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                favoriteFilter.appendChild(option);
            });
        }
    });
}

// 加载收藏列表
function loadFavorites() {
    const favoritesListElement = document.getElementById('favorites-list');
    favoritesListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/favorites/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const favorites = data.data;
            
            if (favorites.length === 0) {
                favoritesListElement.innerHTML = `<p class="empty-message">您还没有收藏任何美食</p>`;
            } else {
                let html = '';
                favorites.forEach(favorite => {
                    html += `
                        <div class="favorite-item">
                            <input type="checkbox" class="batch-checkbox" data-food-id="${favorite.food_id}">
                            <h3>${favorite.food_name}</h3>
                            <p>${favorite.categoryName}</p>
                            <p>${favorite.description.length > 100 ? favorite.description.substring(0, 100) + '...' : favorite.description}</p>
                            <p class="food-price">¥${favorite.price.toFixed(2)}</p>
                            <p class="food-rating">评分: ${favorite.average_rating} (${favorite.review_count}条评价)</p>
                            <div class="food-actions">
                                <a href="food_detail.html?id=${favorite.food_id}" class="btn btn-sm">查看详情</a>
                                <button class="btn btn-sm btn-danger" onclick="removeFavorite(${favorite.food_id})">取消收藏</button>
                            </div>
                        </div>
                    `;
                });
                favoritesListElement.innerHTML = html;
            }
        } else {
            favoritesListElement.innerHTML = `<p class="error">${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('加载收藏列表失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            favoritesListElement.innerHTML = `<p class="empty-message">您还没有收藏任何美食</p>`;
        } else {
            favoritesListElement.innerHTML = `<p class="error">加载失败，请重试</p>`;
        }
    });
}

// 取消收藏
function removeFavorite(foodId) {
    const favoritesListElement = document.getElementById('favorites-list');
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = '取消收藏中...';
    favoritesListElement.appendChild(loadingElement);
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/favorites/${foodId}/remove/`, {
        method: 'POST',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        loadingElement.remove();
        if (data.status === 'success') {
            // 重新加载收藏列表
            loadFavorites();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        loadingElement.remove();
        console.error('取消收藏失败:', error);
        alert('取消收藏失败，请重试');
    });
}

// 设置搜索和筛选功能
function setupSearchAndFilter() {
    // 评价搜索
    const reviewSearch = document.getElementById('reviewSearch');
    if (reviewSearch) {
        reviewSearch.addEventListener('input', debounce(() => {
            filterReviews();
        }, 300));
    }
    
    // 评价筛选
    const reviewFilter = document.getElementById('reviewFilter');
    if (reviewFilter) {
        reviewFilter.addEventListener('change', () => {
            filterReviews();
        });
    }
    
    // 收藏搜索
    const favoriteSearch = document.getElementById('favoriteSearch');
    if (favoriteSearch) {
        favoriteSearch.addEventListener('input', debounce(() => {
            filterFavorites();
        }, 300));
    }
    
    // 收藏筛选
    const favoriteFilter = document.getElementById('favoriteFilter');
    if (favoriteFilter) {
        favoriteFilter.addEventListener('change', () => {
            filterFavorites();
        });
    }
    
    // 批量删除收藏
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', () => {
            batchDeleteFavorites();
        });
    }
    
    // 导出图片
    const exportImageBtn = document.getElementById('exportImageBtn');
    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', () => {
            exportFavoritesAsImage();
        });
    }
}

// 防抖函数
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// 筛选评价
function filterReviews() {
    const searchTerm = document.getElementById('reviewSearch').value.toLowerCase();
    const filterValue = document.getElementById('reviewFilter').value;
    const reviewItems = document.querySelectorAll('.review-item');
    
    reviewItems.forEach(item => {
        const foodName = item.querySelector('h4').textContent.toLowerCase();
        const comment = item.querySelector('.review-content p').textContent.toLowerCase();
        const rating = item.querySelector('.rating').textContent;
        const starCount = rating.split('★').length - 1;
        
        let matchesSearch = foodName.includes(searchTerm) || comment.includes(searchTerm);
        let matchesFilter = true;
        
        if (filterValue === 'high') {
            matchesFilter = starCount >= 4;
        } else if (filterValue === 'low') {
            matchesFilter = starCount <= 2;
        }
        
        if (matchesSearch && matchesFilter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 筛选收藏
function filterFavorites() {
    const searchTerm = document.getElementById('favoriteSearch').value.toLowerCase();
    const filterValue = document.getElementById('favoriteFilter').value;
    const favoriteItems = document.querySelectorAll('.favorite-item');
    
    favoriteItems.forEach(item => {
        const foodName = item.querySelector('h3').textContent.toLowerCase();
        const category = item.querySelectorAll('p')[0].textContent.toLowerCase();
        const description = item.querySelectorAll('p')[1].textContent.toLowerCase();
        
        let matchesSearch = foodName.includes(searchTerm) || category.includes(searchTerm) || description.includes(searchTerm);
        let matchesFilter = true;
        
        // 这里可以根据实际情况实现分类筛选
        // 由于我们没有实际的分类ID在DOM中，这里暂时不实现
        
        if (matchesSearch && matchesFilter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 批量删除收藏
function batchDeleteFavorites() {
    const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('请先选择要取消收藏的美食');
        return;
    }
    
    const confirmDelete = confirm(`确定要取消收藏这${checkboxes.length}项美食吗？`);
    if (confirmDelete) {
        const foodIds = Array.from(checkboxes).map(cb => cb.dataset.foodId);
        const favoritesListElement = document.getElementById('favorites-list');
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.textContent = '批量取消收藏中...';
        favoritesListElement.appendChild(loadingElement);
        
        const apiBaseUrl = getApiBaseUrl();
        
        // 这里可以使用批量API，暂时使用循环调用
        let deletedCount = 0;
        foodIds.forEach(foodId => {
            fetch(`${apiBaseUrl}/food/api/favorites/${foodId}/remove/`, {
                method: 'POST',
                credentials: 'include' // 携带cookie
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('网络响应失败');
                }
                return response.json();
            })
            .then(data => {
                deletedCount++;
                if (deletedCount === foodIds.length) {
                    loadingElement.remove();
                    loadFavorites();
                }
            })
            .catch(error => {
                deletedCount++;
                console.error('取消收藏失败:', error);
                if (deletedCount === foodIds.length) {
                    loadingElement.remove();
                    loadFavorites();
                }
            });
        });
    }
}

// 显示自定义提示信息
function showNotification(message, type = 'info') {
    // 创建提示元素
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // 设置背景颜色
    switch (type) {
        case 'success':
            notification.style.backgroundColor = 'var(--success-color)';
            break;
        case 'error':
            notification.style.backgroundColor = 'var(--error-color)';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = 'var(--vivo-blue)';
    }
    
    // 添加动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 设置消息内容
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// 导出收藏清单为图片
function exportFavoritesAsImage() {
    const apiBaseUrl = getApiBaseUrl();
    const favoritesListElement = document.getElementById('favorites-list');
    
    // 检查是否有勾选的收藏项
    const checkboxes = document.querySelectorAll('.batch-checkbox:checked');
    if (checkboxes.length === 0) {
        showNotification('请先选择要导出的收藏美食', 'warning');
        return;
    }
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'loading';
    loadingElement.textContent = '正在生成图片...';
    favoritesListElement.appendChild(loadingElement);
    
    // 获取收藏列表数据
    fetch(`${apiBaseUrl}/food/api/favorites/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        loadingElement.remove();
        if (data.status === 'success') {
            const favorites = data.data;
            
            // 过滤出勾选的收藏项
            const selectedFoodIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.foodId));
            const selectedFavorites = favorites.filter(fav => selectedFoodIds.includes(fav.food_id));
            
            if (selectedFavorites.length === 0) {
                showNotification('未找到选中的收藏项', 'error');
                return;
            }
            
            // 生成图片
            generateFavoritesImage(selectedFavorites);
        } else {
            showNotification('获取收藏数据失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        loadingElement.remove();
        console.error('导出图片失败:', error);
        showNotification('导出图片失败，请重试', 'error');
    });
}

// 生成收藏清单图片
function generateFavoritesImage(favorites) {
    // 设置Canvas尺寸
    const width = 800;
    const height = 600 + (favorites.length * 160); // 动态调整高度
    
    // 创建Canvas元素
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = '#fef9f0';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制标题
    ctx.fillStyle = '#d35400';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('我的美食收藏清单', width / 2, 50);
    
    // 绘制统计信息
    ctx.fillStyle = '#5d4037';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`收藏数量: ${favorites.length}`, 50, 100);
    ctx.fillText(`生成时间: ${new Date().toLocaleString()}`, 50, 130);
    
    // 绘制分隔线
    ctx.strokeStyle = '#e0d2c3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 150);
    ctx.lineTo(width - 50, 150);
    ctx.stroke();
    
    // 绘制美食列表
    let y = 200;
    favorites.forEach((favorite, index) => {
        // 绘制美食项背景
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(50, y, width - 100, 140);
        
        // 绘制美食图片
        const image = new Image();
        image.onload = function() {
            // 绘制图片
            ctx.drawImage(image, 70, y + 20, 80, 80);
        };
        // 使用默认图片或美食图片
        image.src = favorite.image || favorite.image_url || '../images/汉堡.jpg';
        
        // 绘制美食名称
        ctx.fillStyle = '#d35400';
        ctx.font = '18px Arial';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`${index + 1}. ${favorite.food_name}`, 170, y + 40);
        
        // 绘制美食信息
        ctx.fillStyle = '#5d4037';
        ctx.font = '14px Arial';
        ctx.fillText(`分类: ${favorite.categoryName}`, 170, y + 65);
        ctx.fillText(`价格: ¥${favorite.price.toFixed(2)} | 评分: ${favorite.average_rating}`, 170, y + 85);
        if (favorite.address) {
            ctx.fillText(`地址: ${favorite.address}`, 170, y + 105);
        }
        
        y += 160;
    });
    
    // 绘制页脚
    ctx.fillStyle = '#5d4037';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('校园美食测评与推荐系统', width / 2, y + 50);
    
    // 将Canvas转换为图片
    const imageUrl = canvas.toDataURL('image/png');
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `收藏清单_${new Date().getTime()}.png`;
    link.click();
    
    // 只保留下载功能，取消分享功能
    showNotification('图片导出成功，已开始下载', 'success');
}

// 设置返回顶部按钮
function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 设置头像上传
function setupAvatarUpload() {
    const avatarInput = document.getElementById('avatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 预览头像
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById('avatarPreview').src = e.target.result;
                };
                reader.readAsDataURL(file);
                
                // 压缩并上传头像
                compressAndUploadAvatar(file);
            }
        });
    }
}

// 压缩并上传头像
function compressAndUploadAvatar(file) {
    // 图片压缩配置
    const maxWidth = 300;
    const maxHeight = 300;
    const quality = 0.8;
    
    // 检查文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        const messageElement = document.getElementById('profile-message');
        if (messageElement) {
            messageElement.className = 'message error';
            messageElement.textContent = '仅支持JPG、PNG和GIF格式的图片';
        }
        return;
    }
    
    // 检查文件大小（10MB上限）
    if (file.size > 10 * 1024 * 1024) {
        const messageElement = document.getElementById('profile-message');
        if (messageElement) {
            messageElement.className = 'message error';
            messageElement.textContent = '图片大小不能超过10MB';
        }
        return;
    }
    
    // 使用Canvas进行图片压缩
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            // 计算压缩后的尺寸
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            
            // 创建Canvas并绘制压缩后的图片
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // 转换为Blob对象
            canvas.toBlob((blob) => {
                if (blob) {
                    // 创建新的File对象
                    const compressedFile = new File([blob], file.name, {
                        type: file.type,
                        lastModified: Date.now()
                    });
                    
                    // 上传压缩后的图片
                    uploadAvatar(compressedFile);
                }
            }, file.type, quality);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 上传头像
function uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/user/upload-avatar/`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // 更新localStorage中的头像
            localStorage.setItem('avatar', data.data.avatar);
            
            // 重新设置导航栏，显示新头像
            setupNavbar();
            
            // 重新加载用户信息，更新头像预览
            loadUserInfo();
            
            // 显示成功消息
            const messageElement = document.getElementById('profile-message');
            if (messageElement) {
                messageElement.className = 'message success';
                messageElement.textContent = '头像上传成功';
            }
        } else {
            // 显示错误消息
            const messageElement = document.getElementById('profile-message');
            if (messageElement) {
                messageElement.className = 'message error';
                messageElement.textContent = '头像上传失败：' + data.message;
            }
        }
    })
    .catch(error => {
        console.error('上传头像失败:', error);
        // 显示错误消息
        const messageElement = document.getElementById('profile-message');
        if (messageElement) {
            messageElement.className = 'message error';
            messageElement.textContent = '头像上传失败，请重试';
        }
    });
}

// 退出登录函数 - 使用utils.js中的logout函数

// 加载通知列表
function loadNotifications() {
    const notificationsListElement = document.getElementById('notifications-list');
    if (!notificationsListElement) return;
    
    notificationsListElement.innerHTML = '<div class="loading">加载中...</div>';
    
    const apiBaseUrl = getApiBaseUrl();
    console.log('加载通知列表，API URL:', `${apiBaseUrl}/food/api/notifications/`);
    
    fetch(`${apiBaseUrl}/food/api/notifications/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        console.log('通知API响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`网络响应失败: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('通知API响应数据:', data);
        if (data.status === 'success') {
            const notifications = data.data;
            
            if (notifications.length === 0) {
                notificationsListElement.innerHTML = `<p class="empty-message">您还没有收到任何通知</p>`;
            } else {
                let html = '';
                notifications.forEach(notification => {
                    const isReadClass = notification.is_read ? 'read' : 'unread';
                    const readStatus = notification.is_read ? '已读' : '未读';
                    
                    html += `
                        <div class="notification-item ${isReadClass}">
                            <div class="notification-content">
                                <p>${notification.content}</p>
                                <span class="notification-time">${notification.created_at}</span>
                                <span class="notification-status">${readStatus}</span>
                            </div>
                            <div class="notification-actions">
                                ${!notification.is_read ? `<button class="btn btn-sm" onclick="markNotificationAsRead(${notification.id})">标记已读</button>` : ''}
                                <button class="btn btn-sm btn-danger" onclick="deleteNotification(${notification.id})">删除</button>
                            </div>
                        </div>
                    `;
                });
                notificationsListElement.innerHTML = html;
            }
            // 更新通知管理选项卡的未读数量
            updateNotificationTabBadge();
        } else {
            console.error('通知API返回错误:', data.message);
            notificationsListElement.innerHTML = `<p class="error">${data.message}</p>`;
        }
    })
    .catch(error => {
        console.error('加载通知列表失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            notificationsListElement.innerHTML = `<p class="empty-message">您还没有收到任何通知</p>`;
        } else {
            notificationsListElement.innerHTML = `<p class="error">加载失败，请重试</p>`;
        }
    });
}

// 设置通知相关的事件处理
function setupNotificationHandlers() {
    // 标记所有已读按钮
    const markAllReadBtn = document.getElementById('markAllReadBtn');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }
    
    // 清空所有通知按钮
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllNotifications);
    }
}

// 标记通知为已读
function markNotificationAsRead(notificationId) {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/notifications/${notificationId}/read/`, {
        method: 'POST',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showNotification('通知已标记为已读', 'success');
            // 重新加载通知列表
            loadNotifications();
            // 更新导航栏未读通知数量
            updateUnreadNotificationCount();
        } else {
            showNotification('标记失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('标记通知已读失败:', error);
        showNotification('操作失败，请重试', 'error');
    });
}

// 删除通知
function deleteNotification(notificationId) {
    const confirmDelete = confirm('确定要删除这条通知吗？');
    if (confirmDelete) {
        const apiBaseUrl = getApiBaseUrl();
        
        fetch(`${apiBaseUrl}/food/api/notifications/${notificationId}/delete/`, {
            method: 'POST',
            credentials: 'include' // 携带cookie
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showNotification('通知已删除', 'success');
                // 重新加载通知列表
                loadNotifications();
                // 更新导航栏未读通知数量
                updateUnreadNotificationCount();
            } else {
                showNotification('删除失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('删除通知失败:', error);
            showNotification('操作失败，请重试', 'error');
        });
    }
}

// 标记所有通知为已读
function markAllNotificationsAsRead() {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/notifications/mark-all-read/`, {
        method: 'POST',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            showNotification('所有通知已标记为已读', 'success');
            // 重新加载通知列表
            loadNotifications();
            // 更新导航栏未读通知数量
            updateUnreadNotificationCount();
        } else {
            showNotification('操作失败: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('标记所有通知已读失败:', error);
        showNotification('操作失败，请重试', 'error');
    });
}

// 清空所有通知
function clearAllNotifications() {
    const confirmDelete = confirm('确定要清空所有通知吗？此操作不可恢复。');
    if (confirmDelete) {
        const apiBaseUrl = getApiBaseUrl();
        
        fetch(`${apiBaseUrl}/food/api/notifications/clear-all/`, {
            method: 'POST',
            credentials: 'include' // 携带cookie
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showNotification('所有通知已清空', 'success');
                // 重新加载通知列表
                loadNotifications();
                // 更新导航栏未读通知数量
                updateUnreadNotificationCount();
            } else {
                showNotification('操作失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('清空通知失败:', error);
            showNotification('操作失败，请重试', 'error');
        });
    }
}

// 更新导航栏未读通知数量
function updateUnreadNotificationCount() {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/notifications/unread-count/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const unreadCount = data.data;
            const notificationBadge = document.getElementById('notification-badge');
            if (notificationBadge) {
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount;
                    notificationBadge.style.display = 'inline-block';
                } else {
                    notificationBadge.style.display = 'none';
                }
            }
            // 同时更新通知管理选项卡的未读数量
            updateNotificationTabBadge();
        }
    })
    .catch(error => {
        console.error('获取未读通知数量失败:', error);
    });
}

// 更新通知管理选项卡的未读数量徽章
function updateNotificationTabBadge() {
    const apiBaseUrl = getApiBaseUrl();
    
    fetch(`${apiBaseUrl}/food/api/notifications/unread-count/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('网络响应失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            const unreadCount = data.data;
            // 查找通知管理选项卡按钮
            const notificationTab = document.querySelector('.tab-btn[data-tab="notifications"]');
            if (notificationTab) {
                // 移除现有的徽章
                let existingBadge = notificationTab.querySelector('.notification-badge');
                if (existingBadge) {
                    existingBadge.remove();
                }
                // 添加新的徽章
                if (unreadCount > 0) {
                    const badge = document.createElement('span');
                    badge.className = 'notification-badge';
                    badge.textContent = unreadCount;
                    badge.style.position = 'absolute';
                    badge.style.top = '-5px';
                    badge.style.right = '-10px';
                    badge.style.backgroundColor = 'var(--danger-color)';
                    badge.style.color = 'white';
                    badge.style.borderRadius = '50%';
                    badge.style.width = '20px';
                    badge.style.height = '20px';
                    badge.style.fontSize = '12px';
                    badge.style.fontWeight = 'bold';
                    badge.style.display = 'flex';
                    badge.style.alignItems = 'center';
                    badge.style.justifyContent = 'center';
                    badge.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                    notificationTab.style.position = 'relative';
                    notificationTab.appendChild(badge);
                }
            }
        }
    })
    .catch(error => {
        console.error('获取未读通知数量失败:', error);
    });
}