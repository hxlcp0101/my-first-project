#!/usr/bin/env python
import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus_food_system.settings')
django.setup()

from django.db import connection

try:
    with connection.cursor() as cursor:
        # 检查标签表是否存在
        cursor.execute('SHOW TABLES LIKE "food_app_tag"')
        tag_table_exists = cursor.fetchone() is not None
        print(f'标签表存在: {tag_table_exists}')
        
        # 检查关联表是否存在
        cursor.execute('SHOW TABLES LIKE "food_app_food_tags"')
        food_tags_table_exists = cursor.fetchone() is not None
        print(f'美食-标签关联表存在: {food_tags_table_exists}')
        
        # 如果标签表不存在，创建它
        if not tag_table_exists:
            cursor.execute('''
            CREATE TABLE food_app_tag (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                created_at DATETIME NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ''')
            print('创建标签表成功')
        
        # 如果关联表不存在，创建它（暂时不添加外键约束）
        if not food_tags_table_exists:
            cursor.execute('''
            CREATE TABLE food_app_food_tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                food_id INT NOT NULL,
                tag_id INT NOT NULL,
                UNIQUE KEY unique_food_tag (food_id, tag_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ''')
            print('创建美食-标签关联表成功（无外键约束）')
        
        print('所有表检查和创建操作完成')
finally:
    connection.close()
