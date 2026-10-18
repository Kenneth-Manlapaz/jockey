"""Shared test base: seeds the Figma demo once per test class."""
from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.betting import services
from apps.betting.models import GameType
from apps.core import demo
from apps.races.models import Race


@override_settings(RACING_SUBSCRIPTION_REQUIRED=False)
class DemoDataTestCase(TestCase):
    """Race 2 is untouched and upcoming, with 6 horses and all five games open.
    Race 1 is completed with an official result and Isabella's three demo tickets."""

    @classmethod
    def setUpTestData(cls):
        demo.seed_demo()
        cls.user = User.objects.get(email="isabella@example.com")
        cls.admin = User.objects.get(email="admin@example.com")
        cls.race = Race.objects.get(race_number=2)
        cls.entries = list(cls.race.entries.order_by("horse_number"))
        cls.game = {g.code: g for g in GameType.objects.all()}

    def bet(self, code, picks, amount=100):
        return services.place_bet(user=self.user, race=self.race, game_type=self.game[code],
                                  entry_ids=[self.entries[i].pk for i in picks], wager_amount=amount)
