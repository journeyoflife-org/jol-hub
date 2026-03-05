"""
Django production settings.

This module extends the base settings with production-specific configuration.
It enforces security best practices and optimizes for performance.

Usage:
    DJANGO_SETTINGS_MODULE=backend.django.core.settings.production
"""

from .base import *  # noqa: F401 F403
from .base import env

# =============================================================================
# DEBUG SETTINGS
# =============================================================================

DEBUG = False
TEMPLATE_DEBUG = False

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# HTTPS enforcement
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Content Security Policy headers
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Session security
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# =============================================================================
# ALLOWED HOSTS
# =============================================================================

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['.journeyoflife.org'])

# =============================================================================
# CORS SETTINGS
# =============================================================================

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CORS_ALLOW_ALL_ORIGINS = False

# =============================================================================
# DATABASE SETTINGS
# =============================================================================

# Use connection pooling for production
DATABASES['default']['CONN_MAX_AGE'] = 600
DATABASES['default']['OPTIONS']['sslmode'] = 'require'

# =============================================================================
# CACHE SETTINGS
# =============================================================================

CACHES['default']['TIMEOUT'] = 300  # 5 minutes

# =============================================================================
# CELERY SETTINGS
# =============================================================================

CELERY_TASK_ALWAYS_EAGER = False
CELERY_WORKER_CONCURRENCY = 4

# =============================================================================
# REST FRAMEWORK SETTINGS
# =============================================================================

# Production-optimized renderers (no browsable API)
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
]

# Stricter throttling
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '100/hour',
    'user': '1000/hour',
}

# =============================================================================
# STATIC FILES
# =============================================================================

# Use WhiteNoise for static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# =============================================================================
# LOGGING
# =============================================================================

# Production logging - errors only to file, info to console
LOGGING['root']['level'] = 'WARNING'
LOGGING['loggers']['jolhub']['level'] = 'INFO'

# =============================================================================
# EMAIL SETTINGS
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_USE_TLS = True

# =============================================================================
# ENVIRONMENT IDENTIFICATION
# =============================================================================

ENVIRONMENT = 'production'
