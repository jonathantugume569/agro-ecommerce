from django.db import migrations


def repair_listing_schema(apps, schema_editor):
    connection = schema_editor.connection
    table = "catalog_listing"

    with connection.cursor() as cursor:
        columns = {
            col.name
            for col in connection.introspection.get_table_description(cursor, table)
        }

    # 1. Rename stock_quantity to stock if necessary
    if "stock_quantity" in columns and "stock" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                'ALTER TABLE catalog_listing RENAME COLUMN "stock_quantity" TO "stock"'
            )
        columns.remove("stock_quantity")
        columns.add("stock")

    # 2. Rename premium_until to premium_expires_at if necessary
    if "premium_until" in columns and "premium_expires_at" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                'ALTER TABLE catalog_listing RENAME COLUMN "premium_until" TO "premium_expires_at"'
            )
        columns.remove("premium_until")
        columns.add("premium_expires_at")

    # 3. Add stock if neither old nor new stock column exists
    if "stock" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE catalog_listing "
                "ADD COLUMN stock INTEGER NOT NULL DEFAULT 0"
            )
        columns.add("stock")

    # 4. Add description if missing
    if "description" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE catalog_listing "
                "ADD COLUMN description TEXT NOT NULL DEFAULT ''"
            )
        columns.add("description")

    # 5. Add location if missing
    if "location" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE catalog_listing "
                "ADD COLUMN location VARCHAR(150) NOT NULL DEFAULT ''"
            )
        columns.add("location")

    # 6. Add premium_expires_at if missing
    if "premium_expires_at" not in columns:
        with connection.cursor() as cursor:
            cursor.execute(
                "ALTER TABLE catalog_listing "
                "ADD COLUMN premium_expires_at datetime NULL"
            )


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0003_repair_product_created_by"),
    ]

    operations = [
        migrations.RunPython(
            repair_listing_schema,
            reverse_code=migrations.RunPython.noop,
        ),
    ]