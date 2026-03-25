#!/usr/bin/env python3
"""
检查数据库中的美食数据
"""

import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_food_system.settings')
django.setup()

from food_app.models import Food, Review, User

print("=== 数据库检查 ===")

# 检查美食数据
food_count = Food.objects.count()
print(f"美食数量: {food_count}")

if food_count > 0:
    print("\n美食列表:")
    for food in Food.objects.all()[:5]:  # 只显示前5个
        print(f"ID: {food.id}, 名称: {food.name}, 分类: {food.category.name}")
else:
    print("\n警告: 数据库中没有美食数据，请先添加美食")

# 检查评价数据
review_count = Review.objects.count()
print(f"\n评价数量: {review_count}")

# 检查用户数据
user_count = User.objects.count()
print(f"\n用户数量: {user_count}")
if user_count > 0:
    print("\n用户列表:")
    for user in User.objects.all()[:5]:  # 只显示前5个
        print(f"用户名: {user.username}, 超级用户: {user.is_superuser}")

print("\n=== 检查完成 ===")
