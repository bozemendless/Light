from django.shortcuts import render
from datetime import datetime

# Create your views here.
def channels(request):
    return render(request, 'channels/channels.html',{
        'current_time': str(datetime.now()),
    })
