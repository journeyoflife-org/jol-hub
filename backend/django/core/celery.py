"""
Celery application initialization for JOL-HUB.

This module initializes the Celery app and configures it from Django settings.
It must be imported in core/__init__.py so Celery workers start correctly.

Usage:
    celery -A core worker -l info
    celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
"""

import os

from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

app = Celery('jolhub')

# Read config from Django settings, using the CELERY_ namespace.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Autodiscover tasks in all installed apps.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to verify Celery is working."""
    print(f'Request: {self.request!r}')
