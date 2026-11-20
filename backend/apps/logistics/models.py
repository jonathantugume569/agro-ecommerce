from django.conf import settings
from django.db import models, transaction
from .status_flow import STATUS_CHOICES, validate_transition
from django.core.exceptions import ValidationError


class Delivery(models.Model):
    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="delivery")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    receipt_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    @transaction.atomic
    def update_status(self, new_status, user, note=""):
        validate_transition(self.status, new_status)
        self.status = new_status
        self.save(update_fields=["status"])
        return DeliveryUpdate.objects.create(
            delivery=self, status=new_status, note=note, updated_by=user
        )

    @transaction.atomic
    def confirm_receipt(self, user):
        if self.status != "Delivered":
            raise ValidationError(
                "You can only confirm receipt after the delivery is marked Delivered."
            )

        if self.receipt_confirmed:
            raise ValidationError("Receipt has already been confirmed.")

        self.receipt_confirmed = True
        self.save(update_fields=["receipt_confirmed"])

        return DeliveryUpdate.objects.create(
            delivery=self,
            status="Delivered",
            note="Receipt confirmed by farmer.",
            updated_by=user,
        )

class DeliveryUpdate(models.Model):
    delivery = models.ForeignKey(Delivery, on_delete=models.CASCADE, related_name="updates")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    note = models.CharField(max_length=255, blank=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]