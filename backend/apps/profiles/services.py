from django.db import transaction
from django.db.models import Q, F

from .models import Education, Career, MentorProfile, MentorAvailability, Skill
from ..mentorship.services import FeedbackService


class EducationService:
    @staticmethod
    @transaction.atomic
    def create(user, validated_data):
        return Education.objects.create(user=user, **validated_data)

    @staticmethod
    @transaction.atomic
    def update(education, validated_data):
        for field, value in validated_data.items():
            setattr(education, field, value)
        education.save()
        return education

    @staticmethod
    @transaction.atomic
    def delete(education):
        education.delete()

class CareerService:
    @staticmethod
    @transaction.atomic
    def create(user, validated_data):
        return Career.objects.create(user=user, **validated_data)

    @staticmethod
    @transaction.atomic
    def update(career, validated_data):
        for field, value in validated_data.items():
            setattr(career, field, value)
        career.save()
        return career

    @staticmethod
    @transaction.atomic
    def delete(career):
        career.delete()

class MentorProfileService:
    @staticmethod
    @transaction.atomic
    def create(user, validated_data):
        if MentorProfile.objects.filter(user=user).exists():
            raise ValueError('User đã có Mentor Profile.')
        expertise_data = validated_data.pop('expertise', [])
        profile = MentorProfile.objects.create(user=user, **validated_data)
        if expertise_data:
            profile.expertise.set(expertise_data)
        return profile

    @staticmethod
    @transaction.atomic
    def update(profile, validated_data):
        expertise_data = validated_data.pop('expertise', None)
        for field, value in validated_data.items():
            setattr(profile, field, value)
        profile.save()
        if expertise_data is not None:
            profile.expertise.set(expertise_data)
        return profile

    @staticmethod
    @transaction.atomic
    def submit(profile):
        if profile.status == MentorProfile.Status.APPROVED:
            raise ValueError('Mentor Profile đã được duyệt.')
        profile.status = MentorProfile.Status.PENDING
        profile.rejection_reason = ''
        profile.save(update_fields=['status', 'rejection_reason', 'updated_at'])
        return profile

    @staticmethod
    @transaction.atomic
    def approve(profile):
        if profile.status != MentorProfile.Status.PENDING:
            raise ValueError('Chỉ Mentor Profile đang chờ duyệt mới có thể được duyệt.')

        profile.status = MentorProfile.Status.APPROVED
        profile.rejection_reason = ''
        profile.save(update_fields=['status', 'rejection_reason', 'updated_at'])
        return profile

    @staticmethod
    @transaction.atomic
    def reject(profile, rejection_reason):
        if profile.status != MentorProfile.Status.PENDING:
            raise ValueError('Chỉ Mentor Profile đang chờ duyệt mới có thể bị từ chối.')

        if not rejection_reason or not rejection_reason.strip():
            raise ValueError('Lý do từ chối không được để trống.')

        profile.status = MentorProfile.Status.REJECTED
        profile.rejection_reason = rejection_reason.strip()
        profile.save(update_fields=['status', 'rejection_reason', 'updated_at'])
        return profile

class MentorAvailabilityService:
    @staticmethod
    @transaction.atomic
    def update(mentor, slots):
        sorted_slots = sorted(slots, key=lambda x: (x['day_of_week'], x['start_time']))
        for i in range(len(sorted_slots) - 1):
            slot = sorted_slots[i]
            next_slot = sorted_slots[i + 1]
            if slot['day_of_week'] == next_slot['day_of_week']:
                if next_slot['start_time'] < slot['end_time']:
                    day_name = MentorAvailability.DayOfWeek(slot['day_of_week']).label
                    raise ValueError(f"Khung giờ ngày {day_name} bị trùng hoặc chồng chéo lên nhau.")
        mentor.availabilities.all().delete()
        created_slots = [MentorAvailability(mentor=mentor, **slot) for slot in slots]
        MentorAvailability.objects.bulk_create(created_slots)

        return mentor.availabilities.filter(is_active=True)

class MentorDiscoveryService:
    @staticmethod
    def search(search=None, skill=None, position=None, ordering=None):
        queryset = MentorProfile.objects.filter(
            status=MentorProfile.Status.APPROVED,
            accepting_mentees=True,
            current_mentees__lt=F('max_mentees')
        ).select_related('user').prefetch_related(
            'expertise',
            'user__careers',
            'user__educations'
        )

        if search:
            queryset = queryset.filter(
                Q(user__full_name__icontains=search) |
                Q(headline__icontains=search) |
                Q(mentoring_description__icontains=search) |
                Q(expertise__name__icontains=search) |
                Q(user__careers__position__icontains=search) |
                Q(user__educations__major__icontains=search)
            ).distinct()
        if ordering == 'rating_desc':
            mentors = list(queryset)
            for m in mentors:
                try:
                    stats = FeedbackService.stats(m.user.id)
                    m.avg_rating = stats.get('average_rating', 0.0)
                except Exception:
                    m.avg_rating = 0.0
            mentors.sort(key=lambda x: x.avg_rating, reverse=True)
            return mentors
        elif ordering == 'newest':
            queryset = queryset.order_by('-created_at')
        else:
            queryset = queryset.order_by('-created_at')
        return queryset

    @staticmethod
    def get_detail(mentor_id):
        return MentorProfile.objects.filter(
            id=mentor_id,
            status=MentorProfile.Status.APPROVED,
            accepting_mentees=True
        ).select_related('user').prefetch_related(
            'expertise',
            'availabilities',
            'user__careers',
            'user__educations'
        ).first()

class RecommendationService:
    @staticmethod
    def recommend(user, skill_ids):
        selected_skill_ids = set(Skill.objects.filter(id__in=skill_ids).values_list('id', flat=True))
        mentors = MentorProfile.objects.filter(
            status=MentorProfile.Status.APPROVED,
            accepting_mentees=True,
            current_mentees__lt=F('max_mentees')
        ).prefetch_related('expertise')
        results = []
        for mentor in mentors:
            mentor_skill_ids = set(mentor.expertise.values_list('id', flat=True))
            matched = selected_skill_ids & mentor_skill_ids
            if not matched:
                continue
            score = round(len(matched) / len(selected_skill_ids) * 100)
            mentor.score = score
            mentor.matched_skills = list(Skill.objects.filter(id__in=matched).values_list('name',flat=True))
            results.append(mentor)
        results.sort(key=lambda x: x.score, reverse=True)
        return results[:4]
