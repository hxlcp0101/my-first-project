import sqlite3
import os

db_path = r'd:\graduation\campus_food_system\db.sqlite3'
print(f"数据库文件路径: {db_path}")
print(f"文件是否存在: {os.path.exists(db_path)}")
print(f"文件大小: {os.path.getsize(db_path) if os.path.exists(db_path) else 0} bytes")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print(f"\n查询到 {len(tables)} 个表格")
    print("\n数据库中的数据表格：")
    print("=" * 50)
    if tables:
        for table in tables:
            print(f"- {table[0]}")
    else:
        print("数据库中没有表格！")
    
    conn.close()
else:
    print("数据库文件不存在！")
