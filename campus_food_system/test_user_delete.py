#!/usr/bin/env python
"""
测试用户删除权限的脚本
"""

import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_food_system.settings')
django.setup()

from django.contrib.auth.models import User
from food_app.admin import admin_site, CustomUserAdmin
from django.test import RequestFactory

# 创建测试请求
factory = RequestFactory()

# 测试1：检查超级管理员是否有删除权限
def test_superuser_delete_permission():
    print("测试1：检查超级管理员是否有删除权限")
    
    # 创建测试请求
    request = factory.get('/admin/')
    
    # 创建超级管理员用户
    superuser = User.objects.create_superuser('test_superuser', 'superuser@example.com', 'password123')
    request.user = superuser
    
    # 获取CustomUserAdmin实例
    admin_instance = CustomUserAdmin(User, admin_site)
    
    # 测试删除权限
    has_perm = admin_instance.has_delete_permission(request)
    print(f"超级管理员是否有删除权限: {has_perm}")
    
    # 清理测试数据
    superuser.delete()
    
    return has_perm

# 测试2：检查普通管理员是否没有删除权限
def test_staff_delete_permission():
    print("\n测试2：检查普通管理员是否没有删除权限")
    
    # 创建测试请求
    request = factory.get('/admin/')
    
    # 创建普通管理员用户
    staff_user = User.objects.create_user('test_staff', 'staff@example.com', 'password123')
    staff_user.is_staff = True
    staff_user.save()
    request.user = staff_user
    
    # 获取CustomUserAdmin实例
    admin_instance = CustomUserAdmin(User, admin_site)
    
    # 测试删除权限
    has_perm = admin_instance.has_delete_permission(request)
    print(f"普通管理员是否有删除权限: {has_perm}")
    
    # 清理测试数据
    staff_user.delete()
    
    return not has_perm

# 测试3：检查用户删除时的关联模型处理
def test_user_delete_cascade():
    print("\n测试3：检查用户删除时的关联模型处理")
    
    from food_app.models import UserProfile, Review, Favorite, Food, FoodCategory
    
    # 创建测试数据
    category = FoodCategory.objects.create(name='测试分类', description='测试分类描述')
    food = Food.objects.create(name='测试美食', category=category, description='测试美食描述', price=10.0)
    
    # 创建测试用户
    test_user = User.objects.create_user('test_delete_user', 'delete@example.com', 'password123')
    
    # 创建关联模型
    UserProfile.objects.create(user=test_user, email='delete@example.com', bio='测试用户')
    Review.objects.create(food=food, user=test_user, rating=5, comment='测试评价')
    Favorite.objects.create(user=test_user, food=food)
    
    # 检查关联模型是否存在
    profile_exists = UserProfile.objects.filter(user=test_user).exists()
    review_exists = Review.objects.filter(user=test_user).exists()
    favorite_exists = Favorite.objects.filter(user=test_user).exists()
    
    print(f"删除前 - 用户资料存在: {profile_exists}")
    print(f"删除前 - 评价存在: {review_exists}")
    print(f"删除前 - 收藏存在: {favorite_exists}")
    
    # 删除用户
    test_user.delete()
    
    # 检查关联模型是否被删除
    profile_exists = UserProfile.objects.filter(user=test_user).exists()
    review_exists = Review.objects.filter(user=test_user).exists()
    favorite_exists = Favorite.objects.filter(user=test_user).exists()
    
    print(f"删除后 - 用户资料存在: {profile_exists}")
    print(f"删除后 - 评价存在: {review_exists}")
    print(f"删除后 - 收藏存在: {favorite_exists}")
    
    # 清理测试数据
    food.delete()
    category.delete()
    
    return not (profile_exists or review_exists or favorite_exists)

if __name__ == '__main__':
    print("开始测试用户删除权限...")
    
    test1_passed = test_superuser_delete_permission()
    test2_passed = test_staff_delete_permission()
    test3_passed = test_user_delete_cascade()
    
    print("\n测试结果总结:")
    print(f"测试1 (超级管理员删除权限): {'通过' if test1_passed else '失败'}")
    print(f"测试2 (普通管理员无删除权限): {'通过' if test2_passed else '失败'}")
    print(f"测试3 (关联模型级联删除): {'通过' if test3_passed else '失败'}")
    
    if test1_passed and test2_passed and test3_passed:
        print("\n所有测试通过！用户删除权限配置正确。")
    else:
        print("\n部分测试失败，需要进一步检查配置。")
