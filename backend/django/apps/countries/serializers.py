from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import Country


class CountrySerializer(BaseModelSerializer):
    class Meta:
        model = Country
        fields = [
            'id', 'code', 'name', 'native_name', 'currency',
            'default_language', 'timezone', 'gdpr_consent_age',
            'vat_rate', 'supervisory_authority', 'supervisory_authority_url',
            'supported_payment_methods', 'feature_flags',
        ]
        read_only_fields = fields
