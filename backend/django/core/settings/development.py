"""
Development settings for JOL-HUB.

PostgreSQL 16 configuration for local development.
Enables RLS (Row-Level Security) testing for multi-tenant isolation.

SOC2 CC6.2 / GDPR Article 32 - Security controls must be testable locally.
"""

from .base import *

DEBUG = True

# =============================================================================
# D E B U G   T O O L B A R
# =============================================================================

# Add debug toolbar middleware only in development
MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')

# Debug toolbar internal IPs
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

# =============================================================================
# P O S T G R E S Q L   1 6   C O N F I G U R A T I O N
# =============================================================================

# PostgreSQL for local development (enables RLS testing)
# DATABASE_URL format: postgres://user:password@host:port/database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='jol_lt_platform_prod'),
        'USER': env('DB_USER', default='jol_lt_app_user'),
        # SECURITY: Never hardcode real credentials here. The actual value
        # must come from backend/django/.env (gitignored). This default is a
        # non-functional placeholder so the app fails loudly if .env is missing.
        'PASSWORD': env('DB_PASSWORD', default='change-me-in-env'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '*']
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# R E D I S   C A C H E   &   S E S S I O N S
# =============================================================================

# Redis for caching (required for multi-tenant cache isolation)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://localhost:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 60,
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'jolhub_dev',
    }
}

# Database-backed sessions for development (Redis in production)
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'
SESSION_CACHE_ALIAS = 'default'

# =============================================================================
# C E L E R Y   C O N F I G U R A T I O N
# =============================================================================

# Redis broker for Celery (required for background tasks)
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
CELERY_TASK_ALWAYS_EAGER = env.bool('CELERY_TASK_ALWAYS_EAGER', default=False)

# =============================================================================
# L O G G I N G   ( D E V E L O P M E N T )
# =============================================================================

# Increase logging verbosity for development
LOGGING['handlers']['console']['formatter'] = 'simple'
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG' if DEBUG else 'INFO',
    'propagate': False,
}
LOGGING['loggers']['jolhub']['level'] = 'DEBUG'

# =============================================================================
# S E C U R I T Y   ( R E L A X E D   F O R   D E V )
# =============================================================================

SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
