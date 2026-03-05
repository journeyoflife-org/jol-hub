"""
Content serializers.
"""

from rest_framework import serializers
from apps.core.serializers import BaseModelSerializer
from .models import Page, MediaFile


class MediaFileSerializer(BaseModelSerializer):
    class Meta:
        model = MediaFile
        fields = [
            'id', 'organization', 'file', 'file_name', 'file_type',
            'mime_type', 'file_size', 'alt_text', 'caption',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'file_size', 'mime_type', 'created_at', 'updated_at']


class PageSerializer(BaseModelSerializer):
    featured_image = MediaFileSerializer(read_only=True)
    featured_image_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Page
        fields = [
            'id', 'organization', 'parent', 'author',
            'title', 'slug', 'content', 'excerpt', 'language',
            'template', 'status', 'published_at',
            'featured_image', 'featured_image_id',
            'meta_title', 'meta_description', 'meta_keywords',
            'sort_order', 'extra',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'published_at', 'created_at', 'updated_at']


class PageCreateSerializer(BaseModelSerializer):
    class Meta:
        model = Page
        fields = [
            'organization', 'parent', 'title', 'slug',
            'content', 'excerpt', 'language', 'template',
            'meta_title', 'meta_description', 'meta_keywords',
        ]

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
