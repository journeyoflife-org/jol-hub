"""
ASGI config for JOL-HUB project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see:
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/

Usage:
    uvicorn core.asgi:application --host 0.0.0.0 --port 8000
    daphne -b 0.0.0.0 -p 8000 core.asgi:application
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

application = get_asgi_application()
