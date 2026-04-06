"""
Analytics serializers.
"""

from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import DailyStats, PageView


class DailyStatsSerializer(BaseModelSerializer):
    class Meta:
        model = DailyStats
        fields = [
            'id', 'organization', 'date',
            'page_views', 'unique_visitors', 'sessions',
            'bounce_rate', 'avg_session_duration', 'new_visitors',
            'total_donations', 'donation_count',
            'created_at',
        ]
        read_only_fields = fields


class PageViewSerializer(BaseModelSerializer):
    class Meta:
        model = PageView
        fields = [
            'id', 'organization', 'page_path', 'referrer',
            'session_id', 'country_code', 'language',
            'device_type', 'duration_seconds', 'consent_given', 'consent_version',
            'created_at',
        ]
        read_only_fields = fields


class AnalyticsOverviewSerializer(serializers.Serializer):
    """
    Aggregated overview response — not a ModelSerializer.
    
    GDPR Art. 7, Art. 13 - Consent status tracking:
    - consent_status indicates whether analytics consent is granted
    """

    organization_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    consent_status = serializers.CharField(required=False, default='not_granted')
    total_page_views = serializers.IntegerField()
    total_unique_visitors = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    avg_bounce_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_session_duration = serializers.IntegerField()
    total_donations = serializers.DecimalField(max_digits=12, decimal_places=2)
    donation_count = serializers.IntegerField()


class TopParishSerializer(serializers.Serializer):
    """
    Top parish response with k-anonymity applied.
    
    GDPR Article 5(1)(f) - Privacy by design.
    Small parishes (< k) are anonymized or aggregated.
    """
    
    id = serializers.CharField()
    name = serializers.CharField()
    country = serializers.CharField(max_length=2)
    visitors = serializers.IntegerField()
    donations = serializers.DecimalField(max_digits=12, decimal_places=2)
    is_anonymized = serializers.BooleanField(default=False)
