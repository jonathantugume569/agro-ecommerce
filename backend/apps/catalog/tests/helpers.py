from decimal import Decimal

from apps.accounts.models import DealerProfile, User
from apps.catalog.models import Category, Listing, Product

PASSWORD = "StrongPass123!"


def make_dealer(username="dealer1", verified=True, location="Kampala", district="Kampala"):
    user = User.objects.create_user(
        username, f"{username}@test.com", PASSWORD, role="dealer"
    )
    profile = DealerProfile.objects.create(
        user=user,
        business_name=f"{username} Agro Ltd",
        license_number=f"LIC-{username}",
        location=location,
        district=district,
        is_verified=verified,
    )
    return user, profile


def make_farmer(username="farmer1"):
    return User.objects.create_user(username, f"{username}@test.com", PASSWORD, role="farmer")


def make_admin(username="admin1"):
    return User.objects.create_superuser(username, f"{username}@test.com", PASSWORD)


def make_category(name="Grains"):
    return Category.objects.get_or_create(name=name)[0]


def make_product(name="Maize seed", category=None, unit="2kg pack"):
    return Product.objects.create(name=name, category=category or make_category(), unit=unit)


def make_listing(dealer_profile, product, price="15000", stock=10, **extra):
    return Listing.objects.create(
        dealer=dealer_profile, product=product, price=Decimal(price), stock=stock, **extra
    )
