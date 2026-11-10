from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from common.constants import VerificationStatus

from .models import DealerProfile, FarmerProfile, User, VerificationRequest
from .verification import approve_request, reject_request


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "role", "phone", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("username", "email", "phone")
    fieldsets = DjangoUserAdmin.fieldsets + (("Marketplace", {"fields": ("role", "phone")}),)
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Marketplace", {"fields": ("email", "role", "phone")}),
    )


@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "location", "district", "farm_size_acres")
    search_fields = ("user__username", "location", "district")


@admin.register(DealerProfile)
class DealerProfileAdmin(admin.ModelAdmin):
    list_display = ("business_name", "user", "license_number", "district", "is_verified")
    list_filter = ("is_verified",)
    search_fields = ("business_name", "license_number", "user__username")


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ("dealer", "status", "created_at", "reviewed_by")
    list_filter = ("status",)
    actions = ["approve_selected", "reject_selected"]

    @admin.action(description="Approve selected requests")
    def approve_selected(self, request, queryset):
        for item in queryset.filter(status=VerificationStatus.PENDING):
            approve_request(item, request.user)

    @admin.action(description="Reject selected requests")
    def reject_selected(self, request, queryset):
        for item in queryset.filter(status=VerificationStatus.PENDING):
            reject_request(item, request.user)
