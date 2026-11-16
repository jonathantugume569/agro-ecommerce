from django.db import models
from django.utils import timezone


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Product(models.Model):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="products/", blank=True, null=True)
    unit = models.CharField(max_length=30, default="kg", help_text="e.g. kg, bag, litre, piece")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Listing(models.Model):
    """One dealer selling one product at one price."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="listings")
    dealer = models.ForeignKey(
        "accounts.DealerProfile", on_delete=models.CASCADE, related_name="listings"
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_premium = models.BooleanField(default=False)
    premium_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["price"]
        constraints = [
            models.UniqueConstraint(fields=["product", "dealer"], name="unique_listing_per_dealer")
        ]

    @property
    def in_stock(self):
        return self.stock_quantity > 0

    @property
    def premium_active(self):
        return self.is_premium and (self.premium_until is None or self.premium_until > timezone.now())

    def __str__(self):
        return f"{self.product.name} - {self.dealer.business_name} ({self.price})"
