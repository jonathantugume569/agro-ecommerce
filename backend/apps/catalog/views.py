from django.db.models import Case, Count, IntegerField, Min, Q, Value, When
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsDealer, IsVerifiedDealer
from common.constants import Roles

from .filters import ListingFilter, ProductFilter
from .models import Category, Listing, Product
from .permissions import (
    IsAdminOrReadOnly,
    IsListingOwnerOrAdminOrReadOnly,
    IsVerifiedDealerOrAdminOrReadOnly,
)
from .price_comparison import compare_listings
from .serializers import CategorySerializer, ListingSerializer, ProductSerializer


# ---------- Categories ----------
class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None  # there are only a handful, so return them all


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOrReadOnly]


# ---------- Products ----------
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsVerifiedDealerOrAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ["name", "description", "category__name"]
    ordering_fields = ["name", "created_at", "min_price", "listing_count"]
    ordering = ["name"]

    def get_queryset(self):
        active = Q(listings__is_active=True)
        return Product.objects.select_related("category").annotate(
            listing_count=Count("listings", filter=active),
            min_price=Min("listings__price", filter=active & Q(listings__stock__gt=0)),
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        active = Q(listings__is_active=True)
        return Product.objects.select_related("category").annotate(
            listing_count=Count("listings", filter=active),
            min_price=Min("listings__price", filter=active & Q(listings__stock__gt=0)),
        )


class ProductCompareView(APIView):
    """GET /products/<id>/compare/ - every dealer's price for one product."""

    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            product = Product.objects.select_related("category").get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Product not found.")

        result = compare_listings(product)
        context = {"request": request}
        listings = []
        for row in result["rows"]:
            data = dict(ListingSerializer(row["listing"], context=context).data)
            data["is_cheapest"] = row["is_cheapest"]
            data["below_average"] = row["below_average"]
            data["difference_from_average"] = row["difference_from_average"]
            data["percent_from_average"] = row["percent_from_average"]
            listings.append(data)

        return Response(
            {
                "product": ProductSerializer(product, context=context).data,
                "summary": result["summary"],
                "listings": listings,
            }
        )


# ---------- Listings ----------
def _with_premium_rank(queryset):
    """Adds `premium_rank` (1 while premium is active, else 0) so premium listings sort first."""
    now = timezone.now()
    still_premium = Q(is_premium=True) & (
        Q(premium_expires_at__isnull=True) | Q(premium_expires_at__gt=now)
    )
    return queryset.annotate(
        premium_rank=Case(When(still_premium, then=Value(1)), default=Value(0), output_field=IntegerField())
    )


def _base_listings():
    return Listing.objects.select_related("product", "product__category", "dealer")


class ListingListCreateView(generics.ListCreateAPIView):
    """GET: public browse of active listings. POST: a verified dealer adds a listing."""

    serializer_class = ListingSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ["product__name", "description", "dealer__business_name"]
    ordering_fields = ["price", "created_at", "stock"]
    ordering = ["-premium_rank", "-created_at"]

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsVerifiedDealer()]
        return [AllowAny()]

    def get_queryset(self):
        return _with_premium_rank(_base_listings().filter(is_active=True))


class MyListingsView(generics.ListAPIView):
    """GET /listings/mine/ - the signed-in dealer's own listings, including inactive ones."""

    serializer_class = ListingSerializer
    permission_classes = [IsDealer]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ListingFilter
    search_fields = ["product__name", "description"]
    ordering_fields = ["price", "created_at", "stock"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return _base_listings().filter(dealer__user=self.request.user)


class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer
    permission_classes = [IsListingOwnerOrAdminOrReadOnly]

    def get_queryset(self):
        return _base_listings()

    def get_object(self):
        listing = super().get_object()
        # Hidden (inactive) listings are only visible to their owner and admins.
        if not listing.is_active and self.request.method in ("GET", "HEAD", "OPTIONS"):
            user = self.request.user
            allowed = user.is_authenticated and (
                user.role == Roles.ADMIN or listing.dealer.user_id == user.id
            )
            if not allowed:
                raise NotFound("Listing not found.")
        return listing

    def destroy(self, request, *args, **kwargs):
        from django.db.models import ProtectedError

        listing = self.get_object()
        try:
            listing.delete()
        except ProtectedError:
            # Past orders refer to this listing, so hide it instead of deleting it.
            listing.is_active = False
            listing.save(update_fields=["is_active", "updated_at"])
            return Response(
                {"detail": "This listing has orders, so it was deactivated instead of deleted."},
                status=status.HTTP_200_OK,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)
