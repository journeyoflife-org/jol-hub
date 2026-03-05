"""
Analytics views.
"""

from datetime import date, timedelta
from django.db.models import Sum, Avg, Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DailyStats, PageView
from .serializers import DailyStatsSerializer, AnalyticsOverviewSerializer


class AnalyticsOverviewView(APIView):
    """GET /api/v1/analytics/overview/?organization_id=&start_date=&end_date="""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        org_id = request.query_params.get('organization_id')
        start = request.query_params.get('start_date', str(date.today() - timedelta(days=30)))
        end = request.query_params.get('end_date', str(date.today()))

        qs = DailyStats.objects.filter(
            organization_id=org_id,
            date__range=[start, end],
        )

        agg = qs.aggregate(
            total_page_views=Sum('page_views'),
            total_unique_visitors=Sum('unique_visitors'),
            total_sessions=Sum('sessions'),
            avg_bounce_rate=Avg('bounce_rate'),
            avg_session_duration=Avg('avg_session_duration'),
            total_donations=Sum('total_donations'),
            donation_count=Sum('donation_count'),
        )

        payload = {
            'organization_id': org_id,
            'start_date': start,
            'end_date': end,
            **{k: v or 0 for k, v in agg.items()},
        }
        return Response(AnalyticsOverviewSerializer(payload).data)


class DailyStatsListView(APIView):
    """GET /api/v1/analytics/daily/?organization_id="""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        org_id = request.query_params.get('organization_id')
        qs = DailyStats.objects.filter(organization_id=org_id).order_by('-date')[:90]
        return Response(DailyStatsSerializer(qs, many=True).data)
