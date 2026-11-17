
from django.db import migrations


def repair_created_by(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    field = Product._meta.get_field("created_by")

    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor, Product._meta.db_table
            )
        }

    if field.column not in columns:
        schema_editor.add_field(Product, field)


def reverse_repair(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    field = Product._meta.get_field("created_by")

    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor, Product._meta.db_table
            )
        }

    if field.column in columns:
        schema_editor.remove_field(Product, field)


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(
            repair_created_by,
            reverse_repair,
        ),
    ]
