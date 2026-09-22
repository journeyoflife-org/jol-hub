"""
CRM API URL Configuration

GDPR Article 9 Hardened CRM Endpoints
"""

from rest_framework.routers import DefaultRouter

from django.urls import include, path

from .views import (AuditEntryViewSet, Bitrix24SyncViewSet, ContactViewSet,
                    DataSubjectRequestViewSet, DealViewSet)

router = DefaultRouter()
router.register(r"contacts", ContactViewSet, basename="crm-contact")
router.register(r"deals", DealViewSet, basename="crm-deal")
router.register(r"gdpr/requests", DataSubjectRequestViewSet, basename="crm-dsr")
router.register(r"audit", AuditEntryViewSet, basename="crm-audit")

# Bitrix24 sync is a ViewSet without a model
bitrix24_router = DefaultRouter()
bitrix24_router.register(r"sync", Bitrix24SyncViewSet, basename="crm-bitrix24-sync")

urlpatterns = [
    path("", include(router.urls)),
    path("bitrix24/", include(bitrix24_router.urls)),
]
