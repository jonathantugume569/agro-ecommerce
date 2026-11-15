from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["listing", "product_name", "quantity", "unit_price"]
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "farmer", "dealer", "status", "total_amount", "created_at"]
    list_filter = ["status"]
    search_fields = ["farmer__username", "dealer__username"]
    inlines = [OrderItemInline]
