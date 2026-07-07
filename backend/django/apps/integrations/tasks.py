"""
Celery tasks for processing incoming webhook events.
"""

import asyncio
import logging
from typing import Optional

from celery import shared_task
from celery.utils.log import get_task_logger
from django.utils import timezone

logger = get_task_logger(__name__)


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


@shared_task(
    name='apps.integrations.tasks.process_bitrix24_webhook',
    autoretry_for=(Exception,),
    retry_kwargs={'max_retries': 3, 'countdown': 5},
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
)
def process_bitrix24_webhook(event_id: str, country: Optional[str] = None):
    """
    Process Bitrix24 webhook event asynchronously.
    
    GDPR Article 44: Webhooks are routed to country-specific processors.
    Retry logic handles transient failures with exponential backoff.
    
    Args:
        event_id: UUID of the WebhookEvent record
        country: Country code for GDPR routing (optional)
    """
    from .models import WebhookEvent
    
    try:
        event = WebhookEvent.objects.get(id=event_id)
        logger.info(f"Processing Bitrix24 webhook: {event.event_type} (country={country})")
        
        # Get the webhook handler
        from integrations.bitrix24.webhooks import get_webhook_handler
        from integrations.bitrix24.webhooks.handlers import WebhookEvent as B24Event
        
        handler = get_webhook_handler()
        
        # Parse the webhook event
        b24_event = B24Event(
            event=event.event_type,
            data=event.payload.get('data', {}),
            timestamp=event.payload.get('timestamp', ''),
            application_token=event.payload.get('auth', {}).get('application_token'),
            auth=event.payload.get('auth'),
            country=country or event.payload.get('country'),
            entity_id=event.payload.get('entityId'),
            tenant_id=event.payload.get('auth', {}).get('member_id'),
        )
        
        # Process the webhook asynchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(handler.handle(b24_event))
        finally:
            loop.close()
        
        # Update event status
        if result.get('status') == 'processed':
            event.status = WebhookEvent.STATUS_PROCESSED
        elif result.get('status') == 'ignored':
            event.status = WebhookEvent.STATUS_IGNORED
        else:
            event.status = WebhookEvent.STATUS_PROCESSED
        
        event.processed_at = timezone.now()
        event.save(update_fields=['status', 'processed_at', 'updated_at'])
        
        logger.info(f"Bitrix24 webhook processed: {event.event_type} → {event.status}")
        
    except WebhookEvent.DoesNotExist:
        logger.warning(f"WebhookEvent not found: {event_id}")
    except Exception as e:
        logger.error(f"Error processing Bitrix24 webhook {event_id}: {e}")
        # Update event status to failed
        try:
            event = WebhookEvent.objects.get(id=event_id)
            event.status = WebhookEvent.STATUS_FAILED
            event.error = str(e)
            event.save(update_fields=['status', 'error', 'updated_at'])
        except WebhookEvent.DoesNotExist:
            pass
        raise  # Re-raise for retry


@shared_task(name='apps.integrations.tasks.process_bitrix24_retry_queue')
def process_bitrix24_retry_queue():
    """
    Process failed Bitrix24 webhooks that are pending retry.
    Called periodically by Celery beat.
    """
    from .models import WebhookEvent
    from django.utils import timezone
    from datetime import timedelta
    
    # Get failed events that haven't exceeded max retries
    retry_cutoff = timezone.now() - timedelta(hours=24)
    failed_events = WebhookEvent.objects.filter(
        source='bitrix24',
        status=WebhookEvent.STATUS_FAILED,
        created_at__gte=retry_cutoff,
    )[:100]  # Process in batches
    
    for event in failed_events:
        # Retry processing
        process_bitrix24_webhook.delay(
            str(event.id),
            country=event.payload.get('country')
        )
    
    logger.info(f"Queued {len(failed_events)} Bitrix24 webhooks for retry")
    return {"retried": len(failed_events)}
