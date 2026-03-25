#!/usr/bin/env python
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_food_system.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        # 检查标签表是否存在权重字段
        cursor.execute('SHOW COLUMNS FROM food_app_tag LIKE "weight"')
        weight_field_exists = cursor.fetchone() is not None
        print(f'权重字段存在: {weight_field_exists}')
        
        # 如果权重字段不存在，添加它
        if not weight_field_exists:
            cursor.execute('ALTER TABLE food_app_tag ADD COLUMN weight INT DEFAULT 1 NOT NULL')
            print('添加权重字段成功')
        
        print('标签表结构更新完成')
finally:
    connection.close()
