from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase
from apps.engagement.models import Favorite


class EngagementApiTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()
        token = self.client.post("/api/v1/auth/login/", {"username": "isabella@example.com", "password": "demo12345"}).data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_favorites_rules(self):
        horse_id = self.entries[0].horse_id
        ok = self.client.post("/api/v1/favorites/", {"target_type": "horse", "horse": horse_id}, format="json")
        self.assertEqual(ok.status_code, 201)
        dup = self.client.post("/api/v1/favorites/", {"target_type": "horse", "horse": horse_id}, format="json")
        self.assertEqual(dup.status_code, 400)
        bad = self.client.post("/api/v1/favorites/", {"target_type": "jockey", "horse": horse_id}, format="json")
        self.assertEqual(bad.status_code, 400)
        self.assertEqual(Favorite.objects.filter(user=self.user).count(), 1)
        listed = self.client.get("/api/v1/favorites/", {"type": "horse"})
        self.assertEqual(listed.data["count"], 1)
        self.assertEqual(self.client.delete(f"/api/v1/favorites/{ok.data['id']}/").status_code, 204)

    def test_notifications_unread_and_mark_read(self):
        unread = self.client.get("/api/v1/notifications/unread_count/").data["unread"]
        self.assertGreaterEqual(unread, 2)          # from the seeded settlement
        first = self.client.get("/api/v1/notifications/").data["results"][0]
        self.assertEqual(self.client.post(f"/api/v1/notifications/{first['id']}/read/").status_code, 204)
        self.assertEqual(self.client.get("/api/v1/notifications/unread_count/").data["unread"], unread - 1)
        self.client.post("/api/v1/notifications/read_all/")
        self.assertEqual(self.client.get("/api/v1/notifications/unread_count/").data["unread"], 0)
