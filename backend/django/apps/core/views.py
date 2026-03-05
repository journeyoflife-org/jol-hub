"""
Core views — health check and shared base view classes.
"""

from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework import status

from .models import AuditLog
from .serializers import AuditLogSerializer


class HealthCheckView(APIView):
    """Unauthenticated health-check endpoint for load balancers."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'jol-hub-api'})


class AuditLogListView(APIView):
    """Admin-only read-only view of the audit log."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = AuditLog.objects.all()[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Custom error view helpers (referenced from urls.py)
# ---------------------------------------------------------------------------

def bad_request(request, exception=None):
    return JsonResponse({'error': 'bad_request', 'message': 'Bad request.'}, status=400)


def permission_denied(request, exception=None):
    return JsonResponse({'error': 'permission_denied', 'message': 'Permission denied.'}, status=403)


def page_not_found(request, exception=None):
    return JsonResponse({'error': 'not_found', 'message': 'Resource not found.'}, status=404)


def server_error(request):
    return JsonResponse({'error': 'server_error', 'message': 'Internal server error.'}, status=500)


def ratelimited(request, exception=None):
    return JsonResponse({'error': 'rate_limited', 'message': 'Too many requests.'}, status=429)
