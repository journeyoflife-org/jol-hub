"""
Content views — tenant-scoped.

C3 fix: querysets auto-scoped by TenantScopedFilterBackend.
Client organization_id parameter removed.
"""
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsOrganizationMember
from apps.tenants.filters import TenantScopedFilterBackend

from .models import MediaFile, Page
from .serializers import MediaFileSerializer, PageCreateSerializer, PageSerializer


class PageListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/v1/content/pages/ — tenant-scoped."""

    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [TenantScopedFilterBackend]

    def get_serializer_class(self):
        return PageCreateSerializer if self.request.method == "POST" else PageSerializer

    def get_queryset(self):
        # TenantScopedFilterBackend handles org scoping
        qs = Page.objects.filter(is_deleted=False).select_related(
            "author", "featured_image"
        )
        lang = self.request.query_params.get("language")
        page_status = self.request.query_params.get("status")
        if lang:
            qs = qs.filter(language=lang)
        if page_status:
            qs = qs.filter(status=page_status)
        return qs


class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/v1/content/pages/{id}/ — tenant-scoped."""

    serializer_class = PageSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return Page.objects.filter(is_deleted=False)


class PagePublishView(APIView):
    """POST /api/v1/content/pages/{id}/publish/"""

    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def post(self, request, pk):
        from apps.crm.middleware import get_current_tenant_id

        tenant_id = get_current_tenant_id()
        page = Page.objects.get(pk=pk, is_deleted=False, organization_id=tenant_id)
        page.publish()
        return Response(PageSerializer(page).data)


class MediaFileListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/v1/content/media/ — tenant-scoped."""

    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]
    filter_backends = [TenantScopedFilterBackend]

    def get_queryset(self):
        return MediaFile.objects.filter(is_deleted=False)

    def perform_create(self, serializer):
        from apps.crm.middleware import get_current_tenant_id
        from apps.organizations.models import Organization

        tenant_id = get_current_tenant_id()
        org = Organization.objects.get(id=tenant_id)
        serializer.save(uploaded_by=self.request.user, organization=org)


class MediaFileDetailView(generics.RetrieveDestroyAPIView):
    """GET / DELETE /api/v1/content/media/{id}/ — tenant-scoped."""

    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated, IsOrganizationMember]

    def get_queryset(self):
        return MediaFile.objects.filter(is_deleted=False)
