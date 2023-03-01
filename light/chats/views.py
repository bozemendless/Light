from django.shortcuts import render
from .models import Chat
from django.http import JsonResponse
from accounts.views import check_login
from accounts.models import Account
from channels.db import database_sync_to_async
from channel.models import Server

@check_login
def chat(request):
    server_id = request.GET.get('server_id')
    chat_logs = Chat.objects.filter(server=server_id)

    res = {
            'data':[
                {
                    'id': str(chat_log.id),
                    'message' :chat_log.content, 
                    'username' :chat_log.account.username,
                    'avatar': chat_log.account.avatar.url if chat_log.account.avatar else'',
                    'image': str(chat_log.image), 
                    'time': str(chat_log.create_time),
                    'server': server_id
                }
                for chat_log in chat_logs
            ] 
        }
    return JsonResponse(res)

@database_sync_to_async
def save_chat_logs(**log):
    server = Server.objects.get(id=log['server_id'])
    chat = Chat()
    account = Account.objects.get(id=log['user_id'])
    chat.account = account
    chat.content = log['message']
    chat.server = server
    
    chat.save()
    # print('a chat record insert')

    data = {
        # 'username': chat.account.username,
        # 'message': chat.content,
        'time': str(chat.create_time),
        'avatar': chat.account.avatar.url if chat.account.avatar else None,
    }

    return data