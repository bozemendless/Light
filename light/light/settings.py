from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

host = os.getenv('RDS_DB_HOST')
user = os.getenv('RDS_DB_USER')
password = os.getenv('RDS_DB_PASSWORD')
database = os.getenv('RDS_DB_NAME')
port = os.getenv('RDS_DB_PORT')
docker_gateway = os.getenv('DOCKER_GATEWAY')

access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
storage_bucket_name = os.getenv('AWS_STORAGE_BUCKET_NAME')
cdn_domain_name = os.getenv('AWS_CUSTOM_DOMAIN')
static_url = os.getenv('CDN_STATIC_URL')

secret_key = os.getenv('SECRET_KEY')

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = secret_key

DEBUG = False

ALLOWED_HOSTS = ['127.0.0.1','localhost','shichenx.com']


# CORS
CORS_ALLOWED_ORIGINS = [
    'http://127.0.0.1',
    'http://localhost',
    'https://shichenx.com',
    'http://shichenx.com',
]


# CSRF Token

CSRF_COOKIE_DOMAIN = '.shichenx.com'
CSRF_TRUSTED_ORIGINS = [
    'https://*.shichenx.com'
]


# Application definition


INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channel',
    'chats',
    'accounts',
    'storages',
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'light.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'light.wsgi.application'


# Database

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': database,
        'USER': user,
        'PASSWORD': password,
        'HOST': host,
        'PORT': port,
        'OPTIONS': {
            'init_command': "SET time_zone='+8:00'",
        },
    }
}


# S3 settings

AWS_ACCESS_KEY_ID = access_key_id
AWS_SECRET_ACCESS_KEY = secret_access_key
AWS_STORAGE_BUCKET_NAME = storage_bucket_name
AWS_S3_CUSTOM_DOMAIN = cdn_domain_name
AWS_S3_FILE_OVERWRITE = True
AWS_DEFAULT_ACL = None
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    # {
    #     'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    # },
    # {
    #     'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    # },
]


# Internationalization

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Taipei'

USE_I18N = True

USE_TZ = False


# Static files (CSS, JavaScript, Images)

if DEBUG:
    STATIC_URL = 'static/'
    STATIC_ROOT = os.path.join(BASE_DIR, 'static')

else:
    STATIC_URL = static_url
    STATICFILES_DIRS = [
        os.path.join(BASE_DIR, 'static'),
        ]
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# Default primary key field type

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ASGI

ASGI_APPLICATION = 'light.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [(docker_gateway, 6379)],
        },
    },
}