"""
Core views — deep health checks, readiness probes, metrics, and audit log.

This module exposes three observability endpoints and an admin-only audit
log view.  All error handlers used by the root URL configuration are also
defined here for consistency and i18n readiness.

Endpoints:
    ``/health/``          — Deep liveness + full component check (AllowAny)
    ``/health/ready/``    — Lightweight readiness probe (AllowAny)
    ``/metrics/``         — Prometheus exposition (IP allowlist; see metrics_endpoint)
    ``/audit-logs/``      — Admin-only audit log list (IsAdminUser)

GDPR Note:
    Health responses contain no PII or tenant identifiers.
"""

from __future__ import annotations

from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .health import DeepHealthChecker
from .models import AuditLog
from .serializers import AuditLogSerializer


# ---------------------------------------------------------------------------
# Health & Readiness views
# ---------------------------------------------------------------------------


class DeepHealthCheckView(APIView):
    """
    Unauthenticated deep health-check endpoint.

    Delegates to :class:`DeepHealthChecker` which probes database,
    cache, and Celery broker connectivity.  Returns ``200 OK`` when
    all components are healthy, or ``503 Service Unavailable`` when
    any critical component is unreachable.
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []  # No CSRF / session auth needed

    def get(self, request) -> Response:
        """
        Return full health-check payload.

        Args:
            request: The incoming HTTP request.

        Returns:
            DRF ``Response`` with JSON body and appropriate HTTP status.
        """
        result = DeepHealthChecker.deep()
        http_status = (
            status.HTTP_200_OK
            if result["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(result, status=http_status)


class ReadinessView(APIView):
    """
    Lightweight readiness probe for Kubernetes ``readinessProbe``.

    Checks only database and cache — sufficient to determine whether
    the pod should receive traffic.  Returns ``200`` if ready,
    ``503`` if not.
    """

    permission_classes = [AllowAny]
    authentication_classes: list = []

    def get(self, request) -> Response:
        """
        Return readiness status.

        Args:
            request: The incoming HTTP request.

        Returns:
            DRF ``Response`` with JSON body and appropriate HTTP status.
        """
        result = DeepHealthChecker.readiness()
        http_status = (
            status.HTTP_200_OK
            if result["status"] == "healthy"
            else status.HTTP_503_SERVICE_UNAVAILABLE
        )
        return Response(result, status=http_status)


# ---------------------------------------------------------------------------
# Audit log view
# ---------------------------------------------------------------------------


class AuditLogListView(APIView):
    """Admin-only read-only view of the audit log."""

    permission_classes = [IsAdminUser]

    def get(self, request):
        """
        List the 100 most recent audit log entries.

        Args:
            request: The incoming HTTP request.

        Returns:
            DRF ``Response`` with serialised audit log entries.
        """
        logs = AuditLog.objects.all()[:100]
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Custom error view helpers (referenced from root urls.py handler4xx/5xx)
# ---------------------------------------------------------------------------


def bad_request(request, exception=None) -> JsonResponse:
    """HTTP 400 error handler with i18n-ready message key."""
    return JsonResponse(
        {"error": "bad_request", "message_key": "error.http.400"}, status=400
    )


def permission_denied(request, exception=None) -> JsonResponse:
    """HTTP 403 error handler with i18n-ready message key."""
    return JsonResponse(
        {"error": "permission_denied", "message_key": "error.http.403"}, status=403
    )


def page_not_found(request, exception=None) -> JsonResponse:
    """HTTP 404 error handler with i18n-ready message key."""
    return JsonResponse(
        {"error": "not_found", "message_key": "error.http.404"}, status=404
    )


def server_error(request) -> JsonResponse:
    """HTTP 500 error handler with i18n-ready message key."""
    return JsonResponse(
        {"error": "server_error", "message_key": "error.http.500"}, status=500
    )


def ratelimited(request, exception=None) -> JsonResponse:
    """HTTP 429 error handler with i18n-ready message key."""
    return JsonResponse(
        {"error": "rate_limited", "message_key": "error.http.429"}, status=429
    )
