from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from food_app.models import Food, FoodCategory, Review
from django.http import HttpResponseRedirect

# 首页重定向
def home(request):
    return HttpResponseRedirect('/static/html/index.html')

# 用户注册 - 重定向到前端静态页面
def user_register(request):
    return HttpResponseRedirect('/static/html/register.html')

# 用户登录 - 重定向到前端静态页面
def user_login(request):
    return HttpResponseRedirect('/static/html/login.html')

# 用户退出
def user_logout(request):
    logout(request)
    return HttpResponseRedirect('/static/html/index.html')
