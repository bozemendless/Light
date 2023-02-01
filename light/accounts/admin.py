from django.contrib import admin
from .models import Account

class AccountAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'password', 'create_time')

admin.site.register(Account, AccountAdmin)