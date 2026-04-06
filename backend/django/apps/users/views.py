"""
User views — auth endpoints, profile management, and GDPR data rights.

SOC2 CC6.1 - Rate limiting on sensitive endpoints.
ISO 27001 A.12.4.1 - Event logging and access controls.

GDPR Compliance:
- Art. 15 - Right of access (DSAR)
- Art. 17 - Right to erasure
- Art. 20 - Right to data portability
"""

import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.throttling import AuthRateThrottle, AuthAnonRateThrottle, GDPRExportThrottle, GDPRDeleteThrottle
from .models import User
from .serializers import (
    RegisterSerializer, UserSerializer,
    ChangePasswordSerializer, TokenObtainPairSerializer,
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — create a new user account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AuthAnonRateThrottle, AuthRateThrottle]


class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/ — obtain JWT token pair.
    
    SOC2 CC6.1 - Rate limited to prevent brute force attacks.
    Rate: 10/hour per IP + 10/hour per user.
    """

    serializer_class = TokenObtainPairSerializer
    throttle_classes = [AuthAnonRateThrottle, AuthRateThrottle]


class TokenRefreshViewExtended(TokenRefreshView):
    """POST /api/v1/auth/refresh/ — refresh access token."""


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — blacklist refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'validation_error', 'message': 'refresh_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out.'})


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET / PATCH /api/v1/users/me/ - current user profile.
    
    GDPR Art. 15 - Returns basic profile data.
    For complete DSAR data export, use /api/v1/users/me/gdpr/export/
    """

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class GDPRDataAccessView(APIView):
    """
    GET /api/v1/users/me/gdpr/access/
    
    GDPR Art. 15 - Right of access by the data subject.
    
    Returns a summary of what personal data is held and where.
    For full data export, use /api/v1/users/me/gdpr/export/
    
    SOC2 CC6.1 - Rate limited.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [GDPRExportThrottle]

    def get(self, request):
        user = request.user
        
        # Provide data inventory summary
        data_inventory = {
            'subject_id': str(user.id),
            'data_categories': [
                {
                    'category': 'account',
                    'description': 'User account information',
                    'fields': ['email', 'name', 'phone', 'country', 'language'],
                    'retention_period': '730 days after account deletion',
                },
                {
                    'category': 'donations',
                    'description': 'Donation history and payment information',
                    'fields': ['amounts', 'dates', 'payment_methods'],
                    'retention_period': '2555 days (7 years) - Canon Law 1287',
                    'legal_basis': 'GDPR Art. 6(1)(c) - Legal obligation',
                },
                {
                    'category': 'activity',
                    'description': 'User activity and session data',
                    'fields': ['login_history', 'preferences', 'activity_log'],
                    'retention_period': '90 days',
                },
            ],
            'gdpr_rights': {
                'access': '/api/v1/users/me/gdpr/access/',
                'export': '/api/v1/users/me/gdpr/export/',
                'erasure': '/api/v1/users/me/gdpr/delete/',
            },
            'legal_holds': self._check_legal_holds(str(user.id)),
            'consent_status': {
                'gdpr_consent': user.gdpr_consent,
                'gdpr_consent_at': user.gdpr_consent_at.isoformat() if user.gdpr_consent_at else None,
                'marketing_consent': user.marketing_consent,
                'marketing_consent_at': user.marketing_consent_at.isoformat() if user.marketing_consent_at else None,
            },
        }
        
        logger.info(
            f"GDPR_ACCESS: user={user.id} email={user.email} ip={self._get_client_ip(request)}"
        )
        
        return Response(data_inventory)
    
    def _check_legal_holds(self, subject_id: str) -> dict:
        """Check for active legal holds."""
        from apps.core.data_integration import get_data_integration
        integration = get_data_integration()
        return integration.check_legal_hold(subject_id)
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class ChangePasswordView(APIView):
    """POST /api/v1/users/me/change-password/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password', 'updated_at'])
        return Response({'message': 'Password updated successfully.'})


class UserListView(generics.ListCreateAPIView):
    """GET /api/v1/users/  — admin only."""

    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.active().order_by('email')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/v1/users/{id}/"""

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def perform_destroy(self, instance):
        instance.soft_delete()


class GDPRDataExportView(APIView):
    """
    GET /api/v1/users/me/gdpr/export/
    
    GDPR Art. 15 - Right of access by the data subject.
    GDPR Art. 20 - Right to data portability.
    
    Returns a comprehensive machine-readable dump of ALL personal data
    across all data processors (user, donations, activity, etc.).
    
    SOC2 CC6.1 - Rate limited to prevent data scraping.
    Rate: 5/hour per user.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [GDPRExportThrottle]

    def get(self, request):
        user = request.user
        
        # Use data integration layer for comprehensive DSAR
        from apps.core.data_integration import get_data_integration
        integration = get_data_integration()
        
        dsar_result = integration.handle_data_access_request(str(user.id))
        
        if 'error' in dsar_result and dsar_result.get('status') == 'service_unavailable':
            # Fallback to basic user data if DSAR service unavailable
            data = UserSerializer(user).data
            
            logger.info(
                f"GDPR_EXPORT_BASIC: user={user.id} email={user.email} ip={self._get_client_ip(request)}"
            )
            
            return Response({
                'personal_data': data,
                'note': 'Full DSAR service unavailable - basic data only',
            })
        
        
        # Log GDPR access request with full DSAR tracking
        logger.info(
            f"GDPR_EXPORT: user={user.id} email={user.email} "
            f"request_id={dsar_result.get('request_id')} "
            f"total_records={dsar_result.get('total_records')} "
            f"ip={self._get_client_ip(request)}"
        )
        
        return Response(dsar_result)
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')


class GDPRDataDeleteView(APIView):
    """
    DELETE /api/v1/users/me/gdpr/delete/
    
    GDPR Art. 17 - Right to erasure ("right to be forgotten").
    GDPR Art. 17(3)(e) - Exemptions for legal claims (legal holds).
    
    CRITICAL: Checks for legal holds before deletion.
    If a legal hold exists, deletion is blocked to prevent:
    - Spoliation of evidence
    - Criminal liability
    - Regulatory fines
    
    SOC2 CC6.1 - Rate limited to prevent abuse.
    Rate: 3/hour per user.
    """

    permission_classes = [IsAuthenticated]
    throttle_classes = [GDPRDeleteThrottle]

    def delete(self, request):
        user_id = request.user.id
        user_email = request.user.email
        client_ip = self._get_client_ip(request)
        
        # CRITICAL: Check for legal holds before any deletion
        legal_hold_status = self._check_legal_holds(str(user_id))
        
        if legal_hold_status['has_holds']:
            logger.error(
                f"GDPR_DELETE_BLOCKED: user={user_id} email={user_email} "
                f"hold_count={legal_hold_status['hold_count']} ip={client_ip}"
            )
            
            return Response({
                'error': 'LEGAL_HOLD_ACTIVE',
                'message': 'Cannot delete account: data is subject to legal hold.',
                'hold_count': legal_hold_status['hold_count'],
                'contact': 'Contact legal@jol-hub.eu for assistance.',
                'legal_basis': 'GDPR Art. 17(3)(e) - Right to erasure does not apply for legal claims.',
            }, status=status.HTTP_403_FORBIDDEN)
        
        # No legal holds - proceed with DSAR-based deletion
        from apps.core.data_integration import get_data_integration
        integration = get_data_integration()
        
        dsar_result = integration.handle_data_erasure_request(str(user_id), dry_run=False)
        
        if 'error' in dsar_result and dsar_result.get('status') == 'service_unavailable':
            # Fallback to basic soft-delete if DSAR service unavailable
            logger.info(
                f"GDPR_DELETE_BASIC: user={user_id} email={user_email} ip={client_ip}"
            )
            
            request.user.soft_delete()
            
            return Response({
                'message': 'Your account has been scheduled for deletion.',
                'note': 'Full DSAR service unavailable - basic deletion only',
            }, status=status.HTTP_200_OK)
        
        
        # Log GDPR deletion request with full DSAR tracking
        logger.info(
            f"GDPR_DELETE: user={user_id} email={user_email} "
            f"request_id={dsar_result.get('request_id')} "
            f"deleted={dsar_result.get('total_deleted')} "
            f"retained={dsar_result.get('total_retained')} ip={client_ip}"
        )
        
        # Soft-delete the user account
        request.user.soft_delete()
        
        return Response({
            'message': 'Your data has been processed for deletion.',
            'request_id': dsar_result.get('request_id'),
            'total_deleted': dsar_result.get('total_deleted'),
            'total_retained': dsar_result.get('total_retained'),
            'retention_exempt': dsar_result.get('retention_exempt', []),
            'legal_basis': 'GDPR Art. 17 - Right to erasure',
        }, status=status.HTTP_200_OK)
    
    def _check_legal_holds(self, subject_id: str) -> dict:
        """
        Check for active legal holds on the data subject.
        
        GDPR Art. 17(3)(e) - Erasure does not apply for legal claims.
        """
        from apps.core.data_integration import get_data_integration
        integration = get_data_integration()
        return integration.check_legal_hold(subject_id)
    
    def _get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
