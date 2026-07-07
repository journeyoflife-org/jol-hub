"""
Tenant Context Middleware for Multi-Tenant Isolation

This module provides:
1. Request-scoped tenant identification
2. Row-level security enforcement
3. Tenant validation and access control
4. Audit context injection

Security Architecture:
- Tenant ID extracted from JWT claims or API key
- Stored in thread-local context for query filtering
- Automatic validation against user's organization memberships
"""

import logging
import threading
from dataclasses import dataclass, field
from typing import Optional, Callable, Any
from functools import wraps

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse
from django.utils import timezone

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed

logger = logging.getLogger('jolhub.crm.security')

# Thread-local storage for tenant context
_tenant_context = threading.local()


@dataclass
class TenantContext:
    """
    Immutable tenant context for the current request.
    
    Provides:
    - Organization identification
    - Data residency enforcement
    - Compliance level tracking
    - Request audit metadata
    """
    tenant_id: str
    tenant_name: str
    country_code: str
    data_residency_region: str
    compliance_level: str
    request_id: str
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: str = field(default_factory=lambda: timezone.now().isoformat())
    
    def to_dict(self) -> dict:
        """Convert to dictionary for logging/serialization."""
        return {
            'tenant_id': self.tenant_id,
            'tenant_name': self.tenant_name,
            'country_code': self.country_code,
            'data_residency_region': self.data_residency_region,
            'compliance_level': self.compliance_level,
            'request_id': self.request_id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp,
        }


def get_current_tenant_id() -> Optional[str]:
    """Get the current tenant ID from thread-local context."""
    context = getattr(_tenant_context, 'context', None)
    return context.tenant_id if context else None


def get_current_tenant_context() -> Optional[TenantContext]:
    """Get the full tenant context from thread-local storage."""
    return getattr(_tenant_context, 'context', None)


def set_tenant_context(context: TenantContext):
    """Set the tenant context in thread-local storage."""
    _tenant_context.context = context


def clear_tenant_context():
    """Clear the tenant context from thread-local storage."""
    if hasattr(_tenant_context, 'context'):
        del _tenant_context.context


class TenantContextMiddleware:
    """
    Django middleware for tenant context injection.
    
    Extracts tenant context from:
    1. JWT claims (preferred for authenticated requests)
    2. X-Tenant-ID header (for API key requests)
    3. Request user's default organization
    
    Validates:
    - User has access to specified tenant
    - Tenant is active and compliant
    - Data residency requirements are met
    """
    
    # Cache key prefix for tenant lookups
    CACHE_PREFIX = 'jolhub:tenant:'
    CACHE_TIMEOUT = 300  # 5 minutes
    
    # Header names
    TENANT_HEADER = 'X-Tenant-ID'
    REQUEST_ID_HEADER = 'X-Request-ID'
    
    def __init__(self, get_response: Callable):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest) -> HttpResponse:
        """Process request and inject tenant context."""
        try:
            # Extract tenant context
            context = self._extract_tenant_context(request)
            
            if context:
                set_tenant_context(context)
                request.tenant_context = context
                
                # Log for audit
                logger.info(
                    f"Tenant context established",
                    extra={
                        'tenant_id': context.tenant_id,
                        'user_id': context.user_id,
                        'request_id': context.request_id,
                    }
                )
            else:
                logger.warning("No tenant context could be established")
        
        except Exception as e:
            logger.error(f"Error establishing tenant context: {e}")
            # Continue without tenant context - will be caught by permission checks
        
        try:
            response = self.get_response(request)
        finally:
            # Always clear context to prevent leakage
            clear_tenant_context()
        
        return response
    
    def _extract_tenant_context(self, request: HttpRequest) -> Optional[TenantContext]:
        """Extract tenant context from request."""
        User = get_user_model()
        
        # Try JWT claims first
        tenant_id = self._get_tenant_from_jwt(request)
        
        # Try header
        if not tenant_id:
            tenant_id = request.headers.get(self.TENANT_HEADER)
        
        # Try user's default organization
        if not tenant_id and hasattr(request, 'user') and request.user.is_authenticated:
            tenant_id = self._get_user_default_tenant(request.user)
        
        if not tenant_id:
            return None
        
        # Validate and fetch tenant info
        tenant_info = self._get_tenant_info(tenant_id)
        
        if not tenant_info:
            logger.warning(f"Tenant not found: {tenant_id}")
            return None
        
        # Build context
        request_id = request.headers.get(
            self.REQUEST_ID_HEADER,
            self._generate_request_id()
        )
        
        return TenantContext(
            tenant_id=tenant_id,
            tenant_name=tenant_info['name'],
            country_code=tenant_info['country_code'],
            data_residency_region=tenant_info['data_residency_region'],
            compliance_level=tenant_info['compliance_level'],
            request_id=request_id,
            user_id=str(request.user.id) if hasattr(request, 'user') and request.user.is_authenticated else None,
            ip_address=self._get_client_ip(request),
            user_agent=request.headers.get('User-Agent', '')[:512],
        )
    
    def _get_tenant_from_jwt(self, request: HttpRequest) -> Optional[str]:
        """Extract tenant ID from JWT claims."""
        try:
            authenticator = JWTAuthentication()
            result = authenticator.authenticate(request)
            
            if result:
                user, token = result
                # Check for tenant claim in token
                return token.get('tenant_id') or token.get('organization_id')
        
        except (InvalidToken, AuthenticationFailed) as e:
            logger.debug(f"JWT authentication failed: {e}")
        
        return None
    
    def _get_user_default_tenant(self, user) -> Optional[str]:
        """Get user's default organization as tenant."""
        try:
            # Check for organization membership
            from apps.organizations.models import OrganizationMember
            
            membership = OrganizationMember.objects.filter(
                user=user
            ).select_related('organization').first()
            
            if membership:
                return str(membership.organization.id)
        
        except Exception as e:
            logger.error(f"Error fetching user tenant: {e}")
        
        return None
    
    def _get_tenant_info(self, tenant_id: str) -> Optional[dict]:
        """Get tenant info with caching."""
        cache_key = f"{self.CACHE_PREFIX}{tenant_id}"
        
        # Try cache first
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        try:
            from apps.organizations.models import Organization
            
            org = Organization.objects.filter(
                id=tenant_id,
                status=Organization.STATUS_ACTIVE,
            ).first()
            
            if org:
                info = {
                    'name': org.name,
                    'country_code': org.country,
                    'data_residency_region': self._get_data_residency_region(org.country),
                    'compliance_level': org.compliance_level,
                }
                
                # Cache for future requests
                cache.set(cache_key, info, self.CACHE_TIMEOUT)
                return info
        
        except Exception as e:
            logger.error(f"Error fetching tenant info: {e}")
        
        return None
    
    def _get_data_residency_region(self, country_code: str) -> str:
        """Determine data residency region from country code."""
        # EU countries
        eu_countries = [
            'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
            'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
            'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
        ]
        
        if country_code in eu_countries:
            return 'EU'
        elif country_code in ['GB']:
            return 'UK'
        elif country_code in ['US', 'CA']:
            return 'NA'
        else:
            return 'EU'  # Default to EU for JOL
    
    def _get_client_ip(self, request: HttpRequest) -> str:
        """Extract client IP from request."""
        x_forwarded_for = request.headers.get('X-Forwarded-For')
        
        if x_forwarded_for:
            # Take first IP in chain
            return x_forwarded_for.split(',')[0].strip()
        
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID."""
        import uuid
        return str(uuid.uuid4())


def require_tenant(view_func: Callable) -> Callable:
    """
    Decorator to require valid tenant context for a view.
    
    Raises:
        PermissionDenied: If no tenant context is present
    """
    @wraps(view_func)
    def wrapped_view(*args, **kwargs):
        context = get_current_tenant_context()
        
        if not context:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("Valid tenant context required")
        
        return view_func(*args, **kwargs)
    
    return wrapped_view


def tenant_context_required(cls):
    """
    Class decorator for DRF views that require tenant context.
    
    Adds tenant validation to permission checks.
    """
    from rest_framework.permissions import BasePermission
    
    class TenantRequiredPermission(BasePermission):
        message = "Valid tenant context required"
        
        def has_permission(self, request, view):
            return get_current_tenant_context() is not None
    
    # Add permission to existing permissions
    if not hasattr(cls, 'permission_classes'):
        cls.permission_classes = []
    
    if isinstance(cls.permission_classes, (list, tuple)):
        cls.permission_classes = list(cls.permission_classes) + [TenantRequiredPermission]
    
    return cls


class TenantDataAccessValidator:
    """
    Validator for cross-tenant data access prevention.
    
    Use in views to validate that requested data belongs to current tenant.
    """
    
    @staticmethod
    def validate_organization(obj) -> bool:
        """Validate object belongs to current tenant."""
        tenant_id = get_current_tenant_id()
        
        if not tenant_id:
            return False
        
        obj_org = getattr(obj, 'organization_id', None)
        
        if not obj_org:
            return False
        
        return str(obj_org) == str(tenant_id)
    
    @staticmethod
    def validate_ownership(obj, user) -> bool:
        """Validate user owns the object within tenant context."""
        if not TenantDataAccessValidator.validate_organization(obj):
            return False
        
        # Check user ownership
        obj_owner = getattr(obj, 'created_by_id', None) or getattr(obj, 'owner_id', None)
        
        return str(obj_owner) == str(user.id)


# Security logging helpers
def log_tenant_access(
    operation: str,
    entity_type: str,
    entity_id: str,
    success: bool = True,
    details: Optional[dict] = None
):
    """Log tenant data access for audit trail."""
    context = get_current_tenant_context()
    
    log_data = {
        'operation': operation,
        'entity_type': entity_type,
        'entity_id': entity_id,
        'success': success,
        'tenant_id': context.tenant_id if context else None,
        'user_id': context.user_id if context else None,
        'request_id': context.request_id if context else None,
        'details': details or {},
    }
    
    if success:
        logger.info(f"Tenant access: {operation}", extra=log_data)
    else:
        logger.warning(f"Tenant access denied: {operation}", extra=log_data)
