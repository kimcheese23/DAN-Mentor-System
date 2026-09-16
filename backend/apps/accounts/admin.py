from allauth.account.models import EmailAddress
from allauth.socialaccount.models import SocialAccount, SocialToken, SocialApp
from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.sites.models import Site
from rest_framework.authtoken.models import TokenProxy

from .models import User
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

models_to_unregister = [
    OutstandingToken, BlacklistedToken, SocialAccount,
    SocialToken, Group, Site, EmailAddress, SocialApp, TokenProxy
]

for model in models_to_unregister:
    try:
        admin.site.unregister(model)
    except admin.sites.NotRegistered:
        pass

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'phone', 'is_active', 'is_staff', 'created_at')
    fields = ('email', 'full_name', 'avatar', 'phone', 'skills', 'is_active', 'is_staff', 'is_superuser')
    def get_readonly_fields(self, request, obj=None):
        if obj:
            editable_fields = ['is_active', 'is_staff', 'is_superuser']
            return [f.name for f in self.model._meta.fields if f.name not in editable_fields] + ['skills']
        return super().get_readonly_fields(request, obj)

    def has_delete_permission(self, request, obj=None):
        return False
