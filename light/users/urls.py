from django.urls import path
from . import views

urlpatterns = [
    path('login', views.index, name='Index'),
    path('api/login', views.log_in, name='Log_in'),
    path('api/signup', views.sign_up, name='Sign_up'),
] 
