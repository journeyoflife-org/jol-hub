"""
Fail-closed tenant context validation.

Replaces the scattered try/except ImportError: pass pattern with a single
authoritative validator that DENIES on any anomaly (C3 fix).

Every model with an organization FK must call validate_tenant_context()
in its save() method.
"""
import logging
from typing import Optional

from django.core.exceptions import ValidationError, PermissionDenied

logger = logging.getLogger("jolhub.tenant_validation")


def validate_tenant_context(organization_id, model_name: str, entity_id: Optional[str] = None):
    """
    Validate that the given organization_id matches the current tenant context.

    Fail-closed semantics:
    - No tenant context AND organization_id set -> DENY (system ops should not set org)
    - Tenant context mismatch -> DENY + log security event
    - ImportError (middleware unavailable) -> DENY (fail-closed)
    - Any unexpected exception -> DENY (fail-closed)

    Returns silently on success.

    Args:
        organization_id: The organization UUID to validate
        model_name: Human-readable model name for audit (e.g. "Page")
        entity_id: Optional entity identifier for audit
    """
    if not organization_id:
        return  # No org set — system-level operation, allowed

    try:
        from apps.crm.middleware import get_current_tenant_id

        tenant_id = get_current_tenant_id()
    except ImportError:
        logger.error(
            "TENANT_VALIDATION_FAIL_CLOSED: middleware import fails — denying. "
            "model=%s org=%s",
            model_name, organization_id,
        )
        _emit_security_event("IMPORT_ERROR", model_name, organization_id)
        raise PermissionDenied(
            "Tenant context middleware unavailable — operation denied"
        )
    except Exception as exc:
        logger.error(
            "TENANT_VALIDATION_FAIL_CLOSED: unexpected error — denying. "
            "model=%s org=%s error=%s",
            model_name, organization_id, exc,
        )
        _emit_security_event("UNEXPECTED_ERROR", model_name, organization_id)
        raise PermissionDenied(
            "Tenant context validation failed — operation denied"
        )

    if not tenant_id:
        # No tenant context established — deny if org is set
        logger.error(
            "TENANT_VALIDATION_FAIL_CLOSED: no tenant context but org set — denying. "
            "model=%s org=%s",
            model_name, organization_id,
        )
        _emit_security_event("NO_CONTEXT", model_name, organization_id)
        raise PermissionDenied(
            "No tenant context established — operation denied"
        )

    if str(organization_id) != str(tenant_id):
        logger.error(
            "TENANT_VALIDATION_CROSS_TENANT: context=%s target=%s model=%s entity=%s",
            tenant_id, organization_id, model_name, entity_id,
        )
        _emit_security_event("CROSS_TENANT", model_name, organization_id, tenant_id)
        raise ValidationError(
            "Organization does not match current tenant context"
        )


def _emit_security_event(event_type: str, model_name: str, organization_id, expected_tenant=None):
    """Emit a security event for audit trail."""
    try:
        from apps.core.models import AuditLog

        AuditLog.objects.create(
            action="ACCESS",
            entity_type=model_name,
            entity_id=str(organization_id),
            organization_id=expected_tenant or organization_id,
            legal_basis="security_event",
            extra={
                "event_type": event_type,
                "model": model_name,
                "target_org": str(organization_id),
            },
        )
    except Exception:
        logger.error("Failed to write audit log for security event %s", event_type)
