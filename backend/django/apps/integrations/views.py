"""
Webhook ingestion views — accepts POST from Stripe, PayPal, Bitrix24, etc.

GDPR Article 44: All webhooks are routed to country-specific processors.
SOC2 CC6.1: Audit logging and circuit breaker for security.
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime, timezone

from django.conf import settings
from django.utils.crypto import get_random_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

from .models import WebhookEvent

logger = logging.getLogger(__name__)


class StripeWebhookView(APIView):
    """POST /api/v1/integrations/webhooks/stripe/"""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        idempotency_key = request.META.get('HTTP_STRIPE_SIGNATURE', get_random_string(64))
        event, created = WebhookEvent.objects.get_or_create(
            idempotency_key=idempotency_key,
            defaults={
                'source': 'stripe',
                'event_type': request.data.get('type', 'unknown'),
                'payload': request.data,
            },
        )
        if not created:
            return Response({'status': 'duplicate'})

        # Delegate to Celery task for async processing
        from .tasks import process_stripe_webhook
        process_stripe_webhook.delay(str(event.id))
        return Response({'status': 'received'})


class PayPalWebhookView(APIView):
    """POST /api/v1/integrations/webhooks/paypal/"""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        idempotency_key = request.META.get('HTTP_PAYPAL_TRANSMISSION_ID', get_random_string(64))
        event, created = WebhookEvent.objects.get_or_create(
            idempotency_key=idempotency_key,
            defaults={
                'source': 'paypal',
                'event_type': request.data.get('event_type', 'unknown'),
                'payload': request.data,
            },
        )
        if not created:
            return Response({'status': 'duplicate'})

        from .tasks import process_paypal_webhook
        process_paypal_webhook.delay(str(event.id))
        return Response({'status': 'received'})


class Bitrix24WebhookView(APIView):
    """
    POST /api/v1/integrations/webhooks/bitrix24/
    
    Receives webhooks from Bitrix24 CRM with GDPR compliance.
    
    Features:
    - HMAC signature verification
    - GDPR Article 44 country routing
    - Tamper-evident audit logging
    - Circuit breaker for cascade failure prevention
    - Idempotent processing
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    
    def _verify_signature(self, request) -> bool:
        """Verify Bitrix24 webhook signature."""
        secret = getattr(settings, 'BITRIX24_WEBHOOK_SECRET', '')
        if not secret:
            logger.warning('BITRIX24_WEBHOOK_SECRET not configured - skipping signature verification')
            return True
        
        signature = request.headers.get('X-Bitrix24-Signature', '')
        if not signature:
            return False
        
        # Compute expected HMAC-SHA256
        expected = hmac.new(
            secret.encode('utf-8'),
            request.body,
            hashlib.sha256,
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected)
    
    def _get_country(self, request, payload: dict) -> str:
        """Extract country from webhook for GDPR routing."""
        # Priority: Header > Payload > Default
        return (
            request.headers.get('X-Bitrix24-Country') or
            payload.get('country') or
            payload.get('data', {}).get('residency') or
            'default'
        )
    
    def post(self, request):
        """Process incoming Bitrix24 webhook."""
        # Verify signature
        if not self._verify_signature(request):
            logger.warning('Invalid Bitrix24 webhook signature')
            return Response(
                {'error': 'Invalid signature'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        payload = request.data
        event_type = payload.get('event', 'unknown')
        
        # Extract GDPR country for routing
        country = self._get_country(request, payload)
        
        # Generate idempotency key from event data
        event_id = payload.get('data', {}).get('FIELDS', {}).get('ID', '')
        timestamp = payload.get('ts', '')
        domain = payload.get('auth', {}).get('domain', 'unknown')
        idempotency_key = f"bitrix24:{domain}:{event_type}:{event_id}:{timestamp}"
        
        if not timestamp:
            idempotency_key = f"bitrix24:{domain}:{event_type}:{event_id}:{datetime.now(timezone.utc).isoformat()}"
        
        # Create webhook event (idempotent)
        event, created = WebhookEvent.objects.get_or_create(
            idempotency_key=idempotency_key,
            defaults={
                'source': 'bitrix24',
                'event_type': event_type,
                'payload': {
                    **payload,
                    'country': country,  # Store country for routing
                },
            },
        )
        
        if not created:
            logger.info(f"Duplicate Bitrix24 webhook: {idempotency_key}")
            return Response({'status': 'duplicate', 'event_id': str(event.id)})
        
        # Log webhook receipt
        logger.info(
            f"Bitrix24 webhook received: {event_type} "
            f"from {domain} (country={country})"
        )
        
        # Delegate to Celery task for async processing
        from .tasks import process_bitrix24_webhook
        process_bitrix24_webhook.delay(str(event.id), country=country)
        
        return Response({
            'status': 'received',
            'event_id': str(event.id),
            'country': country,
        })


class Bitrix24WebhookHealthView(APIView):
    """
    GET /api/v1/integrations/webhooks/bitrix24/health/
    
    Health check and circuit breaker status for Bitrix24 webhooks.
    """
    
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def get(self, request):
        """Return webhook handler health status."""
        try:
            from integrations.bitrix24.webhooks import get_webhook_handler
            handler = get_webhook_handler()
            
            # Get circuit breaker status
            circuit_status = handler.get_circuit_breaker_status()
            
            # Verify audit chain integrity
            chain_verification = handler.verify_chain_integrity()
            
            return Response({
                'status': 'healthy',
                'service': 'bitrix24-webhook',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'circuit_breakers': circuit_status,
                'audit_chain_valid': chain_verification.get('valid', False),
                'audit_entry_count': chain_verification.get('entry_count', 0),
            })
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return Response({
                'status': 'unhealthy',
                'error': str(e),
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
