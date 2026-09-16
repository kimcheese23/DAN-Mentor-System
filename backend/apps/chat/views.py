from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chat.models import Conversation, Message
from apps.chat.serializers import ConversationSerializer, MessageSerializer
from apps.chat.services import ChatService
from common.pagination import BasePaginator

class ConversationListView(APIView,BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        conversations = ChatService.list_conversations(request.user)
        return self.paginate_list(request,conversations,ConversationSerializer)

class MessageListView(APIView,BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self,request,pk):
        try:
            conversation = Conversation.objects.get(pk=pk)
        except Conversation.DoesNotExist:
            return Response({'detail':'Không tìm thấy cuộc trò chuyện.'},status=status.HTTP_404_NOT_FOUND)
        try:
            ChatService.check_user(conversation,request.user)
        except ValueError as e:
            return Response({'detail':str(e)},status=status.HTTP_403_FORBIDDEN)
        messages = Message.objects.filter(conversation=conversation).select_related('sender')
        return self.paginate_list(request,messages,MessageSerializer)


