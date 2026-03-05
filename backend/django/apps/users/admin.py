"""
User admin configuration.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = _('Profile')
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]

    list_display = ('email', 'first_name', 'last_name', 'role',
                    'is_active', 'is_verified', 'mfa_enabled', 'created_at')
    list_filter = ('is_active', 'is_staff', 'is_verified', 'role', 'country')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    date_hierarchy = 'created_at'
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_login',
                       'login_count', 'gdpr_consent_at', 'marketing_consent_at')

    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'phone',
                                         'avatar', 'country', 'preferred_language', 'timezone')}),
        (_('Role & permissions'), {'fields': ('role', 'is_active', 'is_staff',
                                               'is_superuser', 'is_verified',
                                               'groups', 'user_permissions')}),
        (_('MFA'), {'fields': ('mfa_enabled',)}),
        (_('GDPR'), {'fields': ('gdpr_consent', 'gdpr_consent_at',
                                'marketing_consent', 'marketing_consent_at')}),
        (_('Activity'), {'fields': ('last_login', 'login_count', 'last_login_ip')}),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
