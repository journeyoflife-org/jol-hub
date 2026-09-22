"""
D8: Hierarchical entitlement tests.

diocese admin -> reaches all deaneries + parishes below
deanery admin -> reaches all parishes below
parish admin -> reaches own parish only
cross-branch -> DENIED
"""

import pytest

from apps.organizations.models import Organization, OrganizationMember
from apps.tenants.entitlement import (
    get_entitled_tenants,
    get_primary_tenant,
    is_entitled_for_tenant,
)
from apps.users.models import User


@pytest.mark.django_db
class TestEntitlementService:

    def _create_hierarchy(self):
        """Create diocese -> deanery -> parish hierarchy."""
        diocese = Organization.objects.create(
            name="Vilnius Archdiocese",
            slug="vilnius-archdiocese",
            org_type="diocese",
            country="LT",
            status="active",
            schema_name="t_vilnius_archdiocese",
        )
        deanery = Organization.objects.create(
            name="Vilnius Deanery",
            slug="vilnius-deanery",
            org_type="deanery",
            country="LT",
            status="active",
            schema_name="t_vilnius_deanery",
            parent_diocese=diocese,
        )
        parish_a = Organization.objects.create(
            name="Basilica Vilnius",
            slug="basilica-vilnius",
            org_type="basilica",
            country="LT",
            status="active",
            schema_name="t_basilica_vilnius",
            parent_diocese=deanery,
        )
        parish_b = Organization.objects.create(
            name="Parish Kaunas",
            slug="parish-kaunas",
            org_type="parish",
            country="LT",
            status="active",
            schema_name="t_parish_kaunas",
            parent_diocese=None,
        )
        # Set tenant context for subsequent OrganizationMember creation
        from apps.tenants.test_utils import set_test_tenant_context

        set_test_tenant_context(diocese)
        return diocese, deanery, parish_a, parish_b

    def test_diocese_admin_entitled_to_all_children(self):
        """Diocese admin can act as any child deanery/parish."""
        diocese, deanery, parish_a, parish_b = self._create_hierarchy()
        user = User.objects.create_user(email="bishop@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=diocese, user=user, role="admin")
        from apps.tenants.test_utils import clear_test_tenant_context

        clear_test_tenant_context()

        entitled = get_entitled_tenants(user)
        entitled_ids = {str(t.id) for t in entitled}

        assert str(diocese.id) in entitled_ids
        assert str(deanery.id) in entitled_ids
        assert str(parish_a.id) in entitled_ids
        assert str(parish_b.id) not in entitled_ids  # different tree

    def test_deanery_admin_entitled_to_children_only(self):
        """Deanery admin can act as child parishes, not siblings."""
        diocese, deanery, parish_a, parish_b = self._create_hierarchy()
        user = User.objects.create_user(email="dean@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=deanery, user=user, role="admin")
        from apps.tenants.test_utils import clear_test_tenant_context

        clear_test_tenant_context()

        entitled = get_entitled_tenants(user)
        entitled_ids = {str(t.id) for t in entitled}

        assert str(deanery.id) in entitled_ids
        assert str(parish_a.id) in entitled_ids
        assert str(diocese.id) not in entitled_ids  # parent — not entitled
        assert str(parish_b.id) not in entitled_ids  # different tree

    def test_parish_admin_entitled_to_own_only(self):
        """Parish admin can only act as their own parish."""
        diocese, deanery, parish_a, parish_b = self._create_hierarchy()
        user = User.objects.create_user(email="rector@test.lt", password="Test1234!")
        OrganizationMember.objects.create(
            organization=parish_a, user=user, role="admin"
        )

        entitled = get_entitled_tenants(user)
        entitled_ids = {str(t.id) for t in entitled}

        assert str(parish_a.id) in entitled_ids
        assert len(entitled_ids) == 1

    def test_cross_tenant_denied(self):
        """User with no membership in tenant is denied."""
        diocese, deanery, parish_a, parish_b = self._create_hierarchy()
        user = User.objects.create_user(email="outsider@test.lt", password="Test1234!")

        assert not is_entitled_for_tenant(user, parish_a.id)
        assert not is_entitled_for_tenant(user, diocese.id)

    def test_viewer_role_entitled(self):
        """Viewer role still gets entitlement (read access)."""
        diocese, _, _, _ = self._create_hierarchy()
        user = User.objects.create_user(email="viewer@test.lt", password="Test1234!")
        OrganizationMember.objects.create(
            organization=diocese, user=user, role="viewer"
        )

        assert is_entitled_for_tenant(user, diocese.id)

    def test_get_primary_tenant_returns_first(self):
        """get_primary_tenant returns the first entitled org."""
        diocese, _, _, _ = self._create_hierarchy()
        user = User.objects.create_user(email="primary@test.lt", password="Test1234!")
        OrganizationMember.objects.create(organization=diocese, user=user, role="admin")

        primary = get_primary_tenant(user)
        assert primary is not None
        assert str(primary.id) == str(diocese.id)

    def test_no_membership_returns_empty(self):
        """User with no memberships gets empty entitlement set."""
        user = User.objects.create_user(email="nobody@test.lt", password="Test1234!")

        entitled = get_entitled_tenants(user)
        assert len(entitled) == 0
        assert get_primary_tenant(user) is None
