"""
Bitrix24 SDK for JOL-HUB Backend
Provides type-safe integration with Bitrix24 CRM for religious institutions.
GDPR-compliant with tamper-evident audit logging.
"""

from .client import Bitrix24Client
from .api.contacts import ContactApi
from .api.deals import DealApi
from .api.events import EventApi
from .api.email import EmailApi
from .audit.logger import ComplianceAuditLogger

__all__ = [
    "Bitrix24Client",
    "ContactApi",
    "DealApi",
    "EventApi",
    "EmailApi",
    "ComplianceAuditLogger",
]
