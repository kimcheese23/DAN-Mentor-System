from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.profiles.models import MentorProfile
from apps.profiles.serializers import EducationSerializer, MentorAvailabilitySerializer
from apps.profiles.services import MentorProfileService

User = get_user_model()

class BaseTestSetup:
    @staticmethod
    def create_mentor_profile(user, headline="Kỹ sư Backend Senior", max_mentees=2):
        return MentorProfile.objects.create(
            user=user,
            headline=headline,
            mentoring_description="Hướng dẫn lập trình Django REST Framework chuyên sâu",
            status=MentorProfile.Status.APPROVED,
            accepting_mentees=True,
            max_mentees=max_mentees,
            current_mentees=0
        )

class ProfilesModuleTests(BaseTestSetup, TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="nguyenvana@gmail.com", full_name="Nguyễn Văn A")

    def test_education_end_year(self):
        data = {'institution': 'Đại Học ABC', 'start_year': 2024, 'end_year': 2020}
        serializer = EducationSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Năm kết thúc không được trước năm bắt đầu.', str(serializer.errors))

    def test_education_future_start_year(self):
        data = {'institution': 'Đại Học ABC', 'start_year': 2030, 'end_year': 2035}
        serializer = EducationSerializer(data=data)
        self.assertFalse(serializer.is_valid())

    def test_availability_end_time(self):
        data = {'day_of_week': 0, 'start_time': '16:00', 'end_time': '14:00'}
        serializer = MentorAvailabilitySerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Thời gian kết thúc phải sau thời gian bắt đầu.', str(serializer.errors))

    def test_mentor_profile_duplicate(self):
        MentorProfileService.create(self.user, {'headline': 'Dev', 'mentoring_description': 'Desc'})
        with self.assertRaisesMessage(ValueError, 'User đã có Mentor Profile.'):
            MentorProfileService.create(self.user, {'headline': 'Dev 2', 'mentoring_description': 'Desc 2'})

class ProfilesAPITests(BaseTestSetup, APITestCase):
    def setUp(self):
        self.mentor_user = User.objects.create_user(email="mentor@gmail.com", full_name="Trần Văn Mentor")
        self.profile = self.create_mentor_profile(self.mentor_user, headline="Chuyên gia lập trình Django")

    def test_mentor_discovery_search(self):
        response = self.client.get('/api/profile/mentors/?search=django')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)

    def test_admin_approve_mentor_profile(self):
        self.profile.status = MentorProfile.Status.PENDING
        self.profile.save()
        MentorProfileService.approve(self.profile)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.status, MentorProfile.Status.APPROVED)
        self.assertEqual(self.profile.rejection_reason, '')