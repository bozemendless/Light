from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_page),
    path('register', views.register_page),
    path('api/user', views.register),
    path('api/user/auth',views.auth),
    path('api/user/avatar', views.avatar),
    path('api/user/about_me', views.about_me),
] 
