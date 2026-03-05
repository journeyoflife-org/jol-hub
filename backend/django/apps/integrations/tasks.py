"""
Celery tasks for processing incoming webhook events.
"""

from celery import shared_task
from django.utils import timezone


@shared_task(name='apps.integrations.tasks.process_stripe_webhook')
def process_stripe_webhook(event_id: str):
    from .models import WebhookEvent
    try:
        event = WebhookEvent.objects.get(id=event_id)
        # Route to appropriate handler based on event_type
        # e.g. payment_intent.succeeded → mark Donation complete
        event.status = WebhookEvent.STATUS_PROCESSED
        event.processed_at = timezone.now()
        event.save(update_fields=['status', 'processed_at', 'updated_at'])
    except WebhookEvent.DoesNotExist:
        pass


@shared_task(name='apps.integrations.tasks.process_paypal_webhook')
def process_paypal_webhook(event_id: str):
    from .models import WebhookEvent
    try:
        event = WebhookEvent.objects.get(id=event_id)
        event.status = WebhookEvent.STATUS_PROCESSED
        event.processed_at = timezone.now()
        event.save(update_fields=['status', 'processed_at', 'updated_at'])
    except WebhookEvent.DoesNotExist:
        pass
