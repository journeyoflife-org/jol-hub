"""
Entitlement service — resolves the user's entitled tenant set.

Source of truth for "which tenants may I act as."
Resolves direct OrganizationMember + hierarchical children
via parent_diocese (diocese->deanery->parish).

D8: Hierarchical entitlement model.
"""

import logging
from typing import Optional, Set

from django.contrib.auth import get_user_model

logger = logging.getLogger("jolhub.entitlement")

User = get_user_model()


def get_entitled_tenants(user) -> list:
    """
    Resolve the full set of organizations the user is entitled to act as.

    Algorithm:
    1. Find all direct memberships (OrganizationMember)
    2. For each membership, walk DOWN the hierarchy via parent_diocese
    3. Return the union (deduplicated)

    Returns a list of Organization instances.
    """
    from apps.organizations.models import Organization, OrganizationMember

    # Step 1: Direct memberships
    direct_memberships = OrganizationMember.objects.filter(
        user=user, is_deleted=False
    ).values_list("organization_id", flat=True)

    if not direct_memberships:
        # Check owned organizations
        owned = Organization.objects.filter(owner=user, status="active")
        return list(owned)

    # Step 2: For each direct org, find all descendants
    entitled_ids: Set[str] = set()

    for org_id in direct_memberships:
        entitled_ids.add(str(org_id))
        _collect_descendants(str(org_id), entitled_ids)

    return list(Organization.objects.filter(id__in=entitled_ids))


def _collect_descendants(org_id: str, accumulator: Set[str]):
    """Recursively collect all child organizations via parent_diocese."""
    from apps.organizations.models import Organization

    children = Organization.objects.filter(
        parent_diocese_id=org_id, status="active"
    ).values_list("id", flat=True)

    for child_id in children:
        child_str = str(child_id)
        if child_str not in accumulator:
            accumulator.add(child_str)
            _collect_descendants(child_str, accumulator)


def is_entitled_for_tenant(user, tenant_id) -> bool:
    """
    Check if user is entitled to act as the given tenant.

    Used by middleware to validate X-Tenant-ID / JWT tenant_id.
    """
    entitled = get_entitled_tenants(user)
    entitled_ids = {str(org.id) for org in entitled}
    return str(tenant_id) in entitled_ids


def get_primary_tenant(user) -> Optional[object]:
    """
    Get the user's primary (first) entitled organization.

    Used during JWT minting to embed tenant_id claim.
    Preference: direct membership -> first entitled org.
    """
    from apps.organizations.models import OrganizationMember

    membership = (
        OrganizationMember.objects.filter(user=user, is_deleted=False)
        .select_related("organization")
        .order_by("organization__name")
        .first()
    )
    if membership:
        return membership.organization

    from apps.organizations.models import Organization

    return Organization.objects.filter(owner=user, status="active").first()
