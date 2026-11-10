import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import DealerProfile, User

PASSWORD = "StrongPass123!"


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class AccountsAPITests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser("admin", "admin@test.com", "Pass12345!")

    # helpers
    def register_farmer(self, username="farmer1"):
        return self.client.post(reverse("accounts:register"), {
            "username": username, "email": f"{username}@test.com", "password": PASSWORD,
            "role": "farmer", "location": "Mukono", "district": "Mukono",
        }, format="json")

    def register_dealer(self, username="dealer1", license_number="LIC-001"):
        return self.client.post(reverse("accounts:register"), {
            "username": username, "email": f"{username}@test.com", "password": PASSWORD,
            "role": "dealer", "business_name": "Green Agro Ltd",
            "license_number": license_number, "location": "Kampala",
        }, format="json")

    def login(self, username, password=PASSWORD):
        res = self.client.post(reverse("accounts:login"),
                               {"username": username, "password": password}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
        return res

    def submit_document(self):
        doc = SimpleUploadedFile("license.pdf", b"fake pdf", content_type="application/pdf")
        return self.client.post(reverse("accounts:verification"),
                                {"document": doc, "notes": "Please verify"}, format="multipart")

    # tests
    def test_register_farmer_creates_profile(self):
        res = self.register_farmer()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["role"], "farmer")
        self.assertEqual(res.data["profile"]["location"], "Mukono")

    def test_dealer_requires_business_details(self):
        res = self.client.post(reverse("accounts:register"), {
            "username": "d", "email": "d@test.com", "password": PASSWORD, "role": "dealer",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("business_name", res.data)

    def test_dealer_starts_unverified(self):
        res = self.register_dealer()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["profile"]["is_verified"])

    def test_cannot_register_as_admin(self):
        res = self.client.post(reverse("accounts:register"), {
            "username": "x", "email": "x@test.com", "password": PASSWORD, "role": "admin",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens_and_user(self):
        self.register_farmer()
        res = self.login("farmer1")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["role"], "farmer")

    def test_verification_flow(self):
        self.register_dealer()
        self.login("dealer1")
        res = self.submit_document()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        request_id = res.data["id"]

        # a second pending request is blocked
        self.assertEqual(self.submit_document().status_code, status.HTTP_400_BAD_REQUEST)

        # admin approves
        self.client.credentials()
        self.login("admin", "Pass12345!")
        res = self.client.post(
            reverse("accounts:admin-verification-review", args=[request_id]),
            {"action": "approve", "admin_notes": "Looks good"}, format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "approved")
        self.assertTrue(DealerProfile.objects.get(user__username="dealer1").is_verified)

    def test_farmer_cannot_access_admin_endpoints(self):
        self.register_farmer()
        self.login("farmer1")
        res = self.client.get(reverse("accounts:admin-user-list"))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_public_dealer_list_only_shows_verified(self):
        self.register_dealer()
        res = self.client.get(reverse("accounts:dealer-list"))
        self.assertEqual(res.data["count"], 0)
