from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from common.constants import Roles

from .models import DealerProfile, FarmerProfile, User, VerificationRequest


# ---------- Profiles ----------
class FarmerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FarmerProfile
        fields = ["location", "district", "farm_size_acres", "main_crops"]


class DealerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DealerProfile
        fields = [
            "id", "business_name", "license_number", "location",
            "district", "description", "is_verified", "verified_at",
        ]
        read_only_fields = ["id", "is_verified", "verified_at"]


class DealerPublicSerializer(serializers.ModelSerializer):
    """What farmers are allowed to see about a dealer."""

    class Meta:
        model = DealerProfile
        fields = ["id", "business_name", "location", "district", "description", "is_verified"]


# ---------- Users ----------
class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "phone", "role", "profile"]
        read_only_fields = fields

    def get_profile(self, obj):
        if obj.role == Roles.FARMER and hasattr(obj, "farmer_profile"):
            return FarmerProfileSerializer(obj.farmer_profile).data
        if obj.role == Roles.DEALER and hasattr(obj, "dealer_profile"):
            return DealerProfileSerializer(obj.dealer_profile).data
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=[Roles.FARMER, Roles.DEALER])

    # profile fields (write only, used to build the profile)
    location = serializers.CharField(write_only=True, required=False, allow_blank=True)
    district = serializers.CharField(write_only=True, required=False, allow_blank=True)
    business_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    license_number = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "password", "phone", "role",
            "location", "district", "business_name", "license_number",
        ]

    def validate(self, attrs):
        if attrs["role"] == Roles.DEALER:
            if not attrs.get("business_name"):
                raise serializers.ValidationError({"business_name": "Required for dealers."})
            if not attrs.get("license_number"):
                raise serializers.ValidationError({"license_number": "Required for dealers."})
            if DealerProfile.objects.filter(license_number=attrs["license_number"]).exists():
                raise serializers.ValidationError(
                    {"license_number": "This license number is already registered."}
                )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data["role"]
        password = validated_data.pop("password")
        location = validated_data.pop("location", "")
        district = validated_data.pop("district", "")
        business_name = validated_data.pop("business_name", "")
        license_number = validated_data.pop("license_number", "")

        user = User.objects.create_user(password=password, **validated_data)

        if role == Roles.DEALER:
            DealerProfile.objects.create(
                user=user, business_name=business_name, license_number=license_number,
                location=location, district=district,
            )
        else:
            FarmerProfile.objects.create(user=user, location=location, district=district)
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login response also returns the user, so React knows the role straight away."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["username"] = user.username
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


# ---------- Verification ----------
class VerificationRequestSerializer(serializers.ModelSerializer):
    business_name = serializers.CharField(source="dealer.business_name", read_only=True)
    license_number = serializers.CharField(source="dealer.license_number", read_only=True)
    dealer_username = serializers.CharField(source="dealer.user.username", read_only=True)

    class Meta:
        model = VerificationRequest
        fields = [
            "id", "business_name", "license_number", "dealer_username",
            "document", "notes", "status", "admin_notes", "created_at", "reviewed_at",
        ]
        read_only_fields = ["id", "status", "admin_notes", "created_at", "reviewed_at"]


class VerificationReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["approve", "reject"])
    admin_notes = serializers.CharField(required=False, allow_blank=True, default="")
