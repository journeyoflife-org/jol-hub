# Generated to fix cross-app AddField issue (Wave 1 CI fix)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0004_organization_bitrix24_contact_group_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="schema_name",
            field=models.CharField(
                blank=True,
                help_text="Postgres schema name (auto-generated from slug, e.g. t_vilnius)",
                max_length=63,
                unique=True,
                verbose_name="schema name",
            ),
        ),
    ]
