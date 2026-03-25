// 公共工具函数

// 检测当前环境，返回API基础URL
function getApiBaseUrl() {
    // 检查当前是否通过HTTP协议访问
    if (window.location.protocol.startsWith('http')) {
        // 通过Django服务器访问，使用相对路径或完整URL
        return window.location.origin;
    } else {
        // 直接打开文件，使用默认的本地服务器地址
        return 'http://localhost:8000';
    }
}

// 检测当前环境，返回相对路径前缀
function getRelativePathPrefix() {
    // 检查当前是否通过HTTP协议访问
    if (window.location.protocol.startsWith('http')) {
        // 通过Django服务器访问，URL中包含/static/html/
        return '/static/html/';
    } else {
        // 直接打开文件，使用相对路径
        return '';
    }
}

// 创建错误提示元素
function createErrorMessage(message, type = 'error') {
    // 检查是否已存在错误提示元素
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        document.body.appendChild(errorContainer);
    }
    
    // 创建错误信息元素
    const errorElement = document.createElement('div');
    errorElement.className = `error-message ${type}`;
    errorElement.textContent = message;
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'error-close';
    closeButton.textContent = '×';
    closeButton.onclick = function() {
        errorElement.remove();
        if (errorContainer.children.length === 0) {
            errorContainer.remove();
        }
    };
    
    errorElement.appendChild(closeButton);
    errorContainer.appendChild(errorElement);
    
    // 3秒后自动消失
    setTimeout(() => {
        errorElement.classList.add('fade-out');
        setTimeout(() => {
            errorElement.remove();
            if (errorContainer.children.length === 0) {
                errorContainer.remove();
            }
        }, 500);
    }, 3000);
}

// 显示加载状态
function showLoading(message = '加载中...') {
    // 检查是否已存在加载元素
    let loadingElement = document.getElementById('loading-container');
    if (loadingElement) {
        return;
    }
    
    loadingElement = document.createElement('div');
    loadingElement.id = 'loading-container';
    loadingElement.className = 'loading-container';
    loadingElement.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-message">${message}</div>
    `;
    
    document.body.appendChild(loadingElement);
}

// 隐藏加载状态
function hideLoading() {
    const loadingElement = document.getElementById('loading-container');
    if (loadingElement) {
        loadingElement.remove();
    }
}

// 统一的API请求函数
async function apiRequest(url, options = {}) {
    try {
        showLoading('处理中...');
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const mergedOptions = { ...defaultOptions, ...options };
        
        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }
        
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'error') {
            throw new Error(data.message || '操作失败');
        }
        
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        console.error('API请求错误:', error);
        createErrorMessage(error.message || '网络请求失败，请稍后重试');
        throw error;
    }
}

// 退出登录函数
async function logout() {
    try {
        const apiBaseUrl = getApiBaseUrl();
        await apiRequest(`${apiBaseUrl}/food/api/logout/`, {
            method: 'POST',
            credentials: 'include' // 携带cookie
        });
        
        // 清除localStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        
        // 跳转到首页
        window.location.href = 'index.html';
    } catch (error) {
        console.error('退出登录失败:', error);
        // 直接打开文件时，API请求会失败，这里可以添加降级处理
        if (window.location.protocol === 'file:') {
            // 清除localStorage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar');
            // 跳转到首页
            window.location.href = 'index.html';
        } else {
            createErrorMessage('退出登录失败，请重试', 'error');
        }
    }
}

// 检查是否为超级管理员
async function checkAdminStatus() {
    try {
        const apiBaseUrl = getApiBaseUrl();
        const data = await apiRequest(`${apiBaseUrl}/food/api/user/info/`, {
            credentials: 'include'
        });
        
        if (data.status === 'success' && data.data.is_superuser) {
            if (document.getElementById('admin-link')) document.getElementById('admin-link').style.display = 'block';
            if (document.getElementById('system-admin-link')) document.getElementById('system-admin-link').style.display = 'block';
        } else {
            if (document.getElementById('admin-link')) document.getElementById('admin-link').style.display = 'none';
            if (document.getElementById('system-admin-link')) document.getElementById('system-admin-link').style.display = 'none';
        }
    } catch (error) {
        console.error('检查管理员状态失败:', error);
        // 直接打开文件时，API请求会失败，隐藏管理员链接
        document.getElementById('admin-link').style.display = 'none';
    }
}

// 设置导航栏
async function setupNavbar() {
    const navbarMenu = document.getElementById('navbarMenu');
    const apiBaseUrl = getApiBaseUrl();
    const prefix = getRelativePathPrefix();
    
    // 获取当前页面的文件名
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    try {
        // 从后端获取用户信息，验证实际登录状态
        const data = await apiRequest(`${apiBaseUrl}/food/api/user/info/`, {
            credentials: 'include'
        });
        
        if (data.status === 'success') {
            // 已登录，更新localStorage和导航栏
            const username = data.data.username;
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('avatar', data.data.avatar);
            
            // 获取当前URL的锚点
            const currentHash = window.location.hash;
            
            navbarMenu.innerHTML = `
                <li><a href="${prefix}index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>首页</a></li>
                <li><a href="${prefix}recommend.html" ${currentPage === 'recommend.html' ? 'class="active"' : ''}>美食推荐</a></li>
                <li><a href="${prefix}all_foods.html" ${currentPage === 'all_foods.html' ? 'class="active"' : ''}>全部美食</a></li>
                <li><a href="${prefix}user_center.html" ${currentPage === 'user_center.html' ? 'class="active"' : ''}>用户中心</a></li>
                <li class="notification-item">
                    <a href="${prefix}user_center.html#notifications">
                        通知
                        <span id="notification-badge" class="notification-badge"></span>
                    </a>
                </li>
                <li class="user-profile">
                    <img src="${data.data.avatar}" alt="用户头像" class="navbar-avatar">
                    <span style="color: #6495ed; font-weight: bold;">欢迎，${username}</span>
                </li>
                <li><a href="#" onclick="logout()">退出</a></li>
                <li id="admin-link"><a href="${prefix}admin.html" ${currentPage === 'admin.html' ? 'class="active"' : ''}>管理中心</a></li>
                <li id="system-admin-link" style="display: none;"><a href="${apiBaseUrl}/admin/" target="_blank">系统运维</a></li>
            `;
            
            // 更新未读通知数量
            updateUnreadNotificationCount();
            
            // 检查是否为超级管理员
            await checkAdminStatus();
        } else {
            // 未登录，清除localStorage和更新导航栏
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('avatar');
            
            // 获取当前URL的锚点
            const currentHash = window.location.hash;
            
            navbarMenu.innerHTML = `
                <li><a href="${prefix}index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>首页</a></li>
                <li><a href="${prefix}recommend.html" ${currentPage === 'recommend.html' ? 'class="active"' : ''}>美食推荐</a></li>
                <li><a href="${prefix}all_foods.html" ${currentPage === 'all_foods.html' ? 'class="active"' : ''}>全部美食</a></li>
                <li><a href="${prefix}login.html" ${currentPage === 'login.html' ? 'class="active"' : ''}>登录</a></li>
                <li><a href="${prefix}register.html" ${currentPage === 'register.html' ? 'class="active"' : ''}>注册</a></li>
            `;
        }
    } catch (error) {
        console.error('获取用户信息失败:', error);
        // 发生错误时，清除localStorage和重置导航栏
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        localStorage.removeItem('avatar');
        
        // 获取当前URL的锚点
        const currentHash = window.location.hash;
        
        navbarMenu.innerHTML = `
            <li><a href="${prefix}index.html" ${currentPage === 'index.html' ? 'class="active"' : ''}>首页</a></li>
            <li><a href="${prefix}recommend.html" ${currentPage === 'recommend.html' ? 'class="active"' : ''}>美食推荐</a></li>
            <li><a href="${prefix}all_foods.html" ${currentPage === 'all_foods.html' ? 'class="active"' : ''}>全部美食</a></li>
            <li><a href="${prefix}login.html" ${currentPage === 'login.html' ? 'class="active"' : ''}>登录</a></li>
            <li><a href="${prefix}register.html" ${currentPage === 'register.html' ? 'class="active"' : ''}>注册</a></li>
        `;
    } finally {
        // 添加导航栏滚动效果
        addNavbarScrollEffect();
        // 初始化返回顶部按钮
        initBackToTopButton();
    }
}

// 添加导航栏滚动效果
function addNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// 初始化返回顶部按钮
function initBackToTopButton() {
    // 检查是否已存在返回顶部按钮
    if (document.querySelector('.back-to-top')) {
        return;
    }
    
    // 创建返回顶部按钮
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '↑';
    backToTopButton.title = '返回顶部';
    document.body.appendChild(backToTopButton);
    
    // 显示/隐藏返回顶部按钮
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });
    
    // 点击返回顶部
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// 平滑滚动到指定元素
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth'
        });
    }
}

// 更新导航栏未读通知数量
function updateUnreadNotificationCount() {
    const apiBaseUrl = getApiBaseUrl();
    console.log('更新导航栏未读通知数量，API URL:', `${apiBaseUrl}/food/api/notifications/unread-count/`);
    
    fetch(`${apiBaseUrl}/food/api/notifications/unread-count/`, {
        method: 'GET',
        credentials: 'include' // 携带cookie
    })
    .then(response => {
        console.log('未读通知数量API响应状态:', response.status);
        if (!response.ok) {
            throw new Error(`网络响应失败: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('未读通知数量API响应数据:', data);
        if (data.status === 'success') {
            const unreadCount = data.data;
            console.log('未读通知数量:', unreadCount);
            const notificationBadge = document.getElementById('notification-badge');
            if (notificationBadge) {
                console.log('找到通知徽章元素');
                if (unreadCount > 0) {
                    notificationBadge.textContent = unreadCount;
                    notificationBadge.style.display = 'inline-block';
                    console.log('显示通知徽章，数量:', unreadCount);
                } else {
                    notificationBadge.style.display = 'none';
                    console.log('隐藏通知徽章');
                }
            } else {
                console.log('未找到通知徽章元素');
            }
        } else {
            console.error('未读通知数量API返回错误:', data.message);
        }
    })
    .catch(error => {
        console.error('获取未读通知数量失败:', error);
    });
}
