from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from apps.betting import services
from apps.betting.models import BetStatus, RaceGame
from apps.core.testing import DemoDataTestCase
from apps.races.models import RaceEntry, RaceStatus


class PlaceBetTests(DemoDataTestCase):
    def test_win_ticket_number_and_estimate(self):
        bet = self.bet("WIN", [0], 50)
        day = (timezone.now() + timedelta(hours=8)).strftime("%y%m%d")
        self.assertRegex(bet.ticket_number, rf"^PJA-DEMO-{day}-\d{{4}}$")
        self.assertEqual(bet.estimated_return, Decimal("155.00"))   # 50 x 3.10
        self.assertEqual(bet.status, BetStatus.PENDING)
        self.assertEqual(bet.selections.count(), 1)

    def test_ticket_numbers_increase_and_are_unique(self):
        a, b = self.bet("WIN", [0], 20), self.bet("WIN", [1], 20)
        self.assertNotEqual(a.ticket_number, b.ticket_number)
        self.assertEqual(int(b.ticket_number[-4:]), int(a.ticket_number[-4:]) + 1)

    def test_rejects_wrong_number_of_horses(self):
        with self.assertRaises(services.BettingError):
            self.bet("FORECAST", [0])

    def test_rejects_duplicate_horse(self):
        with self.assertRaises(services.BettingError):
            self.bet("FORECAST", [0, 0])

    def test_rejects_wager_outside_limits(self):
        with self.assertRaises(services.BettingError):
            self.bet("WIN", [0], 5)
        with self.assertRaises(services.BettingError):
            self.bet("WIN", [0], 20000)

    def test_rejects_closed_race_and_closed_game(self):
        RaceGame.objects.filter(race=self.race, game_type=self.game["TRIFECTA"]).update(is_open=False)
        with self.assertRaises(services.BettingError):
            self.bet("TRIFECTA", [0, 1, 2])
        self.race.status = RaceStatus.ONGOING
        self.race.save()
        with self.assertRaises(services.BettingError):
            self.bet("WIN", [0])

    def test_rejects_scratched_horse(self):
        RaceEntry.objects.filter(pk=self.entries[0].pk).update(status="scratched")
        with self.assertRaises(services.BettingError):
            self.bet("WIN", [0])
