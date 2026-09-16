from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from apps.profiles.models import MentorProfile
from apps.mentorship.models import MentorshipRequest, Mentorship, Milestone, Task, Schedule
from apps.mentorship.services import MentorshipRequestService, TaskService, ScheduleService, FeedbackService

User = get_user_model()

class BaseTestSetup:
    def setUp(self):
        self.mentor = User.objects.create_user(email="trantuana@gmail.com", password="123456", full_name="TranTuanA")
        self.mentee = User.objects.create_user(email="lethib@gmail.com", password="123456", full_name="LeThiB")
        self.outsider = User.objects.create_user(email="dodungc@gmail.com", password="123456", full_name="DoDungC")

        self.mentor_profile = MentorProfile.objects.create(
            user=self.mentor,
            headline="Ky su phan mem",
            mentoring_description="Huong dan lap trinh Web",
            status=MentorProfile.Status.APPROVED,
            accepting_mentees=True,
            max_mentees=2
        )
        self.mentorship = Mentorship.objects.create(
            mentor=self.mentor,
            mentee=self.mentee,
            status=Mentorship.Status.ACTIVE,
            goal="Hoc lap trinh Python"
        )


class MentorshipTests(BaseTestSetup, TestCase):
    def test_cannot_request_self(self):
        with self.assertRaisesMessage(ValueError, 'Bạn không thể gửi yêu cầu cho chính mình.'):
            MentorshipRequestService.create(self.mentor, self.mentor, "Hoc Web", "Loi nhan")

    def test_accept_request_creates_relationship(self):
        new_mentee = User.objects.create_user(email="phamvand@gmail.com", password="123456", full_name="PhamVanD")
        req = MentorshipRequest.objects.create(mentee=new_mentee, mentor=self.mentor, goal="Hoc Web")
        MentorshipRequestService.accept(self.mentor, req)
        req.refresh_from_db()
        self.assertEqual(req.status, MentorshipRequest.Status.ACCEPTED)
        self.assertTrue(Mentorship.objects.filter(mentee=new_mentee, mentor=self.mentor, status='ACTIVE').exists())

    def test_cannot_edit_completed_task(self):
        milestone = Milestone.objects.create(mentorship=self.mentorship, title="Chang 1")
        task = Task.objects.create(milestone=milestone, title="Nhiem vu 1", is_done=True)
        with self.assertRaisesMessage(ValueError, 'Nhiệm vụ đã hoàn thành không thể chỉnh sửa.'):
            TaskService.update(self.mentor, task, {'title': 'Cap nhat nhiem vu'})

    def test_delete_completed_task(self):
        milestone = Milestone.objects.create(mentorship=self.mentorship, title="Chang 1")
        task = Task.objects.create(milestone=milestone, title="Nhiem vu 1", is_done=True)
        with self.assertRaisesMessage(ValueError, 'Nhiệm vụ đã hoàn thành không thể xóa.'):
            TaskService.delete(self.mentor, task)

    def test_schedule_overlap(self):
        now = timezone.now() + timedelta(days=1)
        Schedule.objects.create(
            mentorship=self.mentorship, created_by=self.mentor, title="Buoi 1",
            start_time=now, end_time=now + timedelta(hours=2)
        )
        overlap_data = {
            'title': 'Buoi 2',
            'start_time': now + timedelta(hours=1),
            'end_time': now + timedelta(hours=3)
        }
        with self.assertRaisesMessage(ValueError, 'Thời gian này đã trùng với lịch hẹn khác.'):
            ScheduleService.create(self.mentor, self.mentorship, overlap_data)

    def test_schedule_start_after_end_time(self):
        now = timezone.now() + timedelta(days=1)
        data = {'title': 'Buoi tu van', 'start_time': now + timedelta(hours=2), 'end_time': now}
        with self.assertRaisesMessage(ValueError, 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.'):
            ScheduleService.check_time(data)

    def test_feedback_ratings_constraint(self):
        completed_mentorship = Mentorship.objects.create(
            mentor=self.mentor, mentee=self.mentee, status=Mentorship.Status.COMPLETED
        )
        with self.assertRaisesMessage(ValueError, 'Số sao phải từ 1 đến 5.'):
            FeedbackService.create(self.mentee, completed_mentorship, {'rating': 10, 'comment': 'Tot'})

    def test_request_already_active(self):
        with self.assertRaisesMessage(ValueError, 'Bạn đang là Mentee của Mentor này.'):
            MentorshipRequestService.create(self.mentee, self.mentor, "Hoc Web", "Loi nhan")


class MentorshipAPITests(BaseTestSetup, APITestCase):
    def test_mentor_reject_request(self):
        req = MentorshipRequest.objects.create(mentee=self.mentee, mentor=self.mentor, goal="Hoc React")
        self.client.force_authenticate(user=self.mentor)
        response = self.client.post(f'/api/mentorship/requests/{req.id}/reject/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        req.refresh_from_db()
        self.assertEqual(req.status, MentorshipRequest.Status.REJECTED)

    def test_mentee_cannot_create_milestone(self):
        self.client.force_authenticate(user=self.mentee)
        response = self.client.post(f'/api/mentorship/mentorships/{self.mentorship.id}/milestones/',
                                    {'title': 'Chang 1'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stranger_cannot_access_roadmap(self):
        self.client.force_authenticate(user=self.outsider)
        response = self.client.get(f'/api/mentorship/mentorships/{self.mentorship.id}/milestones/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_schedules_list(self):
        now = timezone.now() + timedelta(days=1)
        Schedule.objects.create(
            mentorship=self.mentorship,
            created_by=self.mentor,
            title='Buoi hop Dinh ky',
            start_time=now,
            end_time=now + timedelta(hours=1),
            status=Schedule.Status.SCHEDULED
        )
        self.client.force_authenticate(user=self.mentor)
        response = self.client.get('/api/mentorship/my-schedules/?status=SCHEDULED')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)