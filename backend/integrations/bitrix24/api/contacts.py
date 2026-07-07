"""
Bitrix24 CRM Contact API
Handles contact CRUD operations with GDPR compliance.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from ..client import Bitrix24Client, Bitrix24Response


@dataclass
class Bitrix24Contact:
    """Bitrix24 contact entity."""
    id: str
    name: str
    last_name: Optional[str] = None
    second_name: Optional[str] = None
    emails: List[Dict[str, str]] = field(default_factory=list)
    phones: List[Dict[str, str]] = field(default_factory=list)
    birthdate: Optional[str] = None
    address: Optional[str] = None
    address_city: Optional[str] = None
    address_country: Optional[str] = None
    address_postal_code: Optional[str] = None
    comments: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    created: Optional[datetime] = None
    modified: Optional[datetime] = None
    assigned_by_id: Optional[str] = None
    source_id: Optional[str] = None
    opened: bool = False
    
    # JOL-HUB custom fields
    parishioner_id: Optional[str] = None
    family_id: Optional[str] = None
    parish_code: Optional[str] = None
    envelope_number: Optional[str] = None
    sacraments_received: List[str] = field(default_factory=list)
    
    @classmethod
    def from_api(cls, data: Dict[str, Any]) -> "Bitrix24Contact":
        """Create contact from API response."""
        return cls(
            id=str(data.get("ID", "")),
            name=data.get("NAME", ""),
            last_name=data.get("LAST_NAME"),
            second_name=data.get("SECOND_NAME"),
            emails=data.get("EMAIL", []),
            phones=data.get("PHONE", []),
            birthdate=data.get("BIRTHDATE"),
            address=data.get("ADDRESS"),
            address_city=data.get("ADDRESS_CITY"),
            address_country=data.get("ADDRESS_COUNTRY"),
            address_postal_code=data.get("ADDRESS_POSTAL_CODE"),
            comments=data.get("COMMENTS"),
            company_id=data.get("COMPANY_ID"),
            company_name=data.get("COMPANY_NAME"),
            created=cls._parse_datetime(data.get("DATE_CREATE")),
            modified=cls._parse_datetime(data.get("DATE_MODIFY")),
            assigned_by_id=data.get("ASSIGNED_BY_ID"),
            source_id=data.get("SOURCE_ID"),
            opened=data.get("OPENED") == "Y",
            parishioner_id=data.get("UF_PARISHIONER_ID"),
            family_id=data.get("UF_FAMILY_ID"),
            parish_code=data.get("UF_PARISH_CODE"),
            envelope_number=data.get("UF_ENVELOPE_NUMBER"),
            sacraments_received=data.get("UF_SACRAMENTS_RECEIVED", []),
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
class ContactAddParams:
    """Parameters for creating a contact."""
    name: str
    last_name: Optional[str] = None
    emails: Optional[List[Dict[str, str]]] = None
    phones: Optional[List[Dict[str, str]]] = None
    address: Optional[str] = None
    address_city: Optional[str] = None
    comments: Optional[str] = None
    assigned_by_id: Optional[str] = None
    source_id: Optional[str] = None
    opened: bool = False
    
    # JOL-HUB custom fields
    parishioner_id: Optional[str] = None
    family_id: Optional[str] = None
    parish_code: Optional[str] = None
    
    def to_api(self) -> Dict[str, Any]:
        """Convert to API format."""
        fields = {
            "NAME": self.name,
        }
        
        if self.last_name:
            fields["LAST_NAME"] = self.last_name
        if self.emails:
            fields["EMAIL"] = self.emails
        if self.phones:
            fields["PHONE"] = self.phones
        if self.address:
            fields["ADDRESS"] = self.address
        if self.address_city:
            fields["ADDRESS_CITY"] = self.address_city
        if self.comments:
            fields["COMMENTS"] = self.comments
        if self.assigned_by_id:
            fields["ASSIGNED_BY_ID"] = self.assigned_by_id
        if self.source_id:
            fields["SOURCE_ID"] = self.source_id
        if self.opened:
            fields["OPENED"] = "Y"
        
        # Custom fields
        if self.parishioner_id:
            fields["UF_PARISHIONER_ID"] = self.parishioner_id
        if self.family_id:
            fields["UF_FAMILY_ID"] = self.family_id
        if self.parish_code:
            fields["UF_PARISH_CODE"] = self.parish_code
        
        return fields


class ContactApi:
    """
    Bitrix24 CRM Contact API.
    
    Provides CRUD operations for contacts with GDPR-compliant audit logging.
    """
    
    def __init__(self, client: Bitrix24Client):
        self._client = client
    
    async def get(self, contact_id: str) -> Bitrix24Contact:
        """Get a contact by ID."""
        response = await self._client.get(
            "crm.contact.get",
            {"id": contact_id},
            entity_id=contact_id,
            entity_type="contact",
        )
        return Bitrix24Contact.from_api(response.result)
    
    async def list(
        self,
        filter_params: Optional[Dict[str, Any]] = None,
        select: Optional[List[str]] = None,
        order: Optional[Dict[str, str]] = None,
        start: int = 0,
    ) -> List[Bitrix24Contact]:
        """List contacts with optional filtering."""
        params = {"start": start}
        
        if filter_params:
            params["filter"] = filter_params
        if select:
            params["select"] = select
        if order:
            params["order"] = order
        
        response = await self._client.get("crm.contact.list", params)
        
        contacts = []
        for item in response.result or []:
            contacts.append(Bitrix24Contact.from_api(item))
        
        return contacts
    
    async def add(self, params: ContactAddParams) -> str:
        """
        Create a new contact.
        
        Returns the ID of the created contact.
        """
        response = await self._client.post(
            "crm.contact.add",
            {"fields": params.to_api()},
            entity_type="contact",
        )
        
        contact_id = str(response.result)
        
        # Log GDPR-compliant audit event
        await self._client.audit.log_data_operation(
            operation="contact_created",
            entity_type="contact",
            entity_id=contact_id,
            details={"name": params.name, "parish_code": params.parish_code},
        )
        
        return contact_id
    
    async def update(
        self,
        contact_id: str,
        fields: Dict[str, Any],
    ) -> bool:
        """Update an existing contact."""
        response = await self._client.post(
            "crm.contact.update",
            {"id": contact_id, "fields": fields},
            entity_id=contact_id,
            entity_type="contact",
        )
        
        success = bool(response.result)
        
        if success:
            await self._client.audit.log_data_operation(
                operation="contact_updated",
                entity_type="contact",
                entity_id=contact_id,
                details={"updated_fields": list(fields.keys())},
            )
        
        return success
    
    async def delete(self, contact_id: str) -> bool:
        """
        Delete a contact (GDPR right to erasure).
        
        This action is logged for compliance.
        """
        response = await self._client.post(
            "crm.contact.delete",
            {"id": contact_id},
            entity_id=contact_id,
            entity_type="contact",
        )
        
        success = bool(response.result)
        
        if success:
            await self._client.audit.log_data_operation(
                operation="contact_deleted",
                entity_type="contact",
                entity_id=contact_id,
                details={"gdpr_basis": "right_to_erasure"},
            )
        
        return success
    
    async def find_by_email(self, email: str) -> Optional[Bitrix24Contact]:
        """Find a contact by email address."""
        contacts = await self.list(
            filter_params={"EMAIL": email},
            select=["ID", "NAME", "LAST_NAME", "EMAIL", "PHONE"],
        )
        return contacts[0] if contacts else None
    
    async def upsert(self, params: ContactAddParams) -> Dict[str, Any]:
        """
        Create or update a contact by email (upsert).
        
        Returns dict with 'id' and 'created' boolean.
        """
        if params.emails and params.emails[0].get("VALUE"):
            existing = await self.find_by_email(params.emails[0]["VALUE"])
            if existing:
                await self.update(existing.id, params.to_api())
                return {"id": existing.id, "created": False}
        
        contact_id = await self.add(params)
        return {"id": contact_id, "created": True}
    
    async def get_by_parish(
        self,
        parish_code: str,
        limit: int = 50,
    ) -> List[Bitrix24Contact]:
        """Get all contacts for a specific parish."""
        return await self.list(
            filter_params={"UF_PARISH_CODE": parish_code},
            select=["ID", "NAME", "LAST_NAME", "EMAIL", "PHONE", "UF_ENVELOPE_NUMBER"],
        )
