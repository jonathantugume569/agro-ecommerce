from django.contrib import admin

from .models import Category, Listing, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "unit", "created_by", "created_at")
    list_filter = ("category",)
    search_fields = ("name", "description")


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = (
        "product", "dealer", "price", "stock", "is_active", "is_premium", "premium_expires_at",
    )
    list_filter = ("is_active", "is_premium", "dealer__is_verified", "product__category")
    search_fields = ("product__name", "dealer__business_name", "location")
    autocomplete_fields = ("product",)
    actions = ["activate", "deactivate"]

    @admin.action(description="Show selected listings to farmers")
    def activate(self, request, queryset):
        queryset.update(is_active=True)

    @admin.action(description="Hide selected listings from farmers")
    def deactivate(self, request, queryset):
        queryset.update(is_active=False)
