"""Price comparison for one product.

Only active listings that still have stock are compared. The result has a summary
(count, cheapest, highest, average) and the listings sorted from cheapest to most
expensive, each marked with whether it is the cheapest and how it compares to the average.
"""
from decimal import ROUND_HALF_UP, Decimal

from .models import Listing

TWO_PLACES = Decimal("0.01")


def _money(value):
    return Decimal(value).quantize(TWO_PLACES, rounding=ROUND_HALF_UP)


def get_comparable_listings(product):
    return (
        Listing.objects.filter(product=product, is_active=True, stock__gt=0)
        .select_related("product", "product__category", "dealer")
        .order_by("price", "-dealer__is_verified", "id")
    )


def compare_listings(product):
    """Return {"summary": {...}, "rows": [{"listing", "is_cheapest", ...}]}."""
    listings = list(get_comparable_listings(product))

    if not listings:
        return {
            "summary": {
                "count": 0,
                "cheapest_price": None,
                "highest_price": None,
                "average_price": None,
                "cheapest_listing_id": None,
            },
            "rows": [],
        }

    prices = [listing.price for listing in listings]
    cheapest = min(prices)
    average = _money(sum(prices) / len(prices))

    rows = []
    for listing in listings:
        difference = _money(listing.price - average)
        rows.append(
            {
                "listing": listing,
                "is_cheapest": listing.price == cheapest,
                "below_average": listing.price < average,
                "difference_from_average": difference,
                "percent_from_average": (
                    _money(difference / average * 100) if average else Decimal("0.00")
                ),
            }
        )

    return {
        "summary": {
            "count": len(listings),
            "cheapest_price": _money(cheapest),
            "highest_price": _money(max(prices)),
            "average_price": average,
            "cheapest_listing_id": listings[0].id,
        },
        "rows": rows,
    }
