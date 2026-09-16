from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.mentorship.models import MentorshipRequest, Mentorship, Milestone, Task, Schedule, Feedback
from apps.mentorship.serializers import MentorshipRequestCreateSerializer, MentorshipRequestListSerializer, \
    MentorshipSerializer, MilestoneSerializer, TaskSerializer, ScheduleSerializer, ScheduleCreateSerializer, \
    FeedbackSerializer, FeedbackCreateSerializer
from apps.mentorship.services import MentorshipRequestService, MentorshipService, MilestoneService, TaskService, \
    ProgressService, ScheduleService, FeedbackService
from apps.profiles.models import MentorProfile
from apps.accounts.models import User
from common.pagination import BasePaginator

class MentorshipRequestView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        request_type = request.query_params.get('type', 'sent')
        status_filter = request.query_params.get('status')

        queryset = MentorshipRequest.objects.select_related('mentee', 'mentor').order_by('-created_at')
        if request_type == 'sent':
            queryset = queryset.filter(mentee=request.user)
        elif request_type == 'received':
            queryset = queryset.filter(mentor=request.user)
        else:
            return Response({'detail': 'Loại yêu cầu không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        if status_filter:
            if status_filter not in MentorshipRequest.Status.values:
                return Response({'detail': 'Trạng thái không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(status=status_filter)

        return self.paginate_list(request, queryset, MentorshipRequestListSerializer)

    def post(self, request):
        serializer = MentorshipRequestCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        profile_id = serializer.validated_data['mentor_id']
        try:
            mentor_profile = MentorProfile.objects.get(id=profile_id)
        except MentorProfile.DoesNotExist:
            return Response({'detail': 'Không tìm thấy Mentor.'}, status=status.HTTP_404_NOT_FOUND)

        mentor = mentor_profile.user
        try:
            mentorship_request = MentorshipRequestService.create(
                mentee=request.user,
                mentor=mentor,
                goal=serializer.validated_data.get('goal', ''),
                message=serializer.validated_data.get('message', '')
            )
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'detail': 'Đã gửi yêu cầu kết nối.',
            'request_id': mentorship_request.id,
            'status': mentorship_request.status
        }, status=status.HTTP_201_CREATED)

class MentorshipRequestAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mentorship_request = MentorshipRequest.objects.select_related('mentor', 'mentee').get(pk=pk)
        except MentorshipRequest.DoesNotExist:
            return Response({'detail': 'Không tìm thấy yêu cầu kết nối.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            mentorship_request, mentorship = MentorshipRequestService.accept(request.user, mentorship_request)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Đã chấp nhận yêu cầu kết nối.',
                         'request': MentorshipRequestListSerializer(mentorship_request).data,
                         'mentorship': MentorshipSerializer(mentorship).data},
                        status=status.HTTP_200_OK)

class MentorshipRequestRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mentorship_request = MentorshipRequest.objects.select_related('mentor', 'mentee').get(pk=pk)
        except MentorshipRequest.DoesNotExist:
            return Response({'detail': 'Không tìm thấy yêu cầu kết nối.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            mentorship_request = MentorshipRequestService.reject(request.user, mentorship_request)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Đã từ chối yêu cầu kết nối.',
                         'request': MentorshipRequestListSerializer(mentorship_request).data},
                        status=status.HTTP_200_OK)

class MentorshipRequestCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mentorship_request = MentorshipRequest.objects.select_related('mentor', 'mentee').get(pk=pk)
        except MentorshipRequest.DoesNotExist:
            return Response({'detail': 'Không tìm thấy yêu cầu kết nối.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            mentorship_request = MentorshipRequestService.cancel_request(request.user, mentorship_request)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Đã hủy yêu cầu kết nối.',
                         'request': MentorshipRequestListSerializer(mentorship_request).data},
                        status=status.HTTP_200_OK)

class MentorshipListView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get('role')
        status_filter = request.query_params.get('status')
        if role not in [None, 'mentee', 'mentor']:
            return Response({'detail': 'Vai trò không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
        if status_filter and status_filter not in Mentorship.Status.values:
            return Response({'detail': 'Trạng thái không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        mentorships = MentorshipService.list(request.user, role, status_filter)
        return self.paginate_list(request, mentorships, MentorshipSerializer)

class MentorshipDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            mentorship = Mentorship.objects.select_related('mentor', 'mentee').get(pk=pk)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            MentorshipService.check_user(mentorship, request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_403_FORBIDDEN)
        return Response(MentorshipSerializer(mentorship).data, status=status.HTTP_200_OK)

class MentorshipCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mentorship = Mentorship.objects.get(pk=pk)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy mối quan hệ mentoring.'},
                            status=status.HTTP_404_NOT_FOUND)
        try:
            mentorship = MentorshipService.complete(mentorship, request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Đã hoàn thành chương trình mentoring.',
                         'mentorship': MentorshipSerializer(mentorship).data},
                        status=status.HTTP_200_OK)

class MentorshipCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mentorship = Mentorship.objects.select_related('mentee', 'mentor').get(pk=pk)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy mối quan hệ mentorship.'},
                            status=status.HTTP_404_NOT_FOUND)
        try:
            mentorship = MentorshipService.cancel(mentorship, request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': 'Đã kết thúc mối quan hệ mentorship.',
                         'mentorship': MentorshipSerializer(mentorship).data}, status=status.HTTP_200_OK)

class MilestoneListCreateView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            MentorshipService.check_user(mentorship, request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        milestones = MilestoneService.list(mentorship)
        return self.paginate_list(request, milestones, MilestoneSerializer)

    def post(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = MilestoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            milestone = MilestoneService.create(request.user, mentorship, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)

class MilestoneDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Milestone.objects.select_related('mentorship', 'mentorship__mentor', 'mentorship__mentee').get(pk=pk)

    def get(self, request, pk):
        milestone = self.get_object(pk)
        MentorshipService.check_user(milestone.mentorship, request.user)
        return Response(MilestoneSerializer(milestone).data)

    def patch(self, request, pk):
        milestone = self.get_object(pk)
        serializer = MilestoneSerializer(milestone, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        milestone = MilestoneService.update(request.user, milestone, serializer.validated_data)
        return Response(MilestoneSerializer(milestone).data)

    def delete(self, request, pk):
        milestone = self.get_object(pk)
        MilestoneService.delete(request.user, milestone)
        return Response(status=status.HTTP_204_NO_CONTENT)

class MilestoneProgressView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, milestone_id):
        try:
            milestone = Milestone.objects.select_related('mentorship').get(pk=milestone_id)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chặng.'}, status=status.HTTP_404_NOT_FOUND)
        MentorshipService.check_user(milestone.mentorship, request.user)
        progress = ProgressService.milestone(milestone)
        return Response({'milestone_id': milestone.pk, 'progress': progress})

class TaskListCreateView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request, milestone_id):
        try:
            milestone = Milestone.objects.select_related('mentorship').get(pk=milestone_id)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chặng.'}, status=status.HTTP_404_NOT_FOUND)
        MentorshipService.check_user(milestone.mentorship, request.user)
        tasks = milestone.tasks.all()
        return self.paginate_list(request, tasks, TaskSerializer)

    def post(self, request, milestone_id):
        try:
            milestone = Milestone.objects.select_related('mentorship').get(pk=milestone_id)
        except Milestone.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chặng.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data['milestone'] = milestone
        try:
            task = TaskService.create(request.user, data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)

class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Task.objects.select_related('milestone__mentorship',
                                           'milestone__mentorship__mentor',
                                           'milestone__mentorship__mentee').get(pk=pk)

    def get(self, request, pk):
        task = self.get_object(pk)
        MentorshipService.check_user(task.milestone.mentorship, request.user)
        return Response(TaskSerializer(task).data)

    def patch(self, request, pk):
        task = self.get_object(pk)
        serializer = TaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        try:
            task = TaskService.update(request.user, task, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        task = self.get_object(pk)
        try:
            TaskService.delete(request.user, task)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)

class TaskCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            task = Task.objects.select_related('milestone__mentorship').get(pk=pk)
        except Task.DoesNotExist:
            return Response({'detail': 'Không tìm thấy nhiệm vụ.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            task = TaskService.complete(request.user, task)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskSerializer(task).data, status=status.HTTP_200_OK)

class MentorshipProgressView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy mối quan hệ mentoring.'}, status=status.HTTP_404_NOT_FOUND)
        MentorshipService.check_user(mentorship, request.user)
        progress = ProgressService.mentorship(mentorship)
        return Response({'mentorship_id': mentorship.id, 'progress': progress})

class ScheduleListCreateView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'}, status=status.HTTP_404_NOT_FOUND)
        MentorshipService.check_user(mentorship, request.user)
        schedules = mentorship.schedules.select_related('created_by').order_by('start_time')
        return self.paginate_list(request, schedules, ScheduleSerializer)

    def post(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ScheduleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            schedule = ScheduleService.create(request.user, mentorship, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ScheduleSerializer(schedule).data, status=status.HTTP_201_CREATED)

class ScheduleUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, schedule_id):
        try:
            schedule = Schedule.objects.select_related('mentorship').get(pk=schedule_id)
        except Schedule.DoesNotExist:
            return Response({'detail':'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = ScheduleCreateSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        try: schedule = ScheduleService.update(request.user, schedule, serializer.validated_data)
        except ValueError as e:
            return Response({'detail':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ScheduleSerializer(schedule).data)

class ScheduleCancelView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, schedule_id):
        try:
            schedule = Schedule.objects.select_related('mentorship').get(pk=schedule_id)
        except Schedule.DoesNotExist:
            return Response({'detail':'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            schedule = ScheduleService.cancel(request.user, schedule)
        except ValueError as e:
            return Response({'detail':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ScheduleSerializer(schedule).data)

class ScheduleCompleteView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, schedule_id):
        try:
            schedule = Schedule.objects.select_related('mentorship').get(pk=schedule_id)
        except Schedule.DoesNotExist:
            return Response({'detail':'Không tìm thấy lịch hẹn.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            schedule = ScheduleService.complete(request.user, schedule)
        except ValueError as e:
            return Response({'detail':str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(ScheduleSerializer(schedule).data)


class MySchedulesListView(APIView, BasePaginator):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        schedules = Schedule.objects.filter(
            Q(mentorship__mentor=user) | Q(mentorship__mentee=user)
        ).select_related('mentorship', 'mentorship__mentor', 'mentorship__mentee').order_by('-start_time')
        status_param = request.query_params.get('status')
        if status_param:
            schedules = schedules.filter(status=status_param)
        return self.paginate_list(request, schedules, ScheduleSerializer)

class FeedbackCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, mentorship_id):
        try:
            mentorship = Mentorship.objects.get(pk=mentorship_id)
        except Mentorship.DoesNotExist:
            return Response({'detail': 'Không tìm thấy chương trình mentoring.'},
                status=status.HTTP_404_NOT_FOUND)
        serializer = FeedbackCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            feedback = FeedbackService.create(request.user, mentorship, serializer.validated_data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(FeedbackSerializer(feedback).data, status=status.HTTP_201_CREATED)

class MentorFeedbackView(APIView, BasePaginator):
    permission_classes = [permissions.AllowAny]

    def get(self, request, mentor_id):
        try:
            mentor = User.objects.get(pk=mentor_id)
        except User.DoesNotExist:
            return Response({'detail': 'Không tìm thấy mentor.'}, status=status.HTTP_404_NOT_FOUND)
        feedbacks = Feedback.objects.filter(mentor=mentor).select_related('mentee').order_by('-created_at')
        paginated_response = self.paginate_list(request, feedbacks, FeedbackSerializer)
        paginated_response.data['stats'] = FeedbackService.stats(mentor.id)
        return paginated_response
