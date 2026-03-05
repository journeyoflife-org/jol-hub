"""
Content management models — Pages, Media, and navigation.
"""

from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _

from apps.core.models import BaseModel
from apps.organizations.models import Organization


class Page(BaseModel):
    """A single web page belonging to an Organization's website."""

    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_ARCHIVED = 'archived'

    STATUS_CHOICES = [
        (STATUS_DRAFT, _('Draft')),
        (STATUS_PUBLISHED, _('Published')),
        (STATUS_ARCHIVED, _('Archived')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='pages', verbose_name=_('organization'),
    )
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='children', verbose_name=_('parent page'),
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='authored_pages',
        verbose_name=_('author'),
    )

    title = models.CharField(_('title'), max_length=255)
    slug = models.SlugField(_('slug'), max_length=255, db_index=True)
    content = models.TextField(_('content'), blank=True)
    excerpt = models.TextField(_('excerpt'), blank=True)
    language = models.CharField(_('language'), max_length=8, default='en', db_index=True)
    template = models.CharField(_('template'), max_length=64, default='default')
    status = models.CharField(_('status'), max_length=20,
                               choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    published_at = models.DateTimeField(_('published at'), null=True, blank=True)
    featured_image = models.ForeignKey(
        'MediaFile', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='featured_in_pages',
        verbose_name=_('featured image'),
    )
    meta_title = models.CharField(_('meta title'), max_length=255, blank=True)
    meta_description = models.TextField(_('meta description'), blank=True)
    meta_keywords = models.CharField(_('meta keywords'), max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(_('sort order'), default=0)
    extra = models.JSONField(_('extra'), default=dict)

    class Meta:
        verbose_name = _('page')
        verbose_name_plural = _('pages')
        ordering = ['sort_order', 'title']
        unique_together = [('organization', 'slug', 'language')]
        indexes = [
            models.Index(fields=['organization', 'status', 'language']),
        ]

    def __str__(self):
        return f'{self.title} [{self.language}] ({self.organization})'

    def publish(self):
        from django.utils import timezone
        self.status = self.STATUS_PUBLISHED
        self.published_at = self.published_at or timezone.now()
        self.save(update_fields=['status', 'published_at', 'updated_at'])


class MediaFile(BaseModel):
    """Uploaded media asset (images, documents, etc.)."""

    TYPE_IMAGE = 'image'
    TYPE_DOCUMENT = 'document'
    TYPE_VIDEO = 'video'
    TYPE_AUDIO = 'audio'
    TYPE_OTHER = 'other'

    TYPE_CHOICES = [
        (TYPE_IMAGE, _('Image')),
        (TYPE_DOCUMENT, _('Document')),
        (TYPE_VIDEO, _('Video')),
        (TYPE_AUDIO, _('Audio')),
        (TYPE_OTHER, _('Other')),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE,
        related_name='media_files', verbose_name=_('organization'),
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='uploaded_media',
        verbose_name=_('uploaded by'),
    )

    file = models.FileField(_('file'), upload_to='media/%Y/%m/')
    file_name = models.CharField(_('file name'), max_length=255)
    file_type = models.CharField(_('file type'), max_length=16, choices=TYPE_CHOICES)
    mime_type = models.CharField(_('MIME type'), max_length=128, blank=True)
    file_size = models.PositiveIntegerField(_('file size (bytes)'), default=0)
    alt_text = models.CharField(_('alt text'), max_length=255, blank=True)
    caption = models.TextField(_('caption'), blank=True)

    class Meta:
        verbose_name = _('media file')
        verbose_name_plural = _('media files')
        ordering = ['-created_at']

    def __str__(self):
        return self.file_name
