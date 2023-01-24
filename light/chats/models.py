from django.db import models
from django.utils import timezone

class Chat(models.Model):

    id = models.AutoField(primary_key=True)
    content = models.TextField(max_length=255)
    image = models.ImageField(upload_to='images/')
    create_time = models.DateTimeField(default=timezone.now)