from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase


class MeetingApiTests(DemoDataTestCase):
    def test_meeting_is_a_venue_race_day(self):
        resp = APIClient().get("/api/v1/meetings/", {"date": str(self.race.race_date)})
        self.assertEqual(resp.data["count"], 1)
        meeting = resp.data["results"][0]
        self.assertEqual(meeting["venue_name"], "Sample Racing Venue")
        self.assertEqual(meeting["race_count"], 4)

    def test_filter_by_venue(self):
        self.assertEqual(APIClient().get("/api/v1/meetings/", {"venue": 999999}).data["count"], 0)
