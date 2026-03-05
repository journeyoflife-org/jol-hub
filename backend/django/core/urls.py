"""
JOL-HUB URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/

Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


def health_check(request):
    """
    Health check endpoint for load balancers and monitoring.
    
    Returns:
        JSON response with service status
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'jol-hub-api',
        'version': '1.0.0',
        'environment': getattr(settings, 'ENVIRONMENT', 'unknown'),
    })


def maintenance_mode_view(request):
    """
    Maintenance mode view displayed when system is under maintenance.
    """
    return TemplateView.as_view(template_name='maintenance.html')(request)


# Base URL patterns
urlpatterns = [
    # Health check endpoint
    path('health/', health_check, name='health-check'),
    
    # Django Admin
    path('admin/', admin.site.urls, name='admin'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('apps.users.api.urls', namespace='auth')),
    path('api/v1/organizations/', include('apps.organizations.api.urls', namespace='organizations')),
    path('api/v1/users/', include('apps.users.api.urls', namespace='users')),
    path('api/v1/content/', include('apps.content.api.urls', namespace='content')),
    path('api/v1/donations/', include('apps.donations.api.urls', namespace='donations')),
    path('api/v1/analytics/', include('apps.analytics.api.urls', namespace='analytics')),
    path('api/v1/countries/', include('apps.countries.api.urls', namespace='countries')),
    
    # Allauth (social authentication)
    path('accounts/', include('allauth.urls')),
    
    # Django-RQ (if using Redis Queue)
    # path('django-rq/', include('django_rq.urls')),
    
    # Debug toolbar (only in development)
    # path('__debug__/', include('debug_toolbar.urls')),
]

# Add static and media file serving in development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # Add debug toolbar URLs
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        urlpatterns += [
            path('__debug__/', include('debug_toolbar.urls')),
        ]
    
    # Add Silk profiler URLs (if enabled)
    if 'silk' in settings.INSTALLED_APPS:
        urlpatterns += [
            path('silk/', include('silk.urls', namespace='silk')),
        ]

# Custom error handlers
handler400 = 'apps.core.views.bad_request'
handler403 = 'apps.core.views.permission_denied'
handler404 = 'apps.core.views.page_not_found'
handler500 = 'apps.core.views.server_error'

# Maintenance mode (optional)
if getattr(settings, 'MAINTENANCE_MODE', False):
    # Override all URLs except admin and health check
    urlpatterns = [
        path('health/', health_check, name='health-check'),
        path('admin/', admin.site.urls, name='admin'),
        path('', maintenance_mode_view, name='maintenance-mode'),
    ] + urlpatterns

# =============================================================================
# URL CONFIGURATION NOTES
# =============================================================================

"""
URL Structure:
--------------

Public APIs:
    /api/v1/                    - API version 1 root
    
Authentication:
    /api/v1/auth/login/         - User login
    /api/v1/auth/logout/        - User logout
    /api/v1/auth/refresh/       - Token refresh
    /api/v1/auth/password/      - Password management
    /accounts/                  - Social authentication (allauth)

Organizations:
    /api/v1/organizations/              - List/Create organizations
    /api/v1/organizations/{id}/         - Retrieve/Update/Delete organization
    /api/v1/organizations/{id}/website/ - Get organization website
    /api/v1/organizations/{id}/members/ - Organization members

Users:
    /api/v1/users/              - List/Create users
    /api/v1/users/{id}/         - Retrieve/Update/Delete user
    /api/v1/users/me/           - Current user profile
    /api/v1/users/me/profile/   - Update current user profile

Content:
    /api/v1/content/pages/              - List/Create pages
    /api/v1/content/pages/{id}/         - Retrieve/Update/Delete page
    /api/v1/content/pages/{id}/publish/ - Publish page
    /api/v1/content/media/              - Media file uploads
    /api/v1/content/templates/          - Page templates

Donations:
    /api/v1/donations/                  - Create/List donations
    /api/v1/donations/{id}/             - Retrieve donation
    /api/v1/donations/{id}/refund/      - Refund donation
    /api/v1/donations/payment-methods/  - Available payment methods
    /api/v1/donations/webhooks/         - Payment webhooks

Analytics:
    /api/v1/analytics/overview/         - Analytics overview
    /api/v1/analytics/page-views/       - Page view statistics
    /api/v1/analytics/visitors/         - Visitor analytics
    /api/v1/analytics/reports/          - Generate reports

Countries:
    /api/v1/countries/                  - List countries
    /api/v1/countries/{code}/           - Country details
    /api/v1/countries/{code}/config/    - Country configuration

Admin:
    /admin/                     - Django admin interface

Documentation:
    /api/docs/                  - Swagger UI
    /api/redoc/                 - ReDoc
    /api/schema/                - OpenAPI schema

Monitoring:
    /health/                    - Health check endpoint

Error Pages:
    /400/                       - Bad request
    /403/                       - Permission denied
    /404/                       - Page not found
    /500/                       - Server error

Versioning Strategy:
--------------------

We use URL path versioning for our API:
    - Current version: v1
    - Version parameter: /api/v1/...
    - Backward compatibility maintained for one previous version

Namespace Usage:
----------------

Each app has its own URL namespace for reverse URL lookups:
    - auth: Authentication endpoints
    - organizations: Organization management
    - users: User management
    - content: Content management
    - donations: Donation processing
    - analytics: Analytics and reporting
    - countries: Country configurations

Example usage in code:
    from django.urls import reverse
    url = reverse('organizations:organization-detail', kwargs={'pk': org_id})

Conditional URLs:
-----------------

Some URLs are only included in specific environments:
    - Debug toolbar: Only in DEBUG mode
    - Silk profiler: Only when explicitly enabled
    - Django-RQ: When using Redis Queue

Maintenance Mode:
-----------------

When MAINTENANCE_MODE is True:
    - All URLs redirect to maintenance page
    - Except: /admin/ and /health/
    - Allows administrators to access system

Best Practices:
---------------

1. Always use namespaces for app URLs
2. Use named URL patterns for reverse lookups
3. Keep API URLs versioned
4. Document URL structure in this file
5. Use include() for modularity
6. Validate URL parameters in views
7. Implement proper HTTP method handling
8. Return appropriate HTTP status codes
9. Use consistent URL naming conventions (lowercase, hyphens)
10. Keep URLs RESTful where possible
"""
