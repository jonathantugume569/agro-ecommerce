from rest_framework.permissions import BasePermission


class IsOrderParticipant(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in (obj.order.farmer, obj.order.dealer)


class IsOrderDealer(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.order.dealer


class IsOrderFarmer(BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user == obj.order.farmer