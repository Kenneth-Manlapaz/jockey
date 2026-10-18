from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.betting import services
from apps.core import demo
from apps.core.testing import DemoDataTestCase
from apps.races.models import Race


class BettingApiTests(DemoDataTestCase):
    def setUp(self):
        self.client = APIClient()

    def login(self, email="isabella@example.com", password="demo12345"):
        resp = self.client.post("/api/v1/auth/login/", {"username": email, "password": password})
        self.assertEqual(resp.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {resp.data['access']}")

    def test_register_login_place_bet_and_history(self):
        reg = self.client.post("/api/v1/auth/register/", {
            "first_name": "Ana", "last_name": "Cruz", "email": "ana@example.com",
            "password": "strong-pass-123", "accept_terms": True}, format="json")
        self.assertEqual(reg.status_code, 201)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
        placed = self.client.post("/api/v1/bets/", {
            "race": self.race.pk, "game": "WIN", "entries": [self.entries[0].pk],
            "wager_amount": "50.00"}, format="json")
        self.assertEqual(placed.status_code, 201, placed.data)
        self.assertEqual(placed.data["selections"][0]["horse_name"], "Golden Victory")
        mine = self.client.get("/api/v1/bets/", {"status": "pending"})
        self.assertEqual(mine.data["count"], 1)
        one = self.client.get(f"/api/v1/bets/{placed.data['ticket_number']}/")
        self.assertEqual(one.status_code, 200)

    def test_bet_errors_use_the_standard_error_shape(self):
        self.login()
        resp = self.client.post("/api/v1/bets/", {
            "race": self.race.pk, "game": "WIN", "entries": [self.entries[0].pk],
            "wager_amount": "1.00"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data["error"]["code"], "betting_error")
        self.assertIn("Wager must be between", resp.data["error"]["message"])

    def test_users_only_see_their_own_tickets(self):
        self.login()
        other = User.objects.create_user("other@example.com", "pw-12345678", first_name="O", last_name="T")
        services.place_bet(user=other, race=self.race, game_type=self.game["WIN"],
                           entry_ids=[self.entries[0].pk], wager_amount=50)
        mine = self.client.get("/api/v1/bets/")
        self.assertEqual(mine.data["count"], 3)   # only Isabella's demo tickets

    def test_games_and_wager_presets(self):
        games = self.client.get("/api/v1/games/").data
        self.assertEqual([g["code"] for g in games], ["WIN", "PLACE", "FORECAST", "REVERSE_FORECAST", "TRIFECTA"])
        self.assertEqual(len(self.client.get(f"/api/v1/races/{self.race.pk}/games/").data), 5)
        self.assertEqual([float(a) for a in self.client.get("/api/v1/games/wager_presets/").data], [20, 50, 100, 200])

    def test_only_staff_can_settle_via_api(self):
        e = self.entries
        self.bet("WIN", [0], 50)
        services.publish_result(race=self.race, finishing_order=[e[0].pk, e[1].pk], dividends=[("WIN", "1", 31)])
        url = f"/api/v1/races/{self.race.pk}/settle/"
        self.assertEqual(self.client.post(url).status_code, 401)
        self.login()                                    # a normal player
        self.assertEqual(self.client.post(url).status_code, 403)
        self.login("admin@example.com", "admin12345")  # staff
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["won"], 1)

    def test_settle_without_result_is_a_clear_error(self):
        self.login("admin@example.com", "admin12345")
        resp = self.client.post(f"/api/v1/races/{Race.objects.get(race_number=3).pk}/settle/")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("no result", resp.data["error"]["message"])
