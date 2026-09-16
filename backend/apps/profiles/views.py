from common.pagination import BasePaginator
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Education, Career, Skill, MentorProfile
from .serializers import EducationSerializer, CareerSerializer, SkillSerializer, MentorProfileSerializer, \
    MentorDiscoverySerializer, MentorDetailSerializer, MentorAvailabilitySerializer, RecommendedMentorSerializer
from .services import EducationService, CareerService, MentorProfileService, MentorDiscoveryService, \
    MentorAvailabilityService, RecommendationService


class SkillListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('search', '')
        skills = Skill.objects.filter(is_active=True)
        if query:
            skills = skills.filter(name__icontains=query)
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

class MySkillView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        skills = request.user.skills.filter(is_active=True)
        serializer = SkillSerializer(skills, many=True)
        return Response(serializer.data)

    def put(self, request):
        skill_ids = request.data.get('skill_ids')
        if not isinstance(skill_ids, list):
            return Response({'detail': 'skill_ids phải là một danh sách.'}, status=status.HTTP_400_BAD_REQUEST)
        skills = Skill.objects.filter(id__in=skill_ids, is_active=True)
        if skills.count() != len(set(skill_ids)):
            return Response({'detail': 'Một hoặc nhiều Skill không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.skills.set(skills)
        serializer = SkillSerializer(request.user.skills.filter(is_active=True), many=True)
        return Response(serializer.data)

class EducationViewSet(viewsets.ModelViewSet):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.instance = EducationService.create(self.request.user, serializer.validated_data)

    def perform_update(self, serializer):
        EducationService.update(serializer.instance, serializer.validated_data)

    def perform_destroy(self, instance):
        EducationService.delete(instance)

class CareerViewSet(viewsets.ModelViewSet):
    serializer_class = CareerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Career.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        CareerService.create(self.request.user, serializer.validated_data)

    def perform_update(self, serializer):
        CareerService.update(serializer.instance, serializer.validated_data)

    def perform_destroy(self, instance):
        CareerService.delete(instance)


class MyMentorProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Bạn chưa có Mentor Profile.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorProfileSerializer(profile)
        return Response(serializer.data)

    def post(self, request):
        serializer = MentorProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            profile = MentorProfileService.create(request.user, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MentorProfileSerializer(profile).data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Bạn chưa có Mentor Profile.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MentorProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            profile = MentorProfileService.update(profile, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MentorProfileSerializer(profile).data)

class MentorProfileSubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Bạn chưa có Mentor Profile. Vui lòng tạo hồ sơ trước.'},
                            status=status.HTTP_404_NOT_FOUND)
        try:
            profile = MentorProfileService.submit(profile)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MentorProfileSerializer(profile).data)

class MyMentorAvailabilityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            mentor = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Bạn chưa có Mentor Profile.'}, status=status.HTTP_404_NOT_FOUND)
        slots = mentor.availabilities.filter(is_active=True)
        return Response(MentorAvailabilitySerializer(slots, many=True).data)

    def put(self, request):
        try:
            mentor = request.user.mentor_profile
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Bạn chưa có Mentor Profile.'}, status=status.HTTP_404_NOT_FOUND)
        slots = request.data.get('slots')
        if not isinstance(slots, list):
            return Response({'detail': 'Danh sách lịch rảnh không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = MentorAvailabilitySerializer(data=slots, many=True)
        serializer.is_valid(raise_exception=True)
        try:
            slots = MentorAvailabilityService.update(mentor, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MentorAvailabilitySerializer(slots, many=True).data)

class MentorDiscoveryView(APIView, BasePaginator):
    permission_classes = [AllowAny]

    def get(self, request):
        search = request.query_params.get('search')
        ordering = request.query_params.get('ordering')
        mentors = MentorDiscoveryService.search(
            search=search,
            ordering=ordering
        )
        if request.user.is_authenticated:
            if isinstance(mentors, list):
                mentors = [m for m in mentors if m.user != request.user]
            else:
                mentors = mentors.exclude(user=request.user)
        return self.paginate_list(request, mentors, MentorDiscoverySerializer)

class MentorDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        mentor = MentorDiscoveryService.get_detail(pk)
        if not mentor:
            return Response({'detail': 'Không tìm thấy Mentor phù hợp.'},
                status=status.HTTP_404_NOT_FOUND)
        serializer = MentorDetailSerializer(mentor)
        return Response(serializer.data)

class RecommendMentorView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        skill_ids = request.data.get('skill_ids', [])
        data = RecommendationService.recommend(request.user, skill_ids)
        serializer = RecommendedMentorSerializer(data, many=True)
        return Response(serializer.data)
