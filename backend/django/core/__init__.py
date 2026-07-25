# JOL-HUB Django settings package

# Import Celery app so it's available when Django starts.
# This follows the Celery documentation recommendation:
# https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html
from .celery import app as celery_app

__all__ = ('celery_app',)
