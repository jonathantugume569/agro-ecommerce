"""Order business logic. Views call these; they never touch stock directly.

Everything that changes stock runs inside transaction.atomic() with the listing
rows locked (select_for_update), so two buyers can't take the same last item.
"""
from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError

from apps.catalog.models import Listing

from .models import Order, OrderItem, OrderStatus
from .signals import order_placed, order_status_changed


def _fail(message):
    raise ValidationError({"detail": [message]})


def _listing_name(listing):
    product = getattr(listing, "product", None)
    return getattr(product, "name", None) or str(product or listing)


def _listing_dealer_user(listing):
    """Listing.dealer may be a User or a DealerProfile; always return the User."""
    dealer = listing.dealer
    return getattr(dealer, "user", dealer)


def _merge_items(items):
    """Combine duplicate listing ids: [{listing: 1, quantity: 2}, {listing: 1, quantity: 3}] -> {1: 5}"""
    wanted = defaultdict(int)
    for item in items:
        wanted[int(item["listing"])] += int(item["quantity"])
    return wanted


@transaction.atomic
def place_orders(farmer, items, delivery_address, notes=""):
    """Turn a cart into one Order per dealer. Returns the list of new orders.

    items: [{"listing": <listing id>, "quantity": <int>}, ...]
    All-or-nothing: if any line fails validation, nothing is created and no stock moves.
    """
    wanted = _merge_items(items)
    if not wanted:
        _fail("Your cart is empty.")

    # Lock the listing rows for the rest of this transaction.
    listings = {
        l.id: l
        for l in Listing.objects.select_for_update().filter(id__in=wanted.keys())
    }

    # 1. Validate every line first.
    for listing_id, qty in wanted.items():
        listing = listings.get(listing_id)
        if listing is None:
            _fail(f"Listing {listing_id} does not exist.")
        name = _listing_name(listing)
        if not listing.active:
            _fail(f"{name} is no longer available.")
        if qty > listing.stock:
            _fail(f"Only {listing.stock} of {name} left in stock (you asked for {qty}).")
        if _listing_dealer_user(listing) == farmer:
            _fail("You can't order your own listing.")

    # 2. Group lines by dealer.
    by_dealer = defaultdict(list)
    for listing_id, qty in wanted.items():
        listing = listings[listing_id]
        by_dealer[_listing_dealer_user(listing)].append((listing, qty))

    # 3. One order per dealer; reduce stock.
    orders = []
    for dealer, lines in by_dealer.items():
        order = Order.objects.create(
            farmer=farmer,
            dealer=dealer,
            delivery_address=delivery_address,
            notes=notes,
        )
        total = Decimal("0.00")
        for listing, qty in lines:
            OrderItem.objects.create(
                order=order,
                listing=listing,
                product_name=_listing_name(listing),
                quantity=qty,
                unit_price=listing.price,  # price frozen at purchase time
            )
            listing.stock -= qty
            listing.save(update_fields=["stock"])
            total += listing.price * qty
        order.total_amount = total
        order.save(update_fields=["total_amount"])
        order_placed.send(sender=Order, order=order)
        orders.append(order)
    return orders


def _restore_stock(order):
    listing_ids = [item.listing_id for item in order.items.all()]
    locked = {l.id: l for l in Listing.objects.select_for_update().filter(id__in=listing_ids)}
    for item in order.items.all():
        listing = locked[item.listing_id]
        listing.stock += item.quantity
        listing.save(update_fields=["stock"])


def _change_status(order, new_status):
    old = order.status
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    order_status_changed.send(sender=Order, order=order, old_status=old, new_status=new_status)
    return order


@transaction.atomic
def cancel_order(order, user):
    """Farmer cancels their own order while it's still pending or accepted."""
    order = Order.objects.select_for_update().get(pk=order.pk)  # re-read: avoid double restore
    if order.farmer_id != user.id:
        raise PermissionDenied("You can only cancel your own orders.")
    if order.status not in (OrderStatus.PENDING, OrderStatus.ACCEPTED):
        _fail(f"A {order.status} order can't be cancelled.")
    _restore_stock(order)
    return _change_status(order, OrderStatus.CANCELLED)


@transaction.atomic
def accept_order(order, user):
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.dealer_id != user.id:
        raise PermissionDenied("This order is not yours to review.")
    if order.status != OrderStatus.PENDING:
        _fail(f"Only pending orders can be accepted (this one is {order.status}).")
    return _change_status(order, OrderStatus.ACCEPTED)


@transaction.atomic
def reject_order(order, user):
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.dealer_id != user.id:
        raise PermissionDenied("This order is not yours to review.")
    if order.status != OrderStatus.PENDING:
        _fail(f"Only pending orders can be rejected (this one is {order.status}).")
    _restore_stock(order)
    return _change_status(order, OrderStatus.REJECTED)
