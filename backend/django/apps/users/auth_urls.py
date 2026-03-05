"""
Authentication URL patterns.

Endpoints:
    POST /api/v1/auth/register/    - Register new user
    POST /api/v1/auth/login/       - Login (returns JWT tokens)
    POST /api/v1/auth/logout/      - Logout (blacklist refresh token)
    POST /api/v1/auth/refresh/     - Refresh access token
"""

from django.urls import path
from . import views

app_name = 'auth'

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', views.TokenRefreshViewExtended.as_view(), name='token-refresh'),
]
