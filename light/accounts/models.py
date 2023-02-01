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
        max_length=72,
        db_index=True,
        )
    create_time = models.DateTimeField(default=timezone.now)