document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password1 = document.getElementById('password1').value;
    const password2 = document.getElementById('password2').value;
    
    // 简单的前端验证
    if (!username || !password1 || !password2) {
        createErrorMessage('请填写所有字段', 'error');
        return;
    }
    
    if (password1 !== password2) {
        createErrorMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    if (password1.length < 6) {
        createErrorMessage('密码长度至少为6位', 'error');
        return;
    }
    
    try {
        // 获取API基础URL
        const apiBaseUrl = getApiBaseUrl();
        
        // 发送注册请求
        await apiRequest(`${apiBaseUrl}/food/api/register/`, {
            method: 'POST',
            body: { username, password1, password2 }
        });
        
        createErrorMessage('注册成功！正在自动登录...', 'success');
        
        // 自动登录
        await apiRequest(`${apiBaseUrl}/food/api/login/`, {
            method: 'POST',
            body: { username, password: password1 }
        });
        
        // 保存登录状态到localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        
        // 跳转到首页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        // 错误已经在apiRequest中处理
        console.error('注册失败:', error);
    }
});