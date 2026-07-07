"""
JOL-HUB Multi-Tenant CRM Application
GDPR Article 9 Hardened CRM Operations for Religious Institutions

Architecture:
- Tenant Isolation: Row-level security via organization_id
- Data Classification: PII, Special Category (religious), Financial
- Audit Trail: Tamper-evident logging for all operations
- Bitrix24 Abstraction: Fail-safe integration layer

Author: Principal Bitrix24 CRM & Compliance Engineer
"""

from django.apps import AppConfig


class CrmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.crm'
    verbose_name = 'CRM Operations'
    
    def ready(self):
        """Import signal handlers and initialize audit system."""
        import apps.crm.signals  # noqa: F401
        
        # Initialize metrics if prometheus is available
        try:
            from .observability.metrics import initialize_metrics
            initialize_metrics()
        except ImportError:
            pass  # prometheus-client not installed


# Expose key components for easy import
from .audit_logger import (
    ComplianceAuditLogger,
    AuditContext,
    FieldChange,
    AuditEventType,
    GDPRLegalBasis,
    get_audit_logger,
    configure_audit_logger,
)

__all__ = [
    'CrmConfig',
    'ComplianceAuditLogger',
    'AuditContext',
    'FieldChange',
    'AuditEventType',
    'GDPRLegalBasis',
    'get_audit_logger',
    'configure_audit_logger',
]
