from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "listing", "product_name", "quantity", "unit_price", "subtotal"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    farmer_name = serializers.SerializerMethodField()
    dealer_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "status", "farmer", "farmer_name", "dealer", "dealer_name",
            "total_amount", "delivery_address", "notes", "items",
            "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_farmer_name(self, obj):
        return obj.farmer.get_full_name() or obj.farmer.username

    def get_dealer_name(self, obj):
        profile = getattr(obj.dealer, "dealer_profile", None)
        return profile.business_name if profile else obj.dealer.username


class PlaceOrderLineSerializer(serializers.Serializer):
    listing = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class PlaceOrderSerializer(serializers.Serializer):
    items = PlaceOrderLineSerializer(many=True, allow_empty=False)
    delivery_address = serializers.CharField(max_length=255)
    notes = serializers.CharField(required=False, allow_blank=True, default="")
