from django.shortcuts import render
from datetime import datetime

# Create your views here.
def channel(request):
    return render(request, 'channel/channel.html',{
        'current_time': str(datetime.now()),
    })
