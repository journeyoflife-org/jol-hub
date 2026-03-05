from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Invoice, Payout
from .serializers import InvoiceSerializer, PayoutSerializer


class InvoiceListView(generics.ListAPIView):
    """GET /api/v1/financial/invoices/?organization_id="""

    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get('organization_id')
        qs = Invoice.objects.filter(is_deleted=False)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs


class InvoiceDetailView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    queryset = Invoice.objects.filter(is_deleted=False)


class PayoutListView(generics.ListAPIView):
    """GET /api/v1/financial/payouts/?organization_id="""

    serializer_class = PayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org_id = self.request.query_params.get('organization_id')
        qs = Payout.objects.filter(is_deleted=False)
        if org_id:
            qs = qs.filter(organization_id=org_id)
        return qs
