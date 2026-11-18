from django.urls import path

from . import views

app_name = "orders"

urlpatterns = [
    path("", views.OrderListCreateView.as_view(), name="order-list"),
    path("<int:pk>/", views.OrderDetailView.as_view(), name="order-detail"),
    path("<int:pk>/cancel/", views.OrderCancelView.as_view(), name="order-cancel"),
    path("<int:pk>/accept/", views.OrderAcceptView.as_view(), name="order-accept"),
    path("<int:pk>/reject/", views.OrderRejectView.as_view(), name="order-reject"),
]
#tooooooooo
