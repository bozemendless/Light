# Light
`Light is a social platform written by the Django MTV pattern that provides members with instant communication, including messaging, voice call, video call, and screen sharing.`

Demo link: https://shichenx.com

## Main used technology (So far)
- Django
- Django Channels
- WebSocket
- WebRTC (getUserMedia, RTCPeerConnection, RTCDataChannel)

## Deploy Structure

```
── EC2
     │
     └─ Nginx
          │
          └─ Container-APP ── Container-Redis
                 │
                 │
               AWS RDS

```

```
──light
    │  manage.py
    │
    ├─channel
    │  │  admin.py
    │  │  apps.py
    │  │  consumers.py
    │  │  models.py
    │  │  routing.py
    │  │  urls.py
    │  │  views.py
    │  │  __init__.py
    │  │
    │  ├─static
    │  │  └─channel
    │  │      ├─css
    │  │      │      channel.css
    │  │      │
    │  │      └─js
    │  │              channel.js
    │  │
    │  └─templates
    │     └─channel
    │             channel.html
    │   
    ├─chats
    │     admin.py
    │     apps.py
    │     models.py
    │     views.py
    │     __init__.py
    │  
    ├─light
    │     asgi.py
    │     settings.py
    │     urls.py
    │     wsgi.py
    │     __init__.py
    │
    ├─static
    │  └─light
    │          favicon.ico
    │
    └─users
        │  admin.py
        │  apps.py
        │  models.py
        │  urls.py
        │  views.py
        │  __init__.py
        │
        ├─static
        │  └─users
        │      ├─css
        │      │      users.css
        │      │
        │      └─js
        │              login.js
        │              register.js
        │
        └─templates
           └─users
                   login.html
                   register.html
```
## TODOs:
- Friend Request and Private Message
- Email Verification for Signing Up 
- Custom and Create Channels
- Canvas Sharing