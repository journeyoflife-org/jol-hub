from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import Invoice, Payout


class InvoiceSerializer(BaseModelSerializer):
    class Meta:
        model = Invoice
        fields = [
            'id', 'organization', 'invoice_number', 'status',
            'issue_date', 'due_date', 'paid_date',
            'currency', 'subtotal', 'vat_rate', 'vat_amount', 'total',
            'notes', 'line_items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'invoice_number', 'created_at', 'updated_at']


class PayoutSerializer(BaseModelSerializer):
    class Meta:
        model = Payout
        fields = [
            'id', 'organization', 'amount', 'currency', 'status',
            'bank_account_last4', 'reference', 'processed_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'processed_at', 'created_at', 'updated_at']
