"""
Organization views.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Organization, OrganizationMember, Website
from .serializers import (
    OrganizationSerializer, OrganizationCreateSerializer,
    OrganizationMemberSerializer, WebsiteSerializer,
)


class OrganizationListCreateView(generics.ListCreateAPIView):
    """GET /api/v1/organizations/  — list + create."""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return OrganizationCreateSerializer if self.request.method == 'POST' else OrganizationSerializer

    def get_queryset(self):
        qs = Organization.objects.filter(is_deleted=False)
        country = self.request.query_params.get('country')
        org_type = self.request.query_params.get('type')
        status_filter = self.request.query_params.get('status')
        if country:
            qs = qs.filter(country=country)
        if org_type:
            qs = qs.filter(org_type=org_type)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/v1/organizations/{id}/"""

    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    queryset = Organization.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.soft_delete()


class OrganizationWebsiteView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/v1/organizations/{id}/website/"""

    serializer_class = WebsiteSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        org = Organization.objects.get(pk=self.kwargs['pk'], is_deleted=False)
        website, _ = Website.objects.get_or_create(organization=org)
        return website


class OrganizationMemberListView(generics.ListCreateAPIView):
    """GET / POST /api/v1/organizations/{id}/members/"""

    serializer_class = OrganizationMemberSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return OrganizationMember.objects.filter(
            organization_id=self.kwargs['pk'],
            is_deleted=False,
        ).select_related('user')
