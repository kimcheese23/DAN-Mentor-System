from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'full_name')

    def create(self, validated_data):
        return User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=validated_data.get('full_name', '')
        )

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'avatar', 'phone', 'created_at', 'updated_at')
        read_only_fields = ('id', 'email', 'created_at', 'updated_at')

        def get_avatar(self, obj):
            if obj.avatar:
                return obj.avatar.url
            return None