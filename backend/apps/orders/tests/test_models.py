from decimal import Decimal

from django.test import TestCase

from apps.orders.models import Order, OrderItem, OrderStatus

from .factories import make_dealer, make_farmer, make_listing


class OrderModelTests(TestCase):
    def test_defaults_and_subtotal(self):
        farmer, dealer = make_farmer(), make_dealer()
        listing = make_listing(dealer, price="2500")
        order = Order.objects.create(farmer=farmer, dealer=dealer, delivery_address="Gulu")
        item = OrderItem.objects.create(
            order=order, listing=listing, product_name="Maize seed", quantity=4, unit_price=Decimal("2500")
        )
        self.assertEqual(order.status, OrderStatus.PENDING)
        self.assertEqual(item.subtotal, Decimal("10000"))
