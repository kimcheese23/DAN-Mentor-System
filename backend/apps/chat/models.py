from django.db import models
from apps.accounts.models import User

class Conversation(models.Model):
    mentor = models.ForeignKey(User,on_delete=models.CASCADE,related_name='mentor_chats')
    mentee = models.ForeignKey(User,on_delete=models.CASCADE,related_name='mentee_chats')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['mentor','mentee'],name='unique_chat')]

class Message(models.Model):
    conversation = models.ForeignKey(Conversation,on_delete=models.CASCADE,related_name='messages')
    sender = models.ForeignKey(User,on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
