import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from apps.chat.models import Conversation, Message
from apps.chat.services import ChatService

class ChatConsumer(AsyncWebsocketConsumer):
    conversation_id: int | None = None
    room: str | None = None

    @database_sync_to_async
    def save_message(self, user_id, content):
        conversation = Conversation.objects.get(pk=self.conversation_id)
        return Message.objects.create(conversation=conversation, sender_id=user_id, content=content)

    @database_sync_to_async
    def check_access(self, user):
        conversation = Conversation.objects.get(pk=self.conversation_id)
        ChatService.check_user(conversation, user)
        ChatService.check_active(conversation)

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        if not self.scope['user'].is_authenticated:
            print("Not authenticated")
            await self.close()
            return
        try:
            await self.check_access(self.scope['user'])
        except Exception as e:
            print('ACCESS ERROR:', e)
            await self.close()
            return

        self.room = f"chat_{self.conversation_id}"
        await self.channel_layer.group_add(self.room, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        print("DISCONNECT", close_code)
        if hasattr(self, "room"):
            await self.channel_layer.group_discard(self.room, self.channel_name)

    async def receive(self, text_data):
        if not self.scope['user'].is_authenticated:
            return
        data = json.loads(text_data)
        content = data.get('content', '').strip()
        if not content:
            return
        message = await self.save_message(self.scope['user'].id, content)
        await self.channel_layer.group_send(
            self.room,
            {
                'type': 'chat_message',
                'message_id': message.id,
                'sender_id': message.sender_id,
                'content': message.content,
                'created_at': message.created_at.isoformat()
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message_id': event['message_id'],
            'sender_id': event['sender_id'],
            'content': event['content'],
            'created_at': event['created_at']
        }))

