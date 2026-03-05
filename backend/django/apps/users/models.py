"""
User domain models.

Extends Django's AbstractBaseUser so we control every field
while keeping full compatibility with the auth system.
"""

import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.core.models import UUIDModel, TimeStampedModel
from .managers import UserManager


class User(UUIDModel, TimeStampedModel, AbstractBaseUser, PermissionsMixin):
    """
    Platform user.

    Email is the unique identifier — no username field.
    Roles are coarse-grained; fine-grained permissions live in OrganizationMember.
    """

    ROLE_ADMIN = 'admin'
    ROLE_EDITOR = 'editor'
    ROLE_VIEWER = 'viewer'
    ROLE_MEMBER = 'member'

    ROLE_CHOICES = [
        (ROLE_ADMIN, _('Admin')),
        (ROLE_EDITOR, _('Editor')),
        (ROLE_VIEWER, _('Viewer')),
        (ROLE_MEMBER, _('Member')),
    ]

    email = models.EmailField(_('email address'), unique=True, db_index=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default=ROLE_MEMBER)

    # Auth flags
    is_staff = models.BooleanField(_('staff status'), default=False)
    is_active = models.BooleanField(_('active'), default=True)
    is_verified = models.BooleanField(_('email verified'), default=False)

    # Soft delete
    is_deleted = models.BooleanField(_('deleted'), default=False)
    deleted_at = models.DateTimeField(_('deleted at'), null=True, blank=True)

    # MFA
    mfa_enabled = models.BooleanField(_('MFA enabled'), default=False)
    mfa_secret = models.CharField(_('MFA secret'), max_length=64, blank=True)

    # Profile
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(_('phone'), max_length=32, blank=True)
    preferred_language = models.CharField(_('preferred language'), max_length=8, default='en')
    timezone = models.CharField(_('timezone'), max_length=64, default='UTC')
    country = models.CharField(_('country'), max_length=2, blank=True)

    # GDPR
    gdpr_consent = models.BooleanField(_('GDPR consent'), default=False)
    gdpr_consent_at = models.DateTimeField(_('GDPR consent date'), null=True, blank=True)
    marketing_consent = models.BooleanField(_('marketing consent'), default=False)
    marketing_consent_at = models.DateTimeField(_('marketing consent date'), null=True, blank=True)

    # Tracking
    last_login_ip = models.GenericIPAddressField(_('last login IP'), null=True, blank=True)
    login_count = models.PositiveIntegerField(_('login count'), default=0)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['email']
        indexes = [
            models.Index(fields=['email', 'is_active']),
            models.Index(fields=['role', 'is_active']),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.email

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'is_active', 'deleted_at', 'updated_at'])


class UserProfile(UUIDModel, TimeStampedModel):
    """
    Extended profile information — kept separate to keep the User model lean
    and to facilitate GDPR erasure without touching auth records.
    """

    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='profile', verbose_name=_('user'),
    )
    bio = models.TextField(_('bio'), blank=True)
    website = models.URLField(_('website'), blank=True)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    notification_preferences = models.JSONField(_('notification preferences'), default=dict)
    extra = models.JSONField(_('extra'), default=dict)

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')

    def __str__(self):
        return f'Profile of {self.user.email}'
