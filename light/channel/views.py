from django.shortcuts import render
from accounts.views import check_login

@check_login
def channel(request):
    return render(request, 'channel/channel.html')