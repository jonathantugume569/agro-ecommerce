from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Delivery, DeliveryUpdate


@receiver(post_save, sender="orders.Order")
def create_delivery_on_order(sender, instance, created, **kwargs):
    if created:
        delivery = Delivery.objects.create(order=instance)
        DeliveryUpdate.objects.create(
            delivery=delivery,
            status="Pending",
            note="Order placed.",
            updated_by=getattr(instance, "farmer", None),
        )