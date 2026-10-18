from django.urls import reverse

from apps.betting import services
from apps.betting.models import Bet
from apps.core.testing import DemoDataTestCase


class AdminTests(DemoDataTestCase):
    def test_admin_pages_load_for_admin(self):
        self.client.force_login(self.admin)
        for name in ("races_race", "betting_bet", "results_raceresult", "accounts_user", "horses_horse",
                     "venues_venue", "engagement_favorite"):
            self.assertEqual(self.client.get(reverse(f"admin:{name}_changelist")).status_code, 200, name)
        self.assertEqual(self.client.get(reverse("admin:races_race_change", args=[self.race.pk])).status_code, 200)
        self.assertEqual(self.client.get(reverse("admin:accounts_user_add")).status_code, 200)

    def test_normal_users_cannot_enter_admin(self):
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse("admin:index")).status_code, 302)

    def test_finalize_action_settles_bets(self):
        e = self.entries
        self.bet("WIN", [0], 50)
        result = services.publish_result(race=self.race, finishing_order=[e[0].pk, e[1].pk],
                                         dividends=[("WIN", "1", 31)])
        self.client.force_login(self.admin)
        resp = self.client.post(reverse("admin:results_raceresult_changelist"),
                                {"action": "finalize", "_selected_action": [result.pk]}, follow=True)
        self.assertContains(resp, "1 won")
        self.assertEqual(Bet.objects.filter(race=self.race, status="won").count(), 1)

    def test_race_form_shows_open_games(self):
        self.client.force_login(self.admin)
        page = self.client.get(reverse("admin:races_race_change", args=[self.race.pk]))
        self.assertContains(page, "Games open for betting")
