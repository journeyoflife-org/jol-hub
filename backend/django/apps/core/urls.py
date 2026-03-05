"""
Core URL configuration — exposes health check and audit log.
"""

from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit-log-list'),
]
