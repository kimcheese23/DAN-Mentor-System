from datetime import timedelta

from django.core.cache import cache
from django.db import transaction
from django.db.models import Q, F, Avg
from django.utils import timezone

from .models import MentorshipRequest, Mentorship, Task, Milestone, Schedule, Feedback
from ..chat.models import Conversation
from ..profiles.models import MentorProfile

class MentorshipRequestService:
    @staticmethod
    def validate_pending(request):
        if request.status != MentorshipRequest.Status.PENDING:
            raise ValueError('Yêu cầu này không còn ở trạng thái chờ xử lý.')

    @staticmethod
    def validate_mentor(mentor, request):
        if request.mentor_id != mentor.id:
            raise ValueError('Bạn không có quyền xử lý yêu cầu này.')

    @staticmethod
    @transaction.atomic
    def create(mentee, mentor, goal, message):
        if mentor.id == mentee.id:
            raise ValueError('Bạn không thể gửi yêu cầu cho chính mình.')
        try:
            profile = MentorProfile.objects.get(user=mentor)
        except MentorProfile.DoesNotExist:
            raise ValueError('Người dùng này chưa có hồ sơ Mentor.')
        if profile.status != MentorProfile.Status.APPROVED:
            raise ValueError('Mentor chưa được duyệt.')
        if not profile.accepting_mentees:
            raise ValueError('Mentor hiện không nhận Mentee.')
        if profile.current_mentees >= profile.max_mentees:
            raise ValueError('Mentor đã đủ số lượng Mentee.')
        if MentorshipRequest.objects.filter(mentee=mentee, mentor=mentor, status=MentorshipRequest.Status.PENDING).exists():
            raise ValueError('Bạn đã gửi yêu cầu cho Mentor này.')
        if Mentorship.objects.filter(mentee=mentee, mentor=mentor, status=Mentorship.Status.ACTIVE).exists():
            raise ValueError('Bạn đang là Mentee của Mentor này.')
        return MentorshipRequest.objects.create(mentee=mentee, mentor=mentor, goal=goal, message=message)

    @staticmethod
    @transaction.atomic
    def cancel_request(mentee, request):
        if request.mentee_id != mentee.id:
            raise ValueError('Bạn không có quyền hủy yêu cầu này.')
        MentorshipRequestService.validate_pending(request)
        request.status = MentorshipRequest.Status.CANCELLED
        request.save(update_fields=['status', 'updated_at'])
        return request

    @staticmethod
    @transaction.atomic
    def reject(mentor, request):
        MentorshipRequestService.validate_mentor(mentor, request)
        MentorshipRequestService.validate_pending(request)
        request.status = MentorshipRequest.Status.REJECTED
        request.save(update_fields=['status', 'updated_at'])
        return request

    @staticmethod
    @transaction.atomic
    def accept(mentor, request):
        MentorshipRequestService.validate_mentor(mentor, request)
        MentorshipRequestService.validate_pending(request)
        profile = MentorProfile.objects.select_for_update().get(user=mentor)
        if profile.status != MentorProfile.Status.APPROVED:
            raise ValueError('Mentor chưa được duyệt.')
        if not profile.accepting_mentees:
            raise ValueError('Mentor hiện không nhận Mentee.')
        if profile.current_mentees >= profile.max_mentees:
            raise ValueError('Mentor đã đủ số lượng Mentee.')
        if Mentorship.objects.filter(mentee=request.mentee, mentor=mentor, status=Mentorship.Status.ACTIVE).exists():
            raise ValueError('Mentee này đã được kết nối với Mentor.')
        request.status = MentorshipRequest.Status.ACCEPTED
        request.save(update_fields=['status', 'updated_at'])
        mentorship = Mentorship.objects.create(mentee=request.mentee, mentor=mentor, goal=request.goal, status=Mentorship.Status.ACTIVE)
        Conversation.objects.get_or_create(mentor=mentor, mentee=request.mentee)
        profile.current_mentees += 1
        profile.save(update_fields=['current_mentees'])
        return request, mentorship

class MentorshipService:
    @staticmethod
    def check_user(mentorship, user):
        if mentorship.mentee_id != user.id and mentorship.mentor_id != user.id:
            raise ValueError('Bạn không thuộc chương trình mentoring này.')

    @staticmethod
    def check_mentor(mentorship, user):
        if mentorship.mentor_id != user.id:
            raise ValueError('Bạn không có quyền quản lý chương trình này.')

    @staticmethod
    def check_active(mentorship):
        if mentorship.status != Mentorship.Status.ACTIVE:
            raise ValueError('Chương trình mentoring không còn hoạt động.')

    @staticmethod
    def list(user, role=None, status=None):
        queryset = Mentorship.objects.select_related('mentee', 'mentor')
        if role == 'mentee':
            queryset = queryset.filter(mentee=user)
        elif role == 'mentor':
            queryset = queryset.filter(mentor=user)
        else:
            queryset = queryset.filter(Q(mentee=user) | Q(mentor=user))
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-updated_at')

    @staticmethod
    @transaction.atomic
    def cancel(mentorship, user):
        MentorshipService.check_user(mentorship, user)
        MentorshipService.check_active(mentorship)
        profile = MentorProfile.objects.select_for_update().get(user_id=mentorship.mentor_id)
        mentorship.status = Mentorship.Status.CANCELLED
        mentorship.ended_at = timezone.now()
        mentorship.save(update_fields=['status', 'ended_at', 'updated_at'])
        profile.current_mentees = max(0, profile.current_mentees - 1)
        profile.save(update_fields=['current_mentees'])
        return mentorship

    @staticmethod
    @transaction.atomic
    def complete(mentorship, mentor):
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        mentorship = Mentorship.objects.select_for_update().get(pk=mentorship.pk)
        profile = MentorProfile.objects.select_for_update().get(user_id=mentorship.mentor)
        mentorship.status = Mentorship.Status.COMPLETED
        mentorship.ended_at = timezone.now()
        mentorship.save(update_fields=['status', 'ended_at', 'updated_at'])
        profile.current_mentees = max(0, profile.current_mentees - 1)
        profile.save(update_fields=['current_mentees'])
        return mentorship

class MilestoneService:
    @staticmethod
    def list(mentorship):
        return mentorship.milestones.all()

    @staticmethod
    @transaction.atomic
    def create(mentor, mentorship, data):
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        return Milestone.objects.create(mentorship=mentorship, **data)

    @staticmethod
    @transaction.atomic
    def update(mentor, milestone, data):
        mentorship = milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        for field, value in data.items():
            setattr(milestone, field, value)
        milestone.save()
        return milestone

    @staticmethod
    @transaction.atomic
    def delete(mentor, milestone):
        mentorship = milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        milestone.delete()

class TaskService:
    @staticmethod
    @transaction.atomic
    def create(mentor, data):
        milestone = data['milestone']
        mentorship = milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        return Task.objects.create(**data)

    @staticmethod
    @transaction.atomic
    def update(mentor, task, data):
        mentorship = task.milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        if task.is_done:
            raise ValueError('Nhiệm vụ đã hoàn thành không thể chỉnh sửa.')
        for field, value in data.items():
            setattr(task, field, value)
        task.save()
        return task

    @staticmethod
    @transaction.atomic
    def complete(mentor, task):
        mentorship = task.milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        if task.is_done:
            raise ValueError('Nhiệm vụ này đã được hoàn thành.')
        task.is_done = True
        task.completed_at = timezone.now()
        task.save(update_fields=['is_done', 'completed_at', 'updated_at'])
        return task

    @staticmethod
    @transaction.atomic
    def delete(mentor, task):
        mentorship = task.milestone.mentorship
        MentorshipService.check_mentor(mentorship, mentor)
        MentorshipService.check_active(mentorship)
        if task.is_done:
            raise ValueError('Nhiệm vụ đã hoàn thành không thể xóa.')
        task.delete()

class ProgressService:
    @staticmethod
    def task_stats(tasks):
        today = timezone.localdate()
        total = tasks.count()
        done = tasks.filter(is_done=True).count()
        pending = tasks.filter(is_done=False).count()
        overdue = tasks.filter(is_done=False, deadline__lt=today).count()
        upcoming = tasks.filter(is_done=False, deadline__gte=today,
                                deadline__lte=today + timedelta(days=3)).count()
        on_time = tasks.filter(is_done=True, completed_at__date__lte=F('deadline')).count()
        late = tasks.filter(is_done=True, completed_at__date__gt=F('deadline')).count()
        progress = 0 if total == 0 else round(done * 100 / total)
        return {
            'progress': progress,
            'total_tasks': total,
            'completed_tasks': done,
            'pending_tasks': pending,
            'overdue_tasks': overdue,
            'upcoming_tasks': upcoming,
            'completed_on_time': on_time,
            'completed_late': late,
        }

    @staticmethod
    def milestone(milestone):
        return ProgressService.task_stats((milestone.tasks.all()))

    @staticmethod
    def mentorship(mentorship):
        tasks =  Task.objects.filter(milestone__mentorship=mentorship)
        data = ProgressService.task_stats(tasks)
        milestones = []
        for item in mentorship.milestones.prefetch_related('tasks'):
            milestones.append({
                'id': item.id,
                'title': item.title,
                'progress': ProgressService.milestone(item)['progress']
            })
        if data['overdue_tasks'] == 0:
            status = 'ON_TRACK'
        elif data['overdue_tasks'] <= 2:
            status = 'WARNING'
        else:
            status = 'AT_RISK'
        data['status'] = status
        data['milestones'] = milestones
        return data

class ScheduleService:
    @staticmethod
    def check_time(data):
        now = timezone.now()
        if data['start_time'] < now:
            raise ValueError('Thời gian bắt đầu không được ở trong quá khứ.')
        if data['start_time'] > data['end_time']:
            raise ValueError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.')

    @staticmethod
    def check_overlap(user, start_time, end_time, schedule_id=None):
        qs = Schedule.objects.filter(
            status=Schedule.Status.SCHEDULED
        ).filter(
            Q(mentorship__mentor=user) |
            Q(mentorship__mentee=user)
        ).filter(
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if schedule_id:
            qs = qs.exclude(id=schedule_id)
        if qs.exists():
            raise ValueError('Thời gian này đã trùng với lịch hẹn khác.')

    @staticmethod
    @transaction.atomic
    def create(user, mentorship, data):
        MentorshipService.check_active(mentorship)
        MentorshipService.check_user(mentorship, user)
        ScheduleService.check_time(data)
        ScheduleService.check_overlap(mentorship.mentor, data['start_time'], data['end_time'])
        ScheduleService.check_overlap(mentorship.mentee, data['start_time'], data['end_time'])
        return Schedule.objects.create(
            mentorship=mentorship,
            created_by=user,
            title=data['title'],
            note=data.get('note', ''),
            meeting_link=data.get('meeting_link', ''),
            start_time=data['start_time'],
            end_time=data['end_time']
        )

    @staticmethod
    @transaction.atomic
    def update(user, schedule, data):
        if schedule.status != Schedule.Status.SCHEDULED:
            raise ValueError('Chỉ có thể chỉnh sửa lịch hẹn đang ở trạng thái "Đã lên lịch".')
        MentorshipService.check_active(schedule.mentorship)
        MentorshipService.check_user(schedule.mentorship, user)
        ScheduleService.check_time(data)
        ScheduleService.check_overlap( schedule.mentorship.mentor, data['start_time'], data['end_time'], schedule.id)
        ScheduleService.check_overlap(schedule.mentorship.mentee, data['start_time'], data['end_time'], schedule.id)
        schedule.title = data['title']
        schedule.note = data.get('note', '')
        schedule.start_time = data['start_time']
        schedule.end_time = data['end_time']
        schedule.save()
        return schedule

    @staticmethod
    @transaction.atomic
    def cancel(user, schedule):
        MentorshipService.check_user(schedule.mentorship, user)
        if schedule.status == Schedule.Status.CANCELLED:
            raise ValueError('Lịch hẹn đã được hủy.')
        if schedule.status == Schedule.Status.COMPLETED:
            raise ValueError('Lịch hẹn đã hoàn thành không thể hủy.')
        schedule.status = Schedule.Status.CANCELLED
        schedule.save(update_fields=['status'])
        return schedule

    @staticmethod
    @transaction.atomic
    def complete(user, schedule):
        MentorshipService.check_user(schedule.mentorship, user)
        if schedule.status != Schedule.Status.SCHEDULED:
            raise ValueError('Lịch hẹn không ở trạng thái hợp lệ để hoàn thành.')
        if timezone.now() < schedule.start_time:
            raise ValueError('Chưa đến thời gian kết thúc buổi hẹn, không thể đánh dấu hoàn thành.')
        schedule.status = Schedule.Status.COMPLETED
        schedule.save(update_fields=['status'])
        return schedule

class FeedbackService:
    @staticmethod
    def check_completed(mentorship):
        if mentorship.status != Mentorship.Status.COMPLETED:
            raise ValueError('Chỉ được đánh giá sau khi hoàn thành mentoring.')

    @staticmethod
    def check_already_reviewed(mentorship):
        if Feedback.objects.filter(mentorship=mentorship).exists():
            raise ValueError('Bạn đã gửi đánh giá cho chương trình này rồi.')

    @staticmethod
    def check_mentee_feedback(mentorship, user):
        if mentorship.mentee_id != user.id:
            raise ValueError('Chỉ mentee tham gia chương trình này mới được đánh giá mentor.')

    @staticmethod
    def check_rating(rating):
        if rating < 1 or rating > 5:
            raise ValueError('Số sao phải từ 1 đến 5.')

    @staticmethod
    @transaction.atomic
    def create(user, mentorship, data):
        MentorshipService.check_user(mentorship, user)
        FeedbackService.check_completed(mentorship)
        FeedbackService.check_mentee_feedback(mentorship, user)
        FeedbackService.check_already_reviewed(mentorship)
        FeedbackService.check_rating(data['rating'])

        feedback = Feedback.objects.create(
            mentorship=mentorship,
            mentor=mentorship.mentor,
            mentee=mentorship.mentee,
            rating=data['rating'],
            comment=data.get('comment', '')
        )
        cache_key = f"mentor_stats_{mentorship.mentor_id}"
        cache.delete(cache_key)
        return feedback

    @staticmethod
    def stats(mentor_id):
        cache_key = f"mentor_stats_{mentor_id}"
        cached_stats = cache.get(cache_key)
        if cached_stats:
            return cached_stats

        qs = Feedback.objects.filter(mentor_id=mentor_id)
        stats_data = {
            'total_feedbacks': qs.count(),
            'average_rating': round(qs.aggregate(avg=Avg('rating'))['avg'] or 0, 1)
        }
        cache.set(cache_key, stats_data, timeout=3600)
        return stats_data
