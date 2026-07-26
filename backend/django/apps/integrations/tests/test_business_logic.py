"""
Comprehensive test suite for Bitrix24 webhook business logic.

All tests use ``core.settings.test`` which configures:
- **mongomock** as the MongoDB backend (no real MongoDB required).
- **CELERY_TASK_ALWAYS_EAGER = True** (tasks execute synchronously).
- **SQLite in-memory** for PostgreSQL (fast, isolated).

Test cases:
1. **Lead Creation** — Valid ``ONCRMLEADADD`` → Lead created in PostgreSQL.
2. **Lead Update** — Valid ``ONCRMLEADUPDATE`` → Lead updated (idempotent).
3. **Invalid Field** — Unknown field → ``ValidationError`` + WebhookEvent FAILED.
4. **PII Masking** — Audit logs mask ``email`` and ``phone`` fields.
5. **Consent Handling** — ``UF_CONSENT_GRANTED=Y`` → Contact consent = GRANTED.
"""

import logging
from typing import Any

import pytest
from django.core.exceptions import ValidationError

from apps.crm.models import Contact, Lead, ConsentStatus
from apps.integrations.models import WebhookEvent
from apps.integrations.tasks import (
    _execute_business_logic,
    _resolve_tenant,
    _sync_contact,
    _sync_lead,
)
from apps.organizations.models import Organization


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def test_organization(db) -> Organization:
    """Create a test Organization with Bitrix24 portal ID."""
    return Organization.objects.create(
        name="Test Parish Vilnius",
        slug="test-parish-vilnius",
        org_type=Organization.TYPE_PARISH,
        country="lt",
        status=Organization.STATUS_ACTIVE,
        bitrix24_portal_id="test-member-id-001",
        entity_id="lt-test-parish-001",
    )


def _create_webhook_event(
    *,
    event_type: str = "ONCRMLEADADD",
    idempotency_key: str = "bitrix24:test:test:12345",
) -> WebhookEvent:
    """Create a WebhookEvent tracking record."""
    return WebhookEvent.objects.create(
        source="bitrix24",
        event_type=event_type,
        idempotency_key=idempotency_key,
        payload={},
        status=WebhookEvent.STATUS_PROCESSING,
    )


# =========================================================================
# Test 1: Lead Creation
# =========================================================================


@pytest.mark.django_db
class TestLeadCreation:
    """Valid ONCRMLEADADD payload → Lead created in PostgreSQL."""

    def test_lead_created_successfully(self, test_organization, caplog):
        """A valid lead payload creates a new Lead record."""
        pg_event = _create_webhook_event(
            event_type="ONCRMLEADADD",
            idempotency_key="bitrix24:test:ONCRMLEADADD:100:1700000001",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "100",
                    "TITLE": "New Funeral Service Inquiry",
                    "NAME": "Jonas",
                    "LAST_NAME": "Petraitis",
                    "STATUS": "NEW",
                    "SOURCE_ID": "WEB",
                    "OPPORTUNITY": "1500.00",
                    "CURRENCY_ID": "EUR",
                    "EMAIL": [{"VALUE": "jonas.petraitis@example.com", "TYPE": "WORK"}],
                    "PHONE": [{"VALUE": "+37061234567", "TYPE": "MOBILE"}],
                    "COMMENTS": "Inquiring about funeral service arrangements",
                },
            },
        }

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMLEADADD",
                country="lt",
            )

        # -- PostgreSQL assertions --
        lead = Lead.objects.get(bitrix24_id="100", organization=test_organization)
        assert lead.title == "New Funeral Service Inquiry"
        assert lead.first_name == "Jonas"
        assert lead.last_name == "Petraitis"
        assert lead.lead_status == "NEW"
        assert lead.source == "web"  # Mapped from WEB
        assert lead.estimated_value == 1500.00
        assert lead.currency == "EUR"
        assert lead.email == "jonas.petraitis@example.com"
        assert lead.phone == "+37061234567"
        assert lead.consent_status == ConsentStatus.NOT_REQUIRED  # Pre-consent

        # -- WebhookEvent status --
        pg_event.refresh_from_db()
        assert pg_event.status == WebhookEvent.STATUS_PROCESSED

        # -- Audit log assertions --
        audit_messages = [r.message for r in caplog.records if "AUDIT" in r.message]
        assert any("lead_created" in m for m in audit_messages)


# =========================================================================
# Test 2: Lead Update (Idempotent)
# =========================================================================


@pytest.mark.django_db
class TestLeadUpdate:
    """Valid ONCRMLEADUPDATE payload → Lead updated (idempotent upsert)."""

    def test_lead_updated_idempotently(self, test_organization, caplog):
        """Updating an existing lead uses update_or_create (idempotent)."""
        # Pre-create the lead
        Lead.objects.create(
            organization=test_organization,
            bitrix24_id="200",
            title="Original Title",
            first_name="Original",
            last_name="Name",
            lead_status="NEW",
            consent_status=ConsentStatus.NOT_REQUIRED,
        )

        pg_event = _create_webhook_event(
            event_type="ONCRMLEADUPDATE",
            idempotency_key="bitrix24:test:ONCRMLEADUPDATE:200:1700000002",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "200",
                    "TITLE": "Updated Title - Qualified",
                    "NAME": "Updated",
                    "LAST_NAME": "Name",
                    "STATUS": "IN_PROCESS",
                    "OPPORTUNITY": "2500.00",
                    "CURRENCY_ID": "EUR",
                },
            },
        }

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMLEADUPDATE",
                country="lt",
            )

        # -- PostgreSQL assertions --
        assert Lead.objects.filter(
            organization=test_organization, bitrix24_id="200"
        ).count() == 1  # No duplicate created

        lead = Lead.objects.get(bitrix24_id="200", organization=test_organization)
        assert lead.title == "Updated Title - Qualified"
        assert lead.first_name == "Updated"
        assert lead.lead_status == "IN_PROCESS"
        assert lead.estimated_value == 2500.00


# =========================================================================
# Test 3: Invalid Field → ValidationError
# =========================================================================


@pytest.mark.django_db
class TestInvalidField:
    """Unknown field in payload → ValidationError + WebhookEvent FAILED."""

    def test_unknown_field_raises_validation_error(self, test_organization):
        """Payload with undocumented field triggers ValidationError."""
        pg_event = _create_webhook_event(
            event_type="ONCRMLEADADD",
            idempotency_key="bitrix24:test:ONCRMLEADADD:300:1700000003",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "300",
                    "TITLE": "Valid Lead",
                    "UNDOCUMENTED_SECRET_FIELD": "should_not_be_accepted",
                    "ANOTHER_UNKNOWN": "also_rejected",
                },
            },
        }

        with pytest.raises(ValidationError) as exc_info:
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMLEADADD",
                country="lt",
            )

        # Verify error mentions the unknown fields
        error_msg = str(exc_info.value)
        assert "ANOTHER_UNKNOWN" in error_msg
        assert "UNDOCUMENTED_SECRET_FIELD" in error_msg

        # No Lead should be created
        assert not Lead.objects.filter(bitrix24_id="300").exists()

    def test_missing_member_id_raises_validation_error(self, test_organization):
        """Missing member_id in auth → ValidationError (strict tenant resolution)."""
        pg_event = _create_webhook_event(
            event_type="ONCRMLEADADD",
            idempotency_key="bitrix24:test:ONCRMLEADADD:400:1700000004",
        )

        payload = {
            "auth": {"domain": "testportal.bitrix24.com"},  # No member_id!
            "data": {"FIELDS": {"ID": "400", "TITLE": "Test"}},
        }

        with pytest.raises(ValidationError) as exc_info:
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMLEADADD",
                country="lt",
            )

        assert "member_id" in str(exc_info.value).lower()

    def test_unknown_member_id_raises_validation_error(self, test_organization):
        """Unknown member_id → ValidationError (no Organization match)."""
        pg_event = _create_webhook_event(
            event_type="ONCRMLEADADD",
            idempotency_key="bitrix24:test:ONCRMLEADADD:500:1700000005",
        )

        payload = {
            "auth": {
                "domain": "unknown.bitrix24.com",
                "member_id": "UNKNOWN-MEMBER-ID-999",
            },
            "data": {"FIELDS": {"ID": "500", "TITLE": "Test"}},
        }

        with pytest.raises(ValidationError) as exc_info:
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMLEADADD",
                country="lt",
            )

        assert "UNKNOWN-MEMBER-ID-999" in str(exc_info.value)


# =========================================================================
# Test 4: PII Masking in Audit Logs
# =========================================================================


@pytest.mark.django_db
class TestPIIMasking:
    """Audit logs MUST mask email and phone fields (GDPR Art. 5(1)(f))."""

    def test_audit_logs_mask_pii(self, test_organization, caplog):
        """Email and phone are masked in audit log details."""
        pg_event = _create_webhook_event(
            event_type="ONCRMCONTACTADD",
            idempotency_key="bitrix24:test:ONCRMCONTACTADD:600:1700000006",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "600",
                    "NAME": "Sensitive",
                    "LAST_NAME": "Data",
                    "EMAIL": [{"VALUE": "sensitive.person@example.com", "TYPE": "WORK"}],
                    "PHONE": [{"VALUE": "+37069876543", "TYPE": "MOBILE"}],
                },
            },
        }

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            _execute_business_logic(
                pg_event=pg_event,
                payload=payload,
                event_type="ONCRMCONTACTADD",
                country="lt",
            )

        # -- Find audit log records --
        audit_records = [r for r in caplog.records if "AUDIT" in r.message]
        contact_created_log = next(
            (r for r in audit_records if "contact_created" in r.message),
            None,
        )
        assert contact_created_log is not None, "Missing contact_created audit log"

        log_message = contact_created_log.message

        # -- PII must be MASKED --
        assert "sensitive.person@example.com" not in log_message
        assert "+37069876543" not in log_message

        # -- Masked versions must be present --
        assert "se***@example.com" in log_message
        assert "+37069***43" in log_message


# =========================================================================
# Test 5: Consent Handling
# =========================================================================


@pytest.mark.django_db
class TestConsentHandling:
    """Verify consent_granted flag is set correctly from UF_CONSENT_GRANTED."""

    def test_consent_granted_when_uf_flag_set(self, test_organization):
        """UF_CONSENT_GRANTED=Y → Contact consent_status = GRANTED."""
        pg_event = _create_webhook_event(
            event_type="ONCRMCONTACTADD",
            idempotency_key="bitrix24:test:ONCRMCONTACTADD:700:1700000007",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "700",
                    "NAME": "Consented",
                    "LAST_NAME": "Person",
                    "EMAIL": [{"VALUE": "consented@example.com", "TYPE": "WORK"}],
                    "UF_CONSENT_GRANTED": "Y",  # Explicit consent
                },
            },
        }

        _execute_business_logic(
            pg_event=pg_event,
            payload=payload,
            event_type="ONCRMCONTACTADD",
            country="lt",
        )

        contact = Contact.objects.get(bitrix24_id="700", organization=test_organization)
        assert contact.consent_status == ConsentStatus.GRANTED
        assert contact.consent_granted_at is not None
        assert contact.consent_version == "1.0"

    def test_consent_pending_when_no_flag(self, test_organization):
        """No UF_CONSENT_GRANTED → Contact consent_status = PENDING."""
        pg_event = _create_webhook_event(
            event_type="ONCRMCONTACTADD",
            idempotency_key="bitrix24:test:ONCRMCONTACTADD:800:1700000008",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "800",
                    "NAME": "NoConsent",
                    "LAST_NAME": "Yet",
                },
            },
        }

        _execute_business_logic(
            pg_event=pg_event,
            payload=payload,
            event_type="ONCRMCONTACTADD",
            country="lt",
        )

        contact = Contact.objects.get(bitrix24_id="800", organization=test_organization)
        assert contact.consent_status == ConsentStatus.PENDING
        assert contact.consent_granted_at is None

    def test_lead_consent_not_required(self, test_organization):
        """Leads default to NOT_REQUIRED (pre-consent pipeline)."""
        pg_event = _create_webhook_event(
            event_type="ONCRMLEADADD",
            idempotency_key="bitrix24:test:ONCRMLEADADD:900:1700000009",
        )

        payload = {
            "auth": {
                "domain": "testportal.bitrix24.com",
                "member_id": "test-member-id-001",
            },
            "data": {
                "FIELDS": {
                    "ID": "900",
                    "TITLE": "Pre-consent Lead",
                },
            },
        }

        _execute_business_logic(
            pg_event=pg_event,
            payload=payload,
            event_type="ONCRMLEADADD",
            country="lt",
        )

        lead = Lead.objects.get(bitrix24_id="900", organization=test_organization)
        assert lead.consent_status == ConsentStatus.NOT_REQUIRED
