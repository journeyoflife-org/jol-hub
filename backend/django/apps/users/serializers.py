"""
User serializers — registration, profile read/write, and JWT token pair.
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer as BaseTokenPairSerializer

from apps.core.serializers import BaseModelSerializer
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['bio', 'website', 'date_of_birth', 'notification_preferences']


class UserSerializer(BaseModelSerializer):
    """Full user representation (admin / self)."""

    full_name = serializers.CharField(read_only=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_verified', 'mfa_enabled',
            'avatar', 'phone', 'preferred_language', 'timezone', 'country',
            'gdpr_consent', 'gdpr_consent_at',
            'marketing_consent', 'marketing_consent_at',
            'last_login', 'login_count',
            'profile', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'is_verified', 'login_count', 'last_login',
            'gdpr_consent_at', 'marketing_consent_at',
            'created_at', 'updated_at',
        ]


class UserPublicSerializer(BaseModelSerializer):
    """Minimal public representation exposed to other organisation members."""

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'full_name', 'avatar', 'role', 'country']


class RegisterSerializer(serializers.ModelSerializer):
    """New user registration."""

    password = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'},
        validators=[validate_password],
    )
    password_confirm = serializers.CharField(
        write_only=True, required=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name',
            'password', 'password_confirm',
            'gdpr_consent', 'marketing_consent',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        from django.utils import timezone
        if validated_data.get('gdpr_consent'):
            validated_data['gdpr_consent_at'] = timezone.now()
        if validated_data.get('marketing_consent'):
            validated_data['marketing_consent_at'] = timezone.now()
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(
        required=True, style={'input_type': 'password'},
        validators=[validate_password],
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value


class TokenObtainPairSerializer(BaseTokenPairSerializer):
    """Extended JWT pair serializer that embeds user data in the response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data
