from django.test import TestCase

from apps.accounts.models import User
from common.constants import Roles


class UserModelTests(TestCase):
    def test_default_role_is_farmer(self):
        user = User.objects.create_user("farmer1", "f1@test.com", "Pass12345!")
        self.assertEqual(user.role, Roles.FARMER)

    def test_superuser_becomes_admin(self):
        admin = User.objects.create_superuser("boss", "boss@test.com", "Pass12345!")
        self.assertEqual(admin.role, Roles.ADMIN)

    def test_str(self):
        user = User.objects.create_user("farmer2", "f2@test.com", "Pass12345!")
        self.assertEqual(str(user), "farmer2 (farmer)")
