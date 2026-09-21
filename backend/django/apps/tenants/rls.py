"""
PostgreSQL Row-Level Security utilities.

Defense-in-depth: if search_path is ever misconfigured, RLS
provides a secondary isolation layer.

ADR-001: RLS on all tenant-scoped tables.
SET LOCAL app.tenant_id inside ATOMIC_REQUESTS transaction.
"""
import logging

from django.db import connection

logger = logging.getLogger("jolhub.tenant.rls")

# Tables that require RLS protection (all tenant-scoped models)
RLS_PROTECTED_TABLES = [
    "content_page",
    "content_mediafile",
    "organizations_organizationmember",
    "organizations_website",
    "organizations_consentsettings",
    "crm_contact",
    "crm_lead",
    "donations_donation",
    "analytics_pageview",
]


def enable_rls_for_table(table_name: str):
    """Enable RLS and create policy for a table."""
    with connection.cursor() as cursor:
        cursor.execute(f'ALTER TABLE "{table_name}" ENABLE ROW LEVEL SECURITY;')
        cursor.execute(f'ALTER TABLE "{table_name}" FORCE ROW LEVEL SECURITY;')
        cursor.execute(f"""
            CREATE POLICY tenant_isolation ON "{table_name}"
            USING (organization_id::text = current_setting('app.tenant_id', true));
        """)


def set_tenant_id_for_request(tenant_id: str):
    """
    Set app.tenant_id for the current transaction.

    Must be called inside ATOMIC_REQUESTS block.
    Uses SET LOCAL so it resets at transaction end (no pooling leak).
    """
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT set_config('app.tenant_id', %s, true)",  # true = LOCAL
            [str(tenant_id)],
        )


def verify_rls_active(table_name: str) -> bool:
    """Check if RLS is enabled and forced on a table."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE relname = %s AND relkind = 'r';
        """, [table_name])
        row = cursor.fetchone()
        if row:
            return row[1] and row[2]  # both must be True
    return False
