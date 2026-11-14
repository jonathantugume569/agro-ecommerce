from rest_framework import serializers
from .models import Delivery, DeliveryUpdate
from .status_flow import ALLOWED_TRANSITIONS, STATUS_CHOICES


class DeliveryUpdateSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source="updated_by.get_full_name", read_only=True)

    class Meta:
        model = DeliveryUpdate
        fields = ["id", "status", "note", "updated_by_name", "created_at"]


class DeliverySerializer(serializers.ModelSerializer):
    updates = DeliveryUpdateSerializer(many=True, read_only=True)
    next_statuses = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = ["id", "order", "status", "receipt_confirmed", "next_statuses", "updates", "created_at"]

    def get_next_statuses(self, obj):
        return ALLOWED_TRANSITIONS.get(obj.status, [])


class StatusUpdateInputSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=STATUS_CHOICES)
    note = serializers.CharField(max_length=255, required=False, allow_blank=True, default="")