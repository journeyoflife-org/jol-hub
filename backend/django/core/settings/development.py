"""
Django development settings.

This module extends the base settings with development-specific configuration.
It enables debug mode, adds development tools, and configures local services.

Usage:
    python manage.py runserver --settings=backend.django.core.settings.development
"""

from .base import *  # noqa: F401 F403
from .base import env

# =============================================================================
# DEBUG SETTINGS

DEBUG = True
TEMPLATE_DEBUG = True

# Add localhost to allowed hosts
ALLOWED_HOSTS += ['localhost', '127.0.0.1', '[::1]']

# =============================================================================
# DEVELOPMENT TOOLS
# =============================================================================

# Django Debug Toolbar
INSTALLED_APPS += [
    'django_extensions',
]

MIDDLEWARE += [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
]

# Debug toolbar configuration
INTERNAL_IPS = [
    '127.0.0.1',
    'localhost',
]

DEBUG_TOOLBAR_CONFIG = {
    'DISABLE_PANELS': [
        'debug_toolbar.panels.redirects.RedirectsPanel',
    ],
    'SHOW_TEMPLATE_CONTEXT': True,
    'SHOW_COLLAPSED': False,
    'UPDATE_ON_FETCH': True,
    'ROOT_TAG_EXTRA_ATTRS': 'class="djdt-debug-toolbar"',
}

# Show SQL queries in console
LOGGING['loggers']['django.db.backends'] = {
    'handlers': ['console'],
    'level': 'DEBUG',
    'propagate': False,
}

# =============================================================================
# EMAIL CONFIGURATION FOR DEVELOPMENT
# =============================================================================

# Use file-based email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.filebased.EmailBackend'
EMAIL_FILE_PATH = BASE_DIR / 'tmp' / 'emails'

# Ensure email directory exists
import os
os.makedirs(EMAIL_FILE_PATH, exist_ok=True)

# Console email backend alternative (prints to console)
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# =============================================================================
# DATABASE CONFIGURATION FOR DEVELOPMENT
# =============================================================================

# Use simpler database configuration for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='jolhub_dev'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='postgres'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 0,  # Don't persist connections in development
        'ATOMIC_REQUESTS': True,  # Wrap each request in a transaction
    }
}

# Enable query logging
if DEBUG:
    LOGGING['loggers']['django.db.backends'] = {
        'handlers': ['console'],
        'level': 'DEBUG',
    }

# =============================================================================
# CACHE CONFIGURATION FOR DEVELOPMENT
# =============================================================================

# Use local Redis for caching
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': env('REDIS_URL', default='redis://localhost:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 60,
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 20,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'jolhub-dev',
        'VERSION': 1,
        'TIMEOUT': 60,  # Short timeout for development
    }
}

# =============================================================================
# CELERY CONFIGURATION FOR DEVELOPMENT
# =============================================================================

# Use eager execution for tasks in development (runs tasks synchronously)
CELERY_TASK_ALWAYS_EAGER = False  # Set to True to run tasks synchronously
CELERY_TASK_EAGER_PROPAGATES = True

# Smaller worker pool for development
CELERY_WORKER_CONCURRENCY = 2

# More frequent task scheduling for testing
CELERY_BEAT_SCHEDULE = {
    'test-task': {
        'task': 'apps.core.tasks.test_task',
        'schedule': 60.0,  # Every minute
    },
}

# =============================================================================
# SECURITY SETTINGS FOR DEVELOPMENT
# =============================================================================

# Disable HTTPS requirements for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Allow all CORS origins in development (for frontend testing)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
]

CORS_ALLOW_ALL_ORIGINS = True  # Only in development!

# Relaxed CSRF settings
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

# =============================================================================
# REST FRAMEWORK SETTINGS FOR DEVELOPMENT
# =============================================================================

# More lenient throttling for development
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '1000/hour',
    'user': '10000/hour',
}

# Enable Browsable API renderer by default
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]

# Simpler authentication for development
REST_FRAMEWORK['DEFAULT_AUTHENTICATION_CLASSES'] = [
    'rest_framework.authentication.SessionAuthentication',
    'rest_framework.authentication.BasicAuthentication',
    'rest_framework_simplejwt.authentication.JWTAuthentication',
]

# =============================================================================
# API DOCUMENTATION IN DEVELOPMENT
# =============================================================================

# Enable Spectacular Swagger UI
SPECTACULAR_SETTINGS['SWAGGER_UI_SETTINGS']['url'] = '/api/schema/'
SPECTACULAR_SETTINGS['SERVE_PUBLIC'] = True

# =============================================================================
# STATIC FILES IN DEVELOPMENT
# =============================================================================

# Use Django's static file server during development
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Additional static files directories for development
STATICFILES_DIRS += [
    BASE_DIR.parent / 'frontend' / 'react' / 'public',
]

# =============================================================================
# MEDIA FILES IN DEVELOPMENT
# =============================================================================

# Serve media files during development
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# =============================================================================
# LOGGING IN DEVELOPMENT
# =============================================================================

# More verbose logging for debugging
LOGGING['formatters']['verbose']['format'] = (
    '{levelname} {asctime} {module} {process:d} {thread:d} {message}'
)

# Lower log level to see more details
LOGGING['root']['level'] = 'DEBUG'
LOGGING['loggers']['jolhub']['level'] = 'DEBUG'

# Disable log file writing in development (use console only)
LOGGING['handlers'].pop('file', None)
LOGGING['handlers'].pop('error_file', None)
LOGGING['root']['handlers'] = ['console']
LOGGING['loggers']['jolhub']['handlers'] = ['console']

# =============================================================================
# DJANGO EXTENSIONS
# =============================================================================

# Shell Plus configuration (python manage.py shell_plus)
SHELL_PLUS = 'ipython'

SHELL_PLUS_POST_IMPORTS = [
    'from apps.users.models import User',
    'from apps.organizations.models import Organization',
    'from apps.content.models import Page',
    'from datetime import datetime, date, timedelta',
    'from decimal import Decimal',
    'import json',
]

# Print SQL queries in shell_plus
SHELL_PLUS_PRINT_SQL = True
SHELL_PLUS_PRINT_SQL_TRUNCATE = 1000

# =============================================================================
# TESTING IN DEVELOPMENT
# =============================================================================

# Use in-memory database for faster tests
TESTING = False  # Will be set to True by test runner

if TESTING:
    DATABASES['default'] = {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
    
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]
    
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        }
    }

# =============================================================================
# DEVELOPMENT SHORTCUTS
# =============================================================================

# Enable django-silk for profiling (optional)
# INSTALLED_APPS += ['silk']
# MIDDLEWARE += ['silk.middleware.SilkyMiddleware']
# SILKY_PYTHON_PROFILER = True

# Enable django-querycount
# INSTALLED_APPS += ['querycount']
# MIDDLEWARE += ['querycount.middleware.QueryCountMiddleware']

# =============================================================================
# HOT RELOAD SETTINGS
# =============================================================================

# Watch additional directories for changes
if 'django_extensions' in INSTALLED_APPS:
    RUNSERVERPLUS_POLLER_RELOADER = True
    RUNSERVERPLUS_POLLER_RELOADER_INTERVAL = 1

# =============================================================================
# FEATURE FLAGS FOR DEVELOPMENT
# =============================================================================

# Enable experimental features in development
ENABLE_EXPERIMENTAL_FEATURES = True
ENABLE_BETA_APIS = True
ENABLE_DEV_TOOLS = True

# =============================================================================
# MOCK SERVICES FOR DEVELOPMENT
# =============================================================================

# Use mock payment gateway in development
USE_MOCK_PAYMENT_GATEWAY = True

# Use mock email service (already configured above)
USE_MOCK_EMAIL_SERVICE = True

# Use mock SMS service
USE_MOCK_SMS_SERVICE = True

# =============================================================================
# PERFORMANCE SETTINGS FOR DEVELOPMENT
# =============================================================================

# Disable query optimization warnings in development
DISABLE_QUERY_OPTIMIZATION_WARNINGS = True

# Enable SQL query logging
ENABLE_SQL_LOGGING = True

# Log slow queries (queries taking longer than X seconds)
SLOW_QUERY_THRESHOLD = 1.0  # seconds

# =============================================================================
# ENVIRONMENT IDENTIFICATION
# =============================================================================

ENVIRONMENT = 'development'

# Add development banner to API responses
DEVELOPMENT_BANNER = '🔧 Development Environment'

# =============================================================================
# WARNING SUPPRESSION
# =============================================================================

# Suppress specific Django system checks in development
SILENCED_SYSTEM_CHECKS = [
    # Example: 'models.W042',  # Ignore specific warning
]

# =============================================================================
# DEVELOPMENT DATA GENERATION
# =============================================================================

# Enable custom management commands for development data
# python manage.py generate_dev_data
GENERATE_DEV_DATA_ENABLED = True

# Default credentials for development (CHANGE THESE!)
DEV_DEFAULT_ADMIN_EMAIL = 'admin@journeyoflife.org'
DEV_DEFAULT_ADMIN_PASSWORD = 'admin123'  # NOsec - development only
DEV_DEFAULT_USER_EMAIL = 'user@journeyoflife.org'
DEV_DEFAULT_USER_PASSWORD = 'user123'  # NOsec - development only

# =============================================================================
# PRINT STARTUP MESSAGE
# =============================================================================

print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🔧 JOL-HUB Development Mode 🔧                  ║
║                                                           ║
║  Environment: Development                                 ║
║  Debug: {}                                           ║
║  Email Backend: File (check tmp/emails/)                 ║
║  Payment Gateway: Mock                                   ║
║                                                           ║
║  Frontend: http://localhost:3000                          ║
║  Backend: http://localhost:8000                           ║
║  API Docs: http://localhost:8000/api/docs/                ║
║  Admin: http://localhost:8000/admin/                      ║
║                                                           ║
║  ⚠️  NEVER use these settings in production!              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
""".format(DEBUG))
