"""
Bitrix24 Email Marketing API
Handles email campaigns, templates, and parish communications.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from ..client import Bitrix24Client


class EmailTemplateType(str, Enum):
    """Types of email templates."""
    WEEKLY_BULLETIN = "weekly_bulletin"
    DONATION_RECEIPT = "donation_receipt"
    SACRAMENT_CONFIRMATION = "sacrament_confirmation"
    EVENT_REMINDER = "event_reminder"
    NEWSLETTER = "newsletter"
    PRAYER_REQUEST = "prayer_request"
    MASS_INTENTION = "mass_intention"


@dataclass
class EmailTemplate:
    """Email template for parish communications."""
    id: str
    name: str
    subject: str
    body: str
    template_type: Optional[str] = None
    parish_code: Optional[str] = None
    language: str = "lt"
    created: Optional[datetime] = None
    modified: Optional[datetime] = None
    
    @classmethod
    def from_api(cls, data: Dict[str, Any]) -> "EmailTemplate":
        """Create template from API response."""
        return cls(
            id=str(data.get("ID", "")),
            name=data.get("NAME", ""),
            subject=data.get("SUBJECT", ""),
            body=data.get("BODY", ""),
            template_type=data.get("UF_TEMPLATE_TYPE"),
            parish_code=data.get("UF_PARISH_CODE"),
            language=data.get("UF_LANGUAGE", "lt"),
            created=cls._parse_datetime(data.get("DATE_CREATE")),
            modified=cls._parse_datetime(data.get("DATE_MODIFY")),
        )
    
    @staticmethod
    def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None


@dataclass
class EmailCampaign:
    """Email campaign for mass communications."""
    id: str
    name: str
    subject: str
    body: str
    status: str
    recipient_count: int
    sent_count: int
    opened_count: int
    clicked_count: int
    created: Optional[datetime] = None
    sent: Optional[datetime] = None
    
    @classmethod
    def from_api(cls, data: Dict[str, Any]) -> "EmailCampaign":
        """Create campaign from API response."""
        return cls(
            id=str(data.get("ID", "")),
            name=data.get("NAME", ""),
            subject=data.get("SUBJECT", ""),
            body=data.get("BODY", ""),
            status=data.get("STATUS", ""),
            recipient_count=data.get("RECIPIENT_COUNT", 0),
            sent_count=data.get("SENT_COUNT", 0),
            opened_count=data.get("OPENED_COUNT", 0),
            clicked_count=data.get("CLICKED_COUNT", 0),
            created=cls._parse_datetime(data.get("DATE_CREATE")),
            sent=cls._parse_datetime(data.get("DATE_SENT")),
        )
    
    @staticmethod
    def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None


@dataclass
class SendEmailParams:
    """Parameters for sending an email."""
    to: List[str]
    subject: str
    body: str
    from_name: Optional[str] = None
    reply_to: Optional[str] = None
    template_type: Optional[EmailTemplateType] = None
    parish_code: Optional[str] = None
    
    def to_api(self) -> Dict[str, Any]:
        """Convert to API format."""
        fields = {
            "TO": self.to,
            "SUBJECT": self.subject,
            "BODY": self.body,
        }
        
        if self.from_name:
            fields["FROM_NAME"] = self.from_name
        if self.reply_to:
            fields["REPLY_TO"] = self.reply_to
        if self.template_type:
            fields["UF_TEMPLATE_TYPE"] = self.template_type.value
        if self.parish_code:
            fields["UF_PARISH_CODE"] = self.parish_code
        
        return fields


class EmailApi:
    """
    Bitrix24 Email Marketing API.
    
    Handles parish communications, newsletters, and transactional emails.
    All email operations are logged for GDPR compliance.
    """
    
    def __init__(self, client: Bitrix24Client):
        self._client = client
    
    # Template Management
    
    async def get_template(self, template_id: str) -> EmailTemplate:
        """Get an email template by ID."""
        response = await self._client.get(
            "sender.template.get",
            {"id": template_id},
            entity_id=template_id,
            entity_type="email_template",
        )
        return EmailTemplate.from_api(response.result)
    
    async def list_templates(
        self,
        parish_code: Optional[str] = None,
        template_type: Optional[EmailTemplateType] = None,
    ) -> List[EmailTemplate]:
        """List email templates."""
        filter_params = {}
        if parish_code:
            filter_params["UF_PARISH_CODE"] = parish_code
        if template_type:
            filter_params["UF_TEMPLATE_TYPE"] = template_type.value
        
        response = await self._client.get(
            "sender.template.list",
            {"filter": filter_params} if filter_params else None,
        )
        
        templates = []
        for item in response.result or []:
            templates.append(EmailTemplate.from_api(item))
        
        return templates
    
    async def create_template(
        self,
        name: str,
        subject: str,
        body: str,
        template_type: Optional[EmailTemplateType] = None,
        parish_code: Optional[str] = None,
        language: str = "lt",
    ) -> str:
        """Create a new email template."""
        fields = {
            "NAME": name,
            "SUBJECT": subject,
            "BODY": body,
            "UF_LANGUAGE": language,
        }
        
        if template_type:
            fields["UF_TEMPLATE_TYPE"] = template_type.value
        if parish_code:
            fields["UF_PARISH_CODE"] = parish_code
        
        response = await self._client.post(
            "sender.template.add",
            {"fields": fields},
            entity_type="email_template",
        )
        
        return str(response.result)
    
    # Email Sending
    
    async def send_email(self, params: SendEmailParams) -> Dict[str, Any]:
        """
        Send an email to recipients.
        
        Logs the operation for GDPR compliance.
        """
        response = await self._client.post(
            "sender.mail.send",
            params.to_api(),
        )
        
        message_id = str(response.result.get("ID", ""))
        
        await self._client.audit.log_data_operation(
            operation="email_sent",
            entity_type="email",
            entity_id=message_id,
            details={
                "recipients": len(params.to),
                "template_type": params.template_type.value if params.template_type else None,
                "parish_code": params.parish_code,
            },
        )
        
        return {
            "message_id": message_id,
            "recipients": len(params.to),
        }
    
    async def send_to_contact(
        self,
        contact_id: str,
        subject: str,
        body: str,
        template_type: Optional[EmailTemplateType] = None,
    ) -> str:
        """Send an email to a specific contact."""
        response = await self._client.post(
            "crm.mail.send",
            {
                "CONTACT_ID": contact_id,
                "SUBJECT": subject,
                "BODY": body,
            },
            entity_id=contact_id,
            entity_type="email",
        )
        
        return str(response.result)
    
    async def send_donation_receipt(
        self,
        contact_id: str,
        deal_id: str,
        amount: float,
        currency: str,
        donation_type: str,
    ) -> str:
        """Send a donation receipt email."""
        # This would typically use a template
        subject = f"Donation Receipt - {currency}{amount}"
        body = f"""
        Dear Donor,
        
        Thank you for your {donation_type} of {currency}{amount}.
        
        Your generosity supports our mission.
        
        God bless you.
        """
        
        message_id = await self.send_to_contact(
            contact_id,
            subject,
            body,
            template_type=EmailTemplateType.DONATION_RECEIPT,
        )
        
        # Mark deal as receipt sent
        await self._client.deals.update(deal_id, {"UF_RECEIPT_SENT": "Y"})
        
        return message_id
    
    # Campaign Management
    
    async def create_campaign(
        self,
        name: str,
        subject: str,
        body: str,
        recipient_list: str,
        parish_code: Optional[str] = None,
    ) -> str:
        """Create an email campaign."""
        fields = {
            "NAME": name,
            "SUBJECT": subject,
            "BODY": body,
            "RECIPIENT_LIST": recipient_list,
        }
        
        if parish_code:
            fields["UF_PARISH_CODE"] = parish_code
        
        response = await self._client.post(
            "sender.campaign.add",
            {"fields": fields},
            entity_type="email_campaign",
        )
        
        campaign_id = str(response.result)
        
        await self._client.audit.log_data_operation(
            operation="campaign_created",
            entity_type="email_campaign",
            entity_id=campaign_id,
            details={"parish_code": parish_code},
        )
        
        return campaign_id
    
    async def send_campaign(self, campaign_id: str) -> bool:
        """Send an email campaign."""
        response = await self._client.post(
            "sender.campaign.send",
            {"id": campaign_id},
            entity_id=campaign_id,
            entity_type="email_campaign",
        )
        
        return bool(response.result)
    
    async def get_campaign_stats(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign statistics."""
        response = await self._client.get(
            "sender.campaign.get",
            {"id": campaign_id},
        )
        
        campaign = EmailCampaign.from_api(response.result)
        
        return {
            "id": campaign.id,
            "status": campaign.status,
            "recipients": campaign.recipient_count,
            "sent": campaign.sent_count,
            "opened": campaign.opened_count,
            "clicked": campaign.clicked_count,
            "open_rate": campaign.opened_count / campaign.sent_count if campaign.sent_count else 0,
            "click_rate": campaign.clicked_count / campaign.sent_count if campaign.sent_count else 0,
        }
    
    # Parish-specific methods
    
    async def send_weekly_bulletin(
        self,
        parish_code: str,
        subject: str,
        body: str,
    ) -> str:
        """Send weekly bulletin to parish subscribers."""
        # Get parish subscribers
        contacts = await self._client.contacts.get_by_parish(parish_code)
        recipients = [
            email["VALUE"]
            for contact in contacts
            for email in contact.emails
            if email.get("VALUE")
        ]
        
        if not recipients:
            return ""
        
        return await self.send_email(SendEmailParams(
            to=recipients,
            subject=subject,
            body=body,
            template_type=EmailTemplateType.WEEKLY_BULLETIN,
            parish_code=parish_code,
        ))
    
    async def send_event_reminder(
        self,
        event_id: str,
        hours_before: int = 24,
    ) -> int:
        """Send event reminder to registered participants."""
        # Implementation would fetch event participants and send reminders
        pass
