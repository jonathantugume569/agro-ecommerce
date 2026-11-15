from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsDealer, IsFarmer
from common.constants import Roles

from . import services
from .models import Order, OrderStatus
from .permissions import IsOrderParticipant
from .serializers import OrderSerializer, PlaceOrderSerializer


def orders_for(user):
    """Each role only ever sees their own slice of orders."""
    qs = Order.objects.select_related("farmer", "dealer", "dealer__dealer_profile").prefetch_related("items")
    if user.role == Roles.ADMIN:
        return qs
    if user.role == Roles.DEALER:
        return qs.filter(dealer=user)
    return qs.filter(farmer=user)


class OrderListCreateView(generics.ListCreateAPIView):
    """GET  /api/orders/        -> my orders (farmer: placed, dealer: received). ?status=pending
    POST /api/orders/        -> farmer places a cart; returns a LIST of orders (one per dealer)
    """

    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsFarmer()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = orders_for(self.request.user)
        wanted = self.request.query_params.get("status")
        if wanted in OrderStatus.values:
            qs = qs.filter(status=wanted)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = PlaceOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        orders = services.place_orders(request.user, **serializer.validated_data)
        return Response(OrderSerializer(orders, many=True).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    """GET /api/orders/<id>/"""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsOrderParticipant]

    def get_queryset(self):
        return orders_for(self.request.user)


class _OrderActionView(APIView):
    """POST /api/orders/<id>/<action>/ -> runs a service function, returns the updated order."""

    permission_classes = [IsAuthenticated]
    service = None  # set in subclasses

    def post(self, request, pk):
        order = generics.get_object_or_404(orders_for(request.user), pk=pk)
        updated = type(self).service(order, request.user)
        return Response(OrderSerializer(updated).data)


class OrderCancelView(_OrderActionView):
    permission_classes = [IsFarmer]
    service = staticmethod(services.cancel_order)


class OrderAcceptView(_OrderActionView):
    permission_classes = [IsDealer]
    service = staticmethod(services.accept_order)


class OrderRejectView(_OrderActionView):
    permission_classes = [IsDealer]
    service = staticmethod(services.reject_order)
