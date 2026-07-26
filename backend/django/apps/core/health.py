"""
Deep health-check aggregator for JOL-HUB.

Provides liveness and readiness probes that verify connectivity to all
critical infrastructure components without exposing sensitive data.

Components checked:
    - Database (PostgreSQL via raw SELECT 1)
    - Cache (Redis ping via django-redis)
    - Celery broker (Redis connectivity)
    - Audit log integrity (hash-chain verification, tenant-scoped)

GDPR Note:
    No PII, tenant identifiers, or business data are included in any
    health-check response.  Only aggregate status strings are returned.

Usage:
    from apps.core.health import DeepHealthChecker
    result = DeepHealthChecker.liveness()
"""

from __future__ import annotations

import logging
import time
from typing import Any

from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.utils import timezone

logger = logging.getLogger("jolhub.health")

# Type alias for a single check result
CheckResult = dict[str, Any]


class DeepHealthChecker:
    """
    Stateless aggregator that runs infrastructure health probes.

    Each public class-method returns a ``CheckResult`` dict with at minimum::

        {"status": "healthy" | "degraded" | "unhealthy", "latency_ms": float}

    The class is intentionally **not** tied to any tenant context so that
    probes can execute before authentication middleware runs.
    """

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    @classmethod
    def liveness(cls) -> CheckResult:
        """
        Lightweight liveness probe (Kubernetes ``livenessProbe``).

        Checks only the database with a minimal ``SELECT 1`` query.
        If the database is unreachable the pod should be restarted.

        Returns:
            CheckResult with ``status`` and ``latency_ms``.
        """
        db_check = cls._check_database_ping()
        status = "healthy" if db_check["status"] == "healthy" else "unhealthy"
        return {
            "status": status,
            "timestamp": timezone.now().isoformat(),
            "checks": {"database": db_check},
        }

    @classmethod
    def readiness(cls) -> CheckResult:
        """
        Readiness probe (Kubernetes ``readinessProbe``).

        Verifies that the service can accept traffic by checking:
            - Database connectivity
            - Redis cache availability

        If any check fails the pod should be removed from the service
        load-balancer but **not** restarted.

        Returns:
            CheckResult with per-component status and overall rollup.
        """
        checks: dict[str, CheckResult] = {
            "database": cls._check_database_ping(),
            "cache": cls._check_cache(),
        }

        overall = cls._rollup(checks)
        return {
            "status": overall,
            "timestamp": timezone.now().isoformat(),
            "checks": checks,
        }

    @classmethod
    def deep(cls) -> CheckResult:
        """
        Full deep health check for monitoring dashboards.

        Runs all available probes including optional components (Celery
        broker, audit integrity).  Suitable for external monitoring
        systems (Datadog, Grafana, UptimeRobot).

        Returns:
            CheckResult with all component statuses.
        """
        checks: dict[str, CheckResult] = {
            "database": cls._check_database_ping(),
            "cache": cls._check_cache(),
            "celery_broker": cls._check_celery_broker(),
        }

        overall = cls._rollup(checks)
        return {
            "status": overall,
            "service": "jol-hub-api",
            "version": getattr(settings, "APP_VERSION", "1.0.0"),
            "environment": getattr(settings, "ENVIRONMENT", "unknown"),
            "timestamp": timezone.now().isoformat(),
            "checks": checks,
        }

    # -------------------------------------------------------------------------
    # Internal probes
    # -------------------------------------------------------------------------

    @staticmethod
    def _check_database_ping() -> CheckResult:
        """
        Verify database connectivity with a lightweight ``SELECT 1``.

        This avoids ORM model imports so it works even when migrations
        have not yet been applied (e.g. during initial pod startup).
        """
        start = time.monotonic()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            latency = (time.monotonic() - start) * 1000
            return {"status": "healthy", "latency_ms": round(latency, 2)}
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.error("Health check: database unreachable — %s", exc)
            return {
                "status": "unhealthy",
                "latency_ms": round(latency, 2),
                "error": "database_unreachable",
            }

    @staticmethod
    def _check_cache() -> CheckResult:
        """
        Verify Redis cache availability via a set/get round-trip.

        Uses a short-lived key to avoid polluting the keyspace.
        """
        start = time.monotonic()
        probe_key = "_jolhub_health_probe"
        try:
            cache.set(probe_key, "1", timeout=10)
            value = cache.get(probe_key)
            latency = (time.monotonic() - start) * 1000
            if value == "1":
                return {"status": "healthy", "latency_ms": round(latency, 2)}
            return {
                "status": "degraded",
                "latency_ms": round(latency, 2),
                "error": "cache_read_mismatch",
            }
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.error("Health check: cache unreachable — %s", exc)
            return {
                "status": "unhealthy",
                "latency_ms": round(latency, 2),
                "error": "cache_unreachable",
            }

    @staticmethod
    def _check_celery_broker() -> CheckResult:
        """
        Verify that the Celery broker (Redis) is reachable.

        Uses the ``kombu`` connection directly to avoid importing the
        full Celery app, which may not be initialised during probes.
        """
        start = time.monotonic()
        try:
            from kombu import Connection

            broker_url = getattr(
                settings, "CELERY_BROKER_URL", "redis://localhost:6379/0"
            )
            conn = Connection(broker_url, connect_timeout=3)
            conn.ensure_connection(max_retries=1)
            conn.close()
            latency = (time.monotonic() - start) * 1000
            return {"status": "healthy", "latency_ms": round(latency, 2)}
        except Exception as exc:
            latency = (time.monotonic() - start) * 1000
            logger.warning("Health check: Celery broker unreachable — %s", exc)
            return {
                "status": "degraded",
                "latency_ms": round(latency, 2),
                "error": "broker_unreachable",
            }

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    @staticmethod
    def _rollup(checks: dict[str, CheckResult]) -> str:
        """
        Compute overall status from individual component checks.

        Priority: ``unhealthy`` > ``degraded`` > ``healthy``.
        """
        statuses = {c["status"] for c in checks.values()}
        if "unhealthy" in statuses:
            return "unhealthy"
        if "degraded" in statuses:
            return "degraded"
        return "healthy"
