from django.urls import path
from . import views

urlpatterns = [
    path('', views.channel, name='channel'),
    path('api/server', views.server),
    path('api/server/members', views.server_members),
] 
