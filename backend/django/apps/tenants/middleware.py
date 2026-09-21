"""
Tenant Entitlement Middleware — placeholder for Task 5.

Will be replaced with full entitlement-validating middleware.
"""


class TenantEntitlementMiddleware:
    """Placeholder — full implementation in Task 5."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)
