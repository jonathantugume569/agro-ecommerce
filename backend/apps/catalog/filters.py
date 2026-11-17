import django_filters
from django.db.models import Q

from .models import Listing, Product


def _location_q(prefix, value):
    """Match a place name against the listing location and the dealer's location or district."""
    return (
        Q(**{f"{prefix}location__icontains": value})
        | Q(**{f"{prefix}dealer__location__icontains": value})
        | Q(**{f"{prefix}dealer__district__icontains": value})
    )


class ListingFilter(django_filters.FilterSet):
    category = django_filters.NumberFilter(field_name="product__category_id")
    category_slug = django_filters.CharFilter(field_name="product__category__slug")
    product = django_filters.NumberFilter(field_name="product_id")
    dealer = django_filters.NumberFilter(field_name="dealer_id")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    location = django_filters.CharFilter(method="filter_location")
    verified_only = django_filters.BooleanFilter(method="filter_verified")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")
    is_active = django_filters.BooleanFilter(field_name="is_active")

    class Meta:
        model = Listing
        fields = []

    def filter_location(self, queryset, name, value):
        return queryset.filter(_location_q("", value)) if value else queryset

    def filter_verified(self, queryset, name, value):
        return queryset.filter(dealer__is_verified=True) if value else queryset

    def filter_in_stock(self, queryset, name, value):
        return queryset.filter(stock__gt=0) if value else queryset


class ProductFilter(django_filters.FilterSet):
    """Products are filtered by what their active listings offer."""

    category = django_filters.NumberFilter(field_name="category_id")
    category_slug = django_filters.CharFilter(field_name="category__slug")
    min_price = django_filters.NumberFilter(method="filter_min_price")
    max_price = django_filters.NumberFilter(method="filter_max_price")
    location = django_filters.CharFilter(method="filter_location")
    verified_only = django_filters.BooleanFilter(method="filter_verified")
    in_stock = django_filters.BooleanFilter(method="filter_in_stock")

    class Meta:
        model = Product
        fields = []

    # Each method keeps products that have at least one active listing matching,
    # and the `ids` subquery avoids duplicate rows from joins.
    def _with_listing(self, queryset, **conditions):
        matching = Listing.objects.filter(is_active=True, **conditions).values("product_id")
        return queryset.filter(pk__in=matching)

    def filter_min_price(self, queryset, name, value):
        return self._with_listing(queryset, price__gte=value)

    def filter_max_price(self, queryset, name, value):
        return self._with_listing(queryset, price__lte=value)

    def filter_location(self, queryset, name, value):
        if not value:
            return queryset
        matching = Listing.objects.filter(_location_q("", value), is_active=True).values("product_id")
        return queryset.filter(pk__in=matching)

    def filter_verified(self, queryset, name, value):
        return self._with_listing(queryset, dealer__is_verified=True) if value else queryset

    def filter_in_stock(self, queryset, name, value):
        return self._with_listing(queryset, stock__gt=0) if value else queryset
