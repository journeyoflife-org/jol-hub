"""
Comprehensive test suite for the ``process_bitrix24_webhook`` Celery task.

All tests use ``core.settings.test`` which configures:
- **mongomock** as the MongoDB backend (no real MongoDB required).
- **CELERY_TASK_ALWAYS_EAGER = True** (tasks execute synchronously).
- **SQLite in-memory** for PostgreSQL (fast, isolated).

Test cases:
1. **Success path** — MongoDB fetch → business logic → PROCESSED + audit log.
2. **Early exit** — Already-processed event → returns without re-processing.
3. **Transient DB error** — OperationalError → Celery retry triggered.
4. **Permanent data error** — KeyError → FAILED, no retry.
"""

import logging
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from bson import ObjectId
from celery.exceptions import Retry
from django.db import OperationalError

from apps.core.mongodb import WebhookPayloadCollection
from apps.integrations.models import WebhookEvent
from apps.integrations.tasks import process_bitrix24_webhook
from apps.organizations.models import Organization


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def test_organization(db) -> Organization:
    """Create a test Organization matching the member_id in test payloads."""
    return Organization.objects.create(
        name="Test Parish",
        slug="test-parish",
        org_type=Organization.TYPE_PARISH,
        country="lt",
        status=Organization.STATUS_ACTIVE,
        bitrix24_portal_id="test-member-001",  # Must match _insert_mongo_doc auth.member_id
        entity_id="lt-test-parish-001",
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _insert_mongo_doc(
    *,
    event_type: str = "ONCRMLEADADD",
    idempotency_key: str = "bitrix24:test.test:ONCRMLEADADD:42:1700000000",
    raw_payload: dict[str, Any] | None = None,
    tenant_id: str = "test-tenant-001",
) -> str:
    """Insert a document into mongomock and return its ``_id`` as string.

    Args:
        event_type: The Bitrix24 event name.
        idempotency_key: Unique key for idempotency.
        raw_payload: The webhook payload dict.
        tenant_id: Tenant identifier.

    Returns:
        The MongoDB ``_id`` as a string.
    """
    if raw_payload is None:
        raw_payload = {
            "event": event_type,
            "ts": "1700000000",
            "auth": {
                "domain": "test.bitrix24.com",
                "member_id": "test-member-001",
                "application_token": "test-token",
            },
            "data": {
                "FIELDS": {
                    "ID": "42",
                    "TITLE": "Test Lead",
                },
            },
        }

    doc_id = WebhookPayloadCollection.insert_one(
        {
            "source": "bitrix24",
            "event_type": event_type,
            "idempotency_key": idempotency_key,
            "country": "lt",
            "raw_payload": raw_payload,
            "tenant_id": tenant_id,
        },
    )
    return str(doc_id)


# =========================================================================
# Test 1: Success Path
# =========================================================================


@pytest.mark.django_db
class TestProcessBitrix24WebhookSuccess:
    """Valid payload → MongoDB fetch → business logic → PROCESSED + audit."""

    def test_success_transitions_to_processed(
        self, caplog, test_organization,
    ):
        """Full success: PG event reaches PROCESSED, audit log emitted."""
        mongo_doc_id = _insert_mongo_doc()

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            process_bitrix24_webhook(mongo_doc_id, country="lt")

        # -- PostgreSQL assertions --
        pg_event = WebhookEvent.objects.get(
            idempotency_key="bitrix24:test.test:ONCRMLEADADD:42:1700000000",
        )
        assert pg_event.status == WebhookEvent.STATUS_PROCESSED
        assert pg_event.processed_at is not None
        assert pg_event.error == ""

        # -- Audit log assertions --
        audit_messages = [
            r.message for r in caplog.records
            if "AUDIT" in r.message
        ]
        assert any(
            "webhook_processing_started" in m for m in audit_messages
        ), "Missing 'webhook_processing_started' audit entry."
        assert any(
            "webhook_processed" in m for m in audit_messages
        ), "Missing 'webhook_processed' audit entry."

        # Verify audit contains required fields.
        started_log = next(
            r for r in caplog.records
            if "webhook_processing_started" in r.message
        )
        assert "system:celery:process_bitrix24_webhook" in started_log.message
        assert "webhook_event" in started_log.message
        assert "test-tenant-001" in started_log.message


# =========================================================================
# Test 2: Idempotency / Early Exit
# =========================================================================


@pytest.mark.django_db
class TestProcessBitrix24WebhookEarlyExit:
    """Already-processed event → task returns early without re-processing."""

    def test_already_processed_returns_early(
        self, caplog,
    ):
        """If WebhookEvent is already PROCESSED, task exits immediately."""
        idempotency_key = "bitrix24:test.test:ONCRMDEALUPDATE:99:1700000099"
        mongo_doc_id = _insert_mongo_doc(
            event_type="ONCRMDEALUPDATE",
            idempotency_key=idempotency_key,
        )

        # Pre-create PG event as already PROCESSED.
        WebhookEvent.objects.create(
            source="bitrix24",
            event_type="ONCRMDEALUPDATE",
            idempotency_key=idempotency_key,
            payload={"event": "ONCRMDEALUPDATE"},
            status=WebhookEvent.STATUS_PROCESSED,
        )

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            process_bitrix24_webhook(mongo_doc_id, country="lt")

        # -- Assertions --
        pg_event = WebhookEvent.objects.get(idempotency_key=idempotency_key)

        # Status must remain PROCESSED (not overwritten).
        assert pg_event.status == WebhookEvent.STATUS_PROCESSED

        # Audit log must contain the early-exit marker.
        audit_messages = [
            r.message for r in caplog.records
            if "AUDIT" in r.message
        ]
        assert any(
            "webhook_skipped_already_processed" in m for m in audit_messages
        ), "Missing 'webhook_skipped_already_processed' audit entry."

    def test_already_ignored_returns_early(self):
        """If WebhookEvent is already IGNORED, task exits immediately."""
        idempotency_key = "bitrix24:test.test:ONCRMCONTACTADD:77:1700000077"
        mongo_doc_id = _insert_mongo_doc(
            event_type="ONCRMCONTACTADD",
            idempotency_key=idempotency_key,
        )

        WebhookEvent.objects.create(
            source="bitrix24",
            event_type="ONCRMCONTACTADD",
            idempotency_key=idempotency_key,
            payload={},
            status=WebhookEvent.STATUS_IGNORED,
        )

        process_bitrix24_webhook(mongo_doc_id, country="de")

        pg_event = WebhookEvent.objects.get(idempotency_key=idempotency_key)
        assert pg_event.status == WebhookEvent.STATUS_IGNORED


# =========================================================================
# Test 3: Transient DB Error → Celery Retry
# =========================================================================


@pytest.mark.django_db
class TestProcessBitrix24WebhookTransientError:
    """Transient OperationalError → Celery retry is triggered."""

    @patch(
        "apps.integrations.tasks._execute_business_logic",
        side_effect=OperationalError("connection refused"),
    )
    @patch(
        "apps.integrations.tasks.process_bitrix24_webhook.retry",
        side_effect=Retry("retrying", Exception()),
    )
    def test_operational_error_triggers_retry(
        self, mock_retry, mock_biz_logic, caplog,
    ):
        """OperationalError during business logic → retry is called."""
        mongo_doc_id = _insert_mongo_doc()

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            with pytest.raises(Retry):
                process_bitrix24_webhook(mongo_doc_id, country="lt")

        # -- Retry must have been called --
        mock_retry.assert_called_once()

        # -- PG event must be marked FAILED (best-effort) --
        pg_event = WebhookEvent.objects.get(
            idempotency_key="bitrix24:test.test:ONCRMLEADADD:42:1700000000",
        )
        assert pg_event.status == WebhookEvent.STATUS_FAILED

        # -- Audit log must capture the transient failure --
        audit_messages = [
            r.message for r in caplog.records
            if "AUDIT" in r.message
        ]
        assert any(
            "webhook_processing_failed_transient" in m
            for m in audit_messages
        ), "Missing 'webhook_processing_failed_transient' audit entry."


# =========================================================================
# Test 4: Permanent Data Error → No Retry
# =========================================================================


@pytest.mark.django_db
class TestProcessBitrix24WebhookPermanentError:
    """Permanent data error (KeyError) → FAILED, no retry."""

    @patch(
        "apps.integrations.tasks._execute_business_logic",
        side_effect=KeyError("required_field_MISSING"),
    )
    @patch(
        "apps.integrations.tasks.process_bitrix24_webhook.retry",
    )
    def test_key_error_marks_failed_no_retry(
        self, mock_retry, mock_biz_logic, caplog,
    ):
        """KeyError during business logic → FAILED, retry NOT called."""
        mongo_doc_id = _insert_mongo_doc()

        with caplog.at_level(logging.INFO, logger="apps.integrations.tasks"):
            process_bitrix24_webhook(mongo_doc_id, country="lt")

        # -- Retry must NOT have been called --
        mock_retry.assert_not_called()

        # -- PG event must be FAILED with error details --
        pg_event = WebhookEvent.objects.get(
            idempotency_key="bitrix24:test.test:ONCRMLEADADD:42:1700000000",
        )
        assert pg_event.status == WebhookEvent.STATUS_FAILED
        assert "KeyError" in pg_event.error
        assert pg_event.processed_at is not None

        # -- Audit log must capture the permanent failure --
        audit_messages = [
            r.message for r in caplog.records
            if "AUDIT" in r.message
        ]
        assert any(
            "webhook_processing_failed_permanent" in m
            for m in audit_messages
        ), "Missing 'webhook_processing_failed_permanent' audit entry."

    @patch(
        "apps.integrations.tasks._execute_business_logic",
        side_effect=ValueError("invalid data format"),
    )
    @patch(
        "apps.integrations.tasks.process_bitrix24_webhook.retry",
    )
    def test_value_error_marks_failed_no_retry(
        self, mock_retry, mock_biz_logic,
    ):
        """ValueError during business logic → FAILED, retry NOT called."""
        mongo_doc_id = _insert_mongo_doc()

        process_bitrix24_webhook(mongo_doc_id, country="lt")

        mock_retry.assert_not_called()

        pg_event = WebhookEvent.objects.get(
            idempotency_key="bitrix24:test.test:ONCRMLEADADD:42:1700000000",
        )
        assert pg_event.status == WebhookEvent.STATUS_FAILED
        assert "ValueError" in pg_event.error
