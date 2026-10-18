from rest_framework.test import APIClient

from apps.accounts.models import User, UserSettings
from apps.core.testing import DemoDataTestCase


class AccountApiTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()
        self.payload = {"first_name": "Ana", "last_name": "Cruz", "email": "ana@example.com",
                        "password": "strong-pass-123", "accept_terms": True}

    def test_register_creates_user_settings_and_jwt(self):
        resp = self.client.post("/api/v1/auth/register/", self.payload, format="json")
        self.assertEqual(resp.status_code, 201)
        self.assertIn("access", resp.data)
        self.assertEqual(resp.data["user"]["initials"], "AC")
        self.assertTrue(UserSettings.objects.filter(user__email="ana@example.com").exists())

    def test_register_rejects_duplicate_email_weak_password_and_missing_terms(self):
        self.client.post("/api/v1/auth/register/", self.payload, format="json")
        dup = self.client.post("/api/v1/auth/register/", {**self.payload, "email": "ANA@example.com"}, format="json")
        self.assertEqual(dup.status_code, 400)
        weak = self.client.post("/api/v1/auth/register/", {**self.payload, "email": "b@example.com", "password": "12345678"}, format="json")
        self.assertEqual(weak.status_code, 400)
        no_terms = self.client.post("/api/v1/auth/register/", {**self.payload, "email": "c@example.com", "accept_terms": False}, format="json")
        self.assertEqual(no_terms.status_code, 400)
        self.assertEqual(no_terms.data["error"]["code"], "validation_error")

    def test_me_get_and_patch(self):
        token = self.client.post("/api/v1/auth/login/", {"username": "isabella@example.com", "password": "demo12345"}).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(self.client.get("/api/v1/me/").data["first_name"], "Isabella")
        resp = self.client.patch("/api/v1/me/", {"first_name": "Bella", "role": "admin"}, format="json")
        self.assertEqual(resp.status_code, 200)
        user = User.objects.get(email="isabella@example.com")
        self.assertEqual(user.first_name, "Bella")
        self.assertEqual(user.role, "user")        # role is read-only: no self-promotion

    def test_wrong_password_is_rejected(self):
        resp = self.client.post("/api/v1/auth/login/", {"username": "isabella@example.com", "password": "nope"})
        self.assertEqual(resp.status_code, 401)
