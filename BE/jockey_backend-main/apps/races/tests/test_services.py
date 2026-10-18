from apps.core.testing import DemoDataTestCase
from apps.races import services
from apps.races.models import Race, RaceEntry, RaceStatus


class RaceServiceTests(DemoDataTestCase):
    def test_entries_count_follows_entries(self):
        self.assertEqual(Race.objects.get(pk=self.race.pk).entries_count, 6)
        self.entries[5].delete()
        self.assertEqual(Race.objects.get(pk=self.race.pk).entries_count, 5)

    def test_scratch_entries_updates_the_count(self):
        n = services.scratch_entries(RaceEntry.objects.filter(pk=self.entries[0].pk), "Vet check")
        self.assertEqual(n, 1)
        self.assertEqual(Race.objects.get(pk=self.race.pk).entries_count, 5)
        self.assertEqual(RaceEntry.objects.get(pk=self.entries[0].pk).status, "scratched")

    def test_mark_ongoing_closes_betting(self):
        services.mark_ongoing(Race.objects.filter(pk=self.race.pk))
        race = Race.objects.get(pk=self.race.pk)
        self.assertEqual(race.status, RaceStatus.ONGOING)
        self.assertFalse(race.is_betting_open())
