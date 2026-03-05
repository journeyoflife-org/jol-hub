"""
Donation serializers.
"""

from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import Donation


class DonationSerializer(BaseModelSerializer):
    class Meta:
        model = Donation
        fields = [
            'id', 'organization', 'donor',
            'amount', 'currency', 'status', 'payment_method',
            'transaction_id',
            'donor_email', 'donor_name', 'is_anonymous',
            'is_recurring', 'frequency', 'next_charge_at',
            'gift_aid', 'dedicated_to', 'message',
            'processed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'transaction_id', 'gateway_response',
            'processed_at', 'created_at', 'updated_at',
        ]


class DonationCreateSerializer(BaseModelSerializer):
    class Meta:
        model = Donation
        fields = [
            'organization', 'amount', 'currency', 'payment_method',
            'donor_email', 'donor_name', 'is_anonymous',
            'is_recurring', 'frequency',
            'gift_aid', 'dedicated_to', 'message',
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data.setdefault('donor', user)
            validated_data.setdefault('donor_email', user.email)
        return super().create(validated_data)
