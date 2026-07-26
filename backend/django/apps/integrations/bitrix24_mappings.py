"""
Centralized Bitrix24 → Django field mappings and transformation helpers.

This module enforces:
- **Explicit field mappings** (no dynamic ``setattr``).
- **Unknown field rejection** via ``ValidationError``.
- **PII masking** for audit logs (GDPR Art. 5(1)(f)).
- **Type-safe transformations** (dates, decimals, nested structures).

SOC2 CC7.2 — every transformation is deterministic and auditable.
GDPR Art. 5(1)(c) — data minimization: only mapped fields are persisted.
"""

import logging
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

from django.core.exceptions import ValidationError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Contact Field Mappings
# ---------------------------------------------------------------------------

#: Bitrix24 ``FIELDS`` → Django ``Contact`` model attributes.
CONTACT_FIELD_MAP: dict[str, str] = {
    "NAME": "first_name",
    "LAST_NAME": "last_name",
    "SECOND_NAME": "middle_name",
    "BIRTHDATE": "date_of_birth",
    "ADDRESS": "address_street",
    "ADDRESS_CITY": "address_city",
    "ADDRESS_POSTAL_CODE": "address_postal_code",
    "ADDRESS_COUNTRY": "address_country",
}

#: Bitrix24 ``UF_*`` custom fields → Django ``Contact`` model attributes.
CONTACT_CUSTOM_FIELD_MAP: dict[str, str] = {
    "UF_PARISHIONER_ID": "envelope_number",
    "UF_ENVELOPE_NUMBER": "envelope_number",
    "UF_PARISH_CODE": "parish_code",
    "UF_FAMILY_ID": "family_id",
}

#: Allowed Bitrix24 fields for Contact events (whitelist).
#: Any field NOT in this set triggers ``ValidationError``.
ALLOWED_CONTACT_FIELDS: frozenset[str] = frozenset(
    CONTACT_FIELD_MAP.keys()
    | CONTACT_CUSTOM_FIELD_MAP.keys()
    | {
        # Metadata fields (always present, not mapped to model)
        "ID",
        "DATE_CREATE",
        "DATE_MODIFY",
        "ASSIGNED_BY_ID",
        "CREATED_BY_ID",
        "OPENED",
        "TYPE_ID",
        "SOURCE_ID",
        "SOURCE_DESCRIPTION",
        "POST",
        "COMMENTS",
        "HONORIFIC",
        "SUFFIX",
        "PHOTO",
        "COMPANY_ID",
        "COMPANY_IDS",
        # Multi-value fields (extracted via helpers)
        "EMAIL",
        "PHONE",
        "WEB",
        "IM",
        # Consent flag (custom)
        "UF_CONSENT_GRANTED",
    }
)


# ---------------------------------------------------------------------------
# Lead Field Mappings
# ---------------------------------------------------------------------------

#: Bitrix24 ``FIELDS`` → Django ``Lead`` model attributes.
LEAD_FIELD_MAP: dict[str, str] = {
    "TITLE": "title",
    "NAME": "first_name",
    "LAST_NAME": "last_name",
    "STATUS": "lead_status",
    "SOURCE_ID": "source",
    "OPPORTUNITY": "estimated_value",
    "CURRENCY_ID": "currency",
    "COMMENTS": "comments",
}

#: Allowed Bitrix24 fields for Lead events (whitelist).
ALLOWED_LEAD_FIELDS: frozenset[str] = frozenset(
    LEAD_FIELD_MAP.keys()
    | {
        # Metadata fields
        "ID",
        "DATE_CREATE",
        "DATE_MODIFY",
        "ASSIGNED_BY_ID",
        "CREATED_BY_ID",
        "STATUS_ID",  # Alias for STATUS
        "STATUS_DESCRIPTION",
        "STATUS_SEMANTIC_ID",
        "SOURCE_DESCRIPTION",
        "CURRENCY_ID",
        "OPENED",
        "HONORIFIC",
        "SECOND_NAME",
        "BIRTHDATE",
        "POST",
        "ADDRESS",
        "ADDRESS_CITY",
        "ADDRESS_POSTAL_CODE",
        "ADDRESS_COUNTRY",
        "COMPANY_ID",
        "CONTACT_ID",
        # Multi-value fields
        "EMAIL",
        "PHONE",
        "WEB",
        "IM",
    }
)


# ---------------------------------------------------------------------------
# Event Type Routing
# ---------------------------------------------------------------------------

#: Bitrix24 event → entity type mapping.
EVENT_ENTITY_MAP: dict[str, str] = {
    "ONCRMCONTACTADD": "contact",
    "ONCRMCONTACTUPDATE": "contact",
    "ONCRMCONTACTDELETE": "contact",
    "ONCRMLEADADD": "lead",
    "ONCRMLEADUPDATE": "lead",
    "ONCRMLEADDELETE": "lead",
    "ONCRMDEALADD": "deal",
    "ONCRMDEALUPDATE": "deal",
    "ONCRMDEALDELETE": "deal",
}

#: Bitrix24 event → operation type.
EVENT_OPERATION_MAP: dict[str, str] = {
    "ONCRMCONTACTADD": "create",
    "ONCRMCONTACTUPDATE": "update",
    "ONCRMCONTACTDELETE": "delete",
    "ONCRMLEADADD": "create",
    "ONCRMLEADUPDATE": "update",
    "ONCRMLEADDELETE": "delete",
    "ONCRMDEALADD": "create",
    "ONCRMDEALUPDATE": "update",
    "ONCRMDEALDELETE": "delete",
}


# ---------------------------------------------------------------------------
# PII Masking (GDPR Art. 5(1)(f))
# ---------------------------------------------------------------------------

def mask_pii(value: str, field_type: str) -> str:
    """Mask PII for audit logs.

    Ensures sensitive data is NEVER logged in plaintext.

    Args:
        value: The raw PII value.
        field_type: One of ``"email"``, ``"phone"``, or ``"generic"``.

    Returns:
        Masked string safe for audit logs.

    Examples:
        >>> mask_pii("john.doe@example.com", "email")
        'jo***@example.com'
        >>> mask_pii("+37061234567", "phone")
        '+37061***67'
    """
    if not value:
        return "***"

    if field_type == "email":
        local, _, domain = value.partition("@")
        if not local:
            return "***@" + domain if domain else "***"
        masked_local = local[:2] + "***" if len(local) > 2 else local[0] + "***"
        return f"{masked_local}@{domain}" if domain else masked_local

    if field_type == "phone":
        if len(value) > 8:
            return f"{value[:6]}***{value[-2:]}"
        return "***"

    # Generic: show first 2 chars only
    return f"{value[:2]}***" if len(value) > 2 else "***"


# ---------------------------------------------------------------------------
# Field Transformation Helpers
# ---------------------------------------------------------------------------

def extract_email(fields: dict[str, Any]) -> str:
    """Extract primary email from Bitrix24 ``EMAIL`` field.

    Bitrix24 stores emails as a list of dicts: ``[{"VALUE": "...", "TYPE": "..."}]``.

    Args:
        fields: The Bitrix24 ``FIELDS`` dict.

    Returns:
        Primary email string, or empty string if not present.
    """
    email_data = fields.get("EMAIL")
    if not email_data:
        return ""
    if isinstance(email_data, list) and len(email_data) > 0:
        return str(email_data[0].get("VALUE", ""))
    if isinstance(email_data, str):
        return email_data
    return ""


def extract_phone(fields: dict[str, Any]) -> str:
    """Extract primary phone from Bitrix24 ``PHONE`` field.

    Bitrix24 stores phones as a list of dicts: ``[{"VALUE": "...", "TYPE": "..."}]``.

    Args:
        fields: The Bitrix24 ``FIELDS`` dict.

    Returns:
        Primary phone string, or empty string if not present.
    """
    phone_data = fields.get("PHONE")
    if not phone_data:
        return ""
    if isinstance(phone_data, list) and len(phone_data) > 0:
        return str(phone_data[0].get("VALUE", ""))
    if isinstance(phone_data, str):
        return phone_data
    return ""


def parse_bitrix24_date(value: Optional[str]) -> Optional[date]:
    """Parse a Bitrix24 date string to Python ``date``.

    Bitrix24 uses ISO 8601 format: ``"YYYY-MM-DD"`` or ``"YYYY-MM-DDTHH:MM:SS"``.

    Args:
        value: Date string from Bitrix24, or ``None``.

    Returns:
        Parsed ``date`` object, or ``None`` if unparseable.
    """
    if not value:
        return None
    try:
        # Try full ISO format first
        if "T" in value:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
        # Date-only format
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        logger.warning("Failed to parse Bitrix24 date: %r", value)
        return None


def parse_decimal(value: Any, default: Decimal = Decimal("0.00")) -> Decimal:
    """Safely parse a value to ``Decimal``.

    Args:
        value: Numeric value (string, int, float, or Decimal).
        default: Fallback value if parsing fails.

    Returns:
        Parsed ``Decimal``, or ``default`` on failure.
    """
    if value is None:
        return default
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        logger.warning("Failed to parse decimal: %r", value)
        return default


def map_source_id(source_id: Optional[str]) -> str:
    """Map Bitrix24 ``SOURCE_ID`` to Django ``Lead.LeadSource`` choice.

    Args:
        source_id: Bitrix24 source identifier (e.g., ``"WEB"``, ``"CALL"``).

    Returns:
        Django ``LeadSource`` choice value.
    """
    mapping = {
        "WEB": "web",
        "WEBSITE": "web",
        "CALL": "phone",
        "PHONE": "phone",
        "EMAIL": "email",
        "ADVERTISING": "web",
        "PARTNER": "referral",
        "RECOMMENDATION": "referral",
        "STORE": "other",
        "OTHER": "other",
    }
    return mapping.get(str(source_id or "").upper(), "bitrix24")


# ---------------------------------------------------------------------------
# Field Validation
# ---------------------------------------------------------------------------

def validate_fields(
    fields: dict[str, Any],
    allowed: frozenset[str],
    *,
    entity_type: str = "unknown",
) -> None:
    """Validate that all fields are in the allowed set.

    Raises:
        ValidationError: If unknown fields are present.

    Args:
        fields: The Bitrix24 ``FIELDS`` dict to validate.
        allowed: Frozenset of allowed field names.
        entity_type: Entity type for error message context.
    """
    unknown = set(fields.keys()) - allowed
    if unknown:
        raise ValidationError(
            f"Unknown Bitrix24 fields for {entity_type}: {sorted(unknown)}. "
            f"Rejecting to prevent data leakage from undocumented API changes."
        )


# ---------------------------------------------------------------------------
# Consent Detection
# ---------------------------------------------------------------------------

def detect_consent_from_fields(fields: dict[str, Any]) -> tuple[bool, str]:
    """Detect GDPR consent status from Bitrix24 custom fields.

    Checks for ``UF_CONSENT_GRANTED`` field:
    - ``"Y"`` or ``"1"`` → consent granted.
    - Otherwise → consent pending.

    Args:
        fields: The Bitrix24 ``FIELDS`` dict.

    Returns:
        Tuple of ``(consent_granted: bool, consent_version: str)``.
    """
    consent_value = str(fields.get("UF_CONSENT_GRANTED", "")).upper()
    if consent_value in ("Y", "1", "YES", "TRUE"):
        return True, "1.0"
    return False, ""
