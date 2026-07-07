"""
JOL-HUB Permission Classes for Multi-Tenant Access Control

GDPR Article 9 / SOC2 CC6.2 / ISO 27001 A.9.4

Provides permission classes for:
- Organization membership validation
- Tenant isolation enforcement
- Role-based access control
- Special category data access
"""

import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from rest_framework import permissions
from rest_framework.request import Request

logger = logging.getLogger('jolhub.permissions')

User = get_user_model()


class IsOrganizationMember(permissions.BasePermission):
    """
    Permission class for multi-tenant organization membership.
    
    Validates that the authenticated user is an active member of the
    organization (tenant) specified in the request context.
    
    SOC2 CC6.2 / GDPR Article 32 - Access Control
    
    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, IsOrganizationMember]
    
    The organization context is established by TenantContextMiddleware
    and can be accessed via the X-Tenant-ID header or JWT claims.
    """
    
    message = "You must be a member of this organization to access this resource."
    
    def has_permission(self, request: Request, view) -> bool:
        """Check if user is authenticated and has organization context."""
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Get tenant context from middleware
        tenant_id = self._get_tenant_id(request)
        
        if not tenant_id:
            logger.warning(
                f"IsOrganizationMember: No tenant context for user {request.user.id}"
            )
            return False
        
        # Check membership
        return self._check_membership(request.user, tenant_id)
    
    def has_object_permission(self, request: Request, view, obj) -> bool:
        """Validate object belongs to user's organization."""
        tenant_id = self._get_tenant_id(request)
        
        if not tenant_id:
            return False
        
        # Check if object has organization_id field
        obj_org_id = getattr(obj, 'organization_id', None)
        if obj_org_id is None:
            # Try organization field
            obj_org = getattr(obj, 'organization', None)
            if obj_org:
                obj_org_id = str(obj_org.id) if hasattr(obj_org, 'id') else None
        
        if obj_org_id and str(obj_org_id) != str(tenant_id):
            logger.warning(
                f"Cross-tenant access attempt: user={request.user.id}, "
                f"tenant={tenant_id}, object_tenant={obj_org_id}"
            )
            return False
        
        return True
    
    def _get_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request context."""
        # Try tenant context from middleware
        if hasattr(request, 'tenant_context') and request.tenant_context:
            return str(request.tenant_context.tenant_id)
        
        # Try header
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id:
            return tenant_id
        
        # Try from thread-local context
        try:
            from apps.crm.middleware import get_current_tenant_id
            return get_current_tenant_id()
        except (ImportError, AttributeError):
            pass
        
        return None
    
    def _check_membership(self, user: User, tenant_id: str) -> bool:
        """Check if user is a member of the organization."""
        try:
            from apps.organizations.models import OrganizationMember
            
            membership = OrganizationMember.objects.filter(
                user=user,
                organization_id=tenant_id,
                is_active=True,
            ).exists()
            
            if membership:
                return True
            
            # Check if user is owner
            from apps.organizations.models import Organization
            is_owner = Organization.objects.filter(
                id=tenant_id,
                owner=user,
            ).exists()
            
            if is_owner:
                return True
            
            logger.warning(
                f"IsOrganizationMember: User {user.id} not member of org {tenant_id}"
            )
            return False
            
        except Exception as e:
            logger.error(f"Error checking organization membership: {e}")
            return False


class IsOrganizationAdmin(permissions.BasePermission):
    """
    Permission class for organization admin access.
    
    Requires user to have 'admin' role in the organization.
    """
    
    message = "You must be an admin of this organization."
    
    def has_permission(self, request: Request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        
        tenant_id = self._get_tenant_id(request)
        if not tenant_id:
            return False
        
        return self._check_admin_role(request.user, tenant_id)
    
    def _get_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request context."""
        if hasattr(request, 'tenant_context') and request.tenant_context:
            return str(request.tenant_context.tenant_id)
        
        tenant_id = request.headers.get('X-Tenant-ID')
        if tenant_id:
            return tenant_id
        
        try:
            from apps.crm.middleware import get_current_tenant_id
            return get_current_tenant_id()
        except (ImportError, AttributeError):
            pass
        
        return None
    
    def _check_admin_role(self, user: User, tenant_id: str) -> bool:
        """Check if user has admin role in organization."""
        try:
            from apps.organizations.models import Organization, OrganizationMember
            
            # Check for admin role
            is_admin = OrganizationMember.objects.filter(
                user=user,
                organization_id=tenant_id,
                role='admin',
                is_active=True,
            ).exists()
            
            if is_admin:
                return True
            
            # Check if owner (implicit admin)
            is_owner = Organization.objects.filter(
                id=tenant_id,
                owner=user,
            ).exists()
            
            return is_owner
            
        except Exception as e:
            logger.error(f"Error checking admin role: {e}")
            return False


class HasTenantContext(permissions.BasePermission):
    """
    Permission class that requires valid tenant context.
    
    Use this to ensure request has tenant context before processing.
    """
    
    message = "Valid tenant context is required."
    
    def has_permission(self, request: Request, view) -> bool:
        if not hasattr(request, 'tenant_context'):
            return False
        
        return request.tenant_context is not None


class CanAccessSpecialCategoryData(permissions.BasePermission):
    """
    Permission class for GDPR Article 9 special category data access.
    
    Requires user to have explicit authorization for accessing
    religious affiliation and sacramental data.
    """
    
    message = "You are not authorized to access special category data."
    
    def has_permission(self, request: Request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        
        tenant_id = self._get_tenant_id(request)
        if not tenant_id:
            return False
        
        # Check if user has appropriate role for special category data
        try:
            from apps.organizations.models import OrganizationMember
            
            allowed_roles = ['admin', 'editor']  # Viewers cannot access
            
            membership = OrganizationMember.objects.filter(
                user=request.user,
                organization_id=tenant_id,
                role__in=allowed_roles,
                is_active=True,
            ).exists()
            
            return membership
            
        except Exception as e:
            logger.error(f"Error checking special category access: {e}")
            return False
    
    def _get_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request context."""
        if hasattr(request, 'tenant_context') and request.tenant_context:
            return str(request.tenant_context.tenant_id)
        
        try:
            from apps.crm.middleware import get_current_tenant_id
            return get_current_tenant_id()
        except (ImportError, AttributeError):
            pass
        
        return None


class CanProcessFinancialData(permissions.BasePermission):
    """
    Permission class for PCI-DSS compliant financial data access.
    
    SOC2 CC6.1 / PCI-DSS Req. 7 - Access Control for Cardholder Data
    """
    
    message = "You are not authorized to process financial data."
    
    def has_permission(self, request: Request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        
        tenant_id = self._get_tenant_id(request)
        if not tenant_id:
            return False
        
        # Only admins can process financial data
        try:
            from apps.organizations.models import Organization, OrganizationMember
            
            is_admin = OrganizationMember.objects.filter(
                user=request.user,
                organization_id=tenant_id,
                role='admin',
                is_active=True,
            ).exists()
            
            if is_admin:
                return True
            
            is_owner = Organization.objects.filter(
                id=tenant_id,
                owner=request.user,
            ).exists()
            
            return is_owner
            
        except Exception as e:
            logger.error(f"Error checking financial data access: {e}")
            return False
    
    def _get_tenant_id(self, request: Request) -> Optional[str]:
        """Extract tenant ID from request context."""
        if hasattr(request, 'tenant_context') and request.tenant_context:
            return str(request.tenant_context.tenant_id)
        
        try:
            from apps.crm.middleware import get_current_tenant_id
            return get_current_tenant_id()
        except (ImportError, AttributeError):
            pass
        
        return None


# Convenience aliases
IsTenantMember = IsOrganizationMember
IsTenantAdmin = IsOrganizationAdmin
