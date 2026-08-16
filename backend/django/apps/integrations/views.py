"""
Webhook ingestion views — accepts POST from PayPal, Bitrix24, etc.

Model A (ADR-0005): Stripe webhooks land ONLY on the marketplace payment
boundary; jol-hub receives signed internal events from it and exposes NO
Stripe webhook endpoint (StripeWebhookView purged STEP 18).

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

    High-throughput Bitrix24 CRM webhook receiver.

    Design goals (see architectural plan):
    - Return ``202 Accepted`` within milliseconds — Bitrix24 enforces strict
      timeouts and will aggressively retry on delay.
    - Store raw, unpredictable JSON in MongoDB via
      ``WebhookPayloadCollection`` (no schema validation, auto TTL expiry).
    - Idempotency via Bitrix24 ``event_id`` or SHA-256 body hash.
    - HMAC-SHA256 signature verification against
      ``settings.BITRIX24_WEBHOOK_SECRET``.
    - Structured error responses conforming to the project standard:
      ``{"status": "error", "error": {"code": "...", "message": "..."}}``
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    # -- helpers --

    @staticmethod
    def _error_response(
        status_code: int,
        code: str,
        message: str,
    ) -> Response:
        """Return a standardised JSON error response.

        Args:
            status_code: HTTP status code.
            code: Machine-readable i18n key (e.g. ``webhook.signature_invalid``).
            message: Human-readable description.

        Returns:
            A ``Response`` with the structured error body.
        """
        return Response(
            {
                "status": "error",
                "error": {"code": code, "message": message},
            },
            status=status_code,
        )

    def _verify_signature(self, request) -> bool:
        """Verify Bitrix24 HMAC-SHA256 webhook signature.

        The signature is expected in the ``X-Bitrix24-Signature`` header as
        a hex-encoded HMAC-SHA256 digest of the raw request body.

        Returns:
            ``True`` if the signature is valid, or if no secret is configured
            (development mode). ``False`` otherwise.
        """
        return self._verify_signature_from_body(request.body, request)

    def _verify_signature_from_body(
        self,
        raw_body: bytes,
        request=None,
    ) -> bool:
        """Verify HMAC-SHA256 signature against raw body bytes.

        Args:
            raw_body: The raw request body bytes.
            request: The DRF request (used to read the signature header).

        Returns:
            ``True`` if valid or no secret configured; ``False`` otherwise.
        """
        secret: str = getattr(settings, "BITRIX24_WEBHOOK_SECRET", "")
        if not secret:
            logger.warning(
                "BITRIX24_WEBHOOK_SECRET not configured — "
                "skipping signature verification (development mode)."
            )
            return True

        if request is None:
            return False

        signature: str = request.headers.get("X-Bitrix24-Signature", "")
        if not signature:
            return False

        expected: str = hmac.new(
            secret.encode("utf-8"),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(signature, expected)

    @staticmethod
    def _compute_idempotency_key(payload: dict, raw_body: bytes) -> str:
        """Derive a deterministic idempotency key from the payload.

        Priority:
        1. Structured Bitrix24 fields:
           ``auth.domain`` + ``event`` + ``data.FIELDS.ID`` + ``ts``
        2. Fallback: SHA-256 hash of the raw request body.

        Args:
            payload: The parsed JSON payload.
            raw_body: The raw ``request.body`` bytes.

        Returns:
            A string suitable for use as an idempotency key.
        """
        domain: str = payload.get("auth", {}).get("domain", "")
        event: str = payload.get("event", "")
        entity_id: str = str(
            payload.get("data", {}).get("FIELDS", {}).get("ID", ""),
        )
        ts: str = str(payload.get("ts", ""))

        if domain and event and entity_id and ts:
            return f"bitrix24:{domain}:{event}:{entity_id}:{ts}"

        # Fallback — SHA-256 of raw body guarantees uniqueness.
        return f"bitrix24:sha256:{hashlib.sha256(raw_body).hexdigest()}"

    @staticmethod
    def _get_country(request, payload: dict) -> str:
        """Extract country code for GDPR Article 44 routing.

        Priority: ``X-Bitrix24-Country`` header > ``payload.country`` >
        ``payload.data.residency`` > ``'default'``.
        """
        return (
            request.headers.get("X-Bitrix24-Country")
            or payload.get("country")
            or payload.get("data", {}).get("residency")
            or "default"
        )

    # -- view --

    def post(self, request) -> Response:
        """Accept a Bitrix24 webhook and queue it for async processing.

        Returns ``202 Accepted`` on success.  The raw payload is stored in
        MongoDB and a Celery task is dispatched for background processing.
        """
        from apps.core.mongodb import WebhookPayloadCollection

        # 1. Read raw body FIRST (caches it on the request object).
        #    This MUST happen before ``request.data`` which also reads the
        #    stream via DRF's JSONParser — accessing body after that raises
        #    ``RawPostDataException``.
        raw_body: bytes = request.body

        # 2. HMAC-SHA256 signature verification (uses raw_body internally).
        if not self._verify_signature_from_body(raw_body, request):
            logger.warning(
                "Bitrix24 webhook rejected: invalid HMAC signature."
            )
            return self._error_response(
                status.HTTP_401_UNAUTHORIZED,
                "webhook.signature_invalid",
                "HMAC signature verification failed.",
            )

        # 3. Parse JSON — DRF's JSONParser already parsed request.data.
        #    We validate it's a dict (not a list or scalar).
        try:
            payload = request.data
        except Exception:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "webhook.malformed_payload",
                "Request body is not valid JSON.",
            )

        if not isinstance(payload, dict):
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "webhook.malformed_payload",
                "Request body must be a JSON object.",
            )

        # Validate required Bitrix24 fields.
        event_type = payload.get("event")
        if not event_type:
            return self._error_response(
                status.HTTP_400_BAD_REQUEST,
                "webhook.malformed_payload",
                "Missing required field: 'event'.",
            )

        # 4. Idempotency check via MongoDB.
        idempotency_key = self._compute_idempotency_key(payload, raw_body)

        existing = WebhookPayloadCollection.find_one(
            {"idempotency_key": idempotency_key},
        )
        if existing is not None:
            logger.info("Duplicate Bitrix24 webhook: %s", idempotency_key)
            return self._error_response(
                status.HTTP_409_CONFLICT,
                "webhook.duplicate_event",
                f"Event already received (idempotency_key={idempotency_key}).",
            )

        # 5. Store raw payload in MongoDB (auto-injects tenant_id,
        #    created_at, updated_at).
        country = self._get_country(request, payload)
        mongo_doc_id = WebhookPayloadCollection.insert_one(
            {
                "source": "bitrix24",
                "event_type": event_type,
                "idempotency_key": idempotency_key,
                "country": country,
                "raw_payload": payload,
            },
        )

        # 6. Dispatch Celery task for async processing.
        from .tasks import process_bitrix24_webhook
        process_bitrix24_webhook.delay(str(mongo_doc_id), country=country)

        logger.info(
            "Bitrix24 webhook queued: %s from %s (country=%s)",
            event_type,
            payload.get("auth", {}).get("domain", "unknown"),
            country,
        )

        # 7. Return 202 Accepted immediately.
        return Response(
            {
                "status": "queued",
                "event_id": str(mongo_doc_id),
                "country": country,
            },
            status=status.HTTP_202_ACCEPTED,
        )


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
