"""
Audit signal handlers — emit AuditLog on content/user mutations.

F9 fix: connects post_save/post_delete signals to AuditLog.
"""

import logging

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

logger = logging.getLogger("jolhub.tenant.audit")


def _log_mutation(sender, instance, created, action_override=None, **kwargs):
    """Emit an AuditLog entry for a model mutation."""
    from apps.core.models import AuditLog
    from apps.crm.middleware import (get_current_tenant_context,
                                     get_current_tenant_id)

    tenant_id = get_current_tenant_id()
    context = get_current_tenant_context()

    action = action_override or ("CREATE" if created else "UPDATE")

    try:
        AuditLog.objects.create(
            action=action,
            entity_type=sender.__name__,
            entity_id=str(instance.id),
            organization_id=tenant_id,
            user_id=context.user_id if context else None,
            ip_address=context.ip_address if context else None,
        )
    except Exception as exc:
        logger.error(
            "AUDIT_SIGNAL_ERROR: %s model=%s id=%s",
            exc,
            sender.__name__,
            instance.id,
        )


@receiver(post_save, sender="content.Page")
def audit_page_save(sender, instance, created, **kwargs):
    _log_mutation(sender, instance, created)


@receiver(post_delete, sender="content.Page")
def audit_page_delete(sender, instance, **kwargs):
    _log_mutation(sender, instance, False, action_override="DELETE")


@receiver(post_save, sender="content.MediaFile")
def audit_media_save(sender, instance, created, **kwargs):
    _log_mutation(sender, instance, created)


@receiver(post_delete, sender="content.MediaFile")
def audit_media_delete(sender, instance, **kwargs):
    _log_mutation(sender, instance, False, action_override="DELETE")
