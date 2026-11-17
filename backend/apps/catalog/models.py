from datetime import timedelta
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    """A thing that can be sold (for example "Longe 5 maize seed, 2kg").

    Many dealers can sell the same product. Each dealer's offer is a Listing,
    and comparing the Listings of one Product is the price comparison feature.
    """

    name = models.CharField(max_length=150)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    description = models.TextField(blank=True)
    unit = models.CharField(
        max_length=30, blank=True, help_text='How it is sold, for example "kg", "2kg pack", "bag".'
    )
    image = models.ImageField(upload_to="products/", null=True, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="products"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "category", "unit"], name="unique_product_name_category_unit"
            )
        ]

    def __str__(self):
        return f"{self.name} ({self.unit})" if self.unit else self.name


class Listing(models.Model):
    """One dealer's offer for one product, with that dealer's price and stock."""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="listings")
    dealer = models.ForeignKey(
        "accounts.DealerProfile", on_delete=models.CASCADE, related_name="listings"
    )
    price = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    stock = models.PositiveIntegerField(default=0)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=150, blank=True)
    is_active = models.BooleanField(default=True)

    # Premium listings are shown first. The payments app switches these on and off.
    is_premium = models.BooleanField(default=False)
    premium_expires_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["product", "dealer"], name="one_listing_per_dealer_product"),
            models.CheckConstraint(condition=models.Q(price__gt=0), name="listing_price_positive"),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.dealer.business_name} @ {self.price}"

    # Lets the shared IsOwnerOrAdmin permission work on listings.
    @property
    def user(self):
        return self.dealer.user

    @property
    def in_stock(self):
        return self.stock > 0

    @property
    def premium_active(self):
        if not self.is_premium:
            return False
        return self.premium_expires_at is None or self.premium_expires_at > timezone.now()

    def activate_premium(self, days):
        """Used by the payments app. Extends the premium period if it is already running."""
        now = timezone.now()
        start = self.premium_expires_at if self.premium_active and self.premium_expires_at else now
        self.is_premium = True
        self.premium_expires_at = start + timedelta(days=days)
        self.save(update_fields=["is_premium", "premium_expires_at", "updated_at"])

    def deactivate_premium(self):
        self.is_premium = False
        self.premium_expires_at = None
        self.save(update_fields=["is_premium", "premium_expires_at", "updated_at"])

    def reduce_stock(self, quantity):
        """Used by the orders app. Call inside a transaction with the row locked."""
        if quantity > self.stock:
            raise ValueError("Not enough stock.")
        self.stock -= quantity
        self.save(update_fields=["stock", "updated_at"])

    def restore_stock(self, quantity):
        self.stock += quantity
        self.save(update_fields=["stock", "updated_at"])
