"""
Tenant Entitlement Middleware — fail-closed replacement for crm.middleware.

C2 fix: validates X-Tenant-ID against the user's entitlement set.
D7: Server-signed entitlement claim + membership/hierarchy validation.
"""

import logging
from typing import Optional

from apps.crm.middleware import TenantContext, clear_tenant_context, set_tenant_context
from apps.tenants.entitlement import get_primary_tenant, is_entitled_for_tenant
from django.http import HttpRequest, HttpResponse, JsonResponse

logger = logging.getLogger("jolhub.tenant.security")

# Paths that do NOT require tenant context
TENANT_EXEMPT_PATHS = {
    "/health/",
    "/health/ready/",
    "/metrics/",
    "/api/v1/auth/login/",
    "/api/v1/auth/register/",
    "/api/v1/auth/refresh/",
    "/api/schema/",
    "/api/docs/",
    "/api/redoc/",
    "/admin/",
    "/accounts/",
}


class TenantEntitlementMiddleware:
    """
    Validates tenant entitlement for every authenticated request.

    Resolution order:
    1. JWT tenant_id claim (server-signed — trusted)
    2. X-Tenant-ID header (validated against entitlement)
    3. User's primary entitlement (auto-select)

    Fail-closed: no entitlement -> 403 for API, pass for exempt paths.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        # Skip for exempt paths
        if any(request.path.startswith(p) for p in TENANT_EXEMPT_PATHS):
            return self.get_response(request)

        # Skip for unauthenticated requests (DRF permissions handle these)
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return self.get_response(request)

        try:
            tenant_id = self._resolve_tenant(request)

            if not tenant_id:
                # No tenant could be resolved — deny for API paths
                if request.path.startswith("/api/"):
                    logger.warning(
                        "TENANT_DENY: no tenant context for user=%s path=%s",
                        request.user.id,
                        request.path,
                    )
                    return JsonResponse(
                        {"error": "tenant_context_required"},
                        status=403,
                    )
                return self.get_response(request)

            # Validate entitlement
            if not is_entitled_for_tenant(request.user, tenant_id):
                logger.warning(
                    "TENANT_DENY: user=%s not entitled for tenant=%s path=%s",
                    request.user.id,
                    tenant_id,
                    request.path,
                )
                # 404 — not 403 — no enumeration (D6)
                return JsonResponse({"error": "not_found"}, status=404)

            # Build and set tenant context
            self._set_context(request, tenant_id)

        except Exception as exc:
            logger.error("TENANT_ERROR: %s user=%s", exc, request.user.id)
            return JsonResponse({"error": "tenant_resolution_failed"}, status=500)

        try:
            response = self.get_response(request)
        finally:
            clear_tenant_context()

        return response

    def _resolve_tenant(self, request: HttpRequest) -> Optional[str]:
        """Resolve tenant ID from request sources (priority order)."""
        # 1. JWT claim (server-signed)
        jwt_tenant = self._get_jwt_tenant(request)
        if jwt_tenant:
            return jwt_tenant

        # 2. X-Tenant-ID header
        header_tenant = request.headers.get("X-Tenant-ID")
        if header_tenant:
            return header_tenant

        # 3. Primary entitlement (auto-select)
        primary = get_primary_tenant(request.user)
        if primary:
            return str(primary.id)

        return None

    def _get_jwt_tenant(self, request: HttpRequest) -> Optional[str]:
        """Extract tenant_id from JWT access token."""
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication

            auth = JWTAuthentication()
            result = auth.authenticate(request)
            if result:
                _, token = result
                return token.get("tenant_id")
        except Exception:
            pass
        return None

    def _set_context(self, request: HttpRequest, tenant_id: str):
        """Build TenantContext and set in thread-local."""
        from apps.organizations.models import Organization

        try:
            org = Organization.objects.get(id=tenant_id)
            context = TenantContext(
                tenant_id=str(org.id),
                tenant_name=org.name,
                country_code=org.country,
                data_residency_region="EU",  # All JOL tenants are EU
                compliance_level=org.compliance_level,
                request_id=request.headers.get("X-Request-ID", ""),
                user_id=str(request.user.id),
                ip_address=self._get_client_ip(request),
            )
            set_tenant_context(context)
            request.tenant_context = context

            # RLS defense-in-depth (C4)
            from apps.tenants.rls import set_tenant_id_for_request

            set_tenant_id_for_request(str(org.id))
        except Organization.DoesNotExist:
            logger.warning("TENANT_RESOLVE: org not found tenant_id=%s", tenant_id)
            raise

    def _get_client_ip(self, request: HttpRequest) -> str:
        xff = request.headers.get("X-Forwarded-For")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "0.0.0.0")
