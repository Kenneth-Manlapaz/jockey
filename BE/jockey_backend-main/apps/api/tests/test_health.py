from django.test import TestCase
from rest_framework.test import APIClient


class HealthTests(TestCase):
    def test_health_is_public_and_reports_database(self):
        resp = APIClient().get("/api/v1/health/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["status"], "ok")
        self.assertEqual(resp.data["database"], "ok")
        self.assertEqual(resp.data["api_version"], "v1")
        self.assertIn("Demo data", resp.data["data_notice"])
