import mysql.connector

# 数据库连接配置
config = {
    'user': 'root',
    'password': '123456',
    'host': 'localhost',
    'database': 'campus_food_system',
    'raise_on_warnings': True
}

try:
    # 连接数据库
    cnx = mysql.connector.connect(**config)
    cursor = cnx.cursor()
    
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
    
    # 如果关联表不存在，创建它
    if not food_tags_table_exists:
        cursor.execute('''
        CREATE TABLE food_app_food_tags (
            id INT AUTO_INCREMENT PRIMARY KEY,
            food_id INT NOT NULL,
            tag_id INT NOT NULL,
            FOREIGN KEY (food_id) REFERENCES food_app_food(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES food_app_tag(id) ON DELETE CASCADE,
            UNIQUE KEY unique_food_tag (food_id, tag_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ''')
        print('创建美食-标签关联表成功')
    
    # 提交更改
    cnx.commit()
    print('所有表检查和创建操作完成')
    
finally:
    # 关闭游标和连接
    if cursor:
        cursor.close()
    if cnx:
        cnx.close()
