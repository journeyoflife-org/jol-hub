"""
Core admin registrations.
"""

from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'entity_type', 'entity_id', 'user_id', 'ip_address', 'created_at')
    list_filter = ('action', 'entity_type')
    search_fields = ('entity_type', 'entity_id', 'user_id')
    readonly_fields = ('id', 'user_id', 'action', 'entity_type', 'entity_id',
                       'field_changes', 'ip_address', 'user_agent',
                       'correlation_id', 'extra', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
