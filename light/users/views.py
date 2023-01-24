from django.shortcuts import render
from django.http import HttpResponse
from .models import User

def index(request):
    return render(request, 'users/login.html')  

def log_in(request):
    if request.method == 'POST':

        user = User()

        User.username = request.POST.get('username')
        User.password = request.POST.get('password')
        return HttpResponse("Hello, world. You're at the polls index.")

def sign_up(request):
    return HttpResponse("Hello, world. You're at the polls index.")