"""
Core serializers — base classes and helpers shared by all apps.
"""

from rest_framework import serializers
from .models import AuditLog


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer that includes standard read-only fields
    (id, created_at, updated_at) present on all domain models.
    """

    id = serializers.UUIDField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


class AuditLogSerializer(BaseModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user_id', 'action', 'entity_type', 'entity_id',
            'field_changes', 'ip_address', 'correlation_id',
            'extra', 'created_at',
        ]
        read_only_fields = fields
