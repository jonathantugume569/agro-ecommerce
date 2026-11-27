from rest_framework import serializers

from .models import Category, Listing, Product


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]
        read_only_fields = ["slug"]


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    # Filled in by the view with annotations (None when not annotated).
    listing_count = serializers.IntegerField(read_only=True, required=False)
    min_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True, required=False
    )

    class Meta:
        model = Product
        fields = [
            "id", "name", "category", "category_name", "description", "unit", "image",
            "listing_count", "min_price", "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate(self, attrs):
        # Friendly message instead of a database error for duplicates.
        name = attrs.get("name", getattr(self.instance, "name", None))
        category = attrs.get("category", getattr(self.instance, "category", None))
        unit = attrs.get("unit", getattr(self.instance, "unit", ""))
        duplicates = Product.objects.filter(name__iexact=name, category=category, unit__iexact=unit)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError("This product already exists. List it instead of adding it again.")
        return attrs


class ProductSummarySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "name", "category", "category_name", "unit", "image"]


class ListingDealerSerializer(serializers.Serializer):
    """The small part of a dealer that a listing shows."""

    id = serializers.IntegerField()
    business_name = serializers.CharField()
    location = serializers.CharField()
    district = serializers.CharField()
    is_verified = serializers.BooleanField()
    profile_picture = serializers.ImageField(read_only=True)

class ListingSerializer(serializers.ModelSerializer):
    # Read: full product and dealer summaries. Write: send product_id.
    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    dealer = ListingDealerSerializer(read_only=True)
    is_premium = serializers.BooleanField(source="premium_active", read_only=True)
    in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Listing
        fields = [
            "id", "product", "product_id", "dealer", "price", "stock", "in_stock",
            "description", "location", "is_active", "is_premium", "premium_expires_at",
            "created_at", "updated_at",
        ]
        read_only_fields = ["premium_expires_at", "created_at", "updated_at"]

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be more than zero.")
        return value

    def validate(self, attrs):
        request = self.context["request"]
        # On update the product cannot change, so skip the duplicate check.
        if self.instance is None:
            dealer = getattr(request.user, "dealer_profile", None)
            product = attrs["product"]
            if dealer and Listing.objects.filter(dealer=dealer, product=product).exists():
                raise serializers.ValidationError(
                    {"product_id": "You already have a listing for this product. Edit it instead."}
                )
        elif "product" in attrs and attrs["product"] != self.instance.product:
            raise serializers.ValidationError(
                {"product_id": "The product cannot be changed. Create a new listing instead."}
            )
        return attrs

    def create(self, validated_data):
        dealer = self.context["request"].user.dealer_profile
        # Default the listing location to the dealer's own.
        if not validated_data.get("location"):
            validated_data["location"] = dealer.location or dealer.district
        return Listing.objects.create(dealer=dealer, **validated_data)
