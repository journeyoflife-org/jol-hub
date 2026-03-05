"""
User URL patterns.
"""

from django.urls import path
from . import views

app_name = 'users'

# Auth endpoints
auth_urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', views.TokenRefreshViewExtended.as_view(), name='token-refresh'),
]

# User / profile endpoints
urlpatterns = [
    path('me/', views.MeView.as_view(), name='me'),
    path('me/change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    path('me/gdpr/export/', views.GDPRDataExportView.as_view(), name='gdpr-export'),
    path('me/gdpr/delete/', views.GDPRDataDeleteView.as_view(), name='gdpr-delete'),
    path('', views.UserListView.as_view(), name='user-list'),
    path('<uuid:pk>/', views.UserDetailView.as_view(), name='user-detail'),
]
