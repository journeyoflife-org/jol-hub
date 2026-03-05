"""
Organization serializers.
"""

from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import Organization, OrganizationMember, Website


class WebsiteSerializer(BaseModelSerializer):
    class Meta:
        model = Website
        fields = [
            'id', 'domain', 'theme', 'default_language', 'languages',
            'ssl_enabled', 'analytics_id', 'settings', 'created_at', 'updated_at',
        ]


class OrganizationSerializer(BaseModelSerializer):
    website = WebsiteSerializer(read_only=True)
    member_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'org_type', 'status', 'country',
            'description', 'logo',
            'address_street', 'address_city', 'address_postal_code',
            'email', 'phone', 'website',
            'latitude', 'longitude',
            'member_count', 'extra',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class OrganizationCreateSerializer(BaseModelSerializer):
    class Meta:
        model = Organization
        fields = [
            'name', 'org_type', 'country', 'description',
            'address_street', 'address_city', 'address_postal_code',
            'email', 'phone',
        ]

    def create(self, validated_data):
        from django.utils.text import slugify
        import uuid
        validated_data['slug'] = slugify(validated_data['name']) + '-' + str(uuid.uuid4())[:8]
        validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)


class OrganizationMemberSerializer(BaseModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = OrganizationMember
        fields = [
            'id', 'organization', 'user', 'user_email', 'user_full_name',
            'role', 'joined_at', 'created_at',
        ]
        read_only_fields = ['id', 'joined_at', 'created_at']
