from rest_framework.permissions import BasePermission

from common.constants import Roles


class IsOrderParticipant(BasePermission):
    """Object-level: only the farmer, the dealer on the order, or an admin."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        return (
            user.role == Roles.ADMIN
            or obj.farmer_id == user.id
            or obj.dealer_id == user.id
        )
