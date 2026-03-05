"""
User signals — auto-create profile, track login metadata.
"""

from django.db.models.signals import post_save
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver

from .models import User, UserProfile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Ensure every User has a linked UserProfile."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(user_logged_in)
def update_login_metadata(sender, request, user, **kwargs):
    """Track last login IP and increment login counter."""
    ip = (
        request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
        or request.META.get('REMOTE_ADDR')
    )
    User.objects.filter(pk=user.pk).update(
        last_login_ip=ip or None,
        login_count=user.login_count + 1,
    )
