from rest_framework import serializers
from .models import Conversation, Message

class ConversationSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.full_name',read_only=True)
    mentee_name = serializers.CharField(source='mentee.full_name',read_only=True)
    mentor_avatar = serializers.CharField(source='mentor.avatar.url', read_only=True, default=None)
    mentee_avatar = serializers.CharField(source='mentee.avatar.url', read_only=True, default=None)

    class Meta:
        model = Conversation
        fields = ['id','mentor','mentee','mentor_name','mentee_name', 'mentor_avatar', 'mentee_avatar', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.full_name',read_only=True)

    class Meta:
        model = Message
        fields = ['id','conversation','sender','sender_name','content','created_at']
