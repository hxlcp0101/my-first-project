#!/usr/bin/env python
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_food_system.settings')
django.setup()

from food_app.models import Tag, Food

# 检查所有标签
print('=== 数据库中的标签 ===')
tags = Tag.objects.all()
if tags:
    for tag in tags:
        print(f'ID: {tag.id}, 名称: {tag.name}, 权重: {tag.weight}, 关联美食数: {tag.food_set.count()}')
else:
    print('数据库中没有标签')

# 检查是否有川菜标签
print('\n=== 检查川菜标签 ===')
try:
    sichuan_tag = Tag.objects.get(name='川菜')
    print(f'找到川菜标签: ID={sichuan_tag.id}, 权重={sichuan_tag.weight}, 关联美食数={sichuan_tag.food_set.count()}')
    # 检查关联的美食
    print('关联的美食:')
    for food in sichuan_tag.food_set.all():
        print(f'  - {food.name} ({food.category.name})')
except Tag.DoesNotExist:
    print('数据库中没有川菜标签')

# 检查所有美食及其标签
print('\n=== 所有美食及其标签 ===')
foods = Food.objects.all()
if foods:
    for food in foods:
        tags = food.tags.all()
        tag_names = [tag.name for tag in tags]
        print(f'{food.name} ({food.category.name}): {tag_names if tag_names else "无标签"}')
else:
    print('数据库中没有美食')
