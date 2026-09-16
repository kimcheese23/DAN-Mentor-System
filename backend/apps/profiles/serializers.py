from datetime import datetime

from rest_framework import serializers
from .models import Skill, Education, Career, MentorProfile, MentorAvailability
from ..mentorship.services import FeedbackService


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'is_active']

class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ['id', 'institution', 'degree', 'major', 'start_year', 'end_year', 'is_current', 'created_at',
                  'updated_at']
        read_only_fields = ['id', 'is_current', 'created_at', 'updated_at']

    def validate(self, attrs):
        start_year = attrs.get('start_year', getattr(self.instance, 'start_year', None))
        end_year = attrs.get('end_year', getattr(self.instance, 'end_year', None))
        current_year = datetime.now().year
        if start_year and end_year:
            if end_year < start_year:
                raise serializers.ValidationError({'end_year': 'Năm kết thúc không được trước năm bắt đầu.'})
        if start_year and start_year > current_year:
            raise serializers.ValidationError({'start_year': 'Năm bắt đầu không được lớn hơn năm hiện tại.'})
        return attrs

class CareerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Career
        fields = ['id', 'company', 'position', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MentorProfileSerializer(serializers.ModelSerializer):
    expertise = serializers.PrimaryKeyRelatedField(many=True, queryset=Skill.objects.all(), required=False)

    class Meta:
        model = MentorProfile
        fields = '__all__'
        read_only_fields = ['user', 'status', 'rejection_reason', 'created_at', 'updated_at']

    def validate_max_mentees(self, value):
        if value <= 0:
            raise serializers.ValidationError('Số lượng mentee tối đa phải lớn hơn 0.')
        return value

class MentorAvailabilitySerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    end_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M', '%H:%M:%S'])
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    class Meta:
        model = MentorAvailability
        fields = ['id', 'day_of_week', 'day_of_week_display', 'start_time', 'end_time', 'is_active']

    def validate(self, attrs):
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError('Thời gian kết thúc phải sau thời gian bắt đầu.')
        return attrs

class MentorDiscoverySerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    expertise = SkillSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = MentorProfile
        fields = ['id', 'full_name', 'avatar', 'headline', 'expertise', 'mentoring_description',
                  'accepting_mentees', 'max_mentees', 'current_mentees', 'average_rating',
                  'created_at', 'updated_at']
        read_only_fields = fields

    def get_average_rating(self, obj):
        try:
            user_id = getattr(obj, 'user_id', None) or (obj.user.id if hasattr(obj.user, 'id') else obj.user)
            if not user_id:
                return 0.0
            stats_data = FeedbackService.stats(user_id)
            return stats_data.get('average_rating', 0.0)
        except Exception as e:
            return 0.0

class MentorDetailSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    expertise = SkillSerializer(many=True, read_only=True)
    careers = CareerSerializer(source='user.careers', many=True, read_only=True)
    educations = EducationSerializer(source='user.educations', many=True, read_only=True)
    availability = MentorAvailabilitySerializer(source='availabilities', many=True, read_only=True)

    class Meta:
        model = MentorProfile
        fields = ['id', 'user_id', 'full_name', 'avatar', 'headline', 'expertise', 'mentoring_description',
                  'accepting_mentees', 'max_mentees', 'current_mentees', 'careers', 'educations', 'availability', 'created_at',
                  'updated_at']
        read_only_fields = fields

class RecommendedMentorSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)
    headline = serializers.CharField(allow_blank=True)
    score = serializers.IntegerField()
    matched_skills = serializers.ListField()

    class Meta:
        field=['id', 'full_name', 'avatar', 'headline', 'score', 'matched_skills']

