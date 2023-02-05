"""light URL Configuration"""

from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path('channel/', include('channel.urls')),
    path('', include('accounts.urls')),
    path('', include('channel.urls')),
    path('', include('chats.urls')),
    path('admin', admin.site.urls),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)