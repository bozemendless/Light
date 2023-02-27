from .models import Account
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.contrib.auth.hashers import make_password, check_password
from django.core.files.storage import default_storage
from django.conf import settings
from dotenv import load_dotenv
from datetime import timedelta
import datetime
import json
import re
import jwt
import os

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
# Register: '/api/user'
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

# Get, Login, Logout, Update : 'api/user/auth'
def auth(request):
    # Get account data
    if request.method == 'GET':
        # verify the token
        if 'token' in request.session:
            try:
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
                account_set = Account.objects.filter(id=decode_user_id).values('username', 'email', 'avatar')
                if account_set:
                    username = account_set[0]['username']
                    email = account_set[0]['email']
                    avatar = '/media/' + account_set[0]['avatar'] if account_set[0]['avatar'] else None
                user_id = decode_token['id']
                res = {
                    'id': user_id,
                    'username': username,
                    'email': email,
                    'avatar': avatar
                }
                return JsonResponse(res)
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')
        # # token not in session
        return redirect('/login')

    # Login
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

    # Logout
    if request.method == 'DELETE':
        if 'token' in request.session:
            del request.session['token']
        res = {
            'ok': True
        }
        return JsonResponse(res)

    # Update
    if request.method == 'PATCH':
        # verify the token and the user password
        if 'token' in request.session:
            try:
                # Response object
                res_err = False
                res = {}
                # Decode ID in token
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']

                # Parse the password in request body 
                infos = json.loads(request.body.decode('utf-8'))

                password = infos['password']
                update_type = infos['type']

                # Verify the password
                account_set = Account.objects.filter(id=decode_user_id).values('password')
                encoded_password = account_set[0]['password']
                if not check_password(password, encoded_password):
                    error = 'Password is invalid'
                    res['message'] = error
                    res_err = True

                # verity the field and update the data
                # username
                elif update_type == 'username':
                    new_username = infos['value']
                    username_regex = r'^[A-Za-z0-9]{2,32}$'
                    is_username_valid = re.search(username_regex, new_username)
                    if not is_username_valid:
                        error = 'Username is not valid'
                        res['message'] = error
                        res_err = True
                    elif Account.objects.filter(username=new_username).exists():
                        error = 'Username already exists'
                        res['message'] = error
                        res_err = True
                    elif not Account.objects.filter(id=decode_user_id).update(username=new_username):
                        error = 'Update failed'
                        res['message'] = error
                        res_err = True
                    else:
                        res['value'] = new_username
                # email
                elif update_type == 'email':
                    new_email = infos['value']
                    email_regex = r'^(?=.{8,64}$)\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+$'
                    is_email_valid = re.search(email_regex, new_email)
                    if not is_email_valid:
                        error = 'Email is not valid'
                        res['message'] = error
                        res_err = True
                    elif Account.objects.filter(email=new_email).exists():
                        error = 'Email already exists'
                        res['message'] = error
                        res_err = True
                    elif not Account.objects.filter(id=decode_user_id).update(email=new_email):
                        error = 'Update failed'
                        res['message'] = error
                        res_err = True
                    else:
                        res['value'] = new_email
                # password
                elif update_type == 'password':
                    new_password = infos['value']
                    new_password_confirm = infos['valueConfirm']
                    if new_password != new_password_confirm:
                        error = 'Passwords entered twice are different'
                        res['message'] = error
                        res_err = True
                    password_regex = r'.{6,72}$'
                    is_password_valid = re.search(password_regex, new_password)
                    if not is_password_valid:
                        error = 'Password is not valid'
                        res['message'] = error
                        res_err = True
                    if not Account.objects.filter(decode_user_id).update(password=new_password):
                        error = 'Update failed'
                        res['message'] = error
                        res_err = True

                if res_err:
                    status = 400
                    res['error']= True
                else:
                    status = 200
                    res['ok'] = True

                return JsonResponse(res, status=status)

            except Exception as e:
                print(e)
                error = 'Internal Server Error'
                res = {
                    'error':True,
                    'message': error
                }
                return JsonResponse(res, status=500)

        # # token not in session
        return redirect('/login')
    
def avatar(request):
    if request.method == 'POST':
        # verify the token
        if 'token' in request.session:
            try:
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')

            # If old avatar, delete old avatar
            # Store new avatar
            try:
                image = request.FILES.get('image')

                updated_user = Account.objects.get(id=decode_user_id)
                if updated_user.avatar:
                        old_file_path = settings.MEDIA_ROOT + '/' + str(updated_user.avatar)
                        default_storage.delete(old_file_path)

                updated_user.avatar = image
                updated_user.save()

                res = {
                    'ok': True,
                    'avatar': updated_user.avatar.url,
                    }

                print(res)

                return JsonResponse(res)

            except:
                error = 'Internal Server Error'
                res = {
                    'error': True,
                    'message': error
                }
                JsonResponse(res, 500)

        # # token not in session
        return redirect('/login')
    
    if request.method == 'DELETE':
        # verify the token
        if 'token' in request.session:
            try:
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')

            # If old avatar, delete old avatar
            try:
                updated_user = Account.objects.get(id=decode_user_id)
                if updated_user.avatar:
                        old_file_path = settings.MEDIA_ROOT + '/' + str(updated_user.avatar)
                        default_storage.delete(old_file_path)
                        updated_user.avatar.delete()

                res = {
                    'ok': True,
                    'avatar': '/static/channel/imgs/default_avatar-512x512.png'
                    }

                return JsonResponse(res)

            except:
                error = 'Internal Server Error'
                res = {
                    'error': True,
                    'message': error
                }
                JsonResponse(res, 500)

        # # token not in session
        return redirect('/login')