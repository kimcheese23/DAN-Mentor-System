from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.accounts.models import User
from apps.accounts.serializers import UserRegisterSerializer

class BaseTestAccount:
    @staticmethod
    def create_user(email='nguyenvana@gmail.com', password='123456', full_name='Nguyễn Văn A', **extra_fields):
        return User.objects.create_user(email=email, password=password, full_name=full_name, **extra_fields)

class UserTests(TestCase):
    def test_create_user_success(self):
        user = User.objects.create_user(email='test@example.com', password='123456')
        self.assertEqual(user.email, 'test@example.com')
        self.assertTrue(user.check_password('123456'))

    def test_create_user_without_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password='123456')

    def test_register_serializer_valid(self):
        data = {'email': 'new@example.com', 'password': '123456', 'full_name': 'Tester'}
        serializer = UserRegisterSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.email, 'new@example.com')
        self.assertTrue(user.check_password('123456'))

class AccountsAPITests(APITestCase):
    def test_unauthenticated_request_fails(self):
        response = self.client.get('/api/mentorship/requests/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
