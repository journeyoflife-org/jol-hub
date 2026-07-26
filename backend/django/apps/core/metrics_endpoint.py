"""
Prometheus ``/metrics`` HTTP endpoint for JOL-HUB.

Exposes all registered Prometheus metrics in the standard text exposition
format (``text/plain; version=0.0.4; charset=utf-8``).

Security:
    Access is gated by an IP allowlist configured via the
    ``PROMETHEUS_ALLOWED_IPS`` Django setting.  When the allowlist is
    empty (the default in development), all IPs are permitted.  In
    production this **must** be set to the Prometheus server IPs.

    An optional bearer-token check (``PROMETHEUS_AUTH_TOKEN``) provides
    a second authentication layer for shared-network deployments.

GDPR Note:
    The endpoint itself does not log request bodies or query parameters.
    Metric labels are pre-registered in ``apps.crm.observability.metrics``
    and must not contain PII.

Usage:
    # urls.py
    from apps.core.metrics_endpoint import PrometheusMetricsView
    path('metrics/', PrometheusMetricsView.as_view(), name='prometheus-metrics')
"""

from __future__ import annotations

import logging
from typing import ClassVar

from django.conf import settings
from django.http import HttpRequest, HttpResponse
from prometheus_client import (
    CollectorRegistry,
    generate_latest,
    multiprocess,
    CONTENT_TYPE_LATEST,
)
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger("jolhub.metrics")


def _get_client_ip(request: HttpRequest) -> str:
    """
    Extract the real client IP from the request.

    Respects ``X-Forwarded-For`` (set by reverse proxies / load-balancers)
    but falls back to ``REMOTE_ADDR``.

    Args:
        request: The incoming Django HTTP request.

    Returns:
        The client IP address as a string.
    """
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR", "")
    if forwarded_for:
        # First entry is the original client IP
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


class PrometheusMetricsView(APIView):
    """
    Prometheus-compatible metrics endpoint.

    Renders all registered ``prometheus_client`` collectors in the
    standard text exposition format.  Access is restricted by IP
    allowlist and optional bearer-token authentication.

    Attributes:
        permission_classes: AllowAny — access control is handled
            inside the view by IP / token, not by DRF permissions.
    """

    permission_classes: ClassVar = [AllowAny]
    authentication_classes: ClassVar = []  # No CSRF / session auth needed

    def get(self, request: HttpRequest) -> HttpResponse | Response:
        """
        Handle GET requests and return Prometheus metrics.

        Args:
            request: The incoming HTTP request.

        Returns:
            ``HttpResponse`` with ``text/plain`` metrics body on success,
            or a DRF ``Response`` with 403 status on authorization failure.
        """
        client_ip = _get_client_ip(request)

        # ------------------------------------------------------------------
        # 1. IP allowlist check
        # ------------------------------------------------------------------
        allowed_ips: list[str] = getattr(settings, "PROMETHEUS_ALLOWED_IPS", [])
        if allowed_ips and client_ip not in allowed_ips:
            logger.warning(
                "Metrics access denied for IP %s (not in allowlist)", client_ip
            )
            return Response(
                {"error": "forbidden", "message": "Access denied."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ------------------------------------------------------------------
        # 2. Optional bearer-token check
        # ------------------------------------------------------------------
        required_token: str = getattr(settings, "PROMETHEUS_AUTH_TOKEN", "")
        if required_token:
            auth_header = request.META.get("HTTP_AUTHORIZATION", "")
            provided_token = (
                auth_header.removeprefix("Bearer ").strip()
                if auth_header.startswith("Bearer ")
                else ""
            )
            if provided_token != required_token:
                logger.warning(
                    "Metrics access denied for IP %s — invalid bearer token",
                    client_ip,
                )
                return Response(
                    {"error": "forbidden", "message": "Access denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        # ------------------------------------------------------------------
        # 3. Generate metrics output
        # ------------------------------------------------------------------
        registry = CollectorRegistry()

        # Support multi-process mode (e.g. Gunicorn with multiple workers)
        prometheus_multiprocess_dir = getattr(
            settings, "PROMETHEUS_MULTIPROC_DIR", None
        )
        if prometheus_multiprocess_dir:
            multiprocess.MultiProcessCollector(registry)
        else:
            # Use the default global registry
            from prometheus_client import REGISTRY

            registry = REGISTRY

        metrics_output = generate_latest(registry)

        return HttpResponse(
            metrics_output,
            content_type=CONTENT_TYPE_LATEST,
        )
