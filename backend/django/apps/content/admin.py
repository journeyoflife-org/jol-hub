from django.contrib import admin

from .models import MediaFile, Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "organization",
        "language",
        "status",
        "author",
        "published_at",
    )
    list_filter = ("status", "language", "template")
    search_fields = ("title", "slug", "content")
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ("id", "published_at", "created_at", "updated_at")
    date_hierarchy = "created_at"
    raw_id_fields = ("organization", "author", "parent", "featured_image")

    def get_queryset(self, request):
        """Scope admin queryset to entitled tenant (no cross-tenant data)."""
        qs = super().get_queryset(request)
        tenant = getattr(request, "tenant", None)
        if tenant is not None:
            return qs.filter(organization=tenant)
        # Superuser with no tenant context → all (platform admin)
        return qs

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Lock organization FK to entitled tenant."""
        if db_field.name == "organization":
            tenant = getattr(request, "tenant", None)
            if tenant is not None:
                kwargs["queryset"] = type(tenant).objects.filter(pk=tenant.pk)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ("file_name", "organization", "file_type", "file_size", "created_at")
    list_filter = ("file_type",)
    search_fields = ("file_name", "alt_text")
    readonly_fields = ("id", "created_at", "updated_at")

    def get_queryset(self, request):
        """Scope media admin to entitled tenant."""
        qs = super().get_queryset(request)
        tenant = getattr(request, "tenant", None)
        if tenant is not None:
            return qs.filter(organization=tenant)
        return qs
