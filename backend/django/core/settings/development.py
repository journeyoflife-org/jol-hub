from .base import *

DEBUG = True

# SQLite for local development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '*']
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# DISABLE REDIS - Use local memory instead
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # Use database, not Redis
SESSION_CACHE_ALIAS = 'default'

# If Celery is configured, use local memory broker
CELERY_BROKER_URL = 'memory://'
CELERY_RESULT_BACKEND = 'cache'
CELERY_CACHE_BACKEND = 'default'
