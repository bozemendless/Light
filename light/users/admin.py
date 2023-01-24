from django.contrib import admin
from .models import User

class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'date_joined', 'is_superuser')

admin.site.register(User, UserAdmin)