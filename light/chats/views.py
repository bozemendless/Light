from django.shortcuts import render
from .models import Chat
from django.http import JsonResponse
from accounts.views import check_login
from accounts.models import Account
from channels.db import database_sync_to_async

@check_login
def get_chat_logs(request):
    chat_logs = Chat.objects.all()
    # print('number of logs',len(chat_logs))
    res = {
            'data':[
                {
                    'id': str(chat_log.id),
                    'message':chat_log.content, 
                    'username':chat_log.account.username,
                    'image':str(chat_log.image), 
                    'time':str(chat_log.create_time)
                }
                for chat_log in chat_logs
            ] 
        }
    return JsonResponse(res)

@database_sync_to_async
def save_chat_logs(**log):
    chat = Chat()
    account = Account.objects.get(id=log['user_id'])
    chat.account = account
    chat.content = log['message']
    
    chat.save()
    # print('a chat record insert')

    data = {
        'username': chat.account.username,
        'message': chat.content,
        'time': str(chat.create_time),
    }

    return data