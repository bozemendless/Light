from django.shortcuts import render
from django.http import JsonResponse
from .models import User
import json
import re

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

    if request.method == 'POST':

        try:
            # Parse the form
            infos = json.loads(request.POST.get('infos'))
            email = infos['email']
            username = infos['username']
            password = infos['password']

            # Verify the register form
            email_regex = r'^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$'
            username_regex = r'^[A-Za-z0-9]{2,32}$'
            password_regex = r'.{6,72}$'

            is_email_valid = re.search(email_regex, email)
            is_username_valid = re.search(username_regex, username)
            is_password_valid = re.search(password_regex, password)

            if not(is_email_valid and is_username_valid and is_password_valid):
                error = "the fields are not valid"
                res = {
                    'error': True,
                    'message': error
                }
                return JsonResponse(res, status=400)

            # Check if account exist or field not unique
            is_email_exists = User.objects.filter(email=email).exists()
            is_username_exists = User.objects.filter(username=username).exists()

            if is_email_exists or is_username_exists:
                if is_email_exists:
                    error = 'email already exists'
                if is_username_exists:
                    error = 'username already exists'
                if is_email_exists and is_username_exists:
                    error = 'email and username already exist'
                res = {
                        'error': True,
                        'message': error
                    }
                return JsonResponse(res, status=400)

            # New account register
            user = User()

            user.email = infos['email']
            user.username = infos['username']
            user.password = infos['password']

            user.save()

            res = {
                'ok': False
            }

            return JsonResponse(res)

        except:
            error = 'Internal Server Error'
            res = {
                'error':True,
                'message': error
            }
            return JsonResponse(res, status=500)