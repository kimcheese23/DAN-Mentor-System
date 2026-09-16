from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenBlacklistView
from .views import (
    RegisterView,
    UserProfileView,
    social_login_callback,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', TokenObtainPairView.as_view(), name='auth_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='auth_logout'),
    path('me/', UserProfileView.as_view(), name='auth_me'),
    path('callback/', social_login_callback, name='social_login_callback'),
    path('google/login/', include('allauth.socialaccount.urls')),
]