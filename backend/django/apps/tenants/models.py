"""
Tenant isolation models — django-tenants integration.

Organization is the tenant model (already exists in apps.organizations).
This module provides the Domain model required by django-tenants
and the schema-per-tenant migration infrastructure.

ADR-001: schema-per-tenant + RLS defense-in-depth.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_tenants.models import TenantMixin


def generate_schema_name(tenant):
    """Generate schema name from organization slug: t_<slug>."""
    slug = tenant.slug.replace("-", "_")[:63]  # Postgres identifier limit
    return f"t_{slug}"


class TenantDomain(TenantMixin):
    """
    Domain routing for tenant schemas.

    Maps hostnames (e.g. 'vilnius.gyvenimo-kelias.lt') to
    Organization tenant schemas (t_vilnius).
    """

    domain = models.CharField(
        _("domain"), max_length=255, unique=True, db_index=True
    )
    tenant = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="domains",
        verbose_name=_("tenant"),
    )
    is_primary = models.BooleanField(
        _("primary domain"), default=True, db_index=True
    )

    auto_create_schema = True
    auto_drop_schema = False  # Safety: never drop schema on domain deletion

    class Meta:
        verbose_name = _("tenant domain")
        verbose_name_plural = _("tenant domains")
        ordering = ["-is_primary", "domain"]

    def __str__(self):
        return f"{self.domain} → {self.tenant.slug}"
