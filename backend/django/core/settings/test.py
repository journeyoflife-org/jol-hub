"""
Test settings for JOL-HUB.

Optimized for fast test execution with minimal external dependencies.
Uses SQLite in-memory database and disables Celery eager mode.

Usage:
    DJANGO_SETTINGS_MODULE=core.settings.test python manage.py test
    pytest --ds=core.settings.test
"""

from .base import *  # noqa: F401 F403

# =============================================================================
# DEBUG & GENERAL
# =============================================================================

DEBUG = False
ENVIRONMENT = 'test'

# =============================================================================
# DATABASE — SQLite in-memory for speed
# =============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# =============================================================================
# PASSWORD HASHERS — Use fastest hasher for tests
# =============================================================================

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# =============================================================================
# EMAIL — In-memory backend
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# =============================================================================
# CACHE — Local memory cache for tests
# =============================================================================

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'KEY_PREFIX': 'jolhub_test',
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

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

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
    'version': 1,
    'disable_existing_loggers': True,
    'handlers': {
        'null': {
            'class': 'logging.NullHandler',
        },
    },
    'root': {
        'handlers': ['null'],
        'level': 'CRITICAL',
    },
    'loggers': {
        'django': {
            'handlers': ['null'],
            'level': 'CRITICAL',
            'propagate': False,
        },
        'jolhub': {
            'handlers': ['null'],
            'level': 'CRITICAL',
            'propagate': False,
        },
    },
}

# =============================================================================
# STATIC FILES — Disable WhiteNoise collector in tests
# =============================================================================

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'
WHITENOISE_MANIFEST_STRICT = False

# =============================================================================
# MONGODB — Use mongomock for tests (no real MongoDB required)
# =============================================================================

MONGODB_URI = 'mongomock://localhost'
MONGODB_DB_NAME = 'jolhub_test'
MONGODB_TLS_ENABLED = False
MONGODB_TTL_DAYS = 90
MONGODB_SLOW_QUERY_THRESHOLD_S = 0.1
