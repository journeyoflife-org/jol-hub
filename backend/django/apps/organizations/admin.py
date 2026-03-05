from django.contrib import admin
from .models import Organization, OrganizationMember, Website


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'org_type', 'country', 'status', 'owner', 'created_at')
    list_filter = ('org_type', 'status', 'country')
    search_fields = ('name', 'slug', 'email')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ('organization', 'user', 'role', 'joined_at')
    list_filter = ('role',)
    search_fields = ('organization__name', 'user__email')
    readonly_fields = ('id', 'joined_at', 'created_at', 'updated_at')


@admin.register(Website)
class WebsiteAdmin(admin.ModelAdmin):
    list_display = ('organization', 'domain', 'theme', 'ssl_enabled')
    search_fields = ('organization__name', 'domain')
    readonly_fields = ('id', 'created_at', 'updated_at')
