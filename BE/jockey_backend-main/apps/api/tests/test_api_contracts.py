from django.urls import resolve
from django.urls.exceptions import Resolver404
from rest_framework.test import APIClient

from apps.core.testing import DemoDataTestCase


class ApiContractTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_list_endpoints_are_paginated_the_same_way(self):
        for url in ("/api/v1/races/", "/api/v1/horses/", "/api/v1/venues/", "/api/v1/entries/"):
            body = self.client.get(url).data
            self.assertEqual(set(body), {"count", "next", "previous", "results"}, url)

    def test_page_size_is_capped_and_configurable(self):
        body = self.client.get("/api/v1/entries/", {"page_size": 5}).data
        self.assertEqual(len(body["results"]), 5)
        self.assertIsNotNone(body["next"])
        self.assertEqual(len(self.client.get("/api/v1/entries/", {"page_size": 100000}).data["results"]), 24)

    def test_race_list_shape(self):
        race = self.client.get("/api/v1/races/").data["results"][0]
        for key in ("id", "race_number", "name", "race_date", "post_time", "distance_m", "status",
                    "entries_count", "venue_name", "is_demo"):
            self.assertIn(key, race)

    def test_every_error_has_one_shape(self):
        for resp in (self.client.get("/api/v1/races/999999/"), self.client.get("/api/v1/bets/"),
                     self.client.post("/api/v1/auth/register/", {}, format="json")):
            self.assertEqual(list(resp.data), ["error"])
            self.assertEqual(set(resp.data["error"]), {"code", "message", "details"})

    def test_unversioned_api_paths_do_not_exist(self):
        with self.assertRaises(Resolver404):
            resolve("/api/races/")
        self.assertEqual(self.client.get("/api/races/").status_code, 404)
