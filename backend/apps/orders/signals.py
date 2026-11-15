"""Hooks for other apps (no imports from them needed here).

Jolly (logistics) can create a Delivery by connecting to `order_placed`:

    from django.dispatch import receiver
    from apps.orders.signals import order_placed

    @receiver(order_placed)
    def create_delivery(sender, order, **kwargs):
        Delivery.objects.create(order=order, ...)

Grace (payments) can use `order_status_changed` (e.g. record commission when
new_status == "accepted").
"""
from django.dispatch import Signal

order_placed = Signal()          # kwargs: order
order_status_changed = Signal()  # kwargs: order, old_status, new_status
