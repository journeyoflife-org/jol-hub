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
            'device_type', 'duration_seconds', 'created_at',
        ]
        read_only_fields = fields


class AnalyticsOverviewSerializer(serializers.Serializer):
    """Aggregated overview response — not a ModelSerializer."""

    organization_id = serializers.UUIDField()
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    total_page_views = serializers.IntegerField()
    total_unique_visitors = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    avg_bounce_rate = serializers.DecimalField(max_digits=5, decimal_places=2)
    avg_session_duration = serializers.IntegerField()
    total_donations = serializers.DecimalField(max_digits=12, decimal_places=2)
    donation_count = serializers.IntegerField()
