"""
DRF filter backend that auto-scopes querysets to the current tenant.

C3 fix: removes client-controlled organization_id filtering.
"""

import logging

from rest_framework.filters import BaseFilterBackend

logger = logging.getLogger("jolhub.tenant.filters")


class TenantScopedFilterBackend(BaseFilterBackend):
    """
    Auto-filters querysets to the current tenant's organization.

    For any model with an `organization` FK, this backend injects
    `.filter(organization_id=<tenant_id>)` into the queryset.

    The client-supplied `organization_id` query parameter is IGNORED.
    """

    def filter_queryset(self, request, queryset, view):
        from apps.crm.middleware import get_current_tenant_id

        tenant_id = get_current_tenant_id()

        if not tenant_id:
            # No tenant context — return empty queryset (fail-closed)
            logger.warning(
                "TENANT_FILTER: no tenant context, returning empty qs. "
                "user=%s model=%s",
                getattr(request, "user", None),
                queryset.model.__name__,
            )
            return queryset.none()

        # Check if model has organization FK
        model = queryset.model
        if hasattr(model, "organization_id") or hasattr(model, "organization"):
            queryset = queryset.filter(organization_id=tenant_id)

        return queryset
