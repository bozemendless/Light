from django.db import models
from django.utils import timezone
from accounts.models import Account

class Server(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    creator = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='created_groups')
    members = models.ManyToManyField(Account, related_name='joined_groups')
    create_time = models.DateTimeField(default=timezone.now)