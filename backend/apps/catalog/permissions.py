from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.accounts.permissions import IsAdminRole, IsOwnerOrAdmin, IsVerifiedDealer
from common.constants import Roles


class IsAdminOrReadOnly(BasePermission):
    """Anyone can read. Only admins can change."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return IsAdminRole().has_permission(request, view)


class IsVerifiedDealerOrAdminOrReadOnly(BasePermission):
    """Anyone can read. Writing needs a verified dealer (or an admin)."""

    message = "Your business must be verified by an admin before you can do this."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        if user and user.is_authenticated and user.role == Roles.ADMIN:
            return True
        return IsVerifiedDealer().has_permission(request, view)


class IsListingOwnerOrAdminOrReadOnly(IsVerifiedDealerOrAdminOrReadOnly):
    """Reading is public. Changing a listing needs its owner (still verified) or an admin."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return IsOwnerOrAdmin().has_object_permission(request, view, obj)
