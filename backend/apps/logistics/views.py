# apps/logistics/views.py
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Delivery
from .permissions import IsOrderDealer, IsOrderFarmer, IsOrderParticipant
from .serializers import DeliverySerializer, StatusUpdateInputSerializer


class DeliveryDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOrderParticipant]

    def get(self, request, order_id):
        delivery = get_object_or_404(Delivery.objects.select_related("order"), order_id=order_id)
        self.check_object_permissions(request, delivery)
        return Response(DeliverySerializer(delivery).data)


class DeliveryStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsOrderDealer]

    def post(self, request, order_id):
        delivery = get_object_or_404(Delivery.objects.select_related("order"), order_id=order_id)
        self.check_object_permissions(request, delivery)

        serializer = StatusUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            delivery.update_status(
                new_status=serializer.validated_data["status"],
                user=request.user,
                note=serializer.validated_data["note"],
            )
        except DjangoValidationError as exc:
            raise ValidationError({"status": exc.message})

        return Response(DeliverySerializer(delivery).data, status=status.HTTP_200_OK)


class ConfirmReceiptView(APIView):
    permission_classes = [IsAuthenticated, IsOrderFarmer]

    def post(self, request, order_id):
        delivery = get_object_or_404(Delivery.objects.select_related("order"), order_id=order_id)
        self.check_object_permissions(request, delivery)

        try:
            delivery.confirm_receipt(request.user)
        except DjangoValidationError as exc:
            raise ValidationError({"status": exc.message})

        return Response(DeliverySerializer(delivery).data, status=status.HTTP_200_OK)