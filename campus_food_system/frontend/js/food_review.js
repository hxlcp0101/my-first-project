/**
 * food_review.js
 */
function initReviewSystem() {
    checkUserLoginStatus();
}

function checkUserLoginStatus() {
    const apiBaseUrl = getApiBaseUrl();
    const container = document.getElementById('reviewFormContainer');

    fetch(`${apiBaseUrl}/food/api/user/info/`, { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            renderReviewForm(container); // 只有登录成功才会渲染
        } else {
            container.innerHTML = '<p>请先<a href="login.html">登录</a>后再发表评价</p>';
        }
    });
}

function renderReviewForm(container) {
    // 1. 渲染 HTML。注意：textarea 必须有明确的 ID，星星使用 span 避免 button 冲突
    container.innerHTML = `
        <div class="review-box">
            <h3>发表测评</h3>
            <form id="activeReviewForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label class="form-label">我的评分：</label>
                    <div id="starContainer" class="star-container">
                        <span class="star-item" data-v="1">★</span>
                        <span class="star-item" data-v="2">★</span>
                        <span class="star-item" data-v="3">★</span>
                        <span class="star-item" data-v="4">★</span>
                        <span class="star-item" data-v="5">★</span>
                        <input type="hidden" id="finalRating" value="5">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">评价内容：</label>
                    <textarea id="finalComment" class="form-textarea" placeholder="写下你的真实感受（至少5个字）" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">上传图片（可选）：</label>
                    <div class="upload-section">
                        <div class="upload-card">
                            <input type="file" id="reviewImage" accept="image/*" class="file-input">
                            <label for="reviewImage" class="upload-label">
                                <div class="upload-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                                <div class="upload-text">
                                    <div class="upload-title">添加图片</div>
                                    <div class="upload-subtitle">点击或拖拽图片到此处</div>
                                </div>
                            </label>
                        </div>
                        <div id="imagePreview" class="image-preview"></div>
                    </div>
                </div>
                <button type="submit" class="submit-btn" id="submitBtn">发布评价</button>
            </form>
            <div id="responseMsg"></div>
        </div>
    `;

    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        /* 评价表单样式 */
        .review-box {
            background-color: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 30px;
            margin-top: 20px;
        }
        
        .review-box h3 {
            color: var(--vivo-blue);
            margin-bottom: 25px;
            font-size: 1.5rem;
            text-align: center;
        }
        
        .form-group {
            margin-bottom: 25px;
        }
        
        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: var(--text-color);
            font-size: 14px;
        }
        
        .star-container {
            display: flex;
            gap: 10px;
        }
        
        .star-item {
            font-size: 30px;
            cursor: pointer;
            color: var(--vivo-blue);
            transition: all 0.3s ease;
        }
        
        .star-item:hover {
            transform: scale(1.2);
        }
        
        .form-textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            resize: vertical;
            min-height: 120px;
            font-size: 14px;
            font-family: Arial, sans-serif;
            background-color: var(--white);
            color: var(--text-color);
        }
        
        .form-textarea:focus {
            outline: none;
            border-color: var(--vivo-blue);
            box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.2);
        }
        
        /* 上传区域样式 */
        .upload-section {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .upload-card {
            position: relative;
            border: 2px dashed #e0e0e0;
            border-radius: 12px;
            padding: 40px 20px;
            text-align: center;
            background-color: #fafafa;
            transition: all 0.3s ease;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .upload-card:hover {
            border-color: var(--vivo-blue);
            background-color: var(--vivo-light-blue);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 153, 255, 0.1);
        }
        
        .file-input {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
            z-index: 2;
        }
        
        .upload-label {
            display: block;
            cursor: pointer;
            z-index: 1;
        }
        
        .upload-icon {
            margin-bottom: 15px;
            color: var(--vivo-blue);
        }
        
        .upload-icon svg {
            transition: all 0.3s ease;
        }
        
        .upload-card:hover .upload-icon svg {
            transform: scale(1.1);
        }
        
        .upload-text {
            text-align: center;
        }
        
        .upload-title {
            font-size: 16px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        
        .upload-subtitle {
            font-size: 14px;
            color: #999;
        }
        
        /* 图片预览样式 */
        .image-preview {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .preview-item {
            position: relative;
            width: 100px;
            height: 100px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #e0d2c3;
        }
        
        .preview-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .preview-item .remove-btn {
            position: absolute;
            top: 5px;
            right: 5px;
            background-color: rgba(231, 76, 60, 0.8);
            color: white;
            border: none;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .submit-btn {
            background-color: #f39c12;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 30px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            width: 100%;
            margin-top: 10px;
        }
        
        .submit-btn:hover {
            background-color: #e67e22;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
        }
        
        .submit-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .review-box {
                padding: 20px;
            }
            
            .star-item {
                font-size: 24px;
            }
            
            .file-upload-container {
                padding: 30px 15px;
            }
            
            .file-icon {
                font-size: 36px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // 2. 激活星星点击逻辑 (解决“不能评级”)
    const stars = container.querySelectorAll('.star-item');
    const ratingInput = document.getElementById('finalRating');

    stars.forEach(star => {
        star.style.fontSize = '30px';
        star.style.cursor = 'pointer';
        star.style.color = 'var(--vivo-blue)'; // 默认亮起

        star.onclick = function() {
            const val = this.getAttribute('data-v');
            ratingInput.value = val;
            // 更新颜色
            stars.forEach((s, i) => {
                s.style.color = (i < val) ? 'var(--vivo-blue)' : '#ccc';
            });
        };
    });
    
    // 3. 添加图片预览功能
    const fileInput = document.getElementById('reviewImage');
    const imagePreview = document.getElementById('imagePreview');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // 清空预览
                imagePreview.innerHTML = '';
                
                // 创建预览元素
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="预览图片">
                    <button class="remove-btn" onclick="removeImagePreview()">×</button>
                `;
                imagePreview.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. 激活提交逻辑 (解决“提交没反应”)
    const form = document.getElementById('activeReviewForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        submitReviewData();
    };
}

function submitReviewData() {
    const apiBaseUrl = getApiBaseUrl();
    const foodId = getFoodId();
    const rating = document.getElementById('finalRating').value;
    const comment = document.getElementById('finalComment').value;
    const image = document.getElementById('reviewImage').files[0];
    const btn = document.getElementById('submitBtn');

    if (comment.trim().length < 5) {
        alert("评价内容太短了！");
        return;
    }

    // 自动获取 Django 的 CSRF Token
    const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    btn.disabled = true;
    btn.innerText = "提交中...";

    // 创建FormData对象
    const formData = new FormData();
    formData.append('food_id', parseInt(foodId));
    formData.append('rating', parseInt(rating));
    formData.append('comment', comment);
    if (image) {
        formData.append('image', image);
    }

    fetch(`${apiBaseUrl}/food/api/reviews/submit/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken
        },
        credentials: 'include',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert("评价成功！");
            location.reload();
        } else {
            // 显示错误消息，包括关键字错误
            alert("失败：" + data.message);
            btn.disabled = false;
            btn.innerText = "重新提交";
        }
    })
    .catch(() => {
        alert("网络异常，请检查后端服务");
        btn.disabled = false;
        btn.innerText = "重新提交";
    });
}