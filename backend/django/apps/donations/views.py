"""
Donation views.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Donation
from .serializers import DonationSerializer, DonationCreateSerializer


class DonationListCreateView(generics.ListCreateAPIView):
    """GET / POST /api/v1/donations/"""

    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        return DonationCreateSerializer if self.request.method == 'POST' else DonationSerializer

    def get_queryset(self):
        return Donation.objects.filter(
            donor=self.request.user, is_deleted=False,
        ).select_related('organization')


class DonationDetailView(generics.RetrieveAPIView):
    """GET /api/v1/donations/{id}/"""

    serializer_class = DonationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Donation.objects.filter(is_deleted=False)


class DonationRefundView(APIView):
    """POST /api/v1/donations/{id}/refund/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        donation = Donation.objects.get(pk=pk, is_deleted=False)
        if donation.status != Donation.STATUS_COMPLETED:
            return Response(
                {'error': 'invalid_state', 'message': 'Only completed donations can be refunded.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Trigger refund via payment gateway (integration delegated to apps.integrations)
        donation.status = Donation.STATUS_REFUNDED
        donation.save(update_fields=['status', 'updated_at'])
        return Response(DonationSerializer(donation).data)
