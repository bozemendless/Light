from django.db import models
from django.utils import timezone

class Account(models.Model):
    id = models.AutoField(primary_key=True)
    email = models.EmailField(
        max_length=64, 
        unique=True,
        db_index=True,
        )
    username = models.CharField(
        max_length=32, 
        unique=True,
        db_index=True,
        )
    password = models.CharField(
        max_length=88,
        db_index=True,
        )
    avatar = models.ImageField(
        upload_to='account/avatar/',
        default=None,
        )
    about_me = models.CharField(
        max_length=100, 
        default='',
        )
    create_time = models.DateTimeField(default=timezone.now)