"""
Django settings for JOL-HUB project.

This is the base settings module containing common configuration
shared across all environments (development, staging, production).

For more information on this file, see:
https://docs.djangoproject.com/en/4.2/topics/settings/

For the full list of settings and their values, see:
https://docs.djangoproject.com/en/4.2/ref/settings/
"""

import os
import sys
from pathlib import Path
from datetime import timedelta
from celery.schedules import crontab

import environ
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Initialize environment variables
env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, ''),
    ALLOWED_HOSTS=(list, []),
)

# Read .env file if it exists
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG')

ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'django.contrib.sites',
    'django.contrib.sitemaps',
]

THIRD_PARTY_APPS = [
    # REST Framework
    'rest_framework',
    'rest_framework.authtoken',
    
    # CORS
    'corsheaders',
    
    # Authentication
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.facebook',
    
    # API Documentation
    'drf_spectacular',
    
    # Filtering and searching
    'django_filters',
    
    # Caching
    'django_redis',
    
    # Celery
    'django_celery_beat',
    'django_celery_results',
    
    # Storage
    'storages',
    
    # Debug toolbar (activated conditionally)
    'debug_toolbar',
]

LOCAL_APPS = [
    # Core applications
    'apps.core',
    'apps.users',
    'apps.organizations',
    'apps.content',
    'apps.donations',
    'apps.analytics',
    
    # Country-specific apps
    'apps.countries',
    
    # Integration apps
    'apps.integrations',
    
    # Financial apps
    'apps.financial',
    
    # CRM app
    'apps.crm',

    # Internal payment-event ingress (Model A, ADR-009; flag-gated)
    'apps.payment_events',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    # Security middleware
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    
    # Django middleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Locale middleware
    'django.middleware.locale.LocaleMiddleware',
    
    # Allauth middleware
    'allauth.account.middleware.AccountMiddleware',
    
    # Tenant context middleware (for CRM multi-tenant isolation)
    'apps.crm.middleware.TenantContextMiddleware',
    
    # Debug toolbar (activated conditionally)
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'django' / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='jol_lt_platform_prod'),
        'USER': env('DB_USER', default='postgres'),
        'PASSWORD': env('DB_PASSWORD', default='postgres'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
        },
    }
}

# Custom database user model
AUTH_USER_MODEL = 'users.User'

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True

# Supported languages for the application
LANGUAGES = [
    ('lt', 'Lithuanian'),
    ('lv', 'Latvian'),
    ('ee', 'Estonian'),
    ('fi', 'Finnish'),
    ('sv', 'Swedish'),
    ('no', 'Norwegian'),
    ('da', 'Danish'),
    ('de', 'German'),
    ('pl', 'Polish'),
    ('cs', 'Czech'),
    ('sk', 'Slovak'),
    ('hu', 'Hungarian'),
    ('sl', 'Slovenian'),
    ('hr', 'Croatian'),
    ('it', 'Italian'),
    ('es', 'Spanish'),
    ('pt', 'Portuguese'),
    ('fr', 'French'),
    ('nl', 'Dutch'),
    ('en', 'English'),
]

LOCALE_PATHS = [
    BASE_DIR / 'django' / 'locale',
]

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'django' / 'static',
]

# WhiteNoise configuration for static files
WHITENOISE_MANIFEST_STRICT = False
WHITENOISE_KEEP_ONLY_HASHED_FILES = True

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Site framework
SITE_ID = 1

# =============================================================================
# REST FRAMEWORK CONFIGURATION
# =============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'MAX_PAGE_SIZE': 100,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        # GDPR / SOC2 - Stricter rate limits for sensitive endpoints
        'auth': '10/hour',           # Login/register - prevent brute force
        'gdpr_export': '5/hour',     # Data export - prevent data scraping
        'gdpr_delete': '3/hour',     # Data deletion - prevent abuse
        'donation_create': '20/hour', # Donation creation - prevent fraud
        'donation_refund': '10/hour', # Refunds - prevent financial abuse
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'apps.core.exceptions.custom_exception_handler',
    'DEFAULT_VERSIONING_CLASS': 'rest_framework.versioning.URLPathVersioning',
    'DEFAULT_VERSION': 'v1',
    'ALLOWED_VERSIONS': ['v1'],
    'VERSION_PARAM': 'version',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_OBTAIN_SERIALIZER': 'apps.users.api.serializers.TokenObtainPairSerializer',
    'TOKEN_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSerializer',
    'TOKEN_VERIFY_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenVerifySerializer',
    'BLACKLIST_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenBlacklistSerializer',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}

# =============================================================================
# CELERY CONFIGURATION
# =============================================================================

CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_WORKER_CONCURRENCY = 4

# Celery Beat schedule
CELERY_BEAT_SCHEDULE = {
    'send-daily-digest': {
        'task': 'apps.content.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=0),
    },
    'cleanup-sessions': {
        'task': 'apps.core.tasks.cleanup_sessions',
        'schedule': crontab(hour=3, minute=0),
    },
    'process-recurring-donations': {
        'task': 'apps.donations.tasks.process_recurring_donations',
        'schedule': crontab(hour=2, minute=0),
    },
}

# =============================================================================
# CACHE CONFIGURATION
# =============================================================================

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
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
        },
        'KEY_PREFIX': 'jolhub',
        'VERSION': 1,
        'TIMEOUT': 300,
    }
}

# Cache timeout constants
CACHE_TIMEOUT_SHORT = 60  # 1 minute
CACHE_TIMEOUT_MEDIUM = 300  # 5 minutes
CACHE_TIMEOUT_LONG = 3600  # 1 hour
CACHE_TIMEOUT_VERY_LONG = 86400  # 24 hours

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env.int('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@journeyoflife.org')
SERVER_EMAIL = env('SERVER_EMAIL', default='errors@journeyoflife.org')
ADMINS = [('JOL Admin', env('ADMIN_EMAIL', default='admin@journeyoflife.org'))]

# Email templates
EMAIL_TEMPLATE_PATH = BASE_DIR / 'django' / 'templates' / 'emails'

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s',
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
            'filters': ['require_debug_true'],
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'jolhub.log',
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'error_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'error.log',
            'maxBytes': 10485760,
            'backupCount': 10,
            'formatter': 'verbose',
            'level': 'ERROR',
        },
        'mail_admins': {
            'class': 'django.utils.log.AdminEmailHandler',
            'level': 'ERROR',
            'filters': ['require_debug_false'],
            'include_html': True,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'jolhub': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# HTTPS settings
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=0)
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False)
SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=False)

# Session settings
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_SAVE_EVERY_REQUEST = False
SESSION_ENGINE = 'django.contrib.sessions.backends.cached_db'

# CSRF settings
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_AGE = 31449600  # 1 year
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

# X-Frame-Options
X_FRAME_OPTIONS = 'DENY'

# Content Security Policy (via django-csp if installed)
# CSP_DEFAULT_SRC = ("'self'",)

# =============================================================================
# CORS SETTINGS
# =============================================================================

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000',
    "http://localhost:3001",
    "http://localhost:3002",
    'http://127.0.0.1:3000',
])

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# API DOCUMENTATION SETTINGS
# =============================================================================

SPECTACULAR_SETTINGS = {
    'TITLE': 'JOL-HUB API',
    'DESCRIPTION': 'Journey Of Life Enterprise API for managing religious institution websites across 27 EU countries',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SCHEMA_PATH_PREFIX': '/api/v1/',
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication endpoints'},
        {'name': 'Organizations', 'description': 'Organization management'},
        {'name': 'Users', 'description': 'User account management'},
        {'name': 'Content', 'description': 'Content management'},
        {'name': 'Donations', 'description': 'Payment processing'},
        {'name': 'Analytics', 'description': 'Statistics and reporting'},
    ],
    'COMPONENT_SPLIT_REQUEST': True,
    'ENUM_ADD_EXPLICIT_BLANK_NULL_CHOICE': False,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
}

# =============================================================================
# GEOLOCATION SETTINGS
# =============================================================================

# Supported countries (ISO 3166-1 alpha-2)
SUPPORTED_COUNTRIES = [
    'LT', 'LV', 'EE', 'FI', 'SE', 'NO', 'DK', 'DE', 'PL', 'CZ',
    'SK', 'AT', 'HU', 'SI', 'HR', 'IT', 'ES', 'PT', 'FR', 'BE',
    'NL', 'LU', 'IE', 'GB', 'GR', 'CY', 'MT',
]

# Default country
DEFAULT_COUNTRY = 'LT'

# Country-specific configurations
COUNTRY_CONFIGURATIONS = {
    'LT': {
        'name': 'Lithuania',
        'currency': 'EUR',
        'language': 'lt',
        'timezone': 'Europe/Vilnius',
    },
    # Add configurations for other countries
}

# =============================================================================
# FILE UPLOAD SETTINGS
# =============================================================================

FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'image': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'],
    'document': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    'archive': ['zip', 'tar', 'gz', 'rar'],
    'video': ['mp4', 'avi', 'mov', 'wmv'],
    'audio': ['mp3', 'wav', 'ogg'],
}

# =============================================================================
# THIRD-PARTY INTEGRATION SETTINGS
# =============================================================================

# Google Analytics
GOOGLE_ANALYTICS_ID = env('GOOGLE_ANALYTICS_ID', default=None)

# Google reCAPTCHA
RECAPTCHA_PUBLIC_KEY = env('RECAPTCHA_PUBLIC_KEY', default='')
RECAPTCHA_PRIVATE_KEY = env('RECAPTCHA_PRIVATE_KEY', default='')

# Payment gateways
# Model A (ADR-0005, jol-m-infrastructure): jol-hub holds NO payment
# service provider keys of any kind. Donations flow through the
# marketplace payment boundary's internal API; card data goes donor
# browser -> provider directly (SAQ-A). Re-introducing PSP secret
# settings here is a PCI scope violation.

# PayPal
PAYPAL_CLIENT_ID = env('PAYPAL_CLIENT_ID', default='')
PAYPAL_CLIENT_SECRET = env('PAYPAL_CLIENT_SECRET', default='')
PAYPAL_MODE = env('PAYPAL_MODE', default='sandbox')

# =============================================================================
# OBSERVABILITY / PROMETHEUS
# =============================================================================

# Comma-separated list of IPs allowed to access /metrics/ (empty = allow all).
# In production this MUST be set, e.g. "10.0.0.0/8,172.16.0.0/12".
_raw_prom_ips = env('PROMETHEUS_ALLOWED_IPS', default='')
PROMETHEUS_ALLOWED_IPS = [ip.strip() for ip in _raw_prom_ips.split(',') if ip.strip()]

# Optional bearer token for /metrics/ (empty = disabled).
PROMETHEUS_AUTH_TOKEN = env('PROMETHEUS_AUTH_TOKEN', default='')

# Directory for Prometheus multi-process metrics (Gunicorn workers).
# Set to e.g. "/tmp/prometheus_multiproc" when running with multiple workers.
PROMETHEUS_MULTIPROC_DIR = env('PROMETHEUS_MULTIPROC_DIR', default='')

# =============================================================================
# MONGODB CONFIGURATION
# =============================================================================
# MongoDB is used as a secondary document store for:
#   - Raw Bitrix24 webhook payloads (unpredictable JSON schema)
#   - High-volume audit / event logs (write-heavy, TTL-managed)
# PostgreSQL remains the primary relational data store.
#
# SOC2 CC6.1 / GDPR Art. 32 — Connection string MUST be supplied via
# environment variable; NEVER hardcode credentials.

MONGODB_URI = env('MONGODB_URI', default='mongodb://localhost:27017')
MONGODB_DB_NAME = env('MONGODB_DB_NAME', default='jolhub_documents')

# TLS/SSL — enforced in production; can be disabled for local dev.
MONGODB_TLS_ENABLED = env.bool('MONGODB_TLS_ENABLED', default=False)
MONGODB_TLS_CA_FILE = env('MONGODB_TLS_CA_FILE', default='')

# Connection pool tuning (defaults suit most workloads).
MONGODB_MAX_POOL_SIZE = env.int('MONGODB_MAX_POOL_SIZE', default=50)
MONGODB_MIN_POOL_SIZE = env.int('MONGODB_MIN_POOL_SIZE', default=5)
MONGODB_MAX_IDLE_TIME_MS = env.int('MONGODB_MAX_IDLE_TIME_MS', default=60_000)
MONGODB_CONNECT_TIMEOUT_MS = env.int('MONGODB_CONNECT_TIMEOUT_MS', default=10_000)
MONGODB_SERVER_SELECTION_TIMEOUT_MS = env.int(
    'MONGODB_SERVER_SELECTION_TIMEOUT_MS', default=5_000,
)

# GDPR data-minimisation — raw webhook payloads auto-expire after this many days.
# SOC2 CC7.2 — Audit logs are retained longer; override per-collection if needed.
MONGODB_TTL_DAYS = env.int('MONGODB_TTL_DAYS', default=90)

# Observability — slow-query threshold (seconds) for the Prometheus histogram.
MONGODB_SLOW_QUERY_THRESHOLD_S = env.float(
    'MONGODB_SLOW_QUERY_THRESHOLD_S', default=0.1,
)

# Application version reported by the /health/ endpoint.
APP_VERSION = env('APP_VERSION', default='1.0.0')

# =============================================================================
# RATE LIMITING SETTINGS
# =============================================================================

RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
RATELIMIT_VIEW = 'apps.core.views.ratelimited'

# =============================================================================
# MAINTENANCE MODE SETTINGS
# =============================================================================

MAINTENANCE_MODE = False
MAINTENANCE_MODE_TEMPLATE = 'maintenance.html'
MAINTENANCE_MODE_STATUS_CODE = 503

# =============================================================================
# IMPORT STRINGS
# =============================================================================

# These settings must be strings and cannot be lazily evaluated
LOGIN_URL = '/accounts/login/'
LOGIN_REDIRECT_URL = '/dashboard/'
LOGOUT_REDIRECT_URL = '/'

# Password reset timeout
PASSWORD_RESET_TIMEOUT = 86400  # 24 hours

# =============================================================================
# TESTING SETTINGS
# =============================================================================

# Use faster password hasher for testing
if 'test' in sys.argv:
    PASSWORD_HASHERS = [
        'django.contrib.auth.hashers.MD5PasswordHasher',
    ]

# =============================================================================
# ENVIRONMENT-SPECIFIC SETTINGS
# =============================================================================

# Import environment-specific settings
# This will be overridden by development.py or production.py
ENVIRONMENT = 'base'

# Ensure file handler exists (fix for missing handler error)
if 'LOGGING' in locals() and 'handlers' in LOGGING:
    if 'file' not in LOGGING['handlers']:
        LOGGING['handlers']['file'] = {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        }
        # Create logs directory if it doesn't exist
        os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

# =============================================================================
# Internal payment-event ingress (ADR-009, docs/payment-api-contract.md v1.0.0)
# Boundary CLOSED: the receiver is flag-gated and stores payment facts only.
# The delivery key is injected from Vaultwarden at deploy time — never
# committed (placeholder below, B8).
# =============================================================================

PAYMENT_EVENTS_ENABLED = env.bool('PAYMENT_EVENTS_ENABLED', default=False)
PAYMENT_EVENTS_REPLAY_WINDOW_SECONDS = env.int(
    'PAYMENT_EVENTS_REPLAY_WINDOW_SECONDS', default=300
)
HUB_PAYMENT_DELIVERY_KEY = env('HUB_PAYMENT_DELIVERY_KEY', default='')

