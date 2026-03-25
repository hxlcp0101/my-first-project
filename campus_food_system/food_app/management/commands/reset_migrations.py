from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = '重置所有迁移历史和数据库表结构'

    def handle(self, *args, **options):
        # 连接到数据库
        with connection.cursor() as cursor:
            # 禁用外键约束
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # 删除所有Django默认表
            cursor.execute("DROP TABLE IF EXISTS django_migrations CASCADE")
            cursor.execute("DROP TABLE IF EXISTS django_content_type CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_permission CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_group_permissions CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_group CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_user_groups CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_user_user_permissions CASCADE")
            cursor.execute("DROP TABLE IF EXISTS auth_user CASCADE")
            cursor.execute("DROP TABLE IF EXISTS django_session CASCADE")
            cursor.execute("DROP TABLE IF EXISTS django_admin_log CASCADE")
            
            # 删除food_app相关表
            cursor.execute("DROP TABLE IF EXISTS food_app_favorite CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_review CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_food_tags CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_food CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_userprofile CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_tag CASCADE")
            cursor.execute("DROP TABLE IF EXISTS food_app_foodcategory CASCADE")
            
            # 重新启用外键约束
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        self.stdout.write(self.style.SUCCESS('成功重置数据库表结构'))
