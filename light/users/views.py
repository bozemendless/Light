from django.shortcuts import render
from django.http import JsonResponse
from .models import User
import json

def login_page(request):
    return render(request, 'users/login.html')  

def register_page(request):
    return render(request, 'users/register.html')  

def login(request):
    if request.method == 'POST':

        user = User()

        request_body = json.loads(request.body)
        
        user.email = request_body['email']
        user.password = request_body['password']

        print(user)

        res = {
            'ok': True
        }

        return JsonResponse(res)

def register(request):

    if request.method == "POST":
        user = User()

        request_body = json.loads(request.body)
        
        user.email = request_body['email']
        user.username = request_body['username']
        user.password = request_body['password']

        print(user) # default username

        res = {
            'ok': True
        }

        return JsonResponse(res)