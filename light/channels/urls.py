from django.urls import path
from . import views

urlpatterns = [
    path('', views.channels, name='channels'),
    # path('api/message', views.create_message, name='create_message'),
] 
