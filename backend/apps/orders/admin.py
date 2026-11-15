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

    # Orders change through the API/services only, so stock and signals stay consistent.
    # Editing status or deleting here would skip stock restoration and notifications.
    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
