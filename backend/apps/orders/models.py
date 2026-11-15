from decimal import Decimal

from django.conf import settings
from django.db import models


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"      # farmer placed it, waiting for the dealer
    ACCEPTED = "accepted", "Accepted"   # dealer agreed to fulfil it
    REJECTED = "rejected", "Rejected"   # dealer declined (stock is restored)
    CANCELLED = "cancelled", "Cancelled"  # farmer cancelled (stock is restored)


class Order(models.Model):
    """One order = one farmer buying from ONE dealer.

    A cart with items from several dealers becomes several Orders (see services.py).
    """

    farmer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders_placed"
    )
    dealer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders_received"
    )
    status = models.CharField(
        max_length=12, choices=OrderStatus.choices, default=OrderStatus.PENDING
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    delivery_address = models.CharField(max_length=255)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} ({self.status})"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    # Patrick's Listing model (apps/catalog/models.py)
    listing = models.ForeignKey(
        "catalog.Listing", on_delete=models.PROTECT, related_name="order_items"
    )
    # Snapshot of what was bought, so later edits to the listing never change old orders.
    product_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.product_name}"

    @property
    def subtotal(self):
        return self.unit_price * self.quantity
