from django.contrib import admin

from .models import Category, Listing, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "unit")
    list_filter = ("category",)
    search_fields = ("name",)


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ("product", "dealer", "price", "stock_quantity", "is_active", "is_premium")
    list_filter = ("is_active", "is_premium")
    search_fields = ("product__name", "dealer__business_name")
