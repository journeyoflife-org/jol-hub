"""
Bitrix24 API modules package.
"""

from .contacts import ContactApi, Bitrix24Contact, ContactAddParams
from .deals import DealApi, Bitrix24Deal, CreateDonationParams, DealCategory, DealStage, DonationType, PaymentMethod
from .events import EventApi, Bitrix24Event, CreateEventParams, EventType, SacramentType, MassSchedule
from .email import EmailApi, EmailTemplate, EmailCampaign, SendEmailParams, EmailTemplateType

__all__ = [
    # Contacts
    "ContactApi",
    "Bitrix24Contact",
    "ContactAddParams",
    # Deals
    "DealApi",
    "Bitrix24Deal",
    "CreateDonationParams",
    "DealCategory",
    "DealStage",
    "DonationType",
    "PaymentMethod",
    # Events
    "EventApi",
    "Bitrix24Event",
    "CreateEventParams",
    "EventType",
    "SacramentType",
    "MassSchedule",
    # Email
    "EmailApi",
    "EmailTemplate",
    "EmailCampaign",
    "SendEmailParams",
    "EmailTemplateType",
]
