"""
User views — auth endpoints, profile management, and GDPR data rights.
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import (
    RegisterSerializer, UserSerializer,
    ChangePasswordSerializer, TokenObtainPairSerializer,
)


class RegisterView(generics.CreateAPIView):
    """POST /api/v1/auth/register/ — create a new user account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/ — obtain JWT token pair."""

    serializer_class = TokenObtainPairSerializer


class TokenRefreshViewExtended(TokenRefreshView):
    """POST /api/v1/auth/refresh/ — refresh access token."""


class LogoutView(APIView):
    """POST /api/v1/auth/logout/ — blacklist refresh token."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {'error': 'validation_error', 'message': 'refresh_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out.'})


class MeView(generics.RetrieveUpdateAPIView):
    """GET / PATCH /api/v1/users/me/ — current user profile."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    """POST /api/v1/users/me/change-password/"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password', 'updated_at'])
        return Response({'message': 'Password updated successfully.'})


class UserListView(generics.ListCreateAPIView):
    """GET /api/v1/users/  — admin only."""

    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.active().order_by('email')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET / PATCH / DELETE /api/v1/users/{id}/"""

    serializer_class = UserSerializer
    queryset = User.objects.all()

    def perform_destroy(self, instance):
        instance.soft_delete()


class GDPRDataExportView(APIView):
    """
    GET /api/v1/users/me/gdpr/export/
    Returns a machine-readable dump of all personal data (GDPR Art. 20).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserSerializer(user).data
        return Response({'personal_data': data})


class GDPRDataDeleteView(APIView):
    """
    DELETE /api/v1/users/me/gdpr/delete/
    Soft-deletes the account (right to erasure, GDPR Art. 17).
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        request.user.soft_delete()
        return Response(
            {'message': 'Your account has been scheduled for deletion.'},
            status=status.HTTP_200_OK,
        )
