from django.shortcuts import render, redirect
from django.http import JsonResponse
import json
import re
from .models import Account
import jwt
import os
from dotenv import load_dotenv
import datetime
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password

load_dotenv()
jwt_secret_key = os.getenv('JWT_SECRET_KEY')

# Login status check decorator
def check_login(callback):
    def wrapper(request):
        # token in session
        if 'token' in request.session:
            try:
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')
            return callback(request)
        # # token not in session
        return redirect('/login')
    return wrapper

# Render pages
def login_page(request):
    if 'token' in request.session:
        return redirect('/')
    return render(request, 'accounts/login.html')  

def register_page(request):
    if 'token' in request.session:
        return redirect('/')
    return render(request, 'accounts/register.html')  

# APIs
def login(request):
    if request.method == 'PUT':
        try:
            # Parse the form
            infos = json.loads(request.body)
            email = infos['email']
            password = infos['password']

            # check if login infos are valid: 
                # if account exists, return a queryset of pk(id) and password.
                # if not exist, return an empty queryset.
            account_set = Account.objects.filter(email=email).values('pk', 'password')

            # account exists
            if account_set:
                account_id = account_set[0]['pk']
                encoded_password = account_set[0]['password']

                # password is valid
                if check_password(password,encoded_password):
                    payload = {
                        "id": account_id,
                        "exp": datetime.datetime.utcnow() + timedelta(days=7)
                    }
                    encoded_id = jwt.encode(payload, jwt_secret_key) # use encoded id as token
                    request.session['token'] = encoded_id
                    res = {
                        'ok': True
                    }
                    return JsonResponse(res)

                # password is invalid
                if not check_password(password,encoded_password):
                    error = 'Password is invalid'
                    res = {
                        'error': True, 
                        'message': error
                    }
                    return JsonResponse(res, status=400)

            # account not exist
            if not account_set:
                error = 'Email does NOT exist'
                res = {
                    'error': True,
                    'message': error
                }
                return JsonResponse(res, status=400)
        except:
            error = 'Internal Server Error'
            res = {
                'error':True,
                'message': error
            }
            return JsonResponse(res, status=500)
        

def register(request):
    if request.method == 'POST':
        try:
            # Parse the form
            infos = json.loads(request.body)
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
            is_email_exists = Account.objects.filter(email=email).exists()
            is_username_exists = Account.objects.filter(username=username).exists()

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
            account = Account()

            account.email = email
            account.username = username
            account.password = make_password(password) # PBKDF2

            account.save()

            res = {
                'ok': True
            }

            return JsonResponse(res)

        except:
            error = 'Internal Server Error'
            res = {
                'error':True,
                'message': error
            }
            return JsonResponse(res, status=500)