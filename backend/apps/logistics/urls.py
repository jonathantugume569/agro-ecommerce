# apps/logistics/urls.py
from django.urls import path
from .views import ConfirmReceiptView, DeliveryDetailView, DeliveryStatusUpdateView

urlpatterns = [
    path("orders/<int:order_id>/", DeliveryDetailView.as_view(), name="delivery-detail"),
    path("orders/<int:order_id>/status/", DeliveryStatusUpdateView.as_view(), name="delivery-status"),
    path("orders/<int:order_id>/confirm/", ConfirmReceiptView.as_view(), name="delivery-confirm"),
]