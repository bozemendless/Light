import json
from channels.generic.websocket import AsyncWebsocketConsumer
from chats.views import save_chat_logs
from channels.exceptions import StopConsumer
from .views import get_server

general_voice_channel_list = []
connections = {}

class ChannelConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_group_name = 'Light' # public server

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # send current online member
        if general_voice_channel_list:
            data = {
                'action': 'channel_list',
                'general_voice_channel': general_voice_channel_list
            }

            await self.channel_layer.send(
                self.channel_name,
                {
                    'type': 'notification',
                    'data': data
                }
            )

    async def disconnect(self, close_code):
        data = {
            'action': 'leave',
            'peer_channel_name': self.channel_name
        }
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send_sdp',
                'data': data
            }
        )
        # remove from online list
        if self.channel_name in connections:
            del connections[self.channel_name]

        for user in general_voice_channel_list:
            if user['peer_channel_name'] == self.channel_name:

                data = {
                    'action': 'leave_room',
                    'peer_username': user['peer_username'],
                    'peer_channel_name': user['peer_channel_name'],
                    'peer_server_id': user['peer_server_id'],
                    # 'peer_nickname': user['peer_nickname'],
                }

                general_voice_channel_list.remove(user)

                await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'notification',
                            'data': data
                        }
                    )
                return


        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print('disconnect', close_code)

        raise StopConsumer()

    async def receive(self, text_data):
        try:
            receive_data = json.loads(text_data)
            action = receive_data['action']
        except Exception as e:
            print(e)

        if action == 'login':
            try:
                user_id = receive_data['id']
                username = receive_data['username']
                connections[self.channel_name] = {
                    'id': user_id,
                    'username': username,
                    'channel_name': self.channel_name,
                }
            except Exception as e:
                print(e)

        if action == 'serverAddMember':
            try:
                username = receive_data['username']
                server_id = receive_data['server']
                for connection in connections.values():
                    if connection['username'] == username:
                        member_channel_name = connection['channel_name']
                        data = await get_server(server_id)
                        data['action'] = 'server_add_member'
                        await self.channel_layer.send(
                            member_channel_name,
                            {
                                'type': 'notification',
                                'data': data,
                            }
                        )
                        break
            except Exception as e:
                print(e)
            
        if action == 'serverRemoveMember':
            try:
                username = receive_data['username']
                for connection in connections.values():
                    if connection['username'] == username:
                        member_channel_name = connection['channel_name']
                        data = {}
                        data["server"] = receive_data['serverId']
                        data['action'] = 'server_delete_member'
                        await self.channel_layer.send(
                            member_channel_name,
                            {
                                'type': 'notification',
                                'data': data,
                            }
                        )
                        break
            except Exception as e:
                print(e)

        # Chat message
        if action == 'message':
            try:
                message = receive_data['message']
                user_id = receive_data['id']
                username = receive_data['username']
                server_id = receive_data['serverId']
                data = await save_chat_logs(message=message, action=action, user_id=user_id, server_id=server_id)
                data['username'] = username
                data['message'] = message
                data['server'] = server_id
                data['channel_name'] = self.channel_name

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'send_message',
                        'data': data,
                    }
                )
            except Exception as e:
                print(e)

        # # Video 
        # New member joining
        if action == 'peer':

            peer_id = receive_data['peerId']
            user_id = receive_data['id']
            peer_username = receive_data['username']
            peer_server_id = receive_data['server']
            # peer_nickname = receive_data['nickname']
            peer_channel_name = self.channel_name

            # send sdp
            data = {
                'action': 'peer',
                'user_id': user_id,
                'peer_id': peer_id,
                'peer_username': peer_username,
                'peer_channel_name': peer_channel_name,
                'peer_server_id': peer_server_id,
                # 'peer_nick_name': peer_nickname,
            }

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_sdp',
                    'data': data
                }
            )

            # append to online list
            channel_member = {
                'peer_channel_name': peer_channel_name,
                'peer_username': peer_username,
                'peer_server_id': peer_server_id,
                # 'peer_nickname': peer_username,
            }
            general_voice_channel_list.append(channel_member)



            # notify online member new peer joining the room
            data = {
                'action': 'join_room',
                'peer_username': peer_username,
                'peer_channel_name': peer_channel_name,
                'peer_server_id': peer_server_id,
                # 'peer_nickname': nickname,
            }

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'notification',
                    'data': data
                }
            )

        # answer to new Peer
        if action == 'answer':

            peer_id = receive_data['peerId']
            user_id = receive_data['userId']
            peer_username = receive_data['username']
            new_peer_channel_name = receive_data['peerChannelName']

            data = {
                'action': 'answer',
                'user_id': user_id,
                'peer_id': peer_id,
                'peer_username': peer_username,
                'answer_channel_name': self.channel_name
            }

            await self.channel_layer.send(
                new_peer_channel_name,
                {
                    'type': 'send_sdp',
                    'data': data,
                }
            )

        # Leave the channel
        if action == 'leave':
            data = {
                'action': 'leave',
                'peer_channel_name': self.channel_name
            }
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'send_sdp',
                    'data': data
                }
            )

    async def send_sdp(self, event):
        data = event['data']

        await self.send(text_data = json.dumps({
            'type': 'sdp',
            'data': data,
        }))

    async def send_message(self, event):
        data = event['data']

        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': data,
        }))

    async def notification(self, event):
        data = event['data']

        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': data,
        }))
