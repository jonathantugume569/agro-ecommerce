from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from apps.orders.models import Order
from apps.logistics.models import Delivery

User = get_user_model()


class DeliveryModelTests(TestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            username="farmer1", email="farmer1@test.com", password="pass", role="farmer"
        )
        self.dealer = User.objects.create_user(
            username="dealer1", email="dealer1@test.com", password="pass", role="dealer"
        )
        self.order = Order.objects.create(farmer=self.farmer, dealer=self.dealer, total_amount=50000)

    def test_delivery_auto_created_with_order(self):
        delivery = Delivery.objects.get(order=self.order)
        self.assertEqual(delivery.status, "Pending")
        self.assertEqual(delivery.updates.count(), 1)
        self.assertEqual(delivery.updates.first().note, "Order placed.")

    def test_valid_status_progression_and_blocking_skipped_stages(self):
        delivery = self.order.delivery

        # Cannot skip Confirmed -> Dispatched
        with self.assertRaises(ValidationError):
            delivery.update_status("Dispatched", self.dealer)

        # Valid step Pending -> Confirmed
        delivery.update_status("Confirmed", self.dealer, note="Stock verified")
        self.assertEqual(delivery.status, "Confirmed")
        self.assertEqual(delivery.updates.count(), 2)

    def test_confirm_receipt_marks_delivered(self):
        delivery = self.order.delivery
        delivery.status = "In transit"
        delivery.save()

        delivery.confirm_receipt(self.farmer)
        self.assertTrue(delivery.receipt_confirmed)
        self.assertEqual(delivery.status, "Delivered")