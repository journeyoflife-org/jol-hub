"""
Content views.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Page, MediaFile
from .serializers import PageSerializer, PageCreateSerializer, MediaFileSerializer


class PageListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/v1/content/pages/"""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return PageCreateSerializer if self.request.method == 'POST' else PageSerializer

    def get_queryset(self):
        qs = Page.objects.filter(is_deleted=False).select_related('author', 'featured_image')
        org_id = self.request.query_params.get('organization_id')
        lang = self.request.query_params.get('language')
        page_status = self.request.query_params.get('status')
        if org_id:
            qs = qs.filter(organization_id=org_id)
        if lang:
            qs = qs.filter(language=lang)
        if page_status:
            qs = qs.filter(status=page_status)
        return qs


class PageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/v1/content/pages/{id}/"""

    serializer_class = PageSerializer
    permission_classes = [IsAuthenticated]
    queryset = Page.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.soft_delete()


class PagePublishView(APIView):
    """POST /api/v1/content/pages/{id}/publish/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        page = Page.objects.get(pk=pk, is_deleted=False)
        page.publish()
        return Response(PageSerializer(page).data)


class MediaFileListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/v1/content/media/"""

    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = MediaFile.objects.filter(is_deleted=False)
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class MediaFileDetailView(generics.RetrieveDestroyAPIView):
    """GET / DELETE /api/v1/content/media/{id}/"""

    serializer_class = MediaFileSerializer
    permission_classes = [IsAuthenticated]
    queryset = MediaFile.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.soft_delete()
