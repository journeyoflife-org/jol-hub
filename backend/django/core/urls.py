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
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)


def maintenance_mode_view(request):
    """
    Maintenance mode view displayed when system is under maintenance.
    """
    return TemplateView.as_view(template_name='maintenance.html')(request)


# Base URL patterns
urlpatterns = [
    # Core app: health probes, Prometheus metrics, audit log
    # Mounts at root level so /health/, /health/ready/, /metrics/ are top-level.
    path('', include('apps.core.urls')),

    # Django Admin
    path('admin/', admin.site.urls, name='admin'),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API v1 endpoints
    path('api/v1/auth/', include('apps.users.auth_urls')),
    path('api/v1/organizations/', include('apps.organizations.urls')),
    path('api/v1/users/', include('apps.users.urls')),
    path('api/v1/content/', include('apps.content.urls')),
    path('api/v1/donations/', include('apps.donations.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
    path('api/v1/countries/', include('apps.countries.urls')),
    path('api/v1/integrations/', include('apps.integrations.urls')),
    path('api/v1/financial/', include('apps.financial.urls')),
    path('api/v1/crm/', include('apps.crm.api.urls')),

    # Internal ingress: marketplace payment events (contract v1.0.0;
    # flag-gated receiver, ADR-009 Model A — hub never touches the PSP).
    path('internal/v1/', include('apps.payment_events.urls')),
    
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
    # Override all URLs except admin and health/metrics (served from core app)
    urlpatterns = [
        path('', include('apps.core.urls')),
        path('admin/', admin.site.urls, name='admin'),
        path('', maintenance_mode_view, name='maintenance-mode'),
    ] + urlpatterns
