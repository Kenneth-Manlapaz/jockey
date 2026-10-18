from apps.core import demo
from apps.core.testing import DemoDataTestCase
from apps.races.models import Race
from apps.results.models import ResultStatus


class DemoDataTests(DemoDataTestCase):
    def test_demo_history_matches_the_figma_screens(self):
        self.assertEqual(sorted(self.user.bets.values_list("status", flat=True)), ["lost", "pending", "won"])
        official = Race.objects.get(race_number=1).result
        self.assertEqual(official.status, ResultStatus.OFFICIAL)
        self.assertEqual(official.winning_time_display, "1:12.84")

    def test_seed_is_repeatable(self):
        demo.seed_demo()
        self.assertEqual(Race.objects.count(), 4)
        self.assertEqual(self.user.bets.count(), 3)
