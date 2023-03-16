from django.shortcuts import render, redirect
from accounts.views import check_login
from django.http import JsonResponse
import json
import jwt
from dotenv import load_dotenv
import os
from . models import Server
from accounts.models import Account

load_dotenv()
jwt_secret_key = os.getenv('JWT_SECRET_KEY')

@check_login
def channel(request):
    return render(request, 'channel/channel.html')

def server(request):
    # Get server list
    if request.method == 'GET':
        # verify the token
        if 'token' in request.session:
            try: # get user id
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')
            try:
                if 'server_id' in request.GET:
                    request_server = request.GET['server_id']
                    account = Account.objects.get(id=decode_user_id)
                    server = Server.objects.get(id=request_server)
                    if server.members.filter(id=decode_user_id).exists():
                        res = {
                            'data': [
                                {
                                    'id': str(server.id),
                                    'name': server.name,
                                    'creator': {'username': server.creator.username,
                                                'id': server.creator.id},
                                    'members': [{
                                        'username': member.username,
                                        'avatar': member.avatar.url if member.avatar else None,
                                    } for member in server.members.all()]
                                }
                            ]
                        }
                        return JsonResponse(res)
                else:
                    # get user servers list
                    account = Account.objects.get(id=decode_user_id)
                    servers = account.joined_groups.all()
                    res = {
                        'data':[
                            {
                                'id': str(server.id),
                                'name': server.name, 
                                'creator': {'username': server.creator.username,
                                            'id': server.creator.id},
                                'members': [
                                    {
                                        'username': member.username,
                                        'avatar': member.avatar.url if member.avatar else None
                                    }
                                        for member in server.members.all()],
                            }
                            for server in servers
                        ] 
                    }
                    return JsonResponse(res)
            except:
                pass
        else: 
            # token not in session
            return redirect('/login')

    # Create server
    if request.method == 'POST':
        # verify the token
        if 'token' in request.session:
            try: # get user id
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                if request.path != '/login':
                    return redirect('/login')

            try:
                account = Account.objects.get(id=decode_user_id)
                infos = json.loads(request.body)
                name = infos['name']
                server = Server(name=name, creator=account)
                server.save()
                server.members.add(account)
                res = {
                    'data':[
                        {
                            'id': str(server.id),
                            'name': server.name,
                            'creator': {'username': server.creator.username,
                                            'id': server.creator.id},
                            'members': [{
                                        'username': member.username,
                                        'avatar': member.avatar.url if member.avatar else None,
                                    } for member in server.members.all()],
                        }
                    ]
                }
                return JsonResponse(res)

            except:
                error = 'Failed to create server'
                res = {
                    'error': True,
                    'message': error,
                }
                return JsonResponse(res, 400)
        else: 
            # token not in session
            return redirect('/login')

    else: # Method not allowed
        return JsonResponse({}, status=405)


def server_members(request):
    if request.method == 'GET':
        if 'member_username' in request.GET:
            try:
                member_username = request.GET['member_username']
                member = Account.objects.get(username=member_username)
                res = {
                    'username': member.username,
                    'avatar': member.avatar.url if member.avatar else None,
                    'about_me': member.about_me,
                }
                return JsonResponse(res)
            except Account.DoesNotExist:
                return JsonResponse({})

    # Add member to server
    elif request.method == 'POST':
        # verify the token
        if 'token' in request.session:
            try: # get user id
                user_token = request.session['token']
                decode_token = jwt.decode(
                user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                error = 'Failed to validate token.'
                res = {
                    'error': True, 
                    'message': error,
                }
                return JsonResponse(res, status=401)

            try:
                infos = json.loads(request.body)
                server_id = infos['server']
                member_username = infos['member']
                account = Account.objects.get(id=decode_user_id)
                member = Account.objects.get(username=member_username)
                server = Server.objects.get(id=server_id, creator=account)
                if member in server.members.all():
                    res = {
                        'error': True,
                        'message': 'Member already exists in the server',
                    }
                    return JsonResponse(res, status=400)
                else:
                    server.members.add(member)
                    res = {
                        'ok': True,
                        'message': 'Member added successfully.',
                    }
                    return JsonResponse(res)
            except Account.DoesNotExist:
                error = 'The user is not existed'
                res = {
                    'error': True,
                    'message': error,
                }
                return JsonResponse(res, status=400)
            except :
                error = 'Failed to add member'
                res = {
                    'error': True,
                    'message': error,
                }
                return JsonResponse(res, status=400)
        else: 
            # token not in session
            error = 'Failed to validate token.'
            res = {
                'error': True, 
                'message': error,
            }
            return JsonResponse(res, status=401)
        
    elif request.method == "DELETE":
        if 'token' in request.session:
            try: # get user id
                user_token = request.session['token']
                decode_token = jwt.decode(
                    user_token, jwt_secret_key, algorithms="HS256")
                decode_user_id = decode_token['id']
            except:
                del request.session['token']
                error = 'Failed to validate token.'
                res = {
                    'error': True, 
                    'message': error,
                }
                return JsonResponse(res, status=401)

            try:
                infos = json.loads(request.body)
                server_id = infos['server']
                member_username = infos['member']
                account = Account.objects.get(id=decode_user_id) # requester
                server = Server.objects.get(id=server_id)
                member = Account.objects.get(username=member_username) # removed member
                if (member != server.creator and account == member) or (member != server.creator and account == server.creator):
                    
                    server.members.remove(member)
                    res = {
                        'ok': True,
                        'message': 'Member removed successfully.',
                    }
                    return JsonResponse(res)
                else:
                    error = 'You are not authorized to remove this member.'
                    res = {
                        'error': True,
                        'message': error,
                    }
                    return JsonResponse(res, status=401)

            except:
                error = 'Failed to remove member'
                res = {
                    'error': True,
                    'message': error,
                }
                return JsonResponse(res, status=400)
        else: 
            # token not in session
            error = 'Failed to validate token.'
            res = {
                'error': True, 
                'message': error,
            }
            return JsonResponse(res, status=401)

    else: # Method not allowed
        return JsonResponse({}, status=405)