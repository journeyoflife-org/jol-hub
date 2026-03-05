from django.contrib import admin
from .models import Page, MediaFile


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'language', 'status', 'author', 'published_at')
    list_filter = ('status', 'language', 'template')
    search_fields = ('title', 'slug', 'content')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('id', 'published_at', 'created_at', 'updated_at')
    date_hierarchy = 'created_at'
    raw_id_fields = ('organization', 'author', 'parent', 'featured_image')


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ('file_name', 'organization', 'file_type', 'file_size', 'created_at')
    list_filter = ('file_type',)
    search_fields = ('file_name', 'alt_text')
    readonly_fields = ('id', 'created_at', 'updated_at')
