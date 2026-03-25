from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# 用户扩展模型
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='用户')
    email = models.EmailField(blank=True, verbose_name='邮箱')
    avatar = models.CharField(max_length=255, blank=True, verbose_name='头像路径')
    bio = models.TextField(blank=True, verbose_name='个人简介')
    visit_count = models.PositiveIntegerField(default=0, verbose_name='访问次数')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户资料'
        verbose_name_plural = '用户资料'
    
    def __str__(self):
        return self.user.username

# 收藏模型
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    food = models.ForeignKey('Food', on_delete=models.CASCADE, verbose_name='美食')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='收藏时间')
    
    class Meta:
        verbose_name = '美食收藏'
        verbose_name_plural = '美食收藏'
        unique_together = ('user', 'food')  # 一个用户对一个美食只能收藏一次
    
    def __str__(self):
        return f'{self.user.username} 收藏了 {self.food.name}'

class FoodCategory(models.Model):
    name = models.CharField(max_length=50, verbose_name='食堂名称')
    description = models.TextField(blank=True, verbose_name='食堂描述')
    image = models.ImageField(upload_to='category_images/', blank=True, null=True, verbose_name='食堂图片')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '美食分类'
        verbose_name_plural = '美食分类'
    
    def __str__(self):
        return self.name

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name='标签名称')
    weight = models.IntegerField(default=1, verbose_name='标签权重')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '美食标签'
        verbose_name_plural = '美食标签'
    
    def __str__(self):
        return self.name

# 过滤关键字模型
class Keyword(models.Model):
    word = models.CharField(max_length=50, unique=True, verbose_name='关键字')
    description = models.CharField(max_length=200, blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '过滤关键字'
        verbose_name_plural = '过滤关键字'
    
    def __str__(self):
        return self.word

class Food(models.Model):
    name = models.CharField(max_length=100, verbose_name='美食名称')
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, verbose_name='所属食堂')
    tags = models.ManyToManyField(Tag, blank=True, verbose_name='美食标签')
    description = models.TextField(verbose_name='美食描述')
    price = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='价格')
    address = models.CharField(max_length=255, blank=True, verbose_name='地址')
    image = models.ImageField(upload_to='food_images/', blank=True, null=True, verbose_name='美食图片')
    average_rating = models.FloatField(default=0, verbose_name='平均评分')
    review_count = models.IntegerField(default=0, verbose_name='评价数量')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '美食信息'
        verbose_name_plural = '美食信息'
    
    def __str__(self):
        return self.name

class Review(models.Model):
    food = models.ForeignKey(Food, on_delete=models.CASCADE, verbose_name='美食')
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='用户')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies', verbose_name='父评论')
    rating = models.IntegerField(choices=[(1, '1星'), (2, '2星'), (3, '3星'), (4, '4星'), (5, '5星')], verbose_name='评分')
    comment = models.TextField(verbose_name='评价内容')
    image = models.ImageField(upload_to='review_images/', blank=True, null=True, verbose_name='评价图片')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评价时间')
    
    class Meta:
        verbose_name = '美食评价'
        verbose_name_plural = '美食评价'
        # 移除unique_together约束，允许用户对同一个美食进行多次评论
    
    def __str__(self):
        return f'{self.user.username} 对 {self.food.name} 的评价'
    
    def save(self, *args, **kwargs):
        # 保存评价
        super().save(*args, **kwargs)
        
        # 只有当不是回复时，才更新对应美食的平均评分和评价数量
        if not self.parent:
            try:
                # 只计算非回复的评论
                reviews = Review.objects.filter(food=self.food, parent__isnull=True)
                total_rating = sum(review.rating for review in reviews)
                self.food.average_rating = total_rating / reviews.count() if reviews.count() > 0 else 0
                self.food.review_count = reviews.count()
                self.food.save()
            except Exception as e:
                # 记录错误但不阻止评价保存
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"更新美食评分时出错: {str(e)}")

class Carousel(models.Model):
    image = models.ImageField(upload_to='carousel_images/', verbose_name='轮播图片')
    link = models.CharField(max_length=255, blank=True, verbose_name='链接地址')
    order = models.IntegerField(default=0, verbose_name='排序')
    is_active = models.BooleanField(default=True, verbose_name='是否激活')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '轮播图片'
        verbose_name_plural = '轮播图片'
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f'轮播图片 {self.id}'

# 通知模型
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('reply', '评论回复'),
        ('system', '系统通知'),
        ('other', '其他通知'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='接收用户')
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name='通知类型')
    content = models.TextField(verbose_name='通知内容')
    related_review = models.ForeignKey(Review, on_delete=models.CASCADE, null=True, blank=True, verbose_name='相关评论')
    is_read = models.BooleanField(default=False, verbose_name='是否已读')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '通知信息'
        verbose_name_plural = '通知信息'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.get_type_display()} - {self.user.username}'

    def mark_as_read(self):
        self.is_read = True
        self.save()

