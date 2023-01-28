from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    # re_path(r"ws/channels/(?P<room_name>\w+)/$", consumers.ChannelConsumer.as_asgi()),
    re_path(r'', consumers.ChannelConsumer.as_asgi()),
]