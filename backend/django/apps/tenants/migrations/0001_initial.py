import django.db.models.deletion
from django.db import migrations, models


def populate_schema_names(apps, schema_editor):
    """Generate t_<slug> schema names for existing organizations."""
    Organization = apps.get_model("organizations", "Organization")
    for org in Organization.objects.all():
        slug = org.slug.replace("-", "_")[:63]
        org.schema_name = f"t_{slug}"
        org.save(update_fields=["schema_name"])


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantDomain",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("domain", models.CharField(db_index=True, max_length=255, unique=True, verbose_name="domain")),
                ("is_primary", models.BooleanField(db_index=True, default=True, verbose_name="primary domain")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="domains", to="organizations.organization", verbose_name="tenant")),
            ],
            options={
                "verbose_name": "tenant domain",
                "verbose_name_plural": "tenant domains",
                "ordering": ["-is_primary", "domain"],
            },
        ),
        migrations.AddField(
            model_name="organization",
            name="schema_name",
            field=models.CharField(blank=True, help_text="Postgres schema name (auto-generated from slug)", max_length=63, unique=True, verbose_name="schema name"),
        ),
        migrations.RunPython(populate_schema_names, migrations.RunPython.noop),
    ]
