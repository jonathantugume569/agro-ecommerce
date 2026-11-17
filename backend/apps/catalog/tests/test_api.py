import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalog.models import Listing, Product

from .helpers import (
    make_admin, make_category, make_dealer, make_farmer, make_listing, make_product,
)


def results(response):
    return response.data["results"]


class CategoryAPITests(APITestCase):
    def test_anyone_can_list_categories(self):
        make_category("Grains")
        res = self.client.get(reverse("catalog:category-list"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data[0]["name"], "Grains")

    def test_only_admin_can_create_category(self):
        url = reverse("catalog:category-list")
        self.client.force_authenticate(make_dealer()[0])
        self.assertEqual(self.client.post(url, {"name": "Beans"}).status_code, 403)

        self.client.force_authenticate(make_admin())
        res = self.client.post(url, {"name": "Beans"})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["slug"], "beans")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ProductAPITests(APITestCase):
    def setUp(self):
        self.category = make_category()
        self.verified, self.verified_profile = make_dealer("verified")
        self.pending, _ = make_dealer("pending", verified=False)

    def payload(self, **extra):
        return {"name": "Beans", "category": self.category.id, "unit": "kg", **extra}

    def test_public_can_list_and_search_products(self):
        make_product("Maize seed", self.category)
        make_product("Bean seed", self.category, "kg")
        res = self.client.get(reverse("catalog:product-list"), {"search": "maize"})
        self.assertEqual([p["name"] for p in results(res)], ["Maize seed"])

    def test_verified_dealer_can_create_product(self):
        self.client.force_authenticate(self.verified)
        res = self.client.post(reverse("catalog:product-list"), self.payload())
        self.assertEqual(res.status_code, 201)
        self.assertEqual(Product.objects.get().created_by, self.verified)

    def test_unverified_dealer_and_farmer_cannot_create_product(self):
        url = reverse("catalog:product-list")
        for user in (self.pending, make_farmer()):
            self.client.force_authenticate(user)
            self.assertEqual(self.client.post(url, self.payload()).status_code, 403)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post(url, self.payload()).status_code, 401)

    def test_duplicate_product_is_rejected(self):
        self.client.force_authenticate(self.verified)
        url = reverse("catalog:product-list")
        self.client.post(url, self.payload())
        res = self.client.post(url, self.payload(name="beans"))
        self.assertEqual(res.status_code, 400)

    def test_product_image_upload(self):
        self.client.force_authenticate(self.verified)
        image = SimpleUploadedFile(
            "p.gif",
            b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,"
            b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;",
            content_type="image/gif",
        )
        res = self.client.post(
            reverse("catalog:product-list"), {**self.payload(), "image": image}, format="multipart"
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data["image"])

    def test_only_admin_can_edit_or_delete_product(self):
        product = make_product("Maize seed", self.category)
        url = reverse("catalog:product-detail", args=[product.id])
        self.client.force_authenticate(self.verified)
        self.assertEqual(self.client.patch(url, {"name": "X"}).status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.client.force_authenticate(make_admin())
        self.assertEqual(self.client.patch(url, {"name": "Maize seed v2"}).status_code, 200)
        self.assertEqual(self.client.delete(url).status_code, 204)

    def test_product_shows_listing_count_and_lowest_price(self):
        product = make_product("Maize seed", self.category)
        make_listing(self.verified_profile, product, price="20000")
        _, other = make_dealer("other")
        make_listing(other, product, price="18000")
        res = self.client.get(reverse("catalog:product-detail", args=[product.id]))
        self.assertEqual(res.data["listing_count"], 2)
        self.assertEqual(str(res.data["min_price"]), "18000.00")

    def test_product_filters_by_price_location_and_verification(self):
        cheap = make_product("Cheap seed", self.category)
        pricey = make_product("Pricey seed", self.category)
        _, gulu = make_dealer("gulu", location="Gulu", district="Gulu")
        _, unverified = make_dealer("unv", verified=False, location="Jinja", district="Jinja")
        make_listing(gulu, cheap, price="5000")
        make_listing(unverified, pricey, price="90000")

        url = reverse("catalog:product-list")
        names = lambda r: [p["name"] for p in results(r)]
        self.assertEqual(names(self.client.get(url, {"max_price": 10000})), ["Cheap seed"])
        self.assertEqual(names(self.client.get(url, {"min_price": 50000})), ["Pricey seed"])
        self.assertEqual(names(self.client.get(url, {"location": "gulu"})), ["Cheap seed"])
        self.assertEqual(names(self.client.get(url, {"verified_only": "true"})), ["Cheap seed"])


class ListingAPITests(APITestCase):
    def setUp(self):
        self.product = make_product("Maize seed")
        self.dealer_user, self.dealer = make_dealer("dealer1")
        self.other_user, self.other = make_dealer("dealer2", location="Gulu", district="Gulu")
        self.pending_user, _ = make_dealer("pending", verified=False)
        self.list_url = reverse("catalog:listing-list")

    def payload(self, **extra):
        return {"product_id": self.product.id, "price": "15000", "stock": 40, **extra}

    # creating
    def test_verified_dealer_creates_listing(self):
        self.client.force_authenticate(self.dealer_user)
        res = self.client.post(self.list_url, self.payload(description="Fresh"))
        self.assertEqual(res.status_code, 201, res.data)
        listing = Listing.objects.get()
        self.assertEqual(listing.dealer, self.dealer)
        self.assertEqual(listing.location, "Kampala")  # defaults to the dealer's location
        self.assertEqual(res.data["dealer"]["business_name"], self.dealer.business_name)
        self.assertEqual(res.data["product"]["name"], "Maize seed")

    def test_unverified_dealer_farmer_and_visitor_cannot_create(self):
        for user, code in ((self.pending_user, 403), (make_farmer(), 403), (None, 401)):
            self.client.force_authenticate(user)
            res = self.client.post(self.list_url, self.payload())
            self.assertEqual(res.status_code, code)
        self.assertEqual(Listing.objects.count(), 0)

    def test_cannot_create_second_listing_for_same_product(self):
        make_listing(self.dealer, self.product)
        self.client.force_authenticate(self.dealer_user)
        res = self.client.post(self.list_url, self.payload())
        self.assertEqual(res.status_code, 400)
        self.assertIn("product_id", res.data)

    def test_price_and_stock_are_validated(self):
        self.client.force_authenticate(self.dealer_user)
        self.assertEqual(self.client.post(self.list_url, self.payload(price="0")).status_code, 400)
        self.assertEqual(self.client.post(self.list_url, self.payload(price="-5")).status_code, 400)
        self.assertEqual(self.client.post(self.list_url, self.payload(stock=-1)).status_code, 400)

    def test_dealer_cannot_grant_themselves_premium(self):
        self.client.force_authenticate(self.dealer_user)
        res = self.client.post(self.list_url, self.payload(is_premium=True))
        self.assertEqual(res.status_code, 201)
        self.assertFalse(Listing.objects.get().is_premium)

    # browsing
    def test_public_list_shows_only_active_listings(self):
        make_listing(self.dealer, self.product)
        hidden_product = make_product("Hidden", unit="kg")
        make_listing(self.dealer, hidden_product, is_active=False)
        res = self.client.get(self.list_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 1)

    def test_premium_listings_come_first_and_expired_premium_does_not(self):
        from datetime import timedelta

        from django.utils import timezone

        second = make_product("Beans", unit="kg")
        third = make_product("Rice", unit="kg")
        normal = make_listing(self.dealer, self.product)
        premium = make_listing(self.dealer, second, is_premium=True,
                               premium_expires_at=timezone.now() + timedelta(days=5))
        expired = make_listing(self.dealer, third, is_premium=True,
                               premium_expires_at=timezone.now() - timedelta(days=1))
        res = self.client.get(self.list_url)
        ids = [item["id"] for item in results(res)]
        self.assertEqual(ids[0], premium.id)
        self.assertEqual(set(ids), {normal.id, premium.id, expired.id})
        self.assertFalse(
            next(i for i in results(res) if i["id"] == expired.id)["is_premium"]
        )

    def test_filters(self):
        grains = make_category("Grains")
        veg = make_category("Vegetables")
        maize = make_product("Maize", grains, "kg")
        tomato = make_product("Tomato", veg, "kg")
        a = make_listing(self.dealer, maize, price="3000", stock=5)
        b = make_listing(self.other, tomato, price="12000", stock=0)
        _, unv = make_dealer("unv2", verified=False, location="Jinja", district="Jinja")
        c = make_listing(unv, maize, price="2500", stock=3)

        def ids(**params):
            return {i["id"] for i in results(self.client.get(self.list_url, params))}

        self.assertEqual(ids(category=grains.id), {a.id, c.id})
        self.assertEqual(ids(category_slug="vegetables"), {b.id})
        self.assertEqual(ids(min_price=5000), {b.id})
        self.assertEqual(ids(max_price=3000), {a.id, c.id})
        self.assertEqual(ids(location="gulu"), {b.id})
        self.assertEqual(ids(verified_only="true"), {a.id, b.id})
        self.assertEqual(ids(in_stock="true"), {a.id, c.id})
        self.assertEqual(ids(product=maize.id, search="maize"), {a.id, c.id})

    def test_ordering_by_price(self):
        other_product = make_product("Beans", unit="kg")
        make_listing(self.dealer, self.product, price="9000")
        make_listing(self.dealer, other_product, price="4000")
        res = self.client.get(self.list_url, {"ordering": "price"})
        self.assertEqual([i["price"] for i in results(res)], ["4000.00", "9000.00"])

    # my listings
    def test_my_listings_include_inactive_and_only_mine(self):
        mine_active = make_listing(self.dealer, self.product)
        mine_hidden = make_listing(self.dealer, make_product("B", unit="kg"), is_active=False)
        make_listing(self.other, self.product)
        self.client.force_authenticate(self.dealer_user)
        res = self.client.get(reverse("catalog:my-listings"), {"page_size": 100})
        self.assertEqual({i["id"] for i in results(res)}, {mine_active.id, mine_hidden.id})

    def test_my_listings_needs_a_dealer(self):
        url = reverse("catalog:my-listings")
        self.assertEqual(self.client.get(url).status_code, 401)
        self.client.force_authenticate(make_farmer())
        self.assertEqual(self.client.get(url).status_code, 403)

    # detail, update, delete
    def test_public_detail_and_hidden_listing_rules(self):
        listing = make_listing(self.dealer, self.product, is_active=False)
        url = reverse("catalog:listing-detail", args=[listing.id])
        self.assertEqual(self.client.get(url).status_code, 404)
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.get(url).status_code, 404)
        self.client.force_authenticate(self.dealer_user)
        self.assertEqual(self.client.get(url).status_code, 200)
        self.client.force_authenticate(make_admin())
        self.assertEqual(self.client.get(url).status_code, 200)

    def test_owner_can_update_and_toggle_active(self):
        listing = make_listing(self.dealer, self.product)
        url = reverse("catalog:listing-detail", args=[listing.id])
        self.client.force_authenticate(self.dealer_user)
        res = self.client.patch(url, {"price": "17500", "stock": 3, "is_active": False})
        self.assertEqual(res.status_code, 200, res.data)
        listing.refresh_from_db()
        self.assertEqual(str(listing.price), "17500.00")
        self.assertFalse(listing.is_active)

    def test_product_cannot_be_changed_on_update(self):
        listing = make_listing(self.dealer, self.product)
        other_product = make_product("Beans", unit="kg")
        self.client.force_authenticate(self.dealer_user)
        res = self.client.patch(
            reverse("catalog:listing-detail", args=[listing.id]), {"product_id": other_product.id}
        )
        self.assertEqual(res.status_code, 400)

    def test_other_dealer_cannot_edit_or_delete(self):
        listing = make_listing(self.dealer, self.product)
        url = reverse("catalog:listing-detail", args=[listing.id])
        self.client.force_authenticate(self.other_user)
        self.assertEqual(self.client.patch(url, {"price": "1"}).status_code, 403)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.assertTrue(Listing.objects.filter(pk=listing.id).exists())

    def test_visitor_and_farmer_cannot_edit(self):
        listing = make_listing(self.dealer, self.product)
        url = reverse("catalog:listing-detail", args=[listing.id])
        self.assertEqual(self.client.patch(url, {"price": "1"}).status_code, 401)
        self.client.force_authenticate(make_farmer())
        self.assertEqual(self.client.patch(url, {"price": "1"}).status_code, 403)

    def test_dealer_who_lost_verification_cannot_edit(self):
        listing = make_listing(self.dealer, self.product)
        self.dealer.is_verified = False
        self.dealer.save()
        self.client.force_authenticate(self.dealer_user)
        res = self.client.patch(reverse("catalog:listing-detail", args=[listing.id]), {"price": "1"})
        self.assertEqual(res.status_code, 403)

    def test_admin_can_edit_and_owner_can_delete(self):
        listing = make_listing(self.dealer, self.product)
        url = reverse("catalog:listing-detail", args=[listing.id])
        self.client.force_authenticate(make_admin())
        self.assertEqual(self.client.patch(url, {"stock": 99}).status_code, 200)
        self.client.force_authenticate(self.dealer_user)
        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Listing.objects.exists())


class PriceComparisonAPITests(APITestCase):
    def setUp(self):
        self.product = make_product("Maize seed")
        self.url = reverse("catalog:product-compare", args=[self.product.id])
        self.listings = {}
        for name, price, stock, verified in (
            ("a", "10000", 5, True),
            ("b", "14000", 5, False),
            ("c", "12000", 5, True),
        ):
            _, profile = make_dealer(name, verified=verified)
            self.listings[name] = make_listing(profile, self.product, price=price, stock=stock)

    def test_listings_sorted_cheapest_first_with_summary(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual([l["price"] for l in res.data["listings"]], ["10000.00", "12000.00", "14000.00"])
        summary = res.data["summary"]
        self.assertEqual(summary["count"], 3)
        self.assertEqual(str(summary["cheapest_price"]), "10000.00")
        self.assertEqual(str(summary["highest_price"]), "14000.00")
        self.assertEqual(str(summary["average_price"]), "12000.00")
        self.assertEqual(summary["cheapest_listing_id"], self.listings["a"].id)

    def test_cheapest_and_below_average_marks(self):
        listings = self.client.get(self.url).data["listings"]
        self.assertEqual([l["is_cheapest"] for l in listings], [True, False, False])
        self.assertEqual([l["below_average"] for l in listings], [True, False, False])
        self.assertEqual(str(listings[0]["difference_from_average"]), "-2000.00")
        self.assertEqual(str(listings[2]["difference_from_average"]), "2000.00")

    def test_inactive_and_out_of_stock_listings_are_left_out(self):
        _, d = make_dealer("d")
        make_listing(d, self.product, price="500", stock=0)
        _, e = make_dealer("e")
        make_listing(e, self.product, price="400", stock=5, is_active=False)
        res = self.client.get(self.url)
        self.assertEqual(res.data["summary"]["count"], 3)
        self.assertEqual(str(res.data["summary"]["cheapest_price"]), "10000.00")

    def test_tied_cheapest_prices_are_both_marked(self):
        _, d = make_dealer("d")
        make_listing(d, self.product, price="10000", stock=5)
        listings = self.client.get(self.url).data["listings"]
        self.assertEqual(sum(l["is_cheapest"] for l in listings), 2)

    def test_product_without_listings(self):
        empty = make_product("Empty", unit="kg")
        res = self.client.get(reverse("catalog:product-compare", args=[empty.id]))
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["listings"], [])
        self.assertEqual(res.data["summary"]["count"], 0)

    def test_unknown_product_is_404(self):
        self.assertEqual(self.client.get(reverse("catalog:product-compare", args=[9999])).status_code, 404)
