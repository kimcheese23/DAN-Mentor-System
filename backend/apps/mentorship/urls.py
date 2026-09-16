from django.urls import path

from .views import MentorshipRequestView, MentorshipListView, MentorshipRequestAcceptView, \
    MentorshipRequestRejectView, MentorshipRequestCancelView, MentorshipCancelView, MilestoneListCreateView, \
    MilestoneDetailView, TaskDetailView, TaskListCreateView, MilestoneProgressView, MentorshipCompleteView, \
    MentorshipProgressView, TaskCompleteView, ScheduleListCreateView, ScheduleUpdateView, ScheduleCancelView, \
    ScheduleCompleteView, FeedbackCreateView, MentorFeedbackView, MentorshipDetailView, MySchedulesListView

urlpatterns = [
    path('requests/', MentorshipRequestView.as_view()),
    path('requests/<int:pk>/accept/', MentorshipRequestAcceptView.as_view()),
    path('requests/<int:pk>/reject/', MentorshipRequestRejectView.as_view()),
    path('requests/<int:pk>/cancel/', MentorshipRequestCancelView.as_view()),

    path('mentorships/', MentorshipListView.as_view()),
    path('mentorships/<int:pk>/', MentorshipDetailView.as_view()),
    path('mentorships/<int:pk>/cancel/', MentorshipCancelView.as_view()),
    path('mentorships/<int:pk>/complete/', MentorshipCompleteView.as_view()),
    path('mentorships/<int:mentorship_id>/milestones/', MilestoneListCreateView.as_view()),
    path('mentorships/<int:mentorship_id>/progress/', MentorshipProgressView.as_view()),
    path('mentorships/<int:mentorship_id>/schedules/', ScheduleListCreateView.as_view()),
    path('mentorships/<int:mentorship_id>/feedback/', FeedbackCreateView.as_view()),

    path('milestones/<int:pk>/', MilestoneDetailView.as_view()),
    path('milestones/<int:milestone_id>/progress/', MilestoneProgressView.as_view()),
    path('milestones/<int:milestone_id>/tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/complete/', TaskCompleteView.as_view()),
    path('schedules/<int:schedule_id>/', ScheduleUpdateView.as_view()),
    path('schedules/<int:schedule_id>/cancel/', ScheduleCancelView.as_view()),
    path('schedules/<int:schedule_id>/complete/', ScheduleCompleteView.as_view()),
    path('mentors/<int:mentor_id>/feedbacks/',MentorFeedbackView.as_view()),
    path('my-schedules/', MySchedulesListView.as_view()),
]