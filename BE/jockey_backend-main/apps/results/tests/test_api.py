from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase
from apps.races.models import Race


class ResultApiTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()
        self.race1 = Race.objects.get(race_number=1)

    def test_race_results_endpoint(self):
        data = self.client.get(f"/api/v1/races/{self.race1.pk}/results/").data
        self.assertEqual(data["winning_time"], "1:12.84")
        self.assertEqual(data["status"], "official")
        self.assertEqual(data["placements"][0]["horse_name"], "Golden Victory")
        games = {d["game"] for d in data["dividends"]}
        self.assertEqual(games, {"WIN", "PLACE", "FORECAST", "REVERSE_FORECAST", "TRIFECTA"})

    def test_results_not_available_yet_is_404(self):
        resp = self.client.get(f"/api/v1/races/{self.race.pk}/results/")
        self.assertEqual(resp.status_code, 404)

    def test_results_list_filters(self):
        self.assertEqual(self.client.get("/api/v1/results/", {"status": "official"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/v1/results/", {"status": "provisional"}).data["count"], 0)
