from django.urls import path
from . import views

urlpatterns = [
    path('', views.channel, name='channel'),
    path('api/server', views.server),
    path('api/server/add_member', views.server_add_member),
] 
