from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_page),
    path('register', views.register_page),
    path('api/login', views.login),
    path('api/register', views.register),
    path('api/account', views.get_account_data),
] 
