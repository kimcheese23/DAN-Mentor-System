from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from .models import MentorshipRequest, Mentorship, Task, Milestone, Schedule, Feedback

class MentorshipRequestCreateSerializer(serializers.ModelSerializer):
    mentor_profile_id = serializers.IntegerField(source='mentor_id')

    class Meta:
        model = MentorshipRequest
        fields = ['mentor_profile_id', 'goal', 'message']

class MentorshipRequestListSerializer(serializers.ModelSerializer):
    mentee_id = serializers.IntegerField(source='mentee.id', read_only=True)
    mentee_name = serializers.CharField(source='mentee.full_name', read_only=True)
    mentor_user_id = serializers.IntegerField(source='mentor.id', read_only=True)
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True)
    mentor_profile_id = serializers.IntegerField(source='mentor.mentor_profile.id', read_only=True)
    mentor_headline = serializers.CharField(source='mentor.mentor_profile.headline', read_only=True)

    class Meta:
        model = MentorshipRequest
        fields = ['id', 'mentee_id', 'mentee_name', 'mentor_user_id', 'mentor_profile_id', 'mentor_name',
                  'mentor_headline', 'goal', 'message', 'status', 'created_at', 'updated_at']

class MentorshipSerializer(serializers.ModelSerializer):
    mentor_name = serializers.CharField(source='mentor.full_name', read_only=True)
    mentee_name = serializers.CharField(source='mentee.full_name', read_only=True)
    is_reviewed = serializers.SerializerMethodField()

    class Meta:
        model = Mentorship
        fields = [
            'id', 'mentor', 'mentee', 'mentor_name', 'mentee_name',
            'status', 'goal', 'started_at', 'is_reviewed']

    def get_is_reviewed(self, obj):
        return Feedback.objects.filter(mentorship_id=obj.id).exists()

class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = ['id', 'mentorship', 'title', 'description', 'order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'mentorship', 'created_at', 'updated_at']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['id', 'milestone', 'title', 'description', 'is_done', 'deadline', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'milestone', 'is_done', 'completed_at', 'created_at', 'updated_at']

class ScheduleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Schedule
        fields = ['title', 'note', 'meeting_link', 'start_time', 'end_time']


class ScheduleSerializer(serializers.ModelSerializer):
    partner_name = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = ['id', 'mentorship', 'title', 'note', 'start_time', 'end_time', 'meeting_link', 'status',
                  'partner_name', 'created_at']

    def get_partner_name(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return "Đối tác"
        user = request.user
        if obj.mentorship.mentor_id == user.id:
            return obj.mentorship.mentee.full_name
        return obj.mentorship.mentor.full_name

class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['comment', 'rating']

class FeedbackSerializer(serializers.ModelSerializer):
    mentee = serializers.CharField(source='mentee.full_name', read_only=True)
    mentor = serializers.CharField(source='mentor.full_name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['mentorship', 'mentee', 'mentor', 'comment', 'rating', 'created_at', 'updated_at']
