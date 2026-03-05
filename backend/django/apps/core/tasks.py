"""
Core Celery tasks — housekeeping jobs shared by the platform.
"""

from celery import shared_task
from django.utils import timezone


@shared_task(name='apps.core.tasks.cleanup_sessions')
def cleanup_sessions():
    """Remove expired sessions from the database."""
    from django.contrib.sessions.backends.db import SessionStore
    from django.contrib.sessions.models import Session

    expired = Session.objects.filter(expire_date__lt=timezone.now())
    count = expired.count()
    expired.delete()
    return {'deleted_sessions': count}


@shared_task(name='apps.core.tasks.test_task')
def test_task():
    """Development smoke-test task."""
    return {'status': 'ok', 'timestamp': timezone.now().isoformat()}
