"""
Celery tasks for processing incoming webhook events.

SOC2 CC7.2  — every state transition is logged for auditability.
GDPR Art. 5 — integrity and confidentiality of processing.
"""

import logging
from typing import Any, Optional

from celery import shared_task
from celery.utils.log import get_task_logger
from django.core.exceptions import ValidationError
from django.db import InterfaceError, OperationalError
from django.utils import timezone

logger = get_task_logger(__name__)

#: Exceptions that indicate **transient** infrastructure problems.
#: These trigger Celery autoretry with exponential backoff.
_TRANSIENT_ERRORS: tuple[type[Exception], ...] = (
    OperationalError,
    InterfaceError,
    ConnectionError,
    OSError,
)

#: Exceptions that indicate **permanent** data problems.
#: These mark the event as FAILED and do NOT trigger a retry —
#: retrying will not fix bad data.
_PERMANENT_ERRORS: tuple[type[Exception], ...] = (
    ValidationError,
    KeyError,
    ValueError,
    TypeError,
)

# ---------------------------------------------------------------------------
# Audit helpers
# ---------------------------------------------------------------------------

_AUDIT_ACTOR = "system:celery:process_bitrix24_webhook"


def _audit_log(
    action: str,
    *,
    event_type: str = "",
    entity_id: str = "",
    tenant_id: str = "",
    details: Optional[dict[str, Any]] = None,
    level: int = logging.INFO,
) -> None:
    """Emit a structured audit log entry.

    SOC2 CC7.2 / ISO 27001 A.12.4 — every significant state change is
    captured with ``actor_id``, ``action``, ``resource_type``, and
    ``tenant_id``.

    PII is NEVER included — only event type, entity ID, and
    machine-readable status codes.
    """
    logger.log(
        level,
        "AUDIT | actor=%s | action=%s | resource_type=webhook_event "
        "| event_type=%s | entity_id=%s | tenant_id=%s | details=%s",
        _AUDIT_ACTOR,
        action,
        event_type,
        entity_id,
        tenant_id,
        details or {},
    )


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------


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
    autoretry_for=_TRANSIENT_ERRORS,
    retry_kwargs={'max_retries': 3, 'countdown': 5},
    retry_backoff=True,
    retry_backoff_max=60,
    retry_jitter=True,
)
def process_bitrix24_webhook(
    mongo_doc_id: str,
    country: Optional[str] = None,
):
    """Process a Bitrix24 webhook payload asynchronously.

    State machine
    -------------
    1. Fetch raw payload from MongoDB.
    2. ``get_or_create`` the PostgreSQL ``WebhookEvent`` tracking record.
    3. **Early exit** if status is already ``PROCESSED`` or ``IGNORED``
       (double-processing protection).
    4. Mark status ``PROCESSING``.
    5. Execute business logic (country-specific handler).
    6. Mark status ``PROCESSED`` (or ``IGNORED``).

    Error handling
    --------------
    * **Permanent** errors (``ValidationError``, ``KeyError``,
      ``ValueError``, ``TypeError``) → status ``FAILED``, no retry.
    * **Transient** errors (``OperationalError``, ``ConnectionError``)
      → re-raised so Celery ``autoretry_for`` kicks in.

    Audit
    -----
    Every state transition is logged via structured ``AUDIT`` records
    (SOC2 CC7.2, ISO 27001 A.12.4).

    Args:
        mongo_doc_id: MongoDB ``_id`` (string) of the raw payload.
        country: Country code for GDPR Article 44 routing.
    """
    from bson import ObjectId

    from .models import WebhookEvent
    from apps.core.mongodb import WebhookPayloadCollection

    # -- Initialise variables used in the except block --
    idempotency_key: str = ""
    pg_event: Optional[WebhookEvent] = None

    # =================================================================
    # Step 1 — Fetch raw payload from MongoDB
    # =================================================================
    raw_doc = WebhookPayloadCollection.find_one(
        {"_id": ObjectId(mongo_doc_id)},
    )
    if raw_doc is None:
        _audit_log(
            "webhook_document_not_found",
            entity_id=mongo_doc_id,
            level=logging.WARNING,
        )
        logger.warning(
            "MongoDB document not found: %s", mongo_doc_id,
        )
        return

    payload: dict = raw_doc.get("raw_payload", {})
    event_type: str = raw_doc.get("event_type", "unknown")
    idempotency_key = raw_doc.get("idempotency_key", "")
    tenant_id: str = str(raw_doc.get("tenant_id", ""))

    _audit_log(
        "webhook_processing_started",
        event_type=event_type,
        entity_id=mongo_doc_id,
        tenant_id=tenant_id,
    )

    # =================================================================
    # Step 2 — Get or create PostgreSQL tracking record
    # =================================================================
    pg_event, _created = WebhookEvent.objects.get_or_create(
        idempotency_key=idempotency_key,
        defaults={
            "source": "bitrix24",
            "event_type": event_type,
            "payload": payload,
        },
    )

    # =================================================================
    # Step 3 — Early exit: double-processing protection
    # =================================================================
    if pg_event.status in (
        WebhookEvent.STATUS_PROCESSED,
        WebhookEvent.STATUS_IGNORED,
    ):
        _audit_log(
            "webhook_skipped_already_processed",
            event_type=event_type,
            entity_id=mongo_doc_id,
            tenant_id=tenant_id,
            details={"current_status": pg_event.status},
        )
        logger.info(
            "Webhook already %s (key=%s) — skipping.",
            pg_event.status, idempotency_key,
        )
        return

    # =================================================================
    # Step 4 — Mark PROCESSING
    # =================================================================
    pg_event.status = WebhookEvent.STATUS_PROCESSING
    pg_event.save(update_fields=["status", "updated_at"])

    try:
        # =============================================================
        # Step 5 — Execute business logic
        # =============================================================
        _execute_business_logic(
            pg_event=pg_event,
            payload=payload,
            event_type=event_type,
            country=country,
        )

        # =============================================================
        # Step 6 — Mark PROCESSED
        # =============================================================
        pg_event.processed_at = timezone.now()
        pg_event.save(
            update_fields=["status", "processed_at", "updated_at"],
        )

        _audit_log(
            "webhook_processed",
            event_type=event_type,
            entity_id=mongo_doc_id,
            tenant_id=tenant_id,
            details={"final_status": pg_event.status},
        )
        logger.info(
            "Bitrix24 webhook processed: %s → %s",
            event_type, pg_event.status,
        )

    except _PERMANENT_ERRORS as exc:
        # -----------------------------------------------------------
        # Permanent data error — do NOT retry.
        # Marking FAILED and returning (swallowing the exception)
        # prevents Celery from re-raising it.
        # -----------------------------------------------------------
        pg_event.status = WebhookEvent.STATUS_FAILED
        pg_event.error = f"{type(exc).__name__}: {exc}"
        pg_event.processed_at = timezone.now()
        pg_event.save(
            update_fields=["status", "error", "processed_at", "updated_at"],
        )

        _audit_log(
            "webhook_processing_failed_permanent",
            event_type=event_type,
            entity_id=mongo_doc_id,
            tenant_id=tenant_id,
            details={"error_type": type(exc).__name__},
            level=logging.ERROR,
        )
        logger.error(
            "Permanent error processing webhook %s: %s: %s",
            mongo_doc_id, type(exc).__name__, exc,
        )
        # Do NOT re-raise — Celery sees a clean return → no retry.
        return

    except Exception as exc:
        # -----------------------------------------------------------
        # Unknown / catch-all — best-effort PG update, then re-raise
        # so Celery retries (fail-safe: better to retry than drop).
        # -----------------------------------------------------------
        try:
            pg_event.status = WebhookEvent.STATUS_FAILED
            pg_event.error = f"{type(exc).__name__}: {exc}"
            pg_event.save(
                update_fields=["status", "error", "updated_at"],
            )
        except Exception:
            pass  # Best effort only.

        _audit_log(
            "webhook_processing_failed_transient",
            event_type=event_type,
            entity_id=mongo_doc_id,
            tenant_id=tenant_id,
            details={"error_type": type(exc).__name__},
            level=logging.ERROR,
        )
        logger.error(
            "Transient error processing webhook %s: %s",
            mongo_doc_id, exc,
        )
        raise  # Re-raise → autoretry_for triggers retry.


def _execute_business_logic(
    *,
    pg_event: Any,
    payload: dict,
    event_type: str,
    country: Optional[str],
) -> None:
    """Execute Bitrix24 webhook business logic with strict validation.

    This function implements the core data mapping pipeline:

    1. **Tenant Resolution** — strict ``auth.member_id`` matching only.
    2. **Field Validation** — reject unknown fields (data leakage prevention).
    3. **Entity Routing** — dispatch to Contact or Lead handler.
    4. **Idempotent Upsert** — ``update_or_create`` with compound unique key.
    5. **PII Masking** — sensitive fields masked in audit logs.
    6. **Consent Handling** — GDPR Art. 7 consent tracking.

    Args:
        pg_event: The ``WebhookEvent`` PostgreSQL tracking record.
        payload: Raw Bitrix24 webhook payload dict.
        event_type: Bitrix24 event name (e.g., ``ONCRMCONTACTADD``).
        country: Country code for GDPR Article 44 routing.

    Raises:
        ValidationError: Unknown fields, missing tenant, or invalid data.
        KeyError: Required fields missing from payload.
    """
    from .models import WebhookEvent
    from .bitrix24_mappings import (
        EVENT_ENTITY_MAP,
        EVENT_OPERATION_MAP,
        validate_fields,
        ALLOWED_CONTACT_FIELDS,
        ALLOWED_LEAD_FIELDS,
        mask_pii,
    )

    # =================================================================
    # Extract auth and fields
    # =================================================================
    auth: dict = payload.get("auth", {})
    fields: dict = payload.get("data", {}).get("FIELDS", {})

    if not fields:
        raise KeyError("Missing 'data.FIELDS' in Bitrix24 payload")

    # =================================================================
    # Step 1 — Strict Tenant Resolution (member_id only)
    # =================================================================
    organization = _resolve_tenant(auth)

    # =================================================================
    # Step 2 — Determine entity type and operation
    # =================================================================
    entity_type = EVENT_ENTITY_MAP.get(event_type)
    operation = EVENT_OPERATION_MAP.get(event_type, "unknown")

    if entity_type is None:
        _audit_log(
            "webhook_entity_type_unknown",
            event_type=event_type,
            entity_id=fields.get("ID", ""),
            tenant_id=str(organization.id),
            details={"event_type": event_type},
            level=logging.WARNING,
        )
        pg_event.status = WebhookEvent.STATUS_IGNORED
        return

    # =================================================================
    # Step 3 — Route to entity-specific handler
    # =================================================================
    if entity_type == "contact":
        validate_fields(fields, ALLOWED_CONTACT_FIELDS, entity_type="contact")
        contact = _sync_contact(
            fields=fields,
            organization=organization,
            operation=operation,
        )
        _audit_log(
            f"contact_{operation}d",
            event_type=event_type,
            entity_id=str(contact.id),
            tenant_id=str(organization.id),
            details={
                "bitrix24_id": contact.bitrix24_id,
                "email_masked": mask_pii(contact.email, "email"),
                "phone_masked": mask_pii(contact.phone, "phone"),
                "consent_status": contact.consent_status,
            },
        )

    elif entity_type == "lead":
        validate_fields(fields, ALLOWED_LEAD_FIELDS, entity_type="lead")
        lead = _sync_lead(
            fields=fields,
            organization=organization,
            operation=operation,
        )
        _audit_log(
            f"lead_{operation}d",
            event_type=event_type,
            entity_id=str(lead.id),
            tenant_id=str(organization.id),
            details={
                "bitrix24_id": lead.bitrix24_id,
                "title": lead.title,
                "lead_status": lead.lead_status,
                "email_masked": mask_pii(lead.email, "email"),
                "phone_masked": mask_pii(lead.phone, "phone"),
            },
        )

    else:
        # Deal and other entities — mark as ignored for now
        _audit_log(
            "webhook_entity_ignored",
            event_type=event_type,
            entity_id=fields.get("ID", ""),
            tenant_id=str(organization.id),
            details={"entity_type": entity_type},
        )
        pg_event.status = WebhookEvent.STATUS_IGNORED
        pg_event.save(update_fields=["status", "updated_at"])
        return

    # Mark as processed (success)
    pg_event.status = WebhookEvent.STATUS_PROCESSED
    pg_event.save(update_fields=["status", "updated_at"])


def _resolve_tenant(auth: dict) -> "Organization":
    """Resolve Organization from Bitrix24 ``auth.member_id``.

    **STRICT MATCHING ONLY** — no domain substring fallback.
    This prevents cross-tenant attacks (e.g., "vilnius.bitrix24.com"
    matching "new-vilnius.bitrix24.com").

    Args:
        auth: The Bitrix24 ``auth`` dict from webhook payload.

    Returns:
        The matching ``Organization`` instance.

    Raises:
        ValidationError: If ``member_id`` is missing or unknown.
    """
    from apps.organizations.models import Organization

    member_id = auth.get("member_id", "")

    if not member_id:
        raise ValidationError(
            "Unknown tenant: invalid or missing member_id in auth payload"
        )

    try:
        return Organization.objects.get(bitrix24_portal_id=member_id)
    except Organization.DoesNotExist:
        raise ValidationError(
            f"Unknown tenant: no Organization with bitrix24_portal_id={member_id!r}"
        )


def _sync_contact(
    *,
    fields: dict,
    organization: "Organization",
    operation: str,
) -> "Contact":
    """Synchronize a Bitrix24 Contact to PostgreSQL.

    Uses ``update_or_create`` with compound unique key
    ``(organization, bitrix24_id)`` for idempotent upserts.

    Args:
        fields: Bitrix24 ``FIELDS`` dict.
        organization: Target ``Organization`` (tenant).
        operation: One of ``"create"``, ``"update"``, ``"delete"``.

    Returns:
        The created or updated ``Contact`` instance.

    Raises:
        KeyError: If ``ID`` field is missing.
    """
    from apps.crm.models import Contact, ConsentStatus
    from django.utils import timezone as django_tz
    from .bitrix24_mappings import (
        CONTACT_FIELD_MAP,
        CONTACT_CUSTOM_FIELD_MAP,
        extract_email,
        extract_phone,
        parse_bitrix24_date,
        detect_consent_from_fields,
    )

    bitrix24_id = str(fields.get("ID", ""))
    if not bitrix24_id:
        raise KeyError("Missing required field: ID")

    # Build field kwargs from explicit mappings
    contact_defaults: dict[str, Any] = {
        "bitrix24_id": bitrix24_id,
        "bitrix24_synced_at": django_tz.now(),
        "bitrix24_sync_status": "synced",
    }

    # Map standard fields
    for b24_key, django_attr in CONTACT_FIELD_MAP.items():
        if b24_key in fields:
            value = fields[b24_key]
            # Date transformation
            if django_attr == "date_of_birth":
                value = parse_bitrix24_date(value)
            contact_defaults[django_attr] = value

    # Map custom UF_* fields
    for b24_key, django_attr in CONTACT_CUSTOM_FIELD_MAP.items():
        if b24_key in fields:
            contact_defaults[django_attr] = fields[b24_key]

    # Extract multi-value fields (EMAIL, PHONE)
    email = extract_email(fields)
    phone = extract_phone(fields)
    if email:
        contact_defaults["email"] = email
    if phone:
        contact_defaults["phone"] = phone

    # Consent detection (GDPR Art. 7)
    consent_granted, consent_version = detect_consent_from_fields(fields)
    if consent_granted:
        contact_defaults["consent_status"] = ConsentStatus.GRANTED
        contact_defaults["consent_version"] = consent_version or "1.0"
        contact_defaults["consent_granted_at"] = django_tz.now()
    else:
        contact_defaults["consent_status"] = ConsentStatus.PENDING

    # Idempotent upsert
    contact, created = Contact.objects.update_or_create(
        organization=organization,
        bitrix24_id=bitrix24_id,
        defaults=contact_defaults,
    )

    logger.info(
        "Contact %s: id=%s, bitrix24_id=%s, org=%s",
        "created" if created else "updated",
        contact.id,
        bitrix24_id,
        organization.id,
    )
    return contact


def _sync_lead(
    *,
    fields: dict,
    organization: "Organization",
    operation: str,
) -> "Lead":
    """Synchronize a Bitrix24 Lead to PostgreSQL.

    Uses ``update_or_create`` with compound unique key
    ``(organization, bitrix24_id)`` for idempotent upserts.

    Args:
        fields: Bitrix24 ``FIELDS`` dict.
        organization: Target ``Organization`` (tenant).
        operation: One of ``"create"``, ``"update"``, ``"delete"``.

    Returns:
        The created or updated ``Lead`` instance.

    Raises:
        KeyError: If ``ID`` field is missing.
    """
    from apps.crm.models import Lead, ConsentStatus
    from django.utils import timezone as django_tz
    from .bitrix24_mappings import (
        LEAD_FIELD_MAP,
        parse_decimal,
        map_source_id,
    )

    bitrix24_id = str(fields.get("ID", ""))
    if not bitrix24_id:
        raise KeyError("Missing required field: ID")

    # Build field kwargs from explicit mappings
    lead_defaults: dict[str, Any] = {
        "bitrix24_id": bitrix24_id,
        "bitrix24_synced_at": django_tz.now(),
        "bitrix24_sync_status": "synced",
        "consent_status": ConsentStatus.NOT_REQUIRED,  # Leads are pre-consent
    }

    # Map fields with type transformations
    for b24_key, django_attr in LEAD_FIELD_MAP.items():
        if b24_key not in fields:
            continue
        value = fields[b24_key]

        # Decimal transformation for OPPORTUNITY
        if django_attr == "estimated_value":
            value = parse_decimal(value)
        # Source mapping
        elif django_attr == "source":
            value = map_source_id(value)
        # STATUS normalization (Bitrix24 uses STATUS_ID or STATUS)
        elif django_attr == "lead_status":
            value = str(value).upper() or "NEW"

        lead_defaults[django_attr] = value

    # Handle STATUS_ID alias
    if "STATUS_ID" in fields and "lead_status" not in lead_defaults:
        lead_defaults["lead_status"] = str(fields["STATUS_ID"]).upper() or "NEW"

    # Extract multi-value fields (EMAIL, PHONE)
    from .bitrix24_mappings import extract_email, extract_phone
    email = extract_email(fields)
    phone = extract_phone(fields)
    if email:
        lead_defaults["email"] = email
    if phone:
        lead_defaults["phone"] = phone

    # Idempotent upsert
    lead, created = Lead.objects.update_or_create(
        organization=organization,
        bitrix24_id=bitrix24_id,
        defaults=lead_defaults,
    )

    logger.info(
        "Lead %s: id=%s, bitrix24_id=%s, org=%s",
        "created" if created else "updated",
        lead.id,
        bitrix24_id,
        organization.id,
    )
    return lead


@shared_task(name='apps.integrations.tasks.process_bitrix24_retry_queue')
def process_bitrix24_retry_queue():
    """
    Process failed Bitrix24 webhooks that are pending retry.
    Called periodically by Celery beat.
    """
    from .models import WebhookEvent
    from datetime import timedelta

    retry_cutoff = timezone.now() - timedelta(hours=24)
    failed_events = WebhookEvent.objects.filter(
        source='bitrix24',
        status=WebhookEvent.STATUS_FAILED,
        created_at__gte=retry_cutoff,
    )[:100]

    for event in failed_events:
        process_bitrix24_webhook.delay(
            str(event.id),
            country=event.payload.get('country'),
        )

    logger.info(f"Queued {len(failed_events)} Bitrix24 webhooks for retry")
    return {"retried": len(failed_events)}
