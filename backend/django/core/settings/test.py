"""
Test settings for JOL-HUB.

Uses PostgreSQL for django-tenants compatibility (schema-per-tenant).
Set USE_SQLITE=1 for local dev without PostgreSQL (limited functionality).

Usage:
    DJANGO_SETTINGS_MODULE=core.settings.test python manage.py test
    pytest --ds=core.settings.test
"""

from .base import *  # noqa: F401 F403

# =============================================================================
# DEBUG & GENERAL
# =============================================================================

DEBUG = False
ENVIRONMENT = "test"

# =============================================================================
# DATABASE — PostgreSQL for django-tenants compatibility
# =============================================================================
# django-tenants requires PostgreSQL (schema-per-tenant). In CI, DATABASE_URL
# is set by the workflow. For local dev without PostgreSQL, set USE_SQLITE=1.

import os
from urllib.parse import urlparse

if os.environ.get("USE_SQLITE") == "1":
    # Local dev fallback (django-tenants features will not work)
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": ":memory:",
        }
    }
else:
    # CI or local with PostgreSQL
    # Parse DATABASE_URL if set (CI), otherwise use DB_* env vars
    _db_url = os.environ.get("DATABASE_URL")
    if _db_url:
        _parsed = urlparse(_db_url)
        DATABASES = {
            "default": {
                "ENGINE": "django_tenants.postgresql_backend",
                "NAME": _parsed.path.lstrip("/"),
                "USER": _parsed.username,
                "PASSWORD": _parsed.password or "",
                "HOST": _parsed.hostname,
                "PORT": str(_parsed.port or 5432),
                "TEST": {
                    "NAME": _parsed.path.lstrip("/") + "_test",
                },
            }
        }
    else:
        DATABASES = {
            "default": {
                "ENGINE": "django_tenants.postgresql_backend",
                "NAME": os.environ.get("DB_NAME", "jolhub_test"),
                "USER": os.environ.get("DB_USER", "test_user"),
                "PASSWORD": os.environ.get("DB_PASSWORD", "test_password"),
                "HOST": os.environ.get("DB_HOST", "localhost"),
                "PORT": os.environ.get("DB_PORT", "5432"),
                "TEST": {
                    "NAME": "jolhub_test",
                },
            }
        }


# -----------------------------------------------------------------------------
# django-tenants test router — permissive allow_migrate for CI
# -----------------------------------------------------------------------------
# django-tenants requires TenantSyncRouter in DATABASE_ROUTERS (checked in
# its apps.py ready()). The default router blocks TENANT_APPS migrations
# from creating tables in the public schema. This subclass overrides
# allow_migrate to permit all apps, so manage.py migrate creates every
# table in the public schema (which is the only schema in tests).
# -----------------------------------------------------------------------------


class _TestRouter:
    """Permissive test router — allows all migrations in the public schema."""

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True


DATABASE_ROUTERS = [
    "django_tenants.routers.TenantSyncRouter",
    "core.settings.test._TestRouter",
]

# -----------------------------------------------------------------------------
# Test-time app configuration - all apps in SHARED_APPS
# -----------------------------------------------------------------------------
# django-tenants replaces manage.py migrate with migrate_schemas which only
# creates tables for SHARED_APPS in the public schema. TENANT_APPS tables
# are only created inside tenant schemas which do not exist in CI.
# Override: put ALL apps in SHARED_APPS so migrate_schemas creates every
# table in the public schema. Keep minimal TENANT_APPS for validation.
# -----------------------------------------------------------------------------

SHARED_APPS = list(INSTALLED_APPS)  # All apps -> public schema in tests
TENANT_APPS = ["apps.organizations"]  # Minimal: just the tenant model app
INSTALLED_APPS = list(SHARED_APPS)  # Recalculate


# =============================================================================
# MIDDLEWARE — Remove django-tenants schema middleware for tests
# =============================================================================
# TenantMainMiddleware tries to resolve tenant schema from request hostname.
# In CI tests there is no tenant domain, so it returns 404 for all requests.
# Remove it; keep TenantEntitlementMiddleware which handles auth gracefully.
# =============================================================================

MIDDLEWARE = [
    m for m in MIDDLEWARE if m != "django_tenants.middleware.main.TenantMainMiddleware"
]

# =============================================================================
# PASSWORD HASHERS — Use fastest hasher for tests
# =============================================================================

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# =============================================================================
# EMAIL — In-memory backend
# =============================================================================

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# =============================================================================
# CACHE — Local memory cache for tests
# =============================================================================

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "KEY_PREFIX": "jolhub_test",
    }
}

# =============================================================================
# CELERY — Run tasks synchronously during tests
# =============================================================================

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# =============================================================================
# SESSIONS — Use cache backend for speed
# =============================================================================

SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"

# =============================================================================
# SECURITY — Relaxed for tests
# =============================================================================

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# =============================================================================
# LOGGING — Suppress logs during tests
# =============================================================================

LOGGING = {
    "version": 1,
    "disable_existing_loggers": True,
    "handlers": {
        "null": {
            "class": "logging.NullHandler",
        },
    },
    "root": {
        "handlers": ["null"],
        "level": "CRITICAL",
    },
    "loggers": {
        "django": {
            "handlers": ["null"],
            "level": "CRITICAL",
            "propagate": False,
        },
        "jolhub": {
            "handlers": ["null"],
            "level": "CRITICAL",
            "propagate": False,
        },
    },
}

# =============================================================================
# STATIC FILES — Disable WhiteNoise collector in tests
# =============================================================================

STATICFILES_STORAGE = "django.contrib.staticfiles.storage.StaticFilesStorage"
WHITENOISE_MANIFEST_STRICT = False

# =============================================================================
# MONGODB — Use mongomock for tests (no real MongoDB required)
# =============================================================================

MONGODB_URI = "mongomock://localhost"
MONGODB_DB_NAME = "jolhub_test"
MONGODB_TLS_ENABLED = False
MONGODB_TTL_DAYS = 90
MONGODB_SLOW_QUERY_THRESHOLD_S = 0.1
