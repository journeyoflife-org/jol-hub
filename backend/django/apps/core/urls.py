"""
Core URL configuration — health probes, Prometheus metrics, and audit log.

Routes mounted by root ``core/urls.py`` at the top level (no prefix):
    /health/         → Deep health check (AllowAny)
    /health/ready/   → Readiness probe  (AllowAny)
    /metrics/        → Prometheus exposition (IP allowlist)
    /audit-logs/     → Audit log list   (IsAdminUser)
"""

from django.urls import path

from . import views
from .metrics_endpoint import PrometheusMetricsView

app_name = "core"

urlpatterns = [
    # -----------------------------------------------------------------------
    # Observability endpoints
    # -----------------------------------------------------------------------
    path(
        "health/",
        views.DeepHealthCheckView.as_view(),
        name="health-check",
    ),
    path(
        "health/ready/",
        views.ReadinessView.as_view(),
        name="readiness-check",
    ),
    path(
        "metrics/",
        PrometheusMetricsView.as_view(),
        name="prometheus-metrics",
    ),

    # -----------------------------------------------------------------------
    # Admin endpoints
    # -----------------------------------------------------------------------
    path(
        "audit-logs/",
        views.AuditLogListView.as_view(),
        name="audit-log-list",
    ),
]
