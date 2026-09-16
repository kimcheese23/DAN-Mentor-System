from django.db import models
from apps.accounts.models import User

class MentorshipRequest(models.Model):
    class Status(models.TextChoices):
        PENDING='PENDING','Đang chờ'
        ACCEPTED='ACCEPTED','Đã chấp nhận'
        REJECTED='REJECTED','Đã từ chối'
        CANCELLED='CANCELLED','Đã hủy'

    mentee=models.ForeignKey(User,on_delete=models.CASCADE, related_name='mentorship_requests_sent')
    mentor=models.ForeignKey(User,on_delete=models.CASCADE, related_name='mentorship_requests')
    goal = models.TextField(blank=True)
    message=models.TextField(blank=True)
    status=models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['mentee', 'status']),
            models.Index(fields=['mentor', 'status']),
        ]

class Mentorship(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Đang hoạt động'
        COMPLETED = 'COMPLETED', 'Đã hoàn thành'
        CANCELLED = 'CANCELLED', 'Đã hủy'

    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentorship_as_mentee')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentorship_as_mentor')
    goal = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['mentee', 'mentor'],
                condition=models.Q(status='ACTIVE'),
                name='unique_active_mentorship'
            )
        ]
        indexes = [
            models.Index(fields=['mentee', 'status']),
            models.Index(fields=['mentor', 'status']),
        ]

class Milestone(models.Model):
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

class Task(models.Model):
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_done = models.BooleanField(default=False)
    deadline = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Schedule(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Đã lên lịch'
        COMPLETED = 'COMPLETED', 'Đã hoàn thành'
        CANCELLED = 'CANCELLED', 'Đã hủy'
    mentorship = models.ForeignKey(Mentorship, on_delete=models.CASCADE, related_name='schedules')
    title = models.CharField(max_length=255)
    note = models.TextField(blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    meeting_link = models.URLField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_schedules')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [models.Index(fields=['status', 'start_time', 'end_time'])]

class Feedback(models.Model):
    mentorship = models.OneToOneField(Mentorship, on_delete=models.CASCADE, related_name='review')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    mentee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_given')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['mentor', '-created_at'])]

