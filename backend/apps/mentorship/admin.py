from django.contrib import admin
from django.db.models import Count
from django.utils import timezone

from .models import Mentorship, MentorshipRequest, Task, Feedback


@admin.register(Mentorship)
class MentorshipAdmin(admin.ModelAdmin):
    list_display = ('mentor', 'mentee', 'status', 'progress_percent', 'risk_level',
                    'task_count', 'completed_task_count', 'feedback_rating', 'started_at', 'ended_at')
    list_filter = ('status', 'started_at')
    search_fields = ('mentor__email', 'mentee__email')
    ordering = ('-started_at',)
    readonly_fields = ('mentor', 'mentee', 'goal', 'started_at', 'ended_at')

    def has_add_permission(self, request):
        return False

    def task_count(self, obj):
        return Task.objects.filter(milestone__mentorship=obj).count()
    task_count.short_description = 'Tasks'

    def completed_task_count(self, obj):
        return Task.objects.filter(milestone__mentorship=obj, is_done=True).count()
    completed_task_count.short_description = 'Done'

    def progress_percent(self, obj):
        total = Task.objects.filter(milestone__mentorship=obj).count()
        if total == 0:
            return '0%'
        done = Task.objects.filter(milestone__mentorship=obj, is_done=True).count()
        return f'{round(done * 100 / total)}%'

    progress_percent.short_description = 'Progress'

    def risk_level(self, obj):
        overdue = Task.objects.filter(
            milestone__mentorship=obj,
            is_done=False,
            deadline__lt=timezone.localdate()
        ).count()
        if overdue == 0:
            return 'ON_TRACK'
        if overdue <= 2:
            return 'WARNING'
        return 'AT_RISK'
    risk_level.short_description = 'Risk'

    def feedback_rating(self, obj):
        if hasattr(obj, 'review'):
            return obj.review.rating
        return '-'
    feedback_rating.short_description = 'Rating'

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ('mentor', 'mentee', 'rating', 'comment_preview', 'created_at')
    list_filter = ('rating',)
    search_fields = ('mentor__email', 'mentee__email', 'comment')
    ordering = ('-created_at',)

    def comment_preview(self, obj):
        return obj.comment[:50]

    comment_preview.short_description = 'Comment'