from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase

PUBLIC = ["/api/v1/health/", "/api/v1/venues/", "/api/v1/meetings/", "/api/v1/races/", "/api/v1/entries/",
          "/api/v1/horses/", "/api/v1/jockeys/", "/api/v1/trainers/", "/api/v1/results/", "/api/v1/games/"]
PROTECTED = ["/api/v1/me/", "/api/v1/bets/", "/api/v1/favorites/", "/api/v1/notifications/"]


class PermissionTests(DemoDataTestCase):
    def test_information_endpoints_are_public(self):
        client = APIClient()
        for url in PUBLIC:
            self.assertEqual(client.get(url).status_code, 200, url)

    def test_personal_endpoints_need_a_token(self):
        client = APIClient()
        for url in PROTECTED:
            resp = client.get(url)
            self.assertEqual(resp.status_code, 401, url)
            self.assertEqual(resp.data["error"]["code"], "not_authenticated")

    def test_public_endpoints_are_read_only(self):
        client = APIClient()
        for url in ("/api/v1/races/", "/api/v1/horses/", "/api/v1/venues/"):
            self.assertEqual(client.post(url, {}, format="json").status_code, 405, url)

    def test_bad_token_is_rejected(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION="Token not-a-real-token")
        self.assertEqual(client.get("/api/v1/me/").status_code, 401)
