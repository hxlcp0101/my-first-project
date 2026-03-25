from django.urls import path
from . import views, api_views

urlpatterns = [
    # 前端页面路由
    path('register/', views.user_register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    
    # API路由
    path('api/register/', api_views.api_register, name='api_register'),
    path('api/login/', api_views.api_login, name='api_login'),
    path('api/logout/', api_views.api_logout, name='api_logout'),
    path('api/categories/', api_views.api_get_categories, name='api_get_categories'),
    path('api/foods/', api_views.api_get_foods, name='api_get_foods'),
    path('api/foods/<int:food_id>/', api_views.api_get_food_detail, name='api_get_food_detail'),
    path('api/foods/<int:food_id>/reviews/', api_views.api_get_reviews, name='api_get_reviews'),
    path('api/reviews/submit/', api_views.api_submit_review, name='api_submit_review'),
    path('api/reviews/reply/', api_views.api_reply_comment, name='api_reply_comment'),
    path('api/recommendations/', api_views.api_get_recommendations, name='api_get_recommendations'),
    path('api/personalized-recommendations/', api_views.api_get_personalized_recommendations, name='api_get_personalized_recommendations'),
    path('api/sentiment-analysis/', api_views.api_analyze_sentiment, name='api_analyze_sentiment'),
    path('api/smart-search/', api_views.api_smart_search, name='api_smart_search'),
    path('api/popular-reviews/', api_views.api_get_popular_reviews, name='api_get_popular_reviews'),
    
    # 用户中心 API
    path('api/user/info/', api_views.api_get_user_info, name='api_get_user_info'),
    path('api/user/reviews/', api_views.api_get_user_reviews, name='api_get_user_reviews'),
    path('api/user/change-password/', api_views.api_change_password, name='api_change_password'),
    path('api/user/update-info/', api_views.api_update_user_info, name='api_update_user_info'),
    path('api/user/upload-avatar/', api_views.api_upload_avatar, name='api_upload_avatar'),
    path('api/reviews/<int:review_id>/edit/', api_views.api_edit_review, name='api_edit_review'),
    path('api/reviews/<int:review_id>/delete/', api_views.api_delete_review, name='api_delete_review'),
    path('api/favorites/add/', api_views.api_add_favorite, name='api_add_favorite'),
    path('api/favorites/<int:food_id>/remove/', api_views.api_remove_favorite, name='api_remove_favorite'),
    path('api/favorites/', api_views.api_get_favorites, name='api_get_favorites'),
    
    # 通知相关 API
    path('api/notifications/', api_views.api_get_notifications, name='api_get_notifications'),
    path('api/notifications/<int:notification_id>/read/', api_views.api_mark_notification_read, name='api_mark_notification_read'),
    path('api/notifications/<int:notification_id>/delete/', api_views.api_delete_notification, name='api_delete_notification'),
    path('api/notifications/unread-count/', api_views.api_get_unread_notification_count, name='api_get_unread_notification_count'),
    path('api/notifications/mark-all-read/', api_views.api_mark_all_notifications_read, name='api_mark_all_notifications_read'),
    path('api/notifications/clear-all/', api_views.api_clear_all_notifications, name='api_clear_all_notifications'),
    
    # 系统管理模块 API
    path('api/admin/categories/add/', api_views.api_add_category, name='api_add_category'),
    path('api/admin/categories/<int:category_id>/edit/', api_views.api_edit_category, name='api_edit_category'),
    path('api/admin/categories/<int:category_id>/delete/', api_views.api_delete_category, name='api_delete_category'),
    path('api/admin/foods/add/', api_views.api_add_food, name='api_add_food'),
    path('api/admin/foods/<int:food_id>/edit/', api_views.api_edit_food, name='api_edit_food'),
    path('api/admin/foods/<int:food_id>/delete/', api_views.api_delete_food, name='api_delete_food'),
    path('api/admin/reviews/', api_views.api_admin_get_reviews, name='api_admin_get_reviews'),
    path('api/admin/reviews/analysis/', api_views.api_admin_reviews_analysis, name='api_admin_reviews_analysis'),
    path('api/admin/reviews/<int:review_id>/delete/', api_views.api_admin_delete_review, name='api_admin_delete_review'),
    path('api/admin/insights/', api_views.api_admin_insights, name='api_admin_insights'),
    
    # 标签 API
    path('api/tags/', api_views.api_get_tags, name='api_get_tags'),
    
    # 轮播图片 API
    path('api/carousel/', api_views.api_get_carousel, name='api_get_carousel'),
]