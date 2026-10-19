from datetime import timedelta
from django.test import TestCase, override_settings
from django.db import connection
from django.test.utils import CaptureQueriesContext
from apps.horses.models import Horse
from apps.participants.models import Owner
from apps.races.models import RaceEntry
from apps.results.models import RaceResult, RaceResultPlacement
from . import test_information as fixtures


@override_settings(RACING_SUBSCRIPTION_REQUIRED=False)
class ExplorationTests(TestCase):
    setUpTestData = classmethod(fixtures.InformationTests.setUpTestData.__func__)
    make_race = classmethod(fixtures.InformationTests.make_race.__func__)
    setUp = fixtures.InformationTests.setUp

    def test_directory_filters_and_stable_global_sort(self):
        self.horse.owner, self.horse.trainer = self.owner, self.trainer
        self.horse.sex, self.horse.birth_year, self.horse.color = 'mare', 2020, 'Bay'
        self.horse.save()
        for i in range(25):
            Horse.objects.create(name=f'Alpha {i:02d}', birth_year=2021)
        response = self.client.get('/api/v1/racing/directory/horses/', {'sex': 'mare', 'trainer': 'Historical', 'owner': 'Historical', 'birth_year': 2020, 'color': 'bay'})
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['current_owner']['id'], self.owner.pk)
        pages = [self.client.get('/api/v1/racing/directory/horses/', {'sort': '-name', 'page_size': 5, 'page': page}).data for page in [1, 2]]
        names = [h['name'] for page in pages for h in page['results']]
        self.assertEqual(names, sorted(names, reverse=True))
        self.assertEqual(len(set(names)), 10)

    def test_directory_queries_are_batched(self):
        for i in range(25):
            Horse.objects.create(name=f'Horse {i}', owner=self.owner, trainer=self.trainer)
        with CaptureQueriesContext(connection) as small:
            self.client.get('/api/v1/racing/directory/horses/', {'page_size': 1})
        with CaptureQueriesContext(connection) as large:
            self.client.get('/api/v1/racing/directory/horses/', {'page_size': 25})
        self.assertEqual(len(small), len(large))

    def test_history_cutoff_pagination_filters_and_statistics(self):
        path = f'/api/v1/racing/horses/{self.horse.pk}/history/'
        data = self.client.get(path, {'race': self.race.pk, 'page_size': 1}).data
        self.assertEqual(data['count'], 3)
        self.assertEqual(len(data['results']), 1)
        self.assertEqual(data['stats']['recorded_finishes'], 3)
        self.assertEqual(data['stats']['win_rate'], 100)
        self.assertEqual(data['results'][0]['date'], self.day - timedelta(days=10))
        oldest = self.client.get(path, {'race': self.race.pk, 'sort': 'date', 'page_size': 1}).data
        self.assertEqual(oldest['results'][0]['date'], self.day - timedelta(days=200))
        filtered = self.client.get(path, {'race': self.race.pk, 'from': str(self.day-timedelta(days=20)), 'surface': 'dirt', 'distance': 1200, 'venue': self.venue.pk, 'status': 'corrected'}).data
        self.assertEqual(filtered['count'], 1)
        self.assertEqual(filtered['stats']['recorded_finishes'], 1)

    def test_dq_rates_dead_heats_and_empty_records(self):
        placements = list(RaceResultPlacement.objects.filter(result__status__in=['official', 'corrected']).order_by('pk'))
        placements[0].is_disqualified = True
        placements[0].save()
        placements[1].finish_position, placements[1].is_dead_heat = 2, True
        placements[1].save()
        path = f'/api/v1/racing/horses/{self.horse.pk}/history/'
        data = self.client.get(path, {'race': self.race.pk}).data
        self.assertEqual(data['stats']['recorded_finishes'], 3)
        self.assertEqual(data['stats']['wins'], 1)
        self.assertEqual(data['stats']['seconds'], 1)
        self.assertEqual(data['stats']['win_rate'], 33.33)
        self.assertEqual(data['stats']['top_three_rate'], 66.67)
        empty = self.client.get(path, {'venue': self.other_venue.pk}).data
        self.assertEqual(empty['count'], 0)
        self.assertIsNone(empty['stats']['win_rate'])

    def test_current_connections_do_not_rewrite_scoped_history(self):
        new_owner = Owner.objects.create(name='New current owner')
        self.horse.owner = new_owner
        self.horse.save()
        self.entry.owner = new_owner
        self.entry.save()
        historical = RaceEntry.objects.filter(horse=self.horse).exclude(pk=self.entry.pk).first()
        historical.owner = new_owner
        historical.save()
        data = self.client.get(f'/api/v1/racing/people/owners/{self.owner.pk}/', {'to': str(self.day)}).data
        self.assertEqual(data['current_horses_count'], 0)
        self.assertEqual(data['stats']['recorded_finishes'], 3)
        history = self.client.get(f'/api/v1/racing/people/owners/{self.owner.pk}/history/', {'to': str(self.day)}).data
        self.assertTrue(all(p['owner']['id'] == self.owner.pk for p in history['results']))
        current = self.client.get(f'/api/v1/racing/people/owners/{new_owner.pk}/').data
        self.assertEqual(current['current_horses_count'], 1)
        self.assertEqual(current['stats']['recorded_finishes'], 0)

    def test_results_keep_dead_heat_winners_exclude_dq_and_missing_times(self):
        result = RaceResult.objects.create(race=self.race, status='official', winning_time_ms=70000)
        for number, dq in [(1, False), (2, False), (3, True)]:
            horse = self.horse if number == 1 else Horse.objects.create(name=f'Runner {number}')
            entry = self.entry if number == 1 else RaceEntry.objects.create(race=self.race, horse=horse, horse_number=number)
            RaceResultPlacement.objects.create(result=result, entry=entry, finish_position=1, is_dead_heat=True, is_disqualified=dq)
        data = self.client.get('/api/v1/racing/results/', {'date': str(self.day), 'status': 'official'}).data
        self.assertEqual(data['count'], 1)
        self.assertEqual(len(data['results'][0]['winners']), 2)
        self.assertTrue(all(p['is_dead_heat'] for p in data['results'][0]['winners']))
        self.assertEqual(data['results'][0]['winning_time_ms'], 70000)
        self.assertIsNone(self.client.get(f'/api/v1/racing/races/{self.race.pk}/').data['result']['placements'][0]['time_ms'])

    def test_invalid_filters_and_membership_boundary(self):
        history = f'/api/v1/racing/horses/{self.horse.pk}/history/'
        for query in [{'from': 'bad'}, {'from': '20261001'}, {'from': '2026-10-02', 'to': '2026-10-01'}, {'surface': 'moon'}, {'distance': '-1'}, {'year': '99999'}, {'sort': 'sql'}, {'status': 'provisional'}, {'race': 'bad'}]:
            self.assertEqual(self.client.get(history, query).status_code, 400, query)
        with override_settings(RACING_SUBSCRIPTION_REQUIRED=True):
            for path in [history, f'/api/v1/racing/people/owners/{self.owner.pk}/history/', '/api/v1/racing/filters/']:
                self.assertEqual(self.client.get(path).status_code, 401, path)
