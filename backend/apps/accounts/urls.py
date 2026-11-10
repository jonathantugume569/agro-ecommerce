from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = "accounts"

urlpatterns = [
    # auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("profile/", views.ProfileView.as_view(), name="profile"),

    # public dealers
    path("dealers/", views.DealerListView.as_view(), name="dealer-list"),
    path("dealers/<int:pk>/", views.DealerDetailView.as_view(), name="dealer-detail"),

    # dealer verification
    path("verification/", views.DealerVerificationView.as_view(), name="verification"),

    # admin
    path("admin/verifications/", views.AdminVerificationListView.as_view(), name="admin-verification-list"),
    path("admin/verifications/<int:pk>/review/", views.AdminVerificationReviewView.as_view(), name="admin-verification-review"),
    path("admin/users/", views.AdminUserListView.as_view(), name="admin-user-list"),
]
