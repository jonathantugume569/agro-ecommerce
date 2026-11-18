"""Test helpers for the orders app. Listing.dealer is a DealerProfile in the catalog app."""
from decimal import Decimal

from apps.accounts.models import DealerProfile, User
from apps.catalog.models import Category, Listing, Product
from common.constants import Roles

_counter = {"n": 0}


def _n():
    _counter["n"] += 1
    return _counter["n"]


def make_farmer(**kw):
    n = _n()
    return User.objects.create_user(
        username=f"farmer{n}", email=f"farmer{n}@test.com", password="pass12345",
        role=Roles.FARMER, **kw,
    )


def make_dealer(verified=True):
    n = _n()
    user = User.objects.create_user(
        username=f"dealer{n}", email=f"dealer{n}@test.com", password="pass12345",
        role=Roles.DEALER,
    )
    DealerProfile.objects.create(
        user=user, business_name=f"Dealer {n} Ltd", license_number=f"LIC-{n}", is_verified=verified
    )
    return user


def make_listing(dealer, name="Maize seed", price="10000", stock=10, active=True):
    """`dealer` is the dealer's User (from make_dealer); the listing uses their DealerProfile."""
    category, _ = Category.objects.get_or_create(name="Test category")
    product, _ = Product.objects.get_or_create(name=name, category=category, unit="")
    return Listing.objects.create(
        product=product,
        dealer=dealer.dealer_profile,
        price=Decimal(price),
        stock=stock,
        is_active=active,
    )
