import json
from channels.generic.websocket import AsyncWebsocketConsumer
from chats.views import save_chat_logs
class ChannelConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.room_group_name = 'Test-Room' # for now, we only have one channel

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        print('disconnect', close_code)

    async def receive(self, text_data):
        try:
            receive_data = json.loads(text_data)
            action = receive_data['action']
        except Exception as e:
            print(e)
        if action == 'message':
            try:
                message = receive_data['message']
                user_id = receive_data['id']
                data = await save_chat_logs(message=message, action=action, user_id=user_id)

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'send_message',
                        'data': data,
                    }
                )
            except Exception as e:
                print(e)

    async def send_sdp(self, event):
        receive_dict = event['receive_dict']

        await self.send(text_data = json.dumps(receive_dict))

    async def send_message(self, event):
        data = event['data']

        await self.send(text_data=json.dumps({
            'type': 'message',
            'data': data,
        }))


        

        # if action == 'new-offer' or action == 'new-answer':
        #     receiver_channel_name = receive_dict['message']['receiver_channel_name']

        #     receive_dict['message']['receiver_channel_name'] = self.channel_name

        #     await self.channel_layer.send(
        #         receiver_channel_name,
        #         {
        #             'type': 'send_sdp',
        #             'receive_dict': receive_dict
        #         }
        #     )

        #     return 

        # receive_dict['message']['receiver_channel_name'] = self.channel_name

        # await self.channel_layer.group_send(
        #     self.room_group_name,
        #     {
        #         'type': 'send_sdp',
        #         'receive_dict': receive_dict
        #     }
        # )
        

