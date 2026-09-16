from django.shortcuts import redirect
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from allauth.socialaccount.models import SocialAccount
from django.contrib.auth.decorators import login_required
from .serializers import UserProfileSerializer, UserRegisterSerializer

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

@login_required
def social_login_callback(request):
    user = request.user
    social_account = SocialAccount.objects.filter(user=user).first()
    if not social_account:
        return redirect('http://localhost:5173/login/callback?error=NoSocialAccount')
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    return redirect(f'http://localhost:5173/login/callback?access_token={access_token}&refresh_token={refresh_token}')
