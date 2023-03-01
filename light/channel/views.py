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
            # try: # get user server list
            account = Account.objects.get(id=decode_user_id)
            servers = account.joined_groups.all()
            res = {
                'data':[
                    {
                        'id': str(server.id),
                        'name': server.name, 
                        'creator': server.creator.username,
                        'members': [member.username for member in server.members.all()],
                    }
                    for server in servers
                ] 
            }
            return JsonResponse(res)
            # except:
            #     pass
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
                            'creator': server.creator.username,
                            'members': [member.username for member in server.members.all()],
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
        


def server_add_member(request):
    pass