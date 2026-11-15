from decimal import Decimal

from rest_framework.test import APITestCase

from apps.orders.models import Order, OrderStatus

from .factories import make_dealer, make_farmer, make_listing

URL = "/api/orders/"


class OrderApiTests(APITestCase):
    def setUp(self):
        self.farmer = make_farmer()
        self.dealer_a = make_dealer()
        self.dealer_b = make_dealer()
        self.seed = make_listing(self.dealer_a, "Maize seed", "10000", stock=10)
        self.fert = make_listing(self.dealer_a, "Fertiliser", "5000", stock=5)
        self.tools = make_listing(self.dealer_b, "Hoe", "20000", stock=3)

    def place(self, lines, address="Gulu town"):
        self.client.force_authenticate(self.farmer)
        return self.client.post(
            URL,
            {"items": [{"listing": l.id, "quantity": q} for l, q in lines], "delivery_address": address},
            format="json",
        )

    def test_place_order_reduces_stock_and_freezes_price(self):
        res = self.place([(self.seed, 3)])
        self.assertEqual(res.status_code, 201)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(Decimal(res.data[0]["total_amount"]), Decimal("30000"))
        self.seed.refresh_from_db()
        self.assertEqual(self.seed.stock, 7)
        # price changes later must not touch the old order
        self.seed.price = Decimal("99999")
        self.seed.save()
        order = Order.objects.get()
        self.assertEqual(order.items.get().unit_price, Decimal("10000"))

    def test_multi_dealer_cart_is_split_into_one_order_per_dealer(self):
        res = self.place([(self.seed, 1), (self.fert, 2), (self.tools, 1)])
        self.assertEqual(res.status_code, 201)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(Order.objects.filter(dealer=self.dealer_a).get().items.count(), 2)
        self.assertEqual(Order.objects.filter(dealer=self.dealer_b).get().items.count(), 1)

    def test_not_enough_stock_fails_and_changes_nothing(self):
        res = self.place([(self.seed, 2), (self.tools, 99)])
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)
        self.seed.refresh_from_db()
        self.assertEqual(self.seed.stock, 10)  # the valid line was NOT applied

    def test_inactive_listing_cannot_be_ordered(self):
        self.seed.active = False
        self.seed.save()
        self.assertEqual(self.place([(self.seed, 1)]).status_code, 400)

    def test_empty_cart_rejected(self):
        self.client.force_authenticate(self.farmer)
        res = self.client.post(URL, {"items": [], "delivery_address": "x"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_dealer_cannot_place_orders(self):
        self.client.force_authenticate(self.dealer_a)
        res = self.client.post(
            URL, {"items": [{"listing": self.tools.id, "quantity": 1}], "delivery_address": "x"}, format="json"
        )
        self.assertEqual(res.status_code, 403)

    def test_farmer_cancel_restores_stock(self):
        self.place([(self.seed, 4)])
        order = Order.objects.get()
        res = self.client.post(f"{URL}{order.id}/cancel/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["status"], OrderStatus.CANCELLED)
        self.seed.refresh_from_db()
        self.assertEqual(self.seed.stock, 10)

    def test_cannot_cancel_twice(self):
        self.place([(self.seed, 4)])
        order = Order.objects.get()
        self.client.post(f"{URL}{order.id}/cancel/")
        self.assertEqual(self.client.post(f"{URL}{order.id}/cancel/").status_code, 400)
        self.seed.refresh_from_db()
        self.assertEqual(self.seed.stock, 10)  # restored once, not twice

    def test_dealer_accepts_then_farmer_cannot_be_double_restored(self):
        self.place([(self.seed, 2)])
        order = Order.objects.get()
        self.client.force_authenticate(self.dealer_a)
        res = self.client.post(f"{URL}{order.id}/accept/")
        self.assertEqual(res.data["status"], OrderStatus.ACCEPTED)
        # accepted orders can't be rejected afterwards
        self.assertEqual(self.client.post(f"{URL}{order.id}/reject/").status_code, 400)

    def test_dealer_reject_restores_stock(self):
        self.place([(self.seed, 6)])
        order = Order.objects.get()
        self.client.force_authenticate(self.dealer_a)
        res = self.client.post(f"{URL}{order.id}/reject/")
        self.assertEqual(res.data["status"], OrderStatus.REJECTED)
        self.seed.refresh_from_db()
        self.assertEqual(self.seed.stock, 10)

    def test_other_dealer_cannot_touch_order(self):
        self.place([(self.seed, 1)])
        order = Order.objects.get()
        self.client.force_authenticate(self.dealer_b)
        self.assertEqual(self.client.post(f"{URL}{order.id}/accept/").status_code, 404)

    def test_each_user_sees_only_their_orders(self):
        self.place([(self.seed, 1), (self.tools, 1)])
        # other farmer sees nothing
        self.client.force_authenticate(make_farmer())
        self.assertEqual(self.client.get(URL).data["count"], 0)
        # dealers see only their own slice
        self.client.force_authenticate(self.dealer_a)
        self.assertEqual(self.client.get(URL).data["count"], 1)
        # farmer sees both
        self.client.force_authenticate(self.farmer)
        self.assertEqual(self.client.get(URL).data["count"], 2)

    def test_status_filter_and_detail(self):
        self.place([(self.seed, 1)])
        order = Order.objects.get()
        self.assertEqual(self.client.get(URL + "?status=accepted").data["count"], 0)
        self.assertEqual(self.client.get(URL + "?status=pending").data["count"], 1)
        detail = self.client.get(f"{URL}{order.id}/")
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(len(detail.data["items"]), 1)

    def test_login_required(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(URL).status_code, 401)
