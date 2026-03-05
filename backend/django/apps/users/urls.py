"""
User URL patterns.

Endpoints:
    GET  /api/v1/users/me/              - Current user profile
    PATCH /api/v1/users/me/             - Update current user profile
    POST /api/v1/users/me/change-password/ - Change password
    GET  /api/v1/users/me/gdpr/export/  - GDPR data export
    DEL  /api/v1/users/me/gdpr/delete/  - GDPR right to erasure
    GET  /api/v1/users/                 - List users (admin)
    GET  /api/v1/users/{id}/            - User detail
"""

from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    path('me/', views.MeView.as_view(), name='me'),
    path('me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('me/gdpr/export/', views.GDPRDataExportView.as_view(), name='gdpr-export'),
    path('me/gdpr/delete/', views.GDPRDataDeleteView.as_view(), name='gdpr-delete'),
    path('', views.UserListView.as_view(), name='user-list'),
    path('<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
