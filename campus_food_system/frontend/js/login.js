document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 简单的前端验证
    if (!username || !password) {
        createErrorMessage('请输入用户名和密码', 'error');
        return;
    }
    
    try {
        // 获取API基础URL
        const apiBaseUrl = getApiBaseUrl();
        
        // 发送AJAX请求到后端API
        const data = await apiRequest(`${apiBaseUrl}/food/api/login/`, {
            method: 'POST',
            body: { username, password }
        });
        
        if (data.status === 'success') {
            createErrorMessage('登录成功！', 'success');
            
            // 保存登录状态到localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            
            // 跳转到首页
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        // 错误已经在apiRequest中处理
        console.error('登录失败:', error);
    }
});