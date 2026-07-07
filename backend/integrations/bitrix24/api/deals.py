"""
Bitrix24 CRM Deal API
Handles donations, contracts, and financial transactions.
PCI-DSS compliant with financial transaction logging.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from ..client import Bitrix24Client, Bitrix24Response


class DealCategory(str, Enum):
    """Deal categories for JOL-HUB entities."""
    DONATION = "donations"
    MASS_INTENTION = "mass_intentions"
    FUNERAL_SERVICE = "funeral_services"
    CEMETERY_SERVICE = "cemetery_services"
    EVENT_REGISTRATION = "event_registrations"
    MAINTENANCE_CONTRACT = "maintenance_contracts"
    PRENEED_CONTRACT = "preneed_contracts"


class DonationType(str, Enum):
    """Types of donations."""
    ONE_TIME = "one_time"
    RECURRING = "recurring"
    MASS_OFFERING = "mass_offering"
    CANDLE_OFFERING = "candle_offering"
    SPECIAL_COLLECTION = "special_collection"


class PaymentMethod(str, Enum):
    """Payment methods."""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_LINK = "bank_link"
    CASH = "cash"
    CARD = "card"


class DealStage(str, Enum):
    """Deal stages."""
    NEW = "NEW"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


@dataclass
class Bitrix24Deal:
    """Bitrix24 deal entity."""
    id: str
    title: str
    type_id: Optional[str] = None
    category_id: Optional[str] = None
    stage_id: Optional[str] = None
    probability: Optional[int] = None
    currency_id: Optional[str] = None
    opportunity: Optional[float] = None
    contact_id: Optional[str] = None
    contact_ids: List[str] = field(default_factory=list)
    begin_date: Optional[datetime] = None
    close_date: Optional[datetime] = None
    closed: bool = False
    comments: Optional[str] = None
    assigned_by_id: Optional[str] = None
    created_by_id: Optional[str] = None
    created: Optional[datetime] = None
    modified: Optional[datetime] = None
    
    # JOL-HUB custom fields
    donation_type: Optional[str] = None
    payment_method: Optional[str] = None
    mass_intention_type: Optional[str] = None
    recurring: bool = False
    tax_deductible: bool = False
    receipt_sent: bool = False
    
    @classmethod
    def from_api(cls, data: Dict[str, Any]) -> "Bitrix24Deal":
        """Create deal from API response."""
        return cls(
            id=str(data.get("ID", "")),
            title=data.get("TITLE", ""),
            type_id=data.get("TYPE_ID"),
            category_id=data.get("CATEGORY_ID"),
            stage_id=data.get("STAGE_ID"),
            probability=data.get("PROBABILITY"),
            currency_id=data.get("CURRENCY_ID"),
            opportunity=data.get("OPPORTUNITY"),
            contact_id=data.get("CONTACT_ID"),
            contact_ids=data.get("CONTACT_IDS", []),
            begin_date=cls._parse_date(data.get("BEGINDATE")),
            close_date=cls._parse_date(data.get("CLOSEDATE")),
            closed=data.get("CLOSED") == "Y",
            comments=data.get("COMMENTS"),
            assigned_by_id=data.get("ASSIGNED_BY_ID"),
            created_by_id=data.get("CREATED_BY_ID"),
            created=cls._parse_datetime(data.get("DATE_CREATE")),
            modified=cls._parse_datetime(data.get("DATE_MODIFY")),
            donation_type=data.get("UF_DONATION_TYPE"),
            payment_method=data.get("UF_PAYMENT_METHOD"),
            mass_intention_type=data.get("UF_MASS_INTENTION_TYPE"),
            recurring=data.get("UF_RECURRING") == "Y",
            tax_deductible=data.get("UF_TAX_DEDUCTIBLE") == "Y",
            receipt_sent=data.get("UF_RECEIPT_SENT") == "Y",
        )
    
    @staticmethod
    def _parse_date(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.strptime(value, "%Y-%m-%d")
        except (ValueError, TypeError):
            return None
    
    @staticmethod
    def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            return None


@dataclass
class CreateDonationParams:
    """Parameters for creating a donation deal."""
    contact_id: str
    amount: float
    currency: str
    donation_type: DonationType
    payment_method: PaymentMethod
    is_recurring: bool = False
    mass_intention_type: Optional[str] = None  # 'living', 'deceased', 'special_intention'
    tax_deductible: bool = False
    comments: Optional[str] = None
    parish_code: Optional[str] = None


class DealApi:
    """
    Bitrix24 CRM Deal API.
    
    Handles financial transactions with PCI-DSS compliance.
    All financial operations are logged with tamper-evident audit trails.
    """
    
    def __init__(self, client: Bitrix24Client):
        self._client = client
    
    async def get(self, deal_id: str) -> Bitrix24Deal:
        """Get a deal by ID."""
        response = await self._client.get(
            "crm.deal.get",
            {"id": deal_id},
            entity_id=deal_id,
            entity_type="deal",
        )
        return Bitrix24Deal.from_api(response.result)
    
    async def list(
        self,
        filter_params: Optional[Dict[str, Any]] = None,
        select: Optional[List[str]] = None,
        order: Optional[Dict[str, str]] = None,
        start: int = 0,
    ) -> List[Bitrix24Deal]:
        """List deals with optional filtering."""
        params = {"start": start}
        
        if filter_params:
            params["filter"] = filter_params
        if select:
            params["select"] = select
        if order:
            params["order"] = order
        
        response = await self._client.get("crm.deal.list", params)
        
        deals = []
        for item in response.result or []:
            deals.append(Bitrix24Deal.from_api(item))
        
        return deals
    
    async def add(
        self,
        title: str,
        category_id: Optional[str] = None,
        stage_id: str = DealStage.NEW.value,
        opportunity: Optional[float] = None,
        currency_id: str = "EUR",
        contact_id: Optional[str] = None,
        comments: Optional[str] = None,
        custom_fields: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Create a new deal."""
        fields = {
            "TITLE": title,
            "STAGE_ID": stage_id,
            "CURRENCY_ID": currency_id,
        }
        
        if category_id:
            fields["CATEGORY_ID"] = category_id
        if opportunity is not None:
            fields["OPPORTUNITY"] = opportunity
        if contact_id:
            fields["CONTACT_ID"] = contact_id
        if comments:
            fields["COMMENTS"] = comments
        if custom_fields:
            fields.update(custom_fields)
        
        response = await self._client.post(
            "crm.deal.add",
            {"fields": fields},
            entity_type="deal",
        )
        
        return str(response.result)
    
    async def update(
        self,
        deal_id: str,
        fields: Dict[str, Any],
    ) -> bool:
        """Update an existing deal."""
        response = await self._client.post(
            "crm.deal.update",
            {"id": deal_id, "fields": fields},
            entity_id=deal_id,
            entity_type="deal",
        )
        
        return bool(response.result)
    
    async def create_donation(self, params: CreateDonationParams) -> Dict[str, Any]:
        """
        Create a donation deal with PCI-DSS compliant logging.
        
        This is the primary method for recording financial donations.
        All transactions are logged for audit compliance.
        """
        title = self._generate_donation_title(params)
        
        custom_fields = {
            "UF_DONATION_TYPE": params.donation_type.value,
            "UF_PAYMENT_METHOD": params.payment_method.value,
            "UF_RECURRING": "Y" if params.is_recurring else "N",
            "UF_TAX_DEDUCTIBLE": "Y" if params.tax_deductible else "N",
        }
        
        if params.mass_intention_type:
            custom_fields["UF_MASS_INTENTION_TYPE"] = params.mass_intention_type
        
        deal_id = await self.add(
            title=title,
            category_id=DealCategory.DONATION.value,
            opportunity=params.amount,
            currency_id=params.currency,
            contact_id=params.contact_id,
            comments=params.comments,
            custom_fields=custom_fields,
        )
        
        # Log financial transaction for PCI-DSS compliance
        await self._client.audit.log_financial_transaction(
            transaction_type="donation",
            entity_type="deal",
            entity_id=deal_id,
            amount=params.amount,
            currency=params.currency,
            payment_method=params.payment_method.value,
            details={
                "donation_type": params.donation_type.value,
                "contact_id": params.contact_id,
                "parish_code": params.parish_code,
            },
        )
        
        return {
            "deal_id": deal_id,
            "amount": params.amount,
            "currency": params.currency,
        }
    
    async def move_to_stage(self, deal_id: str, stage: DealStage) -> bool:
        """Move a deal to a specific stage."""
        success = await self.update(deal_id, {"STAGE_ID": stage.value})
        
        if success:
            await self._client.audit.log_data_operation(
                operation="deal_stage_changed",
                entity_type="deal",
                entity_id=deal_id,
                details={"new_stage": stage.value},
            )
        
        return success
    
    async def mark_paid(
        self,
        deal_id: str,
        transaction_id: Optional[str] = None,
    ) -> bool:
        """Mark a deal as paid (stage change)."""
        success = await self.move_to_stage(deal_id, DealStage.PAID)
        
        if success and transaction_id:
            await self.update(deal_id, {"UF_TRANSACTION_ID": transaction_id})
        
        return success
    
    async def process_refund(
        self,
        deal_id: str,
        reason: str,
        amount: Optional[float] = None,
    ) -> bool:
        """
        Process a refund for a deal.
        
        Logs refund for PCI-DSS compliance.
        """
        deal = await self.get(deal_id)
        
        success = await self.move_to_stage(deal_id, DealStage.REFUNDED)
        
        if success:
            await self._client.audit.log_financial_transaction(
                transaction_type="refund",
                entity_type="deal",
                entity_id=deal_id,
                amount=amount or deal.opportunity or 0,
                currency=deal.currency_id or "EUR",
                payment_method=deal.payment_method or "unknown",
                details={
                    "reason": reason,
                    "original_amount": deal.opportunity,
                },
            )
        
        return success
    
    async def get_by_contact(self, contact_id: str) -> List[Bitrix24Deal]:
        """Get all deals for a contact."""
        return await self.list(
            filter_params={"CONTACT_ID": contact_id},
            select=["ID", "TITLE", "OPPORTUNITY", "CURRENCY_ID", "STAGE_ID", "DATE_CREATE"],
        )
    
    async def get_by_parish(
        self,
        parish_code: str,
        category: Optional[DealCategory] = None,
    ) -> List[Bitrix24Deal]:
        """Get all deals for a parish."""
        filter_params = {"UF_PARISH_CODE": parish_code}
        if category:
            filter_params["CATEGORY_ID"] = category.value
        
        return await self.list(filter_params=filter_params)
    
    def _generate_donation_title(self, params: CreateDonationParams) -> str:
        """Generate a descriptive title for a donation deal."""
        type_labels = {
            DonationType.ONE_TIME: "One-time Donation",
            DonationType.RECURRING: "Recurring Donation",
            DonationType.MASS_OFFERING: "Mass Offering",
            DonationType.CANDLE_OFFERING: "Candle Offering",
            DonationType.SPECIAL_COLLECTION: "Special Collection",
        }
        
        label = type_labels.get(params.donation_type, "Donation")
        return f"{label} - {params.currency}{params.amount}"
