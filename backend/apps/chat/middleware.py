from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

@database_sync_to_async
def get_user_by_id(user_id):
    try:
        return User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return None

class JwtAuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        scope['user'] = AnonymousUser()
        query = parse_qs(scope['query_string'].decode())
        token = query.get('token')
        if token:
            try:
                access = AccessToken(token[0])
                user = await get_user_by_id(access['user_id'])
                if user:
                    scope['user'] = user
            except Exception as e:
                print(e)
        return await self.app(scope, receive, send)
