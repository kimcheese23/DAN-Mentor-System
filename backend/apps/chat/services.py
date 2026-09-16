from django.db.models import Q
from django.utils import timezone

from .models import Conversation, Message
from apps.mentorship.models import Mentorship

class ChatService:
    @staticmethod
    def check_user(conversation,user):
        if conversation.mentor_id != user.id and conversation.mentee_id != user.id:
            raise ValueError('Bạn không thuộc cuộc trò chuyện này.')

    @staticmethod
    def check_active(conversation):
        if not Mentorship.objects.filter(
                mentor_id=conversation.mentor_id,
                mentee_id=conversation.mentee_id,
        ).exists():
            raise ValueError('Hai người hiện không có chương trình mentoring đang hoạt động.')

    @staticmethod
    def list_conversations(user):
        return Conversation.objects.select_related('mentor','mentee').filter(Q(mentor=user)|Q(mentee=user)).order_by('-updated_at')

