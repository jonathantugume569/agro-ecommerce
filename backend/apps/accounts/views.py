from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from common.constants import Roles

from .models import DealerProfile, User, VerificationRequest
from .permissions import IsAdminRole, IsDealer
from .serializers import (
    CustomTokenObtainPairSerializer,
    DealerProfileSerializer,
    DealerPublicSerializer,
    FarmerProfileSerializer,
    RegisterSerializer,
    UserSerializer,
    VerificationRequestSerializer,
    VerificationReviewSerializer,
)
from .verification import approve_request, reject_request, submit_verification


# ---------- Auth ----------
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


# ---------- Own profile ----------
class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.user.role == Roles.DEALER:
            return DealerProfileSerializer
        return FarmerProfileSerializer

    def get_object(self):
        user = self.request.user
        profile = None
        if user.role == Roles.DEALER:
            profile = getattr(user, "dealer_profile", None)
        elif user.role == Roles.FARMER:
            profile = getattr(user, "farmer_profile", None)
        if profile is None:
            raise NotFound("No profile exists for this account.")
        return profile


# ---------- Public dealers ----------
class DealerListView(generics.ListAPIView):
    """Verified dealers only. Supports ?q= search on name, location or district."""
    serializer_class = DealerPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = DealerProfile.objects.filter(is_verified=True).order_by("business_name")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(business_name__icontains=q) | Q(location__icontains=q) | Q(district__icontains=q)
            )
        return qs


class DealerDetailView(generics.RetrieveAPIView):
    serializer_class = DealerPublicSerializer
    permission_classes = [AllowAny]
    queryset = DealerProfile.objects.filter(is_verified=True)


# ---------- Dealer: verification ----------
class DealerVerificationView(generics.ListCreateAPIView):
    """GET: my verification requests. POST: submit a document (multipart/form-data)."""
    serializer_class = VerificationRequestSerializer
    permission_classes = [IsAuthenticated, IsDealer]
    parser_classes = [MultiPartParser, FormParser]

    def _dealer(self):
        dealer = getattr(self.request.user, "dealer_profile", None)
        if dealer is None:
            raise NotFound("Dealer profile not found.")
        return dealer

    def get_queryset(self):
        return VerificationRequest.objects.filter(dealer=self._dealer())

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        verification = submit_verification(
            self._dealer(),
            serializer.validated_data["document"],
            serializer.validated_data.get("notes", ""),
        )
        return Response(
            self.get_serializer(verification).data, status=status.HTTP_201_CREATED
        )


# ---------- Admin ----------
class AdminVerificationListView(generics.ListAPIView):
    """?status=pending|approved|rejected"""
    serializer_class = VerificationRequestSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = VerificationRequest.objects.select_related("dealer", "dealer__user")
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs


class AdminVerificationReviewView(APIView):
    """POST {"action": "approve" | "reject", "admin_notes": "..."}"""
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request, pk):
        verification = get_object_or_404(
            VerificationRequest.objects.select_related("dealer", "dealer__user"), pk=pk
        )
        serializer = VerificationReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action = serializer.validated_data["action"]
        notes = serializer.validated_data["admin_notes"]
        if action == "approve":
            approve_request(verification, request.user, notes)
        else:
            reject_request(verification, request.user, notes)

        return Response(
            VerificationRequestSerializer(verification, context={"request": request}).data
        )


class AdminUserListView(generics.ListAPIView):
    """?role=farmer|dealer|admin and ?q= search on username or email."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = User.objects.select_related("farmer_profile", "dealer_profile").order_by("-date_joined")
        role = self.request.query_params.get("role")
        q = self.request.query_params.get("q")
        if role:
            qs = qs.filter(role=role)
        if q:
            qs = qs.filter(Q(username__icontains=q) | Q(email__icontains=q))
        return qs
