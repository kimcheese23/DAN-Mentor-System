from django.db import models

class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    category = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Education(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='educations')
    institution = models.CharField(max_length=255)
    degree = models.CharField(max_length=100, blank=True)
    major = models.CharField(max_length=150, blank=True)
    start_year = models.PositiveIntegerField(null=True, blank=True)
    end_year = models.PositiveIntegerField( null=True, blank=True)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_year']

    def __str__(self):
        return f'{self.institution} - {self.major}'

class Career(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='careers')
    company = models.CharField(max_length=255)
    position = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.position} - {self.company}'

class MentorProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='mentor_profile')
    headline = models.CharField(max_length=255)
    expertise = models.ManyToManyField('Skill', blank=True)
    mentoring_description = models.TextField()
    accepting_mentees = models.BooleanField(default=True)
    max_mentees = models.PositiveIntegerField(default=1)
    current_mentees = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Mentor: {self.user.email}'

class MentorAvailability(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Thứ 2'
        TUESDAY = 1, 'Thứ 3'
        WEDNESDAY = 2, 'Thứ 4'
        THURSDAY = 3, 'Thứ 5'
        FRIDAY = 4, 'Thứ 6'
        SATURDAY = 5, 'Thứ 7'
        SUNDAY = 6, 'Chủ nhật'

    mentor = models.ForeignKey(MentorProfile, on_delete=models.CASCADE, related_name='availabilities')
    day_of_week = models.PositiveSmallIntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['mentor', 'day_of_week', 'start_time', 'end_time'],
                name='unique_mentor_availability'
            )
        ]

    def __str__(self):
        return (
            f'{self.mentor.user.email} - '
            f'{self.get_day_of_week_display()} '
            f'{self.start_time} - {self.end_time}'
        )
