from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from food_app.models import Food, FoodCategory, Review, Tag, Keyword, Carousel, UserProfile, Favorite, Notification

# 配置日志
logger = logging.getLogger(__name__)

# 用户注册 API
@csrf_exempt
def api_register(request):
    if request.method == 'POST':
        try:
            # 尝试解析请求体
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                logger.error(f'注册请求数据格式错误: {str(e)}')
                return JsonResponse({'status': 'error', 'message': '请求数据格式错误，请检查输入'})
            username = data.get('username')
            password1 = data.get('password1')
            password2 = data.get('password2')
            
            if not username or not password1 or not password2:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            if password1 != password2:
                return JsonResponse({'status': 'error', 'message': '两次输入的密码不一致'})
            
            if len(password1) < 6:
                return JsonResponse({'status': 'error', 'message': '密码长度至少为6位'})
            
            if len(username) < 3:
                return JsonResponse({'status': 'error', 'message': '用户名长度至少为3位'})
            
            if not username.isalnum():
                return JsonResponse({'status': 'error', 'message': '用户名只能包含字母和数字'})
            
            # 检查用户名是否已存在
            from django.contrib.auth.models import User
            if User.objects.filter(username=username).exists():
                return JsonResponse({'status': 'error', 'message': '用户名已存在'})
            
            # 创建用户
            try:
                user = User.objects.create_user(username=username, password=password1)
                user.save()
                logger.info(f'用户注册成功: {username}')
                return JsonResponse({'status': 'success', 'message': '注册成功'})
            except Exception as create_error:
                logger.error(f'创建用户失败: {str(create_error)}')
                return JsonResponse({'status': 'error', 'message': '创建用户失败，请稍后重试'})
        except Exception as e:
            logger.error(f'注册请求处理失败: {str(e)}')
            return JsonResponse({'status': 'error', 'message': '服务器内部错误，请稍后重试'})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 用户登录 API
@csrf_exempt
def api_login(request):
    if request.method == 'POST':
        try:
            # 尝试解析请求体
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                logger.error(f'登录请求数据格式错误: {str(e)}')
                return JsonResponse({'status': 'error', 'message': '请求数据格式错误，请检查输入'})
            
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                return JsonResponse({'status': 'error', 'message': '请输入用户名和密码'})
            
            # 验证用户
            try:
                user = authenticate(username=username, password=password)
                if user is not None:
                    login(request, user)
                    
                    # 增加用户访问次数
                    from .models import UserProfile
                    profile, created = UserProfile.objects.get_or_create(user=user)
                    profile.visit_count += 1
                    profile.save()
                    
                    logger.info(f'用户登录成功: {username}')
                    return JsonResponse({'status': 'success', 'message': '登录成功'})
                else:
                    logger.warning(f'用户登录失败: 用户名或密码错误 - {username}')
                    return JsonResponse({'status': 'error', 'message': '用户名或密码错误'})
            except Exception as auth_error:
                logger.error(f'用户认证失败: {str(auth_error)}')
                return JsonResponse({'status': 'error', 'message': '认证失败，请稍后重试'})
        except Exception as e:
            logger.error(f'登录请求处理失败: {str(e)}')
            return JsonResponse({'status': 'error', 'message': '服务器内部错误，请稍后重试'})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 用户退出 API
@csrf_exempt
def api_logout(request):
    if request.method == 'POST':
        try:
            # 记录退出用户信息
            if request.user.is_authenticated:
                username = request.user.username
                logout(request)
                logger.info(f'用户退出成功: {username}')
            else:
                logout(request)
                logger.info('匿名用户退出')
            return JsonResponse({'status': 'success', 'message': '退出成功'})
        except Exception as e:
            logger.error(f'退出登录失败: {str(e)}')
            return JsonResponse({'status': 'error', 'message': '服务器内部错误，请稍后重试'})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取美食分类 API
@csrf_exempt
def api_get_categories(request):
    if request.method == 'GET':
        try:
            categories = FoodCategory.objects.all()
            category_list = []
            for category in categories:
                category_list.append({
                    'id': category.id,
                    'name': category.name,
                    'description': category.description,
                    'food_count': category.food_set.count(),
                    'image': category.image.url if category.image else ''
                })
            return JsonResponse({'status': 'success', 'data': category_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取美食列表 API
@csrf_exempt
def api_get_foods(request):
    if request.method == 'GET':
        try:
            category_id = request.GET.get('category_id')
            tag_id = request.GET.get('tag_id')
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            
            # 调用通用的美食查询函数
            foods = get_filtered_foods(category_id, tag_id)
            
            total_count = len(foods)
            total_pages = (total_count + page_size - 1) // page_size
            
            # 分页切片
            start = (page - 1) * page_size
            end = start + page_size
            paginated_foods = foods[start:end]
            
            food_list = []
            for food in paginated_foods:
                tags = food.tags.all()
                tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                food_list.append({
                'id': food.id,
                'name': food.name,
                'category': food.category.id,
                'categoryName': food.category.name,
                'tags': tag_list,
                'description': food.description,
                'price': float(food.price),
                'address': food.address or '',
                'distance': getattr(food, 'distance', None),
                'average_rating': food.average_rating,
                'review_count': food.review_count,
                'image': food.image.url if food.image else ''
            })
            return JsonResponse({
                'status': 'success', 
                'data': food_list,
                'pagination': {
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'current_page': page,
                    'page_size': page_size
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 通用的美食查询函数
def get_filtered_foods(category_id=None, tag_id=None, tag_ids=None, order_by=None, limit=None):
    """根据筛选参数查询美食
    
    Args:
        category_id: 分类ID
        tag_id: 单个标签ID（向后兼容）
        tag_ids: 多个标签ID列表
        order_by: 排序方式
        limit: 限制数量
    
    Returns:
        查询结果
    """
    # 基础查询
    if category_id:
        foods = Food.objects.filter(category_id=category_id)
    else:
        foods = Food.objects.all()
    
    # 处理单个标签（向后兼容）
    if tag_id:
        foods = foods.filter(tags__id=tag_id)
    
    # 处理多个标签
    if tag_ids:
        for tag_id in tag_ids:
            foods = foods.filter(tags__id=tag_id)
    
    # 为所有美食生成模拟距离（0.1-2.0公里）
    food_list = list(foods)
    import random
    for food in food_list:
        # 使用美食ID作为种子，确保每次生成相同的距离
        random.seed(food.id)
        food.distance = round(random.uniform(0.1, 2.0), 1)
    
    # 排序
    if order_by:
        # 处理距离排序
        if order_by == 'distance' or order_by == '-distance':
            # 按距离排序
            food_list.sort(key=lambda x: x.distance, reverse=(order_by == '-distance'))
        else:
            # 按其他字段排序
            # 由于我们已经将QuerySet转换为列表，需要手动排序
            if order_by == '-average_rating':
                food_list.sort(key=lambda x: x.average_rating, reverse=True)
            elif order_by == 'price':
                food_list.sort(key=lambda x: x.price)
            elif order_by == '-price':
                food_list.sort(key=lambda x: x.price, reverse=True)
            # 可以添加其他排序方式
    
    # 限制数量
    if limit:
        food_list = food_list[:limit]
    
    return food_list

# 获取美食详情 API
@csrf_exempt
def api_get_food_detail(request, food_id):
    if request.method == 'GET':
        try:
            food = Food.objects.get(id=food_id)
            tags = food.tags.all()
            tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
            food_detail = {
                'id': food.id,
                'name': food.name,
                'category': food.category.id,
                'categoryName': food.category.name,
                'tags': tag_list,
                'description': food.description,
                'price': float(food.price),
                'address': food.address or '',
                'average_rating': food.average_rating,
                'review_count': food.review_count,
                'image': food.image.url if food.image else ''
            }
            return JsonResponse({'status': 'success', 'data': food_detail})
        except Food.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '美食不存在'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取美食评价列表 API
@csrf_exempt
def api_get_reviews(request, food_id):
    if request.method == 'GET':
        try:
            # 只获取顶级评论（非回复）
            reviews = Review.objects.filter(food_id=food_id, parent__isnull=True).order_by('-created_at')
            review_list = []
            for review in reviews:
                # 获取用户头像
                from .models import UserProfile
                user_profile, created = UserProfile.objects.get_or_create(user=review.user)
                avatar = user_profile.avatar or '/static/images/avatar_default.png'
                
                # 获取回复
                replies = []
                for reply in review.replies.all().order_by('created_at'):
                    reply_user_profile, reply_created = UserProfile.objects.get_or_create(user=reply.user)
                    reply_avatar = reply_user_profile.avatar or '/static/images/avatar_default.png'
                    replies.append({
                        'id': reply.id,
                        'username': reply.user.username,
                        'avatar': reply_avatar,
                        'comment': reply.comment,
                        'image': reply.image.url if reply.image else '',
                        'created_at': reply.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S')
                    })
                
                review_list.append({
                    'id': review.id,
                    'username': review.user.username,
                    'avatar': avatar,
                    'rating': review.rating,
                    'comment': review.comment,
                    'image': review.image.url if review.image else '',
                    'created_at': review.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S'),
                    'replies': replies
                })
            return JsonResponse({'status': 'success', 'data': review_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 提交美食评价 API
@csrf_exempt
def api_submit_review(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 处理表单数据（支持multipart/form-data格式）
            food_id = request.POST.get('food_id')
            rating = request.POST.get('rating')
            comment = request.POST.get('comment')
            parent_id = request.POST.get('parent_id')
            
            if not food_id or not comment:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            # 检查美食是否存在
            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '美食不存在'})
            
            # 检查评论内容是否包含过滤关键字
            keywords = Keyword.objects.all()
            for keyword in keywords:
                if keyword.word in comment:
                    return JsonResponse({'status': 'error', 'message': '评论内容包含敏感词汇，请修改后再提交'})
            
            # 尝试创建评价
            try:
                parent = None
                if parent_id:
                    try:
                        parent = Review.objects.get(id=parent_id)
                    except Review.DoesNotExist:
                        return JsonResponse({'status': 'error', 'message': '父评论不存在'})
                
                # 回复不需要评分
                rating_value = int(rating) if rating else 5
                
                review = Review.objects.create(
                    food=food,
                    user=request.user,
                    parent=parent,
                    rating=rating_value,
                    comment=comment
                )
                
                # 处理图片上传
                if 'image' in request.FILES:
                    review.image = request.FILES['image']
                    review.save()
                
                return JsonResponse({'status': 'success', 'message': '评价提交成功'})
            except Exception as create_error:
                return JsonResponse({'status': 'error', 'message': f'创建评价失败: {str(create_error)}'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'系统错误: {str(e)}'})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 回复评论 API
@csrf_exempt
def api_reply_comment(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 处理表单数据
            data = json.loads(request.body)
            parent_id = data.get('parent_id')
            comment = data.get('comment')
            
            if not parent_id or not comment:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            # 检查父评论是否存在
            try:
                parent = Review.objects.get(id=parent_id)
            except Review.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '父评论不存在'})
            
            # 检查评论内容是否包含过滤关键字
            keywords = Keyword.objects.all()
            for keyword in keywords:
                if keyword.word in comment:
                    return JsonResponse({'status': 'error', 'message': '评论内容包含敏感词汇，请修改后再提交'})
            
            # 创建回复
            try:
                review = Review.objects.create(
                    food=parent.food,
                    user=request.user,
                    parent=parent,
                    rating=5,  # 回复默认5星
                    comment=comment
                )
                
                # 创建通知
                if parent.user != request.user:  # 不要给自己发通知
                    notification_content = f'用户 {request.user.username} 回复了您的评论: "{comment[:50]}{"..." if len(comment) > 50 else ""}"'
                    Notification.objects.create(
                        user=parent.user,
                        type='reply',
                        content=notification_content,
                        related_review=review
                    )
                
                return JsonResponse({'status': 'success', 'message': '回复提交成功'})
            except Exception as create_error:
                return JsonResponse({'status': 'error', 'message': f'创建回复失败: {str(create_error)}'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'系统错误: {str(e)}'})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取推荐美食 API
@csrf_exempt
def api_get_recommendations(request):
    if request.method == 'GET':
        try:
            # 获取筛选参数
            category_id = request.GET.get('category_id')
            tag_id = request.GET.get('tag_id')
            tag_ids_param = request.GET.get('tag_ids')
            order_by = request.GET.get('order_by', '-average_rating')
            
            # 处理多个标签ID
            tag_ids = None
            if tag_ids_param:
                try:
                    tag_ids = [int(tag_id.strip()) for tag_id in tag_ids_param.split(',')]
                except ValueError:
                    pass
            
            # 调用通用的美食查询函数，根据参数排序
            foods = get_filtered_foods(category_id, tag_id, tag_ids, order_by, 10)
            
            food_list = []
            for food in foods:
                tags = food.tags.all()
                tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                food_list.append({
                'id': food.id,
                'name': food.name,
                'category': food.category.id,
                'categoryName': food.category.name,
                'tags': tag_list,
                'description': food.description,
                'price': float(food.price),
                'address': food.address or '',
                'distance': getattr(food, 'distance', None),
                'average_rating': food.average_rating,
                'review_count': food.review_count,
                'image': food.image.url if food.image else ''
            })
            return JsonResponse({'status': 'success', 'data': food_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取热门评价 API
@csrf_exempt
def api_get_popular_reviews(request):
    if request.method == 'GET':
        try:
            # 按创建时间排序，返回前8个评价
            reviews = Review.objects.order_by('-created_at')[:8]
            review_list = []
            for review in reviews:
                # 获取用户头像
                from .models import UserProfile
                user_profile, created = UserProfile.objects.get_or_create(user=review.user)
                avatar = user_profile.avatar or '/static/images/avatar_default.png'
                
                review_list.append({
                    'id': review.id,
                    'food_id': review.food.id,
                    'food_name': review.food.name,
                    'food_price': float(review.food.price),
                    'food_category': review.food.category.name,
                    'food_image': review.food.image.url if review.food.image else '',
                    'username': review.user.username,
                    'avatar': avatar,
                    'rating': review.rating,
                    'comment': review.comment,
                    'image': review.image.url if review.image else '',
                    'created_at': review.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S')
                })
            return JsonResponse({'status': 'success', 'data': review_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取用户信息 API
@csrf_exempt
def api_get_user_info(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            user = request.user
            from .models import UserProfile, Review, Favorite
            user_profile, created = UserProfile.objects.get_or_create(user=user)
            
            # 计算统计数据
            review_count = Review.objects.filter(user=user).count()
            favorite_count = Favorite.objects.filter(user=user).count()
            visit_count = user_profile.visit_count if hasattr(user_profile, 'visit_count') else 0
            
            user_info = {
                'username': user.username,
                'is_superuser': user.is_superuser,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                'email': user_profile.email or '',
                'bio': user_profile.bio or '',
                'avatar': user_profile.avatar or '/static/images/avatar_default.png',
                'review_count': review_count,
                'favorite_count': favorite_count,
                'visit_count': visit_count
            }
            
            return JsonResponse({'status': 'success', 'data': user_info})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取用户评价历史 API
@csrf_exempt
def api_get_user_reviews(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            reviews = Review.objects.filter(user=request.user).order_by('-created_at')
            review_list = []
            for review in reviews:
                review_list.append({
                    'id': review.id,
                    'food_id': review.food.id,
                    'food_name': review.food.name,
                    'rating': review.rating,
                    'comment': review.comment,
                    'image': review.image.url if review.image else '',
                    'created_at': review.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return JsonResponse({'status': 'success', 'data': review_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 修改密码 API
@csrf_exempt
def api_change_password(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            data = json.loads(request.body)
            old_password = data.get('old_password')
            new_password = data.get('new_password')
            confirm_password = data.get('confirm_password')
            
            # 验证密码
            if not old_password or not new_password or not confirm_password:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            if new_password != confirm_password:
                return JsonResponse({'status': 'error', 'message': '两次输入的新密码不一致'})
            
            if len(new_password) < 6:
                return JsonResponse({'status': 'error', 'message': '新密码长度至少为6位'})
            
            # 验证旧密码
            if not request.user.check_password(old_password):
                return JsonResponse({'status': 'error', 'message': '旧密码错误'})
            
            # 更新密码
            request.user.set_password(new_password)
            request.user.save()
            
            return JsonResponse({'status': 'success', 'message': '密码修改成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 上传头像 API
@csrf_exempt
def api_upload_avatar(request):
    if request.method == 'POST':
        try:
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 处理头像上传
            if 'avatar' in request.FILES:
                avatar_file = request.FILES['avatar']
                
                # 1. 验证文件类型
                valid_types = ['image/jpeg', 'image/png', 'image/gif']
                if avatar_file.content_type not in valid_types:
                    return JsonResponse({'status': 'error', 'message': '仅支持JPG、PNG和GIF格式的图片'})
                
                # 2. 验证文件大小（10MB上限）
                if avatar_file.size > 10 * 1024 * 1024:
                    return JsonResponse({'status': 'error', 'message': '图片大小不能超过10MB'})
                
                # 3. 使用Pillow处理图片（压缩和调整尺寸）
                from PIL import Image
                import uuid, os
                from django.conf import settings
                
                # 打开图片
                image = Image.open(avatar_file)
                
                # 4. 调整图片尺寸（最大300x300）
                max_size = (300, 300)
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # 5. 生成唯一文件名
                file_extension = avatar_file.name.split('.')[-1].lower()
                # 确保扩展名与文件类型匹配
                if avatar_file.content_type == 'image/jpeg':
                    file_extension = 'jpg'
                elif avatar_file.content_type == 'image/png':
                    file_extension = 'png'
                elif avatar_file.content_type == 'image/gif':
                    file_extension = 'gif'
                
                filename = f'{uuid.uuid4()}.{file_extension}'
                
                # 6. 确保保存目录存在
                save_dir = os.path.join(settings.BASE_DIR, 'frontend', 'images', 'avatars')
                os.makedirs(save_dir, exist_ok=True)
                
                # 7. 保存路径
                save_path = os.path.join(save_dir, filename)
                
                # 8. 保存压缩后的图片
                # 根据文件类型使用不同的保存选项
                if file_extension == 'jpg':
                    image.save(save_path, 'JPEG', quality=80, optimize=True, progressive=True)
                elif file_extension == 'png':
                    image.save(save_path, 'PNG', optimize=True, compress_level=6)
                else:  # gif
                    image.save(save_path, 'GIF')
                
                # 9. 更新用户资料
                from .models import UserProfile
                user_profile, created = UserProfile.objects.get_or_create(user=request.user)
                user_profile.avatar = f'/static/images/avatars/{filename}'
                user_profile.save()
                
                return JsonResponse({'status': 'success', 'message': '头像上传成功', 'data': {'avatar': user_profile.avatar}})
            else:
                return JsonResponse({'status': 'error', 'message': '未选择头像文件'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 更新用户信息 API
@csrf_exempt
def api_update_user_info(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            data = json.loads(request.body)
            email = data.get('email')
            bio = data.get('bio')
            avatar = data.get('avatar')
            
            # 获取或创建用户资料
            from .models import UserProfile
            user_profile, created = UserProfile.objects.get_or_create(user=request.user)
            
            # 更新用户资料
            if email:
                user_profile.email = email
                # 同时更新User模型的email
                request.user.email = email
                request.user.save()
            
            if bio is not None:
                user_profile.bio = bio
            
            if avatar:
                user_profile.avatar = avatar
            
            user_profile.save()
            
            return JsonResponse({'status': 'success', 'message': '用户信息更新成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 编辑评价 API
@csrf_exempt
def api_edit_review(request, review_id):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            data = json.loads(request.body)
            rating = data.get('rating')
            comment = data.get('comment')
            
            # 验证输入
            if not rating or not comment:
                return JsonResponse({'status': 'error', 'message': '请填写评分和评价内容'})
            
            # 检查评论内容是否包含过滤关键字
            keywords = Keyword.objects.all()
            for keyword in keywords:
                if keyword.word in comment:
                    return JsonResponse({'status': 'error', 'message': '评论内容包含敏感词汇，请修改后再提交'})
            
            # 获取评价
            review = Review.objects.get(id=review_id, user=request.user)
            
            # 更新评价
            review.rating = rating
            review.comment = comment
            review.save()
            
            return JsonResponse({'status': 'success', 'message': '评价编辑成功'})
        except Review.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '评价不存在或无权编辑'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 删除评价 API
@csrf_exempt
def api_delete_review(request, review_id):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取评价
            review = Review.objects.get(id=review_id, user=request.user)
            
            # 删除评价
            review.delete()
            
            return JsonResponse({'status': 'success', 'message': '评价删除成功'})
        except Review.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '评价不存在或无权删除'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 添加收藏 API
@csrf_exempt
def api_add_favorite(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            data = json.loads(request.body)
            food_id = data.get('food_id')
            
            if not food_id:
                return JsonResponse({'status': 'error', 'message': '请提供美食ID'})
            
            # 获取美食
            food = Food.objects.get(id=food_id)
            
            # 添加收藏
            from .models import Favorite
            favorite, created = Favorite.objects.get_or_create(user=request.user, food=food)
            
            if created:
                return JsonResponse({'status': 'success', 'message': '收藏成功'})
            else:
                return JsonResponse({'status': 'error', 'message': '您已经收藏过该美食'})
        except Food.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '美食不存在'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 取消收藏 API
@csrf_exempt
def api_remove_favorite(request, food_id):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取收藏
            from .models import Favorite
            favorite = Favorite.objects.get(user=request.user, food_id=food_id)
            
            # 取消收藏
            favorite.delete()
            
            return JsonResponse({'status': 'success', 'message': '取消收藏成功'})
        except Favorite.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': '收藏不存在'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取收藏列表 API
@csrf_exempt
def api_get_favorites(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            from .models import Favorite
            favorites = Favorite.objects.filter(user=request.user).order_by('-created_at')
            favorite_list = []
            for favorite in favorites:
                tags = favorite.food.tags.all()
                tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                favorite_list.append({
                    'id': favorite.id,
                    'food_id': favorite.food.id,
                    'food_name': favorite.food.name,
                    'categoryName': favorite.food.category.name,
                    'tags': tag_list,
                    'description': favorite.food.description,
                    'price': float(favorite.food.price),
                    'average_rating': favorite.food.average_rating,
                    'review_count': favorite.food.review_count,
                    'created_at': favorite.created_at.strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return JsonResponse({'status': 'success', 'data': favorite_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 通知相关 API

# 获取通知列表 API
@csrf_exempt
def api_get_notifications(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取通知列表
            notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
            notification_list = []
            for notification in notifications:
                notification_list.append({
                    'id': notification.id,
                    'type': notification.type,
                    'type_display': notification.get_type_display(),
                    'content': notification.content,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S'),
                    'related_review_id': notification.related_review.id if notification.related_review else None
                })
            
            # 统计未读通知数量
            unread_count = notifications.filter(is_read=False).count()
            
            return JsonResponse({
                'status': 'success', 
                'data': notification_list,
                'unread_count': unread_count
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 标记通知为已读 API
@csrf_exempt
def api_mark_notification_read(request, notification_id):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取通知
            try:
                notification = Notification.objects.get(id=notification_id, user=request.user)
            except Notification.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '通知不存在'})
            
            # 标记为已读
            notification.mark_as_read()
            
            return JsonResponse({'status': 'success', 'message': '通知已标记为已读'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 删除通知 API
@csrf_exempt
def api_delete_notification(request, notification_id):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取通知
            try:
                notification = Notification.objects.get(id=notification_id, user=request.user)
            except Notification.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '通知不存在'})
            
            # 删除通知
            notification.delete()
            
            return JsonResponse({'status': 'success', 'message': '通知已删除'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取未读通知数量 API
@csrf_exempt
def api_get_unread_notification_count(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 统计未读通知数量
            unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
            
            return JsonResponse({'status': 'success', 'data': unread_count})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 标记所有通知为已读 API
@csrf_exempt
def api_mark_all_notifications_read(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 获取所有未读通知
            notifications = Notification.objects.filter(user=request.user, is_read=False)
            
            # 标记为已读
            for notification in notifications:
                notification.mark_as_read()
            
            return JsonResponse({'status': 'success', 'message': '所有通知已标记为已读'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 清空所有通知 API
@csrf_exempt
def api_clear_all_notifications(request):
    if request.method == 'POST':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                return JsonResponse({'status': 'error', 'message': '用户未登录'})
            
            # 删除所有通知
            Notification.objects.filter(user=request.user).delete()
            
            return JsonResponse({'status': 'success', 'message': '所有通知已清空'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 管理员获取评价列表 API
@csrf_exempt
def api_admin_get_reviews(request):
    if request.method == 'GET':
        try:
            # 检查用户是否为管理员
            if not request.user.is_authenticated or not request.user.is_superuser:
                return JsonResponse({'status': 'error', 'message': '权限不足，需要超级管理员权限'})
            
            # 获取分页参数
            page = int(request.GET.get('page', 1))
            page_size = int(request.GET.get('page_size', 10))
            
            # 获取筛选参数
            sentiment = request.GET.get('sentiment')
            rating = request.GET.get('rating')
            
            # 基础查询
            reviews = Review.objects.filter(parent__isnull=True).select_related('user', 'food', 'food__category')
            
            # 应用筛选
            if rating:
                reviews = reviews.filter(rating=int(rating))
            
            # 计算总数
            total_count = reviews.count()
            total_pages = (total_count + page_size - 1) // page_size
            
            # 分页
            start = (page - 1) * page_size
            end = start + page_size
            paginated_reviews = reviews.order_by('-created_at')[start:end]
            
            # 构建返回数据
            review_list = []
            from .models import UserProfile
            for review in paginated_reviews:
                # 获取用户头像
                user_profile, created = UserProfile.objects.get_or_create(user=review.user)
                avatar = user_profile.avatar or '/static/images/avatar_default.png'
                
                review_list.append({
                    'id': review.id,
                    'food_id': review.food.id,
                    'food_name': review.food.name,
                    'username': review.user.username,
                    'avatar': avatar,
                    'rating': review.rating,
                    'comment': review.comment,
                    'image': review.image.url if review.image else '',
                    'created_at': review.created_at.astimezone().strftime('%Y-%m-%d %H:%M:%S')
                })
            
            return JsonResponse({
                'status': 'success',
                'data': review_list,
                'pagination': {
                    'total_count': total_count,
                    'total_pages': total_pages,
                    'current_page': page,
                    'page_size': page_size
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 管理员删除评价 API
@csrf_exempt
def api_admin_delete_review(request, review_id):
    if request.method == 'POST':
        try:
            # 检查用户是否为管理员
            if not request.user.is_authenticated or not request.user.is_superuser:
                return JsonResponse({'status': 'error', 'message': '权限不足，需要超级管理员权限'})
            
            # 获取评价
            try:
                review = Review.objects.get(id=review_id)
            except Review.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '评价不存在'})
            
            # 删除评价
            review.delete()
            
            return JsonResponse({'status': 'success', 'message': '评价删除成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 个性化推荐 API
@csrf_exempt
def api_get_personalized_recommendations(request):
    if request.method == 'GET':
        try:
            # 检查用户是否登录
            if not request.user.is_authenticated:
                # 未登录用户返回热门推荐
                foods = Food.objects.order_by('-average_rating')[:10]
                food_list = []
                for food in foods:
                    tags = food.tags.all()
                    tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                    food_list.append({
                        'id': food.id,
                        'name': food.name,
                        'category': food.category.id,
                        'categoryName': food.category.name,
                        'tags': tag_list,
                        'description': food.description,
                        'price': float(food.price),
                        'address': food.address or '',
                        'average_rating': food.average_rating,
                        'review_count': food.review_count,
                        'image': food.image.url if food.image else ''
                    })
                return JsonResponse({'status': 'success', 'data': food_list, 'recommendation_type': 'popular'})
            
            # 已登录用户，基于历史行为推荐
            user = request.user
            
            # 获取用户的评价和收藏
            user_reviews = Review.objects.filter(user=user).select_related('food')
            user_favorites = Favorite.objects.filter(user=user).select_related('food')
            
            # 提取用户喜欢的食物ID和标签
            liked_food_ids = []
            liked_tags = {}
            
            # 从评价中提取（只考虑4星和5星评价）
            for review in user_reviews:
                if review.rating >= 4:
                    liked_food_ids.append(review.food.id)
                    for tag in review.food.tags.all():
                        liked_tags[tag.id] = liked_tags.get(tag.id, 0) + 1
            
            # 从收藏中提取
            for favorite in user_favorites:
                if favorite.food.id not in liked_food_ids:
                    liked_food_ids.append(favorite.food.id)
                for tag in favorite.food.tags.all():
                    liked_tags[tag.id] = liked_tags.get(tag.id, 0) + 1
            
            # 如果用户没有历史行为，返回热门推荐
            if not liked_food_ids and not liked_tags:
                foods = Food.objects.order_by('-average_rating')[:10]
                food_list = []
                for food in foods:
                    tags = food.tags.all()
                    tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                    food_list.append({
                        'id': food.id,
                        'name': food.name,
                        'category': food.category.id,
                        'categoryName': food.category.name,
                        'tags': tag_list,
                        'description': food.description,
                        'price': float(food.price),
                        'address': food.address or '',
                        'average_rating': food.average_rating,
                        'review_count': food.review_count,
                        'image': food.image.url if food.image else ''
                    })
                return JsonResponse({'status': 'success', 'data': food_list, 'recommendation_type': 'popular'})
            
            # 基于标签相似度推荐
            all_foods = Food.objects.exclude(id__in=liked_food_ids)
            food_scores = {}
            
            for food in all_foods:
                score = 0
                for tag in food.tags.all():
                    if tag.id in liked_tags:
                        score += liked_tags[tag.id]
                if score > 0:
                    food_scores[food] = score
            
            # 按分数排序，取前10个
            sorted_foods = sorted(food_scores.items(), key=lambda x: x[1], reverse=True)[:10]
            recommended_foods = [food for food, score in sorted_foods]
            
            # 如果推荐不足10个，补充热门食物
            if len(recommended_foods) < 10:
                popular_foods = Food.objects.exclude(id__in=liked_food_ids).order_by('-average_rating')[:10 - len(recommended_foods)]
                recommended_foods.extend(popular_foods)
            
            # 构建返回数据
            food_list = []
            for food in recommended_foods:
                tags = food.tags.all()
                tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                food_list.append({
                    'id': food.id,
                    'name': food.name,
                    'category': food.category.id,
                    'categoryName': food.category.name,
                    'tags': tag_list,
                    'description': food.description,
                    'price': float(food.price),
                    'address': food.address or '',
                    'average_rating': food.average_rating,
                    'review_count': food.review_count,
                    'image': food.image.url if food.image else ''
                })
            
            return JsonResponse({'status': 'success', 'data': food_list, 'recommendation_type': 'personalized'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 情感分析 API
@csrf_exempt
def api_analyze_sentiment(request):
    if request.method == 'POST':
        try:
            # 导入TextBlob库
            from textblob import TextBlob
            
            # 解析请求数据
            data = json.loads(request.body)
            comment = data.get('comment')
            
            if not comment:
                return JsonResponse({'status': 'error', 'message': '请提供评论内容'})
            
            # 进行情感分析
            blob = TextBlob(comment)
            sentiment_score = blob.sentiment.polarity
            
            # 确定情感类型
            if sentiment_score > 0.1:
                sentiment = 'positive'
                sentiment_label = '正面'
            elif sentiment_score < -0.1:
                sentiment = 'negative'
                sentiment_label = '负面'
            else:
                sentiment = 'neutral'
                sentiment_label = '中性'
            
            # 返回结果
            return JsonResponse({
                'status': 'success',
                'data': {
                    'comment': comment,
                    'sentiment': sentiment,
                    'sentiment_label': sentiment_label,
                    'score': sentiment_score
                }
            })
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 智能搜索 API
@csrf_exempt
def api_smart_search(request):
    if request.method == 'GET':
        try:
            # 获取搜索关键词
            query = request.GET.get('q', '')
            
            if not query:
                return JsonResponse({'status': 'error', 'message': '请输入搜索关键词'})
            
            # 基础搜索：名称、描述、标签
            from django.db.models import Q
            
            # 搜索食物名称和描述
            foods_by_name_desc = Food.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )
            
            # 搜索标签
            tags = Tag.objects.filter(name__icontains=query)
            food_ids_by_tags = []
            for tag in tags:
                food_ids_by_tags.extend([food.id for food in tag.food_set.all()])
            
            # 合并结果并去重
            all_food_ids = set()
            all_food_ids.update([food.id for food in foods_by_name_desc])
            all_food_ids.update(food_ids_by_tags)
            
            # 获取最终结果
            foods = Food.objects.filter(id__in=all_food_ids)
            
            # 构建返回数据
            food_list = []
            for food in foods:
                tags = food.tags.all()
                tag_list = [{'id': tag.id, 'name': tag.name} for tag in tags]
                food_list.append({
                    'id': food.id,
                    'name': food.name,
                    'category': food.category.id,
                    'categoryName': food.category.name,
                    'tags': tag_list,
                    'description': food.description,
                    'price': float(food.price),
                    'address': food.address or '',
                    'average_rating': food.average_rating,
                    'review_count': food.review_count,
                    'image': food.image.url if food.image else ''
                })
            
            return JsonResponse({'status': 'success', 'data': food_list, 'query': query})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 管理员获取评价分析 API
@csrf_exempt
def api_admin_reviews_analysis(request):
    if request.method == 'GET':
        try:
            # 检查用户是否为管理员
            if not request.user.is_authenticated or not request.user.is_superuser:
                return JsonResponse({'status': 'error', 'message': '权限不足，需要超级管理员权限'})
            
            # 获取所有评价（只考虑顶级评价）
            reviews = Review.objects.filter(parent__isnull=True)
            
            # 计算情感分布
            sentiment_distribution = {
                'positive': 0,
                'negative': 0,
                'neutral': 0
            }
            
            # 计算评分分布
            rating_distribution = {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            }
            
            # 计算评价趋势（最近7天）
            from datetime import datetime, timedelta
            today = datetime.now().date()
            trend_data = []
            
            for i in range(6, -1, -1):
                date = today - timedelta(days=i)
                date_str = date.strftime('%Y-%m-%d')
                count = reviews.filter(created_at__date=date).count()
                trend_data.append({
                    'date': date_str,
                    'count': count
                })
            
            # 分析每个评价的情感
            from textblob import TextBlob
            for review in reviews:
                # 计算评分分布
                if review.rating in rating_distribution:
                    rating_distribution[review.rating] += 1
                
                # 分析情感
                try:
                    blob = TextBlob(review.comment)
                    polarity = blob.sentiment.polarity
                    
                    if polarity > 0.1:
                        sentiment_distribution['positive'] += 1
                    elif polarity < -0.1:
                        sentiment_distribution['negative'] += 1
                    else:
                        sentiment_distribution['neutral'] += 1
                except:
                    # 如果分析失败，默认为中性
                    sentiment_distribution['neutral'] += 1
            
            # 构建返回数据
            analysis_data = {
                'sentiment_distribution': sentiment_distribution,
                'rating_distribution': rating_distribution,
                'review_trend': trend_data,
                'total_reviews': reviews.count()
            }
            
            return JsonResponse({'status': 'success', 'data': analysis_data})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 系统管理模块 API

# 权限检查装饰器
from functools import wraps

def superuser_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_superuser:
            return JsonResponse({'status': 'error', 'message': '权限不足，需要超级管理员权限'})
        return view_func(request, *args, **kwargs)
    return _wrapped_view

# 添加美食分类 API
@csrf_exempt
@superuser_required
def api_add_category(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            name = data.get('name')
            description = data.get('description')
            
            if not name:
                return JsonResponse({'status': 'error', 'message': '分类名称不能为空'})
            
            # 检查分类是否已存在
            if FoodCategory.objects.filter(name=name).exists():
                return JsonResponse({'status': 'error', 'message': '分类已存在'})
            
            # 创建分类
            category = FoodCategory.objects.create(
                name=name,
                description=description
            )
            
            return JsonResponse({'status': 'success', 'message': '分类添加成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 编辑美食分类 API
@csrf_exempt
@superuser_required
def api_edit_category(request, category_id):
    if request.method == 'POST':
        try:
            # 检查分类是否存在
            try:
                category = FoodCategory.objects.get(id=category_id)
            except FoodCategory.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '分类不存在'})
            
            data = json.loads(request.body)
            name = data.get('name')
            description = data.get('description')
            
            if not name:
                return JsonResponse({'status': 'error', 'message': '分类名称不能为空'})
            
            # 更新分类
            category.name = name
            category.description = description
            category.save()
            
            return JsonResponse({'status': 'success', 'message': '分类更新成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 删除美食分类 API
@csrf_exempt
@superuser_required
def api_delete_category(request, category_id):
    if request.method == 'POST':
        try:
            # 检查分类是否存在
            try:
                category = FoodCategory.objects.get(id=category_id)
            except FoodCategory.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '分类不存在'})
            
            # 检查分类下是否有美食
            if category.food_set.exists():
                return JsonResponse({'status': 'error', 'message': '该分类下还有美食，无法删除'})
            
            # 删除分类
            category.delete()
            
            return JsonResponse({'status': 'success', 'message': '分类删除成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 添加美食 API
@csrf_exempt
@superuser_required
def api_add_food(request):
    if request.method == 'POST':
        try:
            # 处理表单数据
            name = request.POST.get('name')
            category_id = request.POST.get('category_id')
            description = request.POST.get('description')
            price = request.POST.get('price')
            
            if not name or not category_id or not description or not price:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            # 检查分类是否存在
            try:
                category = FoodCategory.objects.get(id=category_id)
            except FoodCategory.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '分类不存在'})
            
            # 创建美食实例
            food = Food(
                name=name,
                category=category,
                description=description,
                price=price
            )
            
            # 处理图片上传
            if 'image' in request.FILES:
                food.image = request.FILES['image']
            
            # 保存美食
            food.save()

            # 处理标签
            tag_ids = request.POST.get('tag_ids')
            if tag_ids:
                try:
                    ids = [int(tid.strip()) for tid in tag_ids.split(',') if tid.strip()]
                    food.tags.set(ids)
                except ValueError:
                    pass
            
            return JsonResponse({'status': 'success', 'message': '美食添加成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 编辑美食 API
@csrf_exempt
@superuser_required
def api_edit_food(request, food_id):
    if request.method == 'POST':
        try:
            # 检查美食是否存在
            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '美食不存在'})
            
            # 处理表单数据
            name = request.POST.get('name')
            category_id = request.POST.get('category_id')
            description = request.POST.get('description')
            price = request.POST.get('price')
            
            if not name or not category_id or not description or not price:
                return JsonResponse({'status': 'error', 'message': '请填写所有字段'})
            
            # 检查分类是否存在
            try:
                category = FoodCategory.objects.get(id=category_id)
            except FoodCategory.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '分类不存在'})
            
            # 更新美食信息
            food.name = name
            food.category = category
            food.description = description
            food.price = price
            
            # 处理图片上传
            if 'image' in request.FILES:
                food.image = request.FILES['image']
            
            # 保存更新
            food.save()

            # 处理标签
            tag_ids = request.POST.get('tag_ids')
            if tag_ids is not None:  # 如果传了标签参数（哪怕是空的），就更新
                try:
                    ids = [int(tid.strip()) for tid in tag_ids.split(',') if tid.strip()]
                    food.tags.set(ids)
                except ValueError:
                    pass
            
            return JsonResponse({'status': 'success', 'message': '美食编辑成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取后台运营洞察 API
@superuser_required
def api_admin_insights(request):
    try:
        # 1. 热门美食排行榜 (按收藏数和评价数综合排序)
        # 模拟计算热度: 收藏数*2 + 评价数*1
        from django.db.models import Count, Avg, F
        
        # 获取所有美食及其收藏数和评价数
        foods = Food.objects.annotate(
            fav_count=Count('favorite', distinct=True),
            rev_count=Count('review', distinct=True)
        ).order_by('-fav_count', '-rev_count')[:10]
        
        popular_foods = []
        for f in foods:
            # 备货建议逻辑：热度高且评分在4分以上 -> 增加供应；热度高但评分低 -> 改善质量
            suggestion = "维持现状"
            if f.fav_count > 5 or f.rev_count > 10:
                if f.average_rating >= 4.0:
                    suggestion = "热门爆款，建议增加备货"
                elif f.average_rating < 3.0:
                    suggestion = "差评较多，建议排查质量"
                else:
                    suggestion = "需求量大，保持稳定供应"
            
            popular_foods.append({
                'id': f.id,
                'name': f.name,
                'category': f.category.name,
                'favorites': f.fav_count,
                'reviews': f.rev_count,
                'rating': f.average_rating,
                'suggestion': suggestion
            })
            
        # 2. 食堂动态分析
        categories = FoodCategory.objects.annotate(
            food_num=Count('food', distinct=True),
            avg_rating=Avg('food__average_rating')
        )
        
        category_insights = []
        for c in categories:
            category_insights.append({
                'name': c.name,
                'food_count': c.food_num,
                'avg_rating': round(c.avg_rating or 0, 1)
            })
            
        # 3. 最近趋势 (模拟数据或基于时间的数据)
        # 获取最近3天的评价数量
        from datetime import timedelta
        from django.utils import timezone
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_reviews = Review.objects.filter(created_at__gte=three_days_ago).count()
        
        return JsonResponse({
            'status': 'success',
            'data': {
                'popular_foods': popular_foods,
                'category_insights': category_insights,
                'recent_activity': {
                    'reviews_3d': recent_reviews,
                    'active_users': UserProfile.objects.filter(visit_count__gt=0).count()
                }
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

# 删除美食 API
@csrf_exempt
@superuser_required
def api_delete_food(request, food_id):
    if request.method == 'POST':
        try:
            # 检查美食是否存在
            try:
                food = Food.objects.get(id=food_id)
            except Food.DoesNotExist:
                return JsonResponse({'status': 'error', 'message': '美食不存在'})
            
            # 删除美食
            food.delete()
            
            return JsonResponse({'status': 'success', 'message': '美食删除成功'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取所有标签 API
@csrf_exempt
def api_get_tags(request):
    if request.method == 'GET':
        try:
            tags = Tag.objects.all()
            tag_list = []
            for tag in tags:
                tag_list.append({
                    'id': tag.id,
                    'name': tag.name,
                    'food_count': tag.food_set.count()
                })
            return JsonResponse({'status': 'success', 'data': tag_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})

# 获取轮播图片 API
@csrf_exempt
def api_get_carousel(request):
    if request.method == 'GET':
        try:
            # 获取激活状态的轮播图片，按排序和创建时间排序
            carousels = Carousel.objects.filter(is_active=True).order_by('order', 'created_at')
            carousel_list = []
            for carousel in carousels:
                carousel_list.append({
                    'id': carousel.id,
                    'image': carousel.image.url if carousel.image else '',
                    'link': carousel.link
                })
            return JsonResponse({'status': 'success', 'data': carousel_list})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': '方法不允许'})
