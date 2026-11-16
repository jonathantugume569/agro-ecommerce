"""Test helpers. If Patrick's Listing/Product fields differ from these, fix ONLY make_listing()."""
from decimal import Decimal

from apps.accounts.models import DealerProfile, User
from apps.catalog.models import Listing, Product
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
    product, _ = Product.objects.get_or_create(name=name)
    return Listing.objects.create(
        product=product, dealer=dealer, price=Decimal(price), stock=stock, active=active
    )
