from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase


class RaceApiTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_schedule_filters(self):
        day = str(self.race.race_date)
        self.assertEqual(self.client.get("/api/v1/races/", {"date": day}).data["count"], 4)
        self.assertEqual(self.client.get("/api/v1/races/", {"date": day, "status": "completed"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/v1/races/", {"venue": self.race.venue_id}).data["count"], 4)
        self.assertEqual(self.client.get("/api/v1/races/", {"featured": "1"}).data["count"], 1)
        self.assertEqual(self.client.get("/api/v1/races/", {"date": "2000-01-01"}).data["count"], 0)

    def test_race_detail_has_entries_and_demo_flag(self):
        detail = self.client.get(f"/api/v1/races/{self.race.pk}/").data
        self.assertEqual(len(detail["entries"]), 6)
        self.assertEqual(detail["entries"][0]["jockey_name"], "Marco de León")
        self.assertTrue(detail["is_demo"])

    def test_entries_endpoints(self):
        rows = self.client.get(f"/api/v1/races/{self.race.pk}/entries/").data
        self.assertEqual([r["horse_number"] for r in rows], [1, 2, 3, 4, 5, 6])
        by_horse = self.client.get("/api/v1/entries/", {"horse": rows[0]["horse_id"]})
        self.assertEqual(by_horse.data["count"], 4)   # the same horse runs in all 4 demo races

    def test_missing_race_is_a_404_in_the_standard_shape(self):
        resp = self.client.get("/api/v1/races/999999/")
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.data["error"]["code"], "not_found")
