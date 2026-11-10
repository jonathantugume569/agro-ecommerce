from django.contrib.auth.models import AbstractUser
from django.db import models

from common.constants import Roles, VerificationStatus


class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Roles.CHOICES, default=Roles.FARMER)
    phone = models.CharField(max_length=20, blank=True)

    def save(self, *args, **kwargs):
        # Users created with `createsuperuser` automatically become admins.
        if self.is_superuser:
            self.role = Roles.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"


class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="farmer_profile")
    location = models.CharField(max_length=150, blank=True)
    district = models.CharField(max_length=100, blank=True)
    farm_size_acres = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    main_crops = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Farmer: {self.user.username}"


class DealerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="dealer_profile")
    business_name = models.CharField(max_length=150)
    license_number = models.CharField(max_length=50, unique=True)
    location = models.CharField(max_length=150, blank=True)
    district = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.business_name


class VerificationRequest(models.Model):
    dealer = models.ForeignKey(
        DealerProfile, on_delete=models.CASCADE, related_name="verification_requests"
    )
    document = models.FileField(upload_to="verification_docs/")
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=VerificationStatus.CHOICES, default=VerificationStatus.PENDING
    )
    admin_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="reviewed_verifications"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.dealer.business_name} - {self.status}"
