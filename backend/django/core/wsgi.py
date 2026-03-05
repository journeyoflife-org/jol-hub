"""
WSGI config for JOL-HUB project.

This module contains the WSGI application used by production servers to handle
HTTP requests. It exposes the `application` callable that serves as the entry
point between the web server and Django.

For more information on this file, see:
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/

Deployment Options:
-------------------
1. Gunicorn (Recommended):
   gunicorn backend.django.core.wsgi:application --bind 0.0.0.0:8000

2. uWSGI:
   uwsgi --http :8000 --wsgi-file backend/django/core/wsgi.py

3. Apache mod_wsgi:
   WSGIScriptAlias / /path/to/backend/django/core/wsgi.py

4. Nginx + uWSGI/Gunicorn:
   Configure Nginx as reverse proxy to uWSGI/Gunicorn
"""

import os
import sys
from pathlib import Path

# Add the project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# Set the DJANGO_SETTINGS_MODULE environment variable
# This tells Django which settings module to use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.django.core.settings.production')

# Import Django application after settings are configured
from django.core.wsgi import get_wsgi_application

# Create the WSGI application
application = get_wsgi_application()

# =============================================================================
# WSGI MIDDLEWARE (Optional)
# =============================================================================


class WSGIMiddleware:
    """
    Custom WSGI middleware for request/response processing.
    
    This can be used to add headers, logging, or other cross-cutting concerns
    at the WSGI level before requests reach Django.
    
    Example usage:
        from backend.django.core.wsgi import WSGIMiddleware
        application = WSGIMiddleware(application)
    """
    
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        # Add custom headers to all responses
        environ['CUSTOM_HEADER'] = 'value'
        
        # Add request ID for tracing
        import uuid
        request_id = str(uuid.uuid4())
        environ['HTTP_X_REQUEST_ID'] = request_id
        
        # Custom response handler
        def custom_start_response(status, headers, exc_info=None):
            # Add security headers
            headers.append(('X-Request-ID', request_id))
            headers.append(('X-Content-Type-Options', 'nosniff'))
            headers.append(('X-Frame-Options', 'DENY'))
            headers.append(('X-XSS-Protection', '1; mode=block'))
            
            return start_response(status, headers, exc_info)
        
        # Call the next application
        return self.app(environ, custom_start_response)


# Uncomment to enable custom WSGI middleware
# application = WSGIMiddleware(application)

# =============================================================================
# PERFORMANCE OPTIMIZATIONS
# =============================================================================

# Enable threading for better concurrency (if needed)
# from concurrent.futures import ThreadPoolExecutor
# executor = ThreadPoolExecutor(max_workers=10)

# Optimize for production deployment
try:
    # Try to import production optimizations
    from whitenoise import WhiteNoise
    
    # Wrap application with WhiteNoise for static file serving
    application = WhiteNoise(
        application,
        root=os.path.join(PROJECT_ROOT, 'staticfiles'),
        prefix='static/',
        max_age=604800,  # 7 days
        immutable_max_age=31536000,  # 1 year
    )
except ImportError:
    pass

# =============================================================================
# HEALTH CHECK ENDPOINT
# =============================================================================


def health_check_app(environ, start_response):
    """
    Simple health check application for load balancers.
    
    This provides a lightweight endpoint that doesn't load the full Django
    stack, useful for load balancer health checks.
    
    Usage:
        Configure load balancer to check /health/ endpoint
    """
    if environ.get('PATH_INFO') == '/health/':
        status = '200 OK'
        response_headers = [
            ('Content-Type', 'application/json'),
            ('Cache-Control', 'no-cache'),
        ]
        response_body = b'{"status":"healthy","service":"jol-hub-wsgi"}'
        start_response(status, response_headers)
        return [response_body]
    else:
        # Pass through to Django application
        return application(environ, start_response)


# Use health check wrapper
# application = health_check_app

# =============================================================================
# DEPLOYMENT ENVIRONMENT DETECTION
# =============================================================================

# Detect deployment environment
ENVIRONMENT = os.environ.get('JOL_ENVIRONMENT', 'production')

if ENVIRONMENT == 'development':
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.django.core.settings.development'
elif ENVIRONMENT == 'staging':
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.django.core.settings.staging'
elif ENVIRONMENT == 'production':
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.django.core.settings.production'
else:
    os.environ['DJANGO_SETTINGS_MODULE'] = 'backend.django.core.settings.production'

# Reload application with correct settings
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# =============================================================================
# SERVER-SPECIFIC CONFIGURATIONS
# =============================================================================

# Gunicorn-specific optimizations
if 'gunicorn' in os.environ.get('SERVER_SOFTWARE', ''):
    # Enable Gunicorn specific optimizations
    try:
        from gunicorn.workers.gthread import ThreadWorker
        # Configuration done via command line flags
    except ImportError:
        pass

# uWSGI-specific optimizations
if 'uwsgi' in os.environ.get('SERVER_SOFTWARE', ''):
    # Enable uWSGI specific optimizations
    try:
        import uwsgi
        # Access uWSGI-specific features
    except ImportError:
        pass

# =============================================================================
# MONITORING INTEGRATION
# =============================================================================

# New Relic integration (optional)
try:
    import newrelic.agent
    newrelic.agent.initialize(os.path.join(PROJECT_ROOT, 'newrelic.ini'))
    application = newrelic.agent.wsgi_application()(application)
except ImportError:
    pass

# Sentry integration (optional)
try:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.wsgi import SentryWsgiMiddleware
    
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True,
    )
    
    application = SentryWsgiMiddleware(application)
except ImportError:
    pass

# =============================================================================
# USAGE EXAMPLES
# =============================================================================

"""
Running with Gunicorn:
----------------------
gunicorn backend.django.core.wsgi:application \\
    --bind 0.0.0.0:8000 \\
    --workers 4 \\
    --threads 2 \\
    --worker-class gthread \\
    --timeout 30 \\
    --keep-alive 5 \\
    --access-logfile - \\
    --error-logfile - \\
    --capture-output \\
    --enable-stdio-inheritance

Running with uWSGI:
-------------------
uwsgi --http :8000 \\
    --wsgi-file backend/django/core/wsgi.py \\
    --master \\
    --processes 4 \\
    --threads 2 \\
    --enable-threads \\
    --thunder-lock \\
    --die-on-term \\
    --vacuum \\
    --single-interpreter \\
    --buffer-size 32768 \\
    --harakiri 30 \\
    --max-requests 5000 \\
    --log-maxsize 10485760

Apache Configuration:
---------------------
<VirtualHost *:80>
    ServerName api.journeyoflife.org
    
    WSGIDaemonProcess jolhub python-home=/path/to/venv python-path=/path/to/jol-hub
    WSGIProcessGroup jolhub
    WSGIScriptAlias / /path/to/jol-hub/backend/django/core/wsgi.py
    
    <Directory /path/to/jol-hub/backend/django/core>
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>
    
    Alias /static/ /path/to/jol-hub/staticfiles/
    <Directory /path/to/jol-hub/staticfiles>
        Require all granted
    </Directory>
</VirtualHost>

Nginx Configuration:
--------------------
server {
    listen 80;
    server_name api.journeyoflife.org;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /path/to/jol-hub/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias /path/to/jol-hub/media/;
        expires 7d;
    }
}

Docker Deployment:
------------------
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy application
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "backend.django.core.wsgi:application"]

Kubernetes Deployment:
----------------------
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jol-hub-api
spec:
  replicas: 4
  selector:
    matchLabels:
      app: jol-hub-api
  template:
    metadata:
      labels:
        app: jol-hub-api
    spec:
      containers:
      - name: api
        image: jolhub/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: DJANGO_SETTINGS_MODULE
          value: "backend.django.core.settings.production"
        - name: JOL_ENVIRONMENT
          value: "production"
        readinessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health/
            port: 8000
          initialDelaySeconds: 15
          periodSeconds: 20
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

Best Practices:
---------------

1. Always set DJANGO_SETTINGS_MODULE explicitly
2. Use environment variables for configuration
3. Implement health check endpoints
4. Add monitoring and tracing integration
5. Configure proper logging
6. Set appropriate timeouts
7. Use multiple workers for concurrency
8. Enable keep-alive connections
9. Configure proper buffer sizes
10. Implement graceful shutdown handling
11. Use process managers (systemd, supervisor)
12. Monitor worker memory and restart when needed
13. Enable access and error logging
14. Configure SSL/TLS termination
15. Implement rate limiting at WSGI level if needed
"""

# Application version for tracking
__version__ = '1.0.0'
__author__ = 'JOL-HUB Team'
__email__ = 'dev@journeyoflife.org'
