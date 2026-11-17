from datetime import timedelta
from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone

from apps.catalog.models import Category, Listing

from .helpers import make_category, make_dealer, make_listing, make_product


class CategoryModelTests(TestCase):
    def test_slug_is_created_from_name(self):
        category = Category.objects.create(name="Fruits and Vegetables")
        self.assertEqual(category.slug, "fruits-and-vegetables")


class ProductModelTests(TestCase):
    def test_same_product_cannot_be_added_twice(self):
        category = make_category()
        make_product("Maize seed", category, "2kg pack")
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_product("Maize seed", category, "2kg pack")

    def test_same_name_with_different_unit_is_allowed(self):
        category = make_category()
        make_product("Maize seed", category, "2kg pack")
        make_product("Maize seed", category, "10kg bag")


class ListingModelTests(TestCase):
    def setUp(self):
        _, self.dealer = make_dealer()
        self.product = make_product()

    def test_one_listing_per_dealer_and_product(self):
        make_listing(self.dealer, self.product)
        with self.assertRaises(IntegrityError), transaction.atomic():
            make_listing(self.dealer, self.product)

    def test_price_must_be_positive(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Listing.objects.create(dealer=self.dealer, product=self.product, price=Decimal("0"))

    def test_user_property_is_the_dealer_user(self):
        listing = make_listing(self.dealer, self.product)
        self.assertEqual(listing.user, self.dealer.user)

    def test_in_stock(self):
        self.assertTrue(make_listing(self.dealer, self.product, stock=1).in_stock)
        _, other = make_dealer("dealer2")
        self.assertFalse(make_listing(other, self.product, stock=0).in_stock)

    def test_premium_active_rules(self):
        listing = make_listing(self.dealer, self.product)
        self.assertFalse(listing.premium_active)

        listing.is_premium = True
        listing.premium_expires_at = timezone.now() + timedelta(days=1)
        self.assertTrue(listing.premium_active)

        listing.premium_expires_at = timezone.now() - timedelta(days=1)
        self.assertFalse(listing.premium_active)

    def test_activate_premium_extends_running_period(self):
        listing = make_listing(self.dealer, self.product)
        listing.activate_premium(30)
        first_expiry = listing.premium_expires_at
        listing.activate_premium(30)
        self.assertEqual(listing.premium_expires_at, first_expiry + timedelta(days=30))
        listing.deactivate_premium()
        self.assertFalse(listing.premium_active)

    def test_reduce_and_restore_stock(self):
        listing = make_listing(self.dealer, self.product, stock=5)
        listing.reduce_stock(3)
        listing.refresh_from_db()
        self.assertEqual(listing.stock, 2)
        with self.assertRaises(ValueError):
            listing.reduce_stock(10)
        listing.restore_stock(3)
        listing.refresh_from_db()
        self.assertEqual(listing.stock, 5)
