from decimal import Decimal

from apps.betting import services
from apps.betting.models import Bet, BetStatusHistory
from apps.core import demo
from apps.core.testing import DemoDataTestCase
from apps.engagement.models import Notification
from apps.races.models import Race, RaceStatus


class SettlementTests(DemoDataTestCase):
    def setUp(self):
        # Race 2 result: horse numbers 1, 2, 3 finish in that order.
        e = self.entries
        self.tickets = {
            "win_hit": self.bet("WIN", [0], 50),
            "win_miss": self.bet("WIN", [1], 50),
            "place_hit": self.bet("PLACE", [1], 100),
            "fc_hit": self.bet("FORECAST", [0, 1], 100),
            "fc_wrong_order": self.bet("FORECAST", [1, 0], 100),
            "rfc_hit": self.bet("REVERSE_FORECAST", [1, 0], 100),
            "tri_hit": self.bet("TRIFECTA", [0, 1, 2], 20),
            "tri_miss": self.bet("TRIFECTA", [0, 2, 1], 20),
        }
        services.publish_result(race=self.race, finishing_order=[e[0].pk, e[1].pk, e[2].pk],
                                winning_time_ms=72840, dividends=demo.DEMO_DIVIDENDS)

    def test_cannot_settle_before_official(self):
        with self.assertRaises(services.BettingError):
            services.settle_bets(self.race)

    def test_all_five_games_settle_correctly(self):
        summary = services.finalize_race(self.race, changed_by=self.admin)
        expected = {  # status, payout = wager / 10 * dividend
            "win_hit": ("won", "155.00"), "win_miss": ("lost", None),
            "place_hit": ("won", "180.00"), "fc_hit": ("won", "1420.00"),
            "fc_wrong_order": ("lost", None), "rfc_hit": ("won", "710.00"),
            "tri_hit": ("won", "760.00"), "tri_miss": ("lost", None),
        }
        for key, (status, payout) in expected.items():
            bet = Bet.objects.get(pk=self.tickets[key].pk)
            self.assertEqual(bet.status, status, key)
            self.assertEqual(bet.payout_amount, Decimal(payout) if payout else None, key)
            self.assertIsNotNone(bet.settled_at)
        self.assertEqual((summary["won"], summary["lost"]), (5, 3))
        self.assertEqual(summary["payout_total"], Decimal("3225.00"))
        self.assertEqual(Race.objects.get(pk=self.race.pk).status, RaceStatus.COMPLETED)

    def test_history_and_notifications_written(self):
        services.finalize_race(self.race)
        self.assertEqual(BetStatusHistory.objects.filter(bet__race=self.race).count(), 8)
        self.assertEqual(Notification.objects.filter(race=self.race, type="bet_settled").count(), 8)

    def test_settling_twice_changes_nothing(self):
        services.finalize_race(self.race)
        again = services.settle_bets(self.race)
        self.assertEqual((again["won"], again["lost"]), (0, 0))

    def test_void_pending_bets(self):
        n = services.void_pending_bets(self.race, "Race cancelled")
        self.assertEqual(n, 8)
        self.assertEqual(Bet.objects.filter(race=self.race, status="void").count(), 8)

    def test_cancel_race_voids_and_marks_cancelled(self):
        n = services.cancel_race(self.race)
        self.assertEqual(n, 8)
        self.assertEqual(Race.objects.get(pk=self.race.pk).status, RaceStatus.CANCELLED)

    def test_publish_rejects_horse_from_another_race(self):
        other = Race.objects.get(race_number=3).entries.first()
        with self.assertRaises(services.BettingError):
            services.publish_result(race=self.race, finishing_order=[other.pk])
