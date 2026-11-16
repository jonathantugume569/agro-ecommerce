from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.orders.models import Order

User = get_user_model()


class LogisticsAPITests(APITestCase):
    def setUp(self):
        self.farmer = User.objects.create_user(
            username="farmer1", email="farmer1@test.com", password="pass", role="farmer"
        )
        self.dealer = User.objects.create_user(
            username="dealer1", email="dealer1@test.com", password="pass", role="dealer"
        )
        self.stranger = User.objects.create_user(
            username="stranger", email="stranger@test.com", password="pass", role="farmer"
        )
        self.order = Order.objects.create(farmer=self.farmer, dealer=self.dealer, total_amount=50000)

    def test_participants_can_view_delivery_and_strangers_blocked(self):
        
        url = reverse("delivery-detail", args=[self.order.id])

        # Unauthorized user blocked
        self.client.force_authenticate(self.stranger)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        # Farmer can view timeline and next_statuses
        self.client.force_authenticate(self.farmer)
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "Pending")
        self.assertEqual(res.data["next_statuses"], ["Confirmed", "Cancelled"])

    def test_dealer_updates_status_and_farmer_blocked_from_updating(self):
        url = reverse("delivery-status", args=[self.order.id])

        # Farmer cannot update delivery status
        self.client.force_authenticate(self.farmer)
        res = self.client.post(url, {"status": "Confirmed"})
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Dealer cannot skip stages
        self.client.force_authenticate(self.dealer)
        res = self.client.post(url, {"status": "Dispatched"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Dealer advances valid stage
        res = self.client.post(url, {"status": "Confirmed", "note": "Packed and ready"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "Confirmed")

    def test_farmer_confirms_receipt(self):
        delivery = self.order.delivery
        delivery.status = "In transit"
        delivery.save()

        self.client.force_authenticate(self.farmer)
        res = self.client.post(reverse("delivery-confirm", args=[self.order.id]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["receipt_confirmed"])
        self.assertEqual(res.data["status"], "Delivered")