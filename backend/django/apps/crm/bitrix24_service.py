"""
Bitrix24 Abstraction Layer for CRM Operations

Provides fail-safe integration with Bitrix24 CRM for:
- Contact synchronization
- Deal/donation tracking
- Event management
- Email marketing

Architecture:
- Tenant-aware client factory
- Automatic retry with circuit breaker
- GDPR-compliant audit logging
- Conflict resolution strategies
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Callable, TypeVar, Generic
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache

# Import from existing Bitrix24 integration
from integrations.bitrix24 import Bitrix24Client, Bitrix24Config
from integrations.bitrix24.client import (
    Bitrix24Error, Bitrix24AuthError, Bitrix24RateLimitError, Bitrix24ApiError
)

from apps.crm.models import Contact, Deal, AuditEntry
from apps.crm.middleware import get_current_tenant_id, get_current_tenant_context

logger = logging.getLogger('jolhub.crm.bitrix24')

T = TypeVar('T')


class SyncStatus(str, Enum):
    """Synchronization status for entities."""
    PENDING = 'pending'
    SYNCED = 'synced'
    FAILED = 'failed'
    CONFLICT = 'conflict'


class ConflictResolution(str, Enum):
    """Conflict resolution strategies."""
    LOCAL_WINS = 'local_wins'
    REMOTE_WINS = 'remote_wins'
    LATEST_WINS = 'latest_wins'
    MANUAL = 'manual'


@dataclass
class SyncResult(Generic[T]):
    """Result of a synchronization operation."""
    success: bool
    entity: Optional[T] = None
    bitrix24_id: Optional[str] = None
    error: Optional[str] = None
    conflict: bool = False
    local_data: Optional[Dict] = None
    remote_data: Optional[Dict] = None


@dataclass
class CircuitBreakerState:
    """Circuit breaker state for fail-safe operations."""
    is_open: bool = False
    failure_count: int = 0
    last_failure_time: Optional[datetime] = None
    next_retry_time: Optional[datetime] = None
    
    FAILURE_THRESHOLD: int = 5
    RECOVERY_TIMEOUT: timedelta = field(default_factory=lambda: timedelta(minutes=5))
    
    def record_failure(self):
        """Record a failure and potentially open the circuit."""
        self.failure_count += 1
        self.last_failure_time = timezone.now()
        
        if self.failure_count >= self.FAILURE_THRESHOLD:
            self.is_open = True
            self.next_retry_time = self.last_failure_time + self.RECOVERY_TIMEOUT
    
    def record_success(self):
        """Record a success and reset the circuit."""
        self.failure_count = 0
        self.is_open = False
        self.next_retry_time = None
    
    def can_execute(self) -> bool:
        """Check if execution is allowed."""
        if not self.is_open:
            return True
        
        if self.next_retry_time and timezone.now() >= self.next_retry_time:
            # Half-open state - allow one attempt
            return True
        
        return False


class Bitrix24ClientFactory:
    """
    Factory for creating tenant-specific Bitrix24 clients.
    
    Provides:
    - Per-tenant configuration management
    - Client caching for performance
    - Configuration validation
    """
    
    _clients: Dict[str, Bitrix24Client] = {}
    _configs: Dict[str, Bitrix24Config] = {}
    _circuit_breakers: Dict[str, CircuitBreakerState] = {}
    
    CACHE_PREFIX = 'jolhub:bitrix24:config:'
    CACHE_TIMEOUT = 3600  # 1 hour
    
    @classmethod
    def get_client(cls, tenant_id: Optional[str] = None) -> Optional[Bitrix24Client]:
        """
        Get or create a Bitrix24 client for the specified tenant.
        
        Args:
            tenant_id: Organization ID (uses current context if not provided)
            
        Returns:
            Bitrix24Client instance or None if not configured
        """
        if not tenant_id:
            tenant_id = get_current_tenant_id()
        
        if not tenant_id:
            logger.warning("No tenant context available for Bitrix24 client")
            return None
        
        # Check cache first
        if tenant_id in cls._clients:
            return cls._clients[tenant_id]
        
        # Load tenant-specific configuration
        config = cls._load_tenant_config(tenant_id)
        if not config:
            return None
        
        # Create client
        client = Bitrix24Client(config)
        cls._clients[tenant_id] = client
        cls._circuit_breakers[tenant_id] = CircuitBreakerState()
        
        return client
    
    @classmethod
    def get_circuit_breaker(cls, tenant_id: str) -> CircuitBreakerState:
        """Get circuit breaker state for tenant."""
        if tenant_id not in cls._circuit_breakers:
            cls._circuit_breakers[tenant_id] = CircuitBreakerState()
        return cls._circuit_breakers[tenant_id]
    
    @classmethod
    def _load_tenant_config(cls, tenant_id: str) -> Optional[Bitrix24Config]:
        """Load Bitrix24 configuration for tenant."""
        from apps.organizations.models import Organization
        
        try:
            # Check cache
            cache_key = f"{cls.CACHE_PREFIX}{tenant_id}"
            cached = cache.get(cache_key)
            if cached:
                return Bitrix24Config(**cached)
            
            # Load from database
            org = Organization.objects.filter(id=tenant_id).first()
            if not org or not org.bitrix24_portal_id:
                return None
            
            # Build config from portal ID and webhook URL
            # Portal ID format: domain.bitrix24.com or just 'domain'
            domain = org.bitrix24_portal_id
            if not domain.startswith('http'):
                domain = f'https://{domain}'
            if not domain.endswith('.bitrix24.com'):
                domain = f'{domain}.bitrix24.com'
            
            # For webhook-based auth, access_token is embedded in webhook URL
            access_token = ''
            if org.bitrix24_webhook_url:
                # Extract token from webhook URL: https://domain.bitrix24.com/rest/USER_ID/WEBHOOK_ID/
                import re
                match = re.search(r'/rest/(\d+)/([a-zA-Z0-9]+)/?$', org.bitrix24_webhook_url)
                if match:
                    access_token = f'{match.group(1)}:{match.group(2)}'
            
            config = Bitrix24Config(
                domain=domain,
                access_token=access_token,
                refresh_token='',
                client_id=getattr(settings, 'BITRIX24_CLIENT_ID', ''),
                client_secret=getattr(settings, 'BITRIX24_CLIENT_SECRET', ''),
            )
            
            # Cache the config
            cache.set(cache_key, {
                'domain': config.domain,
                'access_token': config.access_token,
                'refresh_token': config.refresh_token,
                'client_id': config.client_id,
                'client_secret': config.client_secret,
            }, cls.CACHE_TIMEOUT)
            
            return config
            
        except Exception as e:
            logger.error(f"Error loading Bitrix24 config for tenant {tenant_id}: {e}")
            return None
    
    @classmethod
    def clear_cache(cls, tenant_id: Optional[str] = None):
        """Clear client cache for tenant or all tenants."""
        if tenant_id:
            cls._clients.pop(tenant_id, None)
            cls._configs.pop(tenant_id, None)
            cls._circuit_breakers.pop(tenant_id, None)
            cache.delete(f"{cls.CACHE_PREFIX}{tenant_id}")
        else:
            cls._clients.clear()
            cls._configs.clear()
            cls._circuit_breakers.clear()


class CRMBitrix24Service:
    """
    CRM-specific Bitrix24 integration service.
    
    Provides:
    - Contact synchronization
    - Deal/donation sync
    - Bidirectional conflict resolution
    - GDPR-compliant audit logging
    """
    
    # Field mappings between CRM and Bitrix24
    CONTACT_FIELD_MAP = {
        'first_name': 'NAME',
        'last_name': 'LAST_NAME',
        'middle_name': 'SECOND_NAME',
        'email': 'EMAIL',
        'phone': 'PHONE',
        'address_street': 'ADDRESS',
        'address_city': 'ADDRESS_CITY',
        'address_country': 'ADDRESS_COUNTRY',
        'address_postal_code': 'ADDRESS_POSTAL_CODE',
        'date_of_birth': 'BIRTHDATE',
    }
    
    # Custom field mappings (UF_* fields in Bitrix24)
    CUSTOM_FIELD_MAP = {
        'religious_affiliation': 'UF_RELIGIOUS_AFFILIATION',
        'parish_registration_date': 'UF_PARISH_REGISTRATION',
        'baptism_date': 'UF_BAPTISM_DATE',
        'baptism_place': 'UF_BAPTISM_PLACE',
        'first_communion_date': 'UF_FIRST_COMMUNION',
        'confirmation_date': 'UF_CONFIRMATION',
        'marriage_date': 'UF_MARRIAGE_DATE',
        'envelope_number': 'UF_ENVELOPE_NUMBER',
    }
    
    def __init__(self, tenant_id: Optional[str] = None):
        self.tenant_id = tenant_id or get_current_tenant_id()
        self._client: Optional[Bitrix24Client] = None
    
    @property
    def client(self) -> Optional[Bitrix24Client]:
        """Lazy-load Bitrix24 client."""
        if self._client is None:
            self._client = Bitrix24ClientFactory.get_client(self.tenant_id)
        return self._client
    
    def _can_execute(self) -> bool:
        """Check if we can execute Bitrix24 operations."""
        circuit_breaker = Bitrix24ClientFactory.get_circuit_breaker(self.tenant_id)
        return circuit_breaker.can_execute()
    
    def _handle_success(self):
        """Handle successful API call."""
        circuit_breaker = Bitrix24ClientFactory.get_circuit_breaker(self.tenant_id)
        circuit_breaker.record_success()
    
    def _handle_failure(self, error: Exception):
        """Handle failed API call."""
        circuit_breaker = Bitrix24ClientFactory.get_circuit_breaker(self.tenant_id)
        circuit_breaker.record_failure()
        logger.error(f"Bitrix24 API failure for tenant {self.tenant_id}: {error}")
    
    async def sync_contact_to_bitrix24(
        self,
        contact: Contact,
        resolution: ConflictResolution = ConflictResolution.LATEST_WINS
    ) -> SyncResult[Contact]:
        """
        Synchronize a CRM contact to Bitrix24.
        
        Args:
            contact: Contact instance to sync
            resolution: Conflict resolution strategy
            
        Returns:
            SyncResult with outcome
        """
        if not self.client or not self._can_execute():
            return SyncResult(
                success=False,
                entity=contact,
                error="Bitrix24 unavailable or circuit breaker open"
            )
        
        try:
            # Prepare contact data for Bitrix24
            bitrix24_data = self._map_contact_to_bitrix24(contact)
            
            if contact.bitrix24_id:
                # Update existing contact
                result = await self.client.contacts.update(
                    id=contact.bitrix24_id,
                    fields=bitrix24_data
                )
                bitrix24_id = contact.bitrix24_id
            else:
                # Create new contact
                result = await self.client.contacts.add(fields=bitrix24_data)
                bitrix24_id = str(result.result)
            
            # Update contact with sync info
            contact.bitrix24_id = bitrix24_id
            contact.bitrix24_synced_at = timezone.now()
            contact.bitrix24_sync_status = 'synced'
            contact.save(update_fields=[
                'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status'
            ])
            
            self._handle_success()
            
            # Create audit entry
            AuditEntry.objects.create(
                organization=contact.organization,
                event_type=AuditEntry.EventType.UPDATE,
                operation='contact_synced_to_bitrix24',
                entity_type='contact',
                entity_id=str(contact.id),
                details={'bitrix24_id': bitrix24_id}
            )
            
            return SyncResult(
                success=True,
                entity=contact,
                bitrix24_id=bitrix24_id
            )
            
        except Bitrix24RateLimitError as e:
            self._handle_failure(e)
            return SyncResult(
                success=False,
                entity=contact,
                error="Rate limit exceeded"
            )
        except Bitrix24AuthError as e:
            self._handle_failure(e)
            return SyncResult(
                success=False,
                entity=contact,
                error="Authentication failed"
            )
        except Bitrix24ApiError as e:
            self._handle_failure(e)
            return SyncResult(
                success=False,
                entity=contact,
                error=f"API error: {e.message}"
            )
        except Exception as e:
            self._handle_failure(e)
            return SyncResult(
                success=False,
                entity=contact,
                error=str(e)
            )
    
    async def sync_deal_to_bitrix24(
        self,
        deal: Deal,
        resolution: ConflictResolution = ConflictResolution.LATEST_WINS
    ) -> SyncResult[Deal]:
        """
        Synchronize a CRM deal to Bitrix24.
        
        Args:
            deal: Deal instance to sync
            resolution: Conflict resolution strategy
            
        Returns:
            SyncResult with outcome
        """
        if not self.client or not self._can_execute():
            return SyncResult(
                success=False,
                entity=deal,
                error="Bitrix24 unavailable or circuit breaker open"
            )
        
        try:
            # Prepare deal data for Bitrix24
            bitrix24_data = self._map_deal_to_bitrix24(deal)
            
            if deal.bitrix24_id:
                # Update existing deal
                result = await self.client.deals.update(
                    id=deal.bitrix24_id,
                    fields=bitrix24_data
                )
                bitrix24_id = deal.bitrix24_id
            else:
                # Create new deal
                result = await self.client.deals.add(fields=bitrix24_data)
                bitrix24_id = str(result.result)
            
            # Update deal with sync info
            deal.bitrix24_id = bitrix24_id
            deal.bitrix24_synced_at = timezone.now()
            deal.bitrix24_sync_status = 'synced'
            deal.save(update_fields=[
                'bitrix24_id', 'bitrix24_synced_at', 'bitrix24_sync_status'
            ])
            
            self._handle_success()
            
            # Create audit entry
            AuditEntry.objects.create(
                organization=deal.organization,
                event_type=AuditEntry.EventType.UPDATE,
                operation='deal_synced_to_bitrix24',
                entity_type='deal',
                entity_id=str(deal.id),
                details={
                    'bitrix24_id': bitrix24_id,
                    'deal_number': deal.deal_number,
                }
            )
            
            return SyncResult(
                success=True,
                entity=deal,
                bitrix24_id=bitrix24_id
            )
            
        except Bitrix24Error as e:
            self._handle_failure(e)
            return SyncResult(
                success=False,
                entity=deal,
                error=str(e)
            )
    
    def _map_contact_to_bitrix24(self, contact: Contact) -> Dict[str, Any]:
        """Map CRM Contact to Bitrix24 contact format."""
        data = {}
        
        # Standard fields
        for crm_field, bitrix24_field in self.CONTACT_FIELD_MAP.items():
            value = getattr(contact, crm_field, None)
            if value:
                if bitrix24_field == 'EMAIL':
                    data['EMAIL'] = [{'VALUE': value, 'TYPE': 'WORK'}]
                elif bitrix24_field == 'PHONE':
                    data['PHONE'] = [{'VALUE': value, 'TYPE': 'WORK'}]
                else:
                    data[bitrix24_field] = str(value)
        
        # Custom fields (UF_*)
        for crm_field, bitrix24_field in self.CUSTOM_FIELD_MAP.items():
            value = getattr(contact, crm_field, None)
            if value:
                data[bitrix24_field] = str(value)
        
        return data
    
    def _map_deal_to_bitrix24(self, deal: Deal) -> Dict[str, Any]:
        """Map CRM Deal to Bitrix24 deal format."""
        data = {
            'TITLE': deal.title,
            'OPPORTUNITY': str(deal.amount),
            'CURRENCY_ID': deal.currency,
            'STAGE_ID': self._map_deal_stage(deal.stage),
            'CATEGORY_ID': self._map_deal_category(deal.deal_type),
        }
        
        # Link to contact if available
        if deal.contact and deal.contact.bitrix24_id:
            data['CONTACT_ID'] = deal.contact.bitrix24_id
        
        # Deal type specific fields
        if deal.deal_type == Deal.DealType.DONATION:
            data['UF_DONATION_TYPE'] = deal.donation_type
            data['UF_IS_RECURRING'] = deal.is_recurring
            data['UF_TAX_DEDUCTIBLE'] = deal.is_tax_deductible
        
        elif deal.deal_type == Deal.DealType.MASS_INTENTION:
            data['UF_MASS_INTENTION_FOR'] = deal.mass_intention_for
            data['UF_MASS_INTENTION_TYPE'] = deal.mass_intention_type
            if deal.mass_date:
                data['UF_MASS_DATE'] = deal.mass_date.isoformat()
        
        return data
    
    def _map_deal_stage(self, stage: str) -> str:
        """Map CRM deal stage to Bitrix24 stage ID."""
        stage_map = {
            'new': 'NEW',
            'in_progress': 'PREPARATION',
            'pending_payment': 'PREPAYMENT_INVOICE',
            'paid': 'FINAL_INVOICE',
            'completed': 'WON',
            'cancelled': 'LOSE',
            'refunded': 'APOLOGY',
        }
        return stage_map.get(stage, 'NEW')
    
    def _map_deal_category(self, deal_type: str) -> str:
        """Map CRM deal type to Bitrix24 category ID."""
        # These would be configured per tenant in Bitrix24
        category_map = {
            'donation': '1',
            'mass_intention': '2',
            'funeral_service': '3',
            'cemetery_service': '4',
            'maintenance_contract': '5',
            'preneed_contract': '6',
            'memorial_product': '7',
        }
        return category_map.get(deal_type, '0')


# Synchronous wrapper for Django contexts
class CRMBitrix24ServiceSync:
    """Synchronous wrapper for CRMBitrix24Service."""
    
    def __init__(self, tenant_id: Optional[str] = None):
        self._async_service = CRMBitrix24Service(tenant_id)
    
    def _run(self, coro):
        import asyncio
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        return loop.run_until_complete(coro)
    
    def sync_contact(self, contact: Contact, **kwargs) -> SyncResult[Contact]:
        """Synchronize contact to Bitrix24."""
        return self._run(self._async_service.sync_contact_to_bitrix24(contact, **kwargs))
    
    def sync_deal(self, deal: Deal, **kwargs) -> SyncResult[Deal]:
        """Synchronize deal to Bitrix24."""
        return self._run(self._async_service.sync_deal_to_bitrix24(deal, **kwargs))
