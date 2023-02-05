from django.urls import path
from . import views

urlpatterns = [
    path('api/chat_logs', views.get_chat_logs, name='get_chat_logs'),
    # path('api/token', views.get_token, name='get_token')
] 
