from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EducationViewSet, CareerViewSet, SkillListView, MySkillView, MyMentorProfileView, \
    MentorProfileSubmitView, MentorDiscoveryView, MentorDetailView, \
    MyMentorAvailabilityView, RecommendMentorView

router = DefaultRouter()
router.register('educations', EducationViewSet, basename='education')
router.register('careers', CareerViewSet, basename='career')

urlpatterns = [
    path('skills/', SkillListView.as_view(), name='skill-list'),
    path('me/skills/', MySkillView.as_view(), name='my-skills'),
    path('', include(router.urls)),
    path('mentor/', MyMentorProfileView.as_view()),
    path('mentor/submit/', MentorProfileSubmitView.as_view()),
    path('mentor/availability/', MyMentorAvailabilityView.as_view()),
    path('mentors/', MentorDiscoveryView.as_view()),
    path('mentors/<int:pk>/', MentorDetailView.as_view()),
    path('mentors/recommend/', RecommendMentorView.as_view()),

]
