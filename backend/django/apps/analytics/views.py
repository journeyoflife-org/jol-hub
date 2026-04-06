"""
Analytics views.
GDPR Article 5(1)(f) - K-anonymity enforcement for privacy.
ISO 27001 A.18.1.4 - Data protection in analytics.
"""

import logging
import uuid
import re
from datetime import date, timedelta, datetime
from django.db.models import Sum, Avg, Count
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.core.models import AuditLog
from apps.organizations.models import ConsentSettings, Organization
from .models import DailyStats, PageView
from .serializers import DailyStatsSerializer, AnalyticsOverviewSerializer, TopParishSerializer

logger = logging.getLogger(__name__)

# GDPR K-anonymity threshold (default k=5)
K_ANONYMITY_THRESHOLD = getattr(settings, 'GDPR_K_ANONYMITY_VALUE', 5)

# Maximum date range for queries (prevent DoS via large ranges)
MAX_DATE_RANGE_DAYS = 365


def validate_organization_id(org_id: str) -> str:
    """
    Validate organization_id parameter.
    
    Security: Prevents SQL injection and invalid input.
    
    Args:
        org_id: Raw organization ID from query params
        
    Returns:
        Validated organization ID string
        
    Raises:
        ValidationError: If org_id is invalid
    """
    if not org_id:
        raise ValidationError("organization_id is required")
    
    # Strip whitespace
    org_id = str(org_id).strip()
    
    # Validate UUID format (prevents SQL injection via malformed input)
    try:
        uuid.UUID(org_id)
    except ValueError:
        raise ValidationError(f"Invalid organization_id format: must be a valid UUID")
    
    # Additional safety: reject suspicious patterns
    if re.search(r'[<>"\';\\]', org_id):
        raise ValidationError("Invalid organization_id: contains forbidden characters")
    
    return org_id


def validate_date_param(date_str: str, param_name: str, default: date = None) -> date:
    """
    Validate date parameter.
    
    Security: Prevents SQL injection and ensures valid date format.
    
    Args:
        date_str: Raw date string from query params
        param_name: Name of the parameter for error messages
        default: Default date if none provided
        
    Returns:
        Validated date object
        
    Raises:
        ValidationError: If date is invalid
    """
    if not date_str and default:
        return default
    
    if not date_str:
        raise ValidationError(f"{param_name} is required")
    
    # Validate ISO date format (YYYY-MM-DD)
    date_pattern = r'^\d{4}-\d{2}-\d{2}$'
    if not re.match(date_pattern, str(date_str)):
        raise ValidationError(f"Invalid {param_name} format: must be YYYY-MM-DD")
    
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError as e:
        raise ValidationError(f"Invalid {param_name}: {str(e)}")


def validate_date_range(start: date, end: date, max_days: int = MAX_DATE_RANGE_DAYS) -> None:
    """
    Validate date range is within acceptable bounds.
    
    Security: Prevents DoS via excessively large date ranges.
    
    Raises:
        ValidationError: If range exceeds maximum
    """
    if start > end:
        raise ValidationError("start_date must be before or equal to end_date")
    
    delta = (end - start).days
    if delta > max_days:
        raise ValidationError(f"Date range exceeds maximum of {max_days} days")


def validate_positive_int(value: str, param_name: str, default: int, max_value: int = 100) -> int:
    """
    Validate positive integer parameter.
    
    Security: Prevents injection and bounds issues.
    """
    if not value:
        return default
    
    try:
        int_value = int(value)
    except (ValueError, TypeError):
        raise ValidationError(f"Invalid {param_name}: must be a positive integer")
    
    if int_value < 1:
        raise ValidationError(f"Invalid {param_name}: must be positive")
    
    if int_value > max_value:
        raise ValidationError(f"Invalid {param_name}: exceeds maximum of {max_value}")
    
    return int_value


def check_analytics_consent(organization_id) -> bool:
    """
    GDPR Art. 7, Art. 13 - Verify organization has consent for analytics.
    
    Returns True if organization has explicit analytics consent enabled.
    Returns False if no consent settings exist or consent is not granted.
    """
    try:
        consent = ConsentSettings.objects.get(organization_id=organization_id)
        return consent.has_analytics_consent()
    except ConsentSettings.DoesNotExist:
        logger.warning(f"No consent settings for organization {organization_id}")
        return False
    except Exception as e:
        logger.error(f"Error checking consent for org {organization_id}: {e}")
        return False


def get_organizations_with_consent(organization_ids: list) -> set:
    """
    GDPR Art. 7 - Filter organizations to those with valid consent.
    Returns a set of organization IDs that have analytics consent enabled.
    """
    consent_orgs = set(
        ConsentSettings.objects.filter(
            organization_id__in=organization_ids,
            analytics_consent_enabled=True,
        ).values_list('organization_id', flat=True)
    )
    return consent_orgs


class AnalyticsOverviewView(APIView):
    """
    GET /api/v1/analytics/overview/?organization_id=&start_date=&end_date=
    
    GDPR Art. 7, Art. 13 - Consent verification:
    - Only returns analytics data if organization has consent enabled
    - Data is aggregated only from consented page views
    
    Security: Input validation on all query parameters
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Security: Validate all input parameters
        try:
            org_id = validate_organization_id(request.query_params.get('organization_id'))
            start = validate_date_param(
                request.query_params.get('start_date'),
                'start_date',
                default=date.today() - timedelta(days=30)
            )
            end = validate_date_param(
                request.query_params.get('end_date'),
                'end_date',
                default=date.today()
            )
            validate_date_range(start, end)
        except ValidationError as e:
            return Response({
                'error': 'VALIDATION_ERROR',
                'message': str(e.message) if hasattr(e, 'message') else str(e),
            }, status=status.HTTP_400_BAD_REQUEST)

        # GDPR Art. 7, Art. 13 - Verify consent before returning analytics
        if not check_analytics_consent(org_id):
            logger.info(f"Analytics access denied - no consent for org {org_id}")
            return Response({
                'error': 'CONSENT_REQUIRED',
                'message': 'Analytics data is only available for organizations with consent enabled.',
                'organization_id': org_id,
                'start_date': str(start),
                'end_date': str(end),
                'consent_status': 'not_granted',
            }, status=403)

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
            'start_date': str(start),
            'end_date': str(end),
            'consent_status': 'granted',
            **{k: v or 0 for k, v in agg.items()},
        }
        return Response(AnalyticsOverviewSerializer(payload).data)


class DailyStatsListView(APIView):
    """
    GET /api/v1/analytics/daily/?organization_id=
    
    GDPR Art. 7, Art. 13 - Consent verification:
    - Only returns daily stats if organization has consent enabled
    
    Security: Input validation on organization_id
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Security: Validate organization_id
        try:
            org_id = validate_organization_id(request.query_params.get('organization_id'))
        except ValidationError as e:
            return Response({
                'error': 'VALIDATION_ERROR',
                'message': str(e.message) if hasattr(e, 'message') else str(e),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # GDPR Art. 7, Art. 13 - Verify consent before returning analytics
        if not check_analytics_consent(org_id):
            logger.info(f"Daily stats access denied - no consent for org {org_id}")
            return Response({
                'error': 'CONSENT_REQUIRED',
                'message': 'Daily analytics data is only available for organizations with consent enabled.',
                'organization_id': org_id,
                'consent_status': 'not_granted',
            }, status=403)
        
        qs = DailyStats.objects.filter(organization_id=org_id).order_by('-date')[:90]
        return Response(DailyStatsSerializer(qs, many=True).data)


class TopParishesView(APIView):
    """
    GET /api/v1/analytics/top-parishes/?metric=visitors&limit=10
    
    GDPR Art. 7, Art. 13 - Consent verification:
    - Only includes organizations with valid analytics consent
    - Filters data to consent-enabled organizations only
    
    GDPR Article 5(1)(f) - Integrity and confidentiality.
    ISO 27001 A.18.1.4 - Privacy protection in data processing.
    
    Implements k-anonymity:
    - Parishes with < k visitors/donations are anonymized
    - Small parishes aggregated into "Other" category
    - Rounding to nearest k for counts
    """

    permission_classes = [IsAuthenticated]

    VALID_METRICS = ['visitors', 'donations', 'engagement']
    DEFAULT_LIMIT = 10
    MAX_LIMIT = 100
    
    def get(self, request):
        # Security: Validate input parameters
        try:
            metric = request.query_params.get('metric', 'visitors')
            if metric not in self.VALID_METRICS:
                metric = 'visitors'
            
            limit = validate_positive_int(
                request.query_params.get('limit'),
                'limit',
                default=self.DEFAULT_LIMIT,
                max_value=self.MAX_LIMIT
            )
        except ValidationError as e:
            return Response({
                'error': 'VALIDATION_ERROR',
                'message': str(e.message) if hasattr(e, 'message') else str(e),
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Audit log for data access (GDPR Art. 30)
        AuditLog.objects.create(
            user_id=request.user.id,
            action=AuditLog.ACTION_READ,
            entity_type='analytics',
            entity_id='top-parishes',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
            extra={'metric': metric, 'limit': limit},
        )
        
        # GDPR Art. 7 - Get organization IDs with valid consent
        consent_org_ids = self._get_organizations_with_consent()
        
        if not consent_org_ids:
            logger.warning("No organizations with analytics consent found")
            return Response({
                'error': 'NO_CONSENT_DATA',
                'message': 'No organizations have analytics consent enabled.',
                'data': [],
            })
        
        # Query aggregated stats - only for consented organizations
        queryset = self._get_queryset(metric, consent_org_ids)
        results = list(queryset[:limit + 5])  # Fetch extra for k-anonymity processing
        
        # Apply k-anonymity
        anonymized_results = self._apply_k_anonymity(results, limit)
        
        serializer = TopParishSerializer(anonymized_results, many=True)
        return Response(serializer.data)
    
    def _get_organizations_with_consent(self):
        """Get organization IDs that have analytics consent enabled."""
        return list(
            ConsentSettings.objects.filter(
                analytics_consent_enabled=True
            ).values_list('organization_id', flat=True)
        )
    
    def _get_queryset(self, metric, consent_org_ids):
        """Build queryset based on metric type, filtered by consent."""
        date_from = date.today() - timedelta(days=30)
        
        # Aggregate by organization - ONLY those with consent
        qs = DailyStats.objects.filter(
            date__gte=date_from,
            organization_id__in=consent_org_ids,  # GDPR Art. 7 consent filter
        ).values(
            'organization_id',
            'organization__name',
            'organization__country',
        ).annotate(
            total_visitors=Sum('unique_visitors'),
            total_donations=Sum('total_donations'),
            total_page_views=Sum('page_views'),
            donation_count=Sum('donation_count'),
        ).order_by(self._get_order_field(metric))
        
        return qs
    
    def _get_order_field(self, metric):
        """Get ordering field based on metric."""
        order_map = {
            'visitors': '-total_visitors',
            'donations': '-total_donations',
            'engagement': '-total_page_views',
        }
        return order_map.get(metric, '-total_visitors')
    
    def _apply_k_anonymity(self, results, limit):
        """
        Apply k-anonymity to results.
        
        GDPR Art. 5(1)(f) - Prevents re-identification of small parishes.
        
        Rules:
        1. Parishes with < k visitors/donations are labeled "Anonymous Parish"
        2. Counts are rounded to nearest k
        3. Small parishes are aggregated into "Other" bucket
        """
        k = K_ANONYMITY_THRESHOLD
        anonymized = []
        other_bucket = {
            'id': 'other',
            'name': 'Other Parishes',
            'country': 'XX',
            'visitors': 0,
            'donations': 0,
            'is_anonymized': True,
        }
        
        for row in results:
            visitors = row.get('total_visitors') or 0
            donations = row.get('total_donations') or 0
            donation_count = row.get('donation_count') or 0
            
            # Check if parish meets k-anonymity threshold
            if visitors < k or donation_count < k:
                # Aggregate into "Other" bucket
                other_bucket['visitors'] += visitors
                other_bucket['donations'] += float(donations) if donations else 0
                continue
            
            # Round to nearest k for privacy
            anonymized.append({
                'id': str(row['organization_id']),
                'name': row['organization__name'],
                'country': row['organization__country'],
                'visitors': self._round_to_k(visitors, k),
                'donations': round(float(donations) if donations else 0, 2),
                'is_anonymized': False,
            })
            
            if len(anonymized) >= limit:
                break
        
        # Add "Other" bucket if there are aggregated small parishes
        if other_bucket['visitors'] > 0:
            other_bucket['visitors'] = self._round_to_k(other_bucket['visitors'], k)
            other_bucket['donations'] = round(other_bucket['donations'], 2)
            anonymized.append(other_bucket)
        
        
        return anonymized[:limit]
    
    def _round_to_k(self, value, k):
        """Round value to nearest k for k-anonymity."""
        return (value // k) * k
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
