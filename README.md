# Light
`Light is a community-oriented instant messaging platform inspired by Discord's design. It allows members to create servers and chat channels freely and communicate via messages, video, and audio.`

Demo link: https://shichenx.com

## Main used technology
- Django
- Django Channels
- WebSocket
- WebRTC (getUserMedia, RTCPeerConnection, RTCDataChannel)

## Software Structure
![Light drawio3](https://user-images.githubusercontent.com/98375601/222913079-d914db04-9ef7-4bc3-a96e-a4b6a0630133.png)


## Database ER Diagram
![Light_DBER](https://user-images.githubusercontent.com/98375601/222913206-c2d88f00-d53b-4d4b-8ced-2208baa73ad9.png)

## Tree-structured Directories
```
light
│  manage.py
│  
├─accounts
│  │  admin.py
│  │  apps.py
│  │  models.py
│  │  urls.py
│  │  views.py
│  │  __init__.py
│  │  
│  │          
│  ├─static
│  │  └─accounts
│  │      ├─css
│  │      │      accounts.css
│  │      │      
│  │      └─js
│  │              login.js
│  │              register.js
│  │              
│  └─templates
│       └─accounts
│             login.html
│             register.html
│            
│          
├─channel
│  │ admin.py
│  │ apps.py
│  │ consumers.py
│  │  models.py
│  │  routing.py
│  │  urls.py
│  │  views.py
│  │  __init__.py
│  │ 
│  │        
│  ├─static
│  │  └─channel
│  │      ├─css
│  │      │      channel.css
│  │      │      setting.css
│  │      │      
│  │      ├─imgs
│  │      │      default_avatar-512x512.png
│  │      │      me_server.png
│  │      │      Ripple-2s-243px.gif
│  │      │      
│  │      └─js
│  │              channel.js
│  │              server.js
│  │              setting.js
│  │              
│  └─templates
│     └─channel
│             channel.html
│            
│         
├─chats
│       admin.py
│       apps.py
│       models.py
│       urls.py
│        views.py
│       __init__.py
│            
│          
├─light
│       asgi.py
│       settings.py
│       urls.py
│       wsgi.py
│       __init__.py
│       
│              
└─static
    └─light
            favicon.ico

.gitignore
Dockerfile
README.md
requirements.txt
