from django.db import models
from django.utils import timezone
from channel.models import Server

class Chat(models.Model):

    id = models.AutoField(primary_key=True)
    account = models.ForeignKey('accounts.Account', on_delete=models.SET_NULL, null=True)
    content = models.TextField(max_length=512)
    image = models.ImageField(upload_to='images/')
    server = models.ForeignKey(Server, on_delete=models.PROTECT, related_name='chats')
    create_time = models.DateTimeField(default=timezone.now)