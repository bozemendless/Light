# Light
 
Light is a community-oriented instant messaging platform inspired by Discord's design. It allows members to create servers and communicate in channel of each server freely via messages, video, and audio. 

![shichenx com_ (2)](https://user-images.githubusercontent.com/98375601/225050405-9784ec7c-a28a-4225-983b-33dd56ad8ade.png)

## Main Freatures
- Use Django as server framework.
- Use Django Channels as support of WebSocket (ASGI) to achieve real-time chat.
- Use WebRTC to achieve voice and video chat.
- Deploy the website by Docker.
- Store static files and uploaded media from user by AWS S3 and speed up distribution of static files by CloudFront.
- Authenticate user with JSON Web Token.
- Use Django ORM with AWS RDS for MySQL and normalize database in 3NF.
- Use unit tests to ensure the correctness and robustness.

## Main Technologies
### Back-End
- Python Django
- Python Django Channels (ASGI)
- RESTful APIs
- Linux(Ubuntu)
- MVC Pattern
- Unit Test
### Front-End
- HTML
- CSS
- JavaScript
- Ajax
### Cloud Service (AWS)
- EC2
- S3
- CloudFront
- RDS (MySQL)
### Database
- MySQL
- Django ORM
- Redis
### Networking
- HTTP & HTTPS
- Domain Name System
- NGINX
- SSL (SSL For Free)
- WebSocket, WebRTC
### Development Tools
- Docker
- Git /GitHub

## Architecture
![Light drawio (2)](https://user-images.githubusercontent.com/98375601/222950372-6c0373b2-070e-4b53-92a1-77d8ff6077d0.png)

![Light_websocket drawio](https://user-images.githubusercontent.com/98375601/222950263-fbf8fcdb-940b-41cf-9e33-66b770f0a33d.png)



## Database ER Diagram
![Light_DBER](https://user-images.githubusercontent.com/98375601/225050323-02266428-6ca1-445b-ac03-53e80112d4b8.png)

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
```

## Contact
🧑‍💻 Jesse Hou 侯晨曦

✉ jessehou6@gmail.com
