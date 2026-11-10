from rest_framework.permissions import BasePermission

from common.constants import Roles


class _RolePermission(BasePermission):
    role = None

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == self.role)


class IsFarmer(_RolePermission):
    role = Roles.FARMER


class IsDealer(_RolePermission):
    role = Roles.DEALER


class IsAdminRole(_RolePermission):
    role = Roles.ADMIN


class IsVerifiedDealer(BasePermission):
    message = "Your business must be verified by an admin before you can do this."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.role == Roles.DEALER):
            return False
        profile = getattr(user, "dealer_profile", None)
        return bool(profile and profile.is_verified)


class IsOwnerOrAdmin(BasePermission):
    """Object-level: the object must have a `user` attribute (or be the user itself)."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == Roles.ADMIN:
            return True
        owner = getattr(obj, "user", obj)
        return owner == request.user
