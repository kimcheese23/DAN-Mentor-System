from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.chat.models import Conversation
from apps.chat.services import ChatService

User = get_user_model()

class ChatModuleTests(TestCase):
    def setUp(self):
        self.mentor = User.objects.create_user(email="mentor@test.com", full_name="Mentor Test")
        self.mentee = User.objects.create_user(email="mentee@test.com", full_name="Mentee Test")
        self.people = User.objects.create_user(email="people@test.com", full_name="People Test")
        self.conversation = Conversation.objects.create(mentor=self.mentor, mentee=self.mentee)

    def test_check_user_in_conversation(self):
        with self.assertRaisesMessage(ValueError, 'Bạn không thuộc cuộc trò chuyện này.'):
            ChatService.check_user(self.conversation, self.people)

    def test_chat_inactive_mentorship(self):
        with self.assertRaisesMessage(ValueError, 'Hai người hiện không có chương trình mentoring đang hoạt động.'):
            ChatService.check_active(self.conversation)

class ChatAPITests(APITestCase):
    def test_list_conversations(self):
        mentor = User.objects.create_user(email='mentor@test.com')
        mentee = User.objects.create_user(email='mentee@test.com')
        Conversation.objects.create(mentor=mentor, mentee=mentee)
        self.client.force_authenticate(user=mentee)
        response = self.client.get('/api/chat/conversations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)