"""
Webhook ingestion view — accepts POST from Stripe, PayPal, etc.
"""

from django.utils.crypto import get_random_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import WebhookEvent


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
