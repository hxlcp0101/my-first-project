import logging
from django.contrib import admin
from django.contrib.admin import AdminSite
from food_app.models import FoodCategory, Food, Review, Favorite, UserProfile, Tag, Keyword, Carousel
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User, Group, Permission
from django.utils.html import format_html

logger = logging.getLogger(__name__)
# 注册模型到admin后台
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'weight', 'food_count', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at', 'weight')
    ordering = ('name',)
    fields = ('name', 'weight')
    
    def food_count(self, obj):
        """显示标签关联的美食数量"""
        count = obj.food_set.count()
        return format_html(f'<span style="font-weight: bold; color: #2196f3;">{count}</span>')
    
    food_count.short_description = '美食数量'
    food_count.admin_order_field = 'food_count'

@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'food_count', 'image_thumbnail', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('created_at',)
    ordering = ('name',)
    fields = ('name', 'description', 'image')
    
    def food_count(self, obj):
        """显示分类下的美食数量"""
        count = obj.food_set.count()
        return format_html(f'<span style="font-weight: bold; color: #2196f3;">{count}</span>')
    
    food_count.short_description = '美食数量'
    food_count.admin_order_field = 'food_count'
    
    def image_thumbnail(self, obj):
        """在列表视图中显示图片缩略图"""
        if obj.image:
            return format_html('<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />', obj.image.url)
        return format_html('<span style="color: #999;">无图片</span>')
    
    image_thumbnail.short_description = '图片预览'

@admin.register(Food)
class FoodAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'tags_list', 'price', 'average_rating', 'review_count', 'created_at', 'image_thumbnail')
    search_fields = ('name', 'description', 'category__name', 'tags__name')
    list_filter = ('category', 'tags', 'created_at', 'average_rating')
    ordering = ('-average_rating',)
    fieldsets = (
        ('基本信息', {
            'fields': ('name', 'category', 'tags', 'description', 'price'),
            'classes': ('wide',)
        }),
        ('图片信息', {
            'fields': ('image',),
            'classes': ('wide',)
        }),
        ('统计信息', {
            'fields': ('average_rating', 'review_count'),
            'classes': ('wide', 'collapse'),
        }),
    )
    
    def tags_list(self, obj):
        """在列表中显示标签"""
        tags = obj.tags.all()
        if not tags:
            return format_html('<span style="color: #999;">无标签</span>')
        tag_html = ''.join([format_html('<span class="tag">{}</span>&nbsp;', tag.name) for tag in tags])
        return format_html(tag_html)
    
    tags_list.short_description = '标签'
    tags_list.admin_order_field = 'tags'
    readonly_fields = ('average_rating', 'review_count')
    save_on_top = True
    
    def image_thumbnail(self, obj):
        """在列表视图中显示图片缩略图"""
        if obj.image:
            return format_html('<img src="{}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />', obj.image.url)
        return format_html('<span style="color: #999;">无图片</span>')
    
    image_thumbnail.short_description = '图片预览'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('food', 'user', 'rating', 'comment_preview', 'created_at')
    search_fields = ('food__name', 'user__username', 'comment')
    list_filter = ('rating', 'created_at', 'food__category')
    ordering = ('-created_at',)
    fields = ('food', 'user', 'rating', 'comment', 'created_at')
    readonly_fields = ('created_at',)
    
    def comment_preview(self, obj):
        """显示评论预览"""
        if obj.comment:
            preview = obj.comment[:50] + ('...' if len(obj.comment) > 50 else '')
            return format_html('<span style="font-size: 13px;">{}</span>', preview)
        return format_html('<span style="color: #999;">无评论</span>')
    
    comment_preview.short_description = '评论内容'

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'food', 'created_at')
    search_fields = ('user__username', 'food__name')
    list_filter = ('created_at',)
    ordering = ('-created_at',)
    fields = ('user', 'food', 'created_at')
    readonly_fields = ('created_at',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'email', 'avatar_thumbnail', 'bio', 'updated_at')
    search_fields = ('user__username', 'email')
    list_filter = ('updated_at',)
    ordering = ('-updated_at',)
    fields = ('user', 'email', 'avatar', 'bio', 'updated_at')
    readonly_fields = ('updated_at',)
    
    def avatar_thumbnail(self, obj):
        """显示用户头像缩略图"""
        if obj.avatar:
            return format_html('<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%;" />', obj.avatar)
        return format_html('<span style="color: #999;">无头像</span>')
    
    avatar_thumbnail.short_description = '头像'

@admin.register(Keyword)
class KeywordAdmin(admin.ModelAdmin):
    list_display = ('word', 'description', 'created_at')
    search_fields = ('word', 'description')
    list_filter = ('created_at',)
    ordering = ('word',)
    fields = ('word', 'description')

@admin.register(Carousel)
class CarouselAdmin(admin.ModelAdmin):
    list_display = ('image_thumbnail', 'link', 'order', 'is_active', 'created_at')
    search_fields = ('link',)
    list_filter = ('is_active', 'created_at')
    ordering = ('order', 'created_at')
    fields = ('image', 'link', 'order', 'is_active')
    
    def image_thumbnail(self, obj):
        """在列表视图中显示图片缩略图"""
        if obj.image:
            return format_html('<img src="{}" style="width: 100px; height: 60px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />', obj.image.url)
        return format_html('<span style="color: #999;">无图片</span>')
    
    image_thumbnail.short_description = '图片预览'

# 配置用户管理，隐藏一些不必要的字段
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_superuser', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('first_name', 'last_name', 'email')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('重要日期', {'fields': ('last_login', 'date_joined')}),
    )
    save_on_top = True
    
    def has_delete_permission(self, request, obj=None):
        """确保只有超级管理员可以删除用户"""
        return request.user.is_superuser
    
    def delete_model(self, request, obj):
        """确保删除操作正确处理关联模型"""
        try:
            # 直接删除用户，依赖Django的级联删除机制删除关联模型
            super().delete_model(request, obj)
        except Exception as e:
            # 记录错误信息
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"删除用户 {obj.username} 时出错: {str(e)}")
            raise
    
    def delete_queryset(self, request, queryset):
        """批量删除用户时的处理"""
        try:
            # 直接批量删除用户，依赖Django的级联删除机制删除关联模型
            super().delete_queryset(request, queryset)
        except Exception as e:
            # 记录错误信息
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"批量删除用户时出错: {str(e)}")
            raise

# 系统管理员组和权限由Django内置认证系统管理

# 设置admin后台标题和样式
admin.site.site_header = '校园美食测评与推荐系统 - 超级管理员后台'
admin.site.site_title = '校园美食系统后台'
admin.site.index_title = '系统管理'

# 自定义admin站点的CSS和样式
from django.contrib.admin import AdminSite
from django.contrib import admin

# 创建自定义Admin站点
class CustomAdminSite(AdminSite):
    site_header = '校园美食测评与推荐系统 - 超级管理员后台'
    site_title = '校园美食系统后台'
    index_title = '系统管理'
    
    def each_context(self, request):
        context = super().each_context(request)
        # 添加自定义CSS，匹配前端风格
        context['extra_css'] = '''
            <style>
                /* 全局样式 - 匹配前端风格 */
                body {
                    font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f5f5f5;
                    color: #333333;
                }
                
                /* 头部样式 */
                #header {
                    background-color: #0099ff;
                    border-bottom: 0;
                }
                
                #branding h1 {
                    color: #fff;
                    font-weight: bold;
                }
                
                #user-tools {
                    color: #fff;
                }
                
                #user-tools a {
                    color: #fff;
                }
                
                #user-tools a:hover {
                    color: #e3f2fd;
                }
                
                /* 侧边栏样式 */
                #left-sidebar {
                    background-color: #fff;
                    border-right: 1px solid #e8e8e8;
                    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
                }
                
                .sidebar-nav {
                    background-color: #fff;
                    padding: 20px 0;
                }
                
                .sidebar-nav a {
                    color: #333333;
                    padding: 10px 20px;
                    margin: 4px 12px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    display: block;
                }
                
                .sidebar-nav a:hover {
                    background-color: #e3f2fd;
                    color: #0099ff;
                    transform: translateX(4px);
                }
                
                /* 内容区域样式 */
                #content {
                    background-color: #f8f9fa;
                    padding: 30px;
                }
                
                h1 {
                    color: #0099ff;
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 30px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e3f2fd;
                }
                
                .module {
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8e8e8;
                    margin-bottom: 24px;
                    overflow: hidden;
                }
                
                .module caption {
                    padding: 16px 20px;
                    background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                    border-bottom: 1px solid #e8e8e8;
                }
                
                .module caption a.section {
                    color: #0099ff;
                    font-size: 16px;
                    font-weight: 600;
                    text-decoration: none;
                }
                
                .module h2 {
                    background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                    color: #0099ff;
                    border-bottom: 1px solid #e8e8e8;
                    border-radius: 12px 12px 0 0;
                    padding: 16px 20px;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                
                /* 表格样式 */
                table {
                    border-collapse: collapse;
                    width: 100%;
                }
                
                th {
                    background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                    color: #0099ff;
                    border-bottom: 2px solid #e8e8e8;
                    padding: 12px 16px;
                    text-align: left;
                    font-weight: 600;
                }
                
                td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #e8e8e8;
                }
                
                tr:hover {
                    background-color: #f8f9fa;
                }
                
                /* 按钮样式 - 匹配前端 */
                .button, input[type="submit"], input[type="button"], .submit-row input, a.button {
                    background: linear-gradient(135deg, #0099ff, #0066cc);
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 153, 255, 0.2);
                    text-decoration: none;
                    display: inline-block;
                    margin: 2px;
                }
                
                .button:hover, input[type="submit"]:hover, input[type="button"]:hover, .submit-row input:hover, a.button:hover {
                    background: linear-gradient(135deg, #0066cc, #004c99);
                    color: #fff;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
                }
                
                .button.default, input[type="submit"].default, .submit-row input.default {
                    background: linear-gradient(135deg, #0066cc, #004c99);
                }
                
                .button.default:hover, input[type="submit"].default:hover, .submit-row input.default:hover {
                    background: linear-gradient(135deg, #004c99, #003366);
                }
                
                /* 表单样式 */
                input[type="text"], input[type="password"], input[type="email"], input[type="url"], input[type="number"], input[type="tel"], textarea, select {
                    border: 1px solid #e8e8e8;
                    border-radius: 8px;
                    padding: 10px 12px;
                    font-size: 14px;
                    background-color: #fff;
                    color: #333333;
                    transition: all 0.3s ease;
                }
                
                input[type="text"]:focus, input[type="password"]:focus, input[type="email"]:focus, input[type="url"]:focus, input[type="number"]:focus, input[type="tel"]:focus, textarea:focus, select:focus {
                    border-color: #0099ff;
                    box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
                    outline: none;
                }
                
                /* 最近动作模块样式 */
                #recent-actions-module {
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8e8e8;
                }
                
                #recent-actions-module h2 {
                    background: linear-gradient(135deg, #e3f2fd, #f0f8ff);
                    color: #0099ff;
                    border-bottom: 1px solid #e8e8e8;
                    border-radius: 12px 12px 0 0;
                    padding: 16px 20px;
                    font-size: 16px;
                    font-weight: 600;
                    margin: 0;
                }
                
                #recent-actions-module h3 {
                    color: #333333;
                    font-size: 14px;
                    font-weight: 600;
                    margin: 16px 20px 8px;
                }
                
                .actionlist li {
                    padding: 8px 20px;
                    border-bottom: 1px solid #f0f0f0;
                }
                
                .actionlist li:hover {
                    background-color: #f8f9fa;
                }
                
                .actionlist a {
                    color: #0099ff;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }
                
                .actionlist a:hover {
                    color: #0066cc;
                    text-decoration: underline;
                }
                
                /* 响应式设计 */
                @media (max-width: 768px) {
                    #content {
                        padding: 20px;
                    }
                    
                    .module {
                        margin-bottom: 20px;
                    }
                    
                    .sidebar-nav a {
                        padding: 8px 16px;
                    }
                }
                
                /* 标签样式 */
                .tag {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                    background-color: #e3f2fd;
                    color: #0066cc;
                }
                
                /* 链接样式 */
                a {
                    color: #0099ff;
                }
                
                a:hover {
                    color: #0066cc;
                }
                
                /* 消息样式 */
                .message {
                    border-radius: 4px;
                    padding: 10px;
                    margin-bottom: 10px;
                }
                
                .success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                /* 模型特定样式 */
                .model-food .change-list tbody tr:hover {
                    background-color: #f8f0e3;
                }
                
                .model-foodcategory .change-list tbody tr:hover {
                    background-color: #f8f0e3;
                }
                
                .model-review .change-list tbody tr:hover {
                    background-color: #f8f0e3;
                }
                
                .model-favorite .change-list tbody tr:hover {
                    background-color: #f8f0e3;
                }
                
                .model-userprofile .change-list tbody tr:hover {
                    background-color: #f8f0e3;
                }
                
                /* 评分样式 */
                .rating {
                    color: #ff9800;
                    font-weight: bold;
                }
                
                /* 响应式调整 */
                @media (max-width: 768px) {
                    .module {
                        border-radius: 4px;
                    }
                }
            </style>
        '''
        return context

# 替换默认的admin站点
admin_site = CustomAdminSite(name='custom_admin')

# 重新注册所有模型到自定义站点
admin_site.register(Tag, TagAdmin)
admin_site.register(FoodCategory, FoodCategoryAdmin)
admin_site.register(Food, FoodAdmin)
admin_site.register(Review, ReviewAdmin)
admin_site.register(Favorite, FavoriteAdmin)
admin_site.register(UserProfile, UserProfileAdmin)
admin_site.register(Keyword, KeywordAdmin)
admin_site.register(Carousel, CarouselAdmin)
admin_site.register(User, CustomUserAdmin)

# 注意：需要在urls.py中更新admin站点的URL配置
