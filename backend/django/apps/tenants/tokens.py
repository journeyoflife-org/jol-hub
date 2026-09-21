"""
Custom JWT token classes with tenant claim injection.

C1: Server-signed tenant_id claim from entitlement service.
"""
from rest_framework_simplejwt.tokens import RefreshToken as BaseRefreshToken


class RefreshToken(BaseRefreshToken):
    """
    Refresh token with server-signed tenant_id claim.

    On for_user(), injects tenant_id from the user's primary entitlement.
    """

    @classmethod
    def for_user(cls, user):
        token = super().for_user(user)

        # Inject tenant_id from entitlement
        from apps.tenants.entitlement import get_primary_tenant
        tenant = get_primary_tenant(user)
        if tenant:
            token["tenant_id"] = str(tenant.id)

        return token
