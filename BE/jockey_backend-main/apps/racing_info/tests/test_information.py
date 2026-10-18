from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.horses.models import Horse
from apps.participants.models import Jockey, Trainer, Owner
from apps.venues.models import Venue
from apps.races.models import Race, RaceEntry
from apps.results.models import RaceResult, RaceResultPlacement
from apps.meetings.models import Meeting
from apps.racing_info.models import (EventType, BettingEvent, EventLeg, OfficialDividend,
                                    Announcement, SectionalTime)
from apps.racing_info.selectors import form


@override_settings(RACING_SUBSCRIPTION_REQUIRED=False)
class InformationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.day = timezone.localdate(timezone=ZoneInfo('Asia/Manila'))
        cls.venue = Venue.objects.create(name='Test venue')
        cls.other_venue = Venue.objects.create(name='Other venue')
        cls.horse = Horse.objects.create(name='Test horse', career_starts=999, form_last5='9-9-9')
        cls.jockey = Jockey.objects.create(full_name='Historical jockey')
        cls.trainer = Trainer.objects.create(full_name='Historical trainer')
        cls.owner = Owner.objects.create(name='Historical owner')
        cls.race = cls.make_race(cls.day, 1)
        cls.entry = RaceEntry.objects.create(race=cls.race, horse=cls.horse, horse_number=1,
            jockey=cls.jockey, trainer=cls.trainer, owner=cls.owner, weight_kg='54.0')
        for offset, time, status in [(-200, 65000, 'official'), (-180, 72000, 'official'),
                                      (-10, 73000, 'corrected'), (-2, 60000, 'provisional'), (7, 50000, 'official')]:
            r = cls.make_race(cls.day + timedelta(days=offset), 1)
            e = RaceEntry.objects.create(race=r, horse=cls.horse, horse_number=1, jockey=cls.jockey,
                trainer=cls.trainer, owner=cls.owner, weight_kg='54.0')
            result = RaceResult.objects.create(race=r, status=status)
            RaceResultPlacement.objects.create(result=result, entry=e, finish_position=1, finish_time_ms=time)

    @classmethod
    def make_race(cls, day, number, venue=None, distance=1200):
        return Race.objects.create(venue=venue or cls.venue, race_date=day, race_number=number,
            name=f'Race {number}', post_time=datetime(day.year, day.month, day.day, 14, number, tzinfo=ZoneInfo('Asia/Manila')),
            distance_m=distance, surface='dirt')

    def setUp(self):
        self.client = APIClient()

    def test_calendar_counts_multiple_meetings_and_skips_empty_days(self):
        self.make_race(self.day, 1, self.other_venue)
        response = self.client.get('/api/v1/racing/calendar/', {'date': str(self.day), 'year': self.day.year, 'month': self.day.month})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data['meetings']), 2)
        self.assertEqual(response.data['previous_date'], self.day-timedelta(days=2))
        self.assertEqual(response.data['next_date'], self.day+timedelta(days=7))
        count = next(d for d in response.data['days'] if d['race_date'] == self.day)
        self.assertEqual(count['meeting_count'], 2)
        self.assertEqual(count['race_count'], 2)

    def test_empty_date_and_invalid_dates(self):
        r = self.client.get('/api/v1/racing/calendar/', {'date': str(self.day-timedelta(days=1))})
        self.assertEqual(r.data['meetings'], [])
        for query in [{'month': '13'}, {'year': 'bad'}, {'year': '9999'}, {'date': '2026-02-30'}]:
            self.assertEqual(self.client.get('/api/v1/racing/calendar/', query).status_code, 400)
        self.assertEqual(self.client.get(f'/api/v1/racing/horses/{self.horse.pk}/', {'race': 'invalid'}).status_code, 400)

    def test_public_journey_and_account_boundaries(self):
        for path in ['calendar/', f'meetings/{self.race.meeting_id}/', f'races/{self.race.pk}/',
                     f'horses/{self.horse.pk}/', 'directory/horses/', 'directory/jockeys/', 'directory/trainers/',
                     'directory/owners/', f'people/jockeys/{self.jockey.pk}/', f'people/trainers/{self.trainer.pk}/',
                     f'people/owners/{self.owner.pk}/', 'results/']:
            self.assertEqual(self.client.get('/api/v1/racing/'+path).status_code, 200, path)
            self.assertEqual(self.client.post('/api/v1/racing/'+path, {}).status_code, 405, path)
        for path in ['/api/v1/me/', '/api/v1/favorites/', '/api/v1/notifications/', '/api/v1/racing/access/']:
            self.assertEqual(self.client.get(path).status_code, 401, path)

    def test_form_excludes_future_and_provisional_and_obeys_180_day_boundary(self):
        data = form(self.horse.pk, self.race)
        self.assertEqual(len(data['recent']), 3)
        self.assertEqual(data['best_time_ms'], 72000)
        self.assertEqual(data['stats']['recorded_finishes'], 3)
        self.assertEqual(data['recent'][0]['jockey']['name'], self.jockey.full_name)

    def test_comparable_form_requires_venue_surface_distance(self):
        for venue, dist, surf in [(self.other_venue, 1200, 'dirt'), (self.venue, 1400, 'dirt'), (self.venue, 1200, 'turf')]:
            r = self.make_race(self.day-timedelta(days=1), Race.objects.count()+1, venue, dist)
            r.surface = surf
            r.save()
            e = RaceEntry.objects.create(race=r, horse=self.horse, horse_number=1)
            result = RaceResult.objects.create(race=r, status='official')
            RaceResultPlacement.objects.create(result=result, entry=e, finish_position=2, finish_time_ms=50000)
        self.assertEqual(form(self.horse.pk, self.race)['best_time_ms'], 72000)

    def test_disqualified_time_cannot_be_best_or_count_as_win(self):
        p = RaceResultPlacement.objects.get(result__race__race_date=self.day-timedelta(days=180))
        p.is_disqualified = True
        p.save()
        data = form(self.horse.pk, self.race)
        self.assertEqual(data['best_time_ms'], 73000)
        self.assertEqual(data['stats']['wins'], 2)

    def test_missing_time_never_uses_winners_time_as_horse_time(self):
        RaceResultPlacement.objects.update(finish_time_ms=None)
        self.assertIsNone(form(self.horse.pk, self.race)['best_time_ms'])
        self.assertIsNone(form(self.horse.pk, self.race)['recent'][0]['time_ms'])

    def test_entry_declaration_and_changes_survive_scratch(self):
        original = self.entry.original_declaration.copy()
        self.entry.status = 'scratched'
        self.entry.scratch_reason = 'Veterinary withdrawal'
        self.entry.save()
        self.entry.refresh_from_db()
        self.assertEqual(self.entry.original_declaration, original)
        self.assertEqual(self.entry.changes.count(), 1)
        data = self.client.get(f'/api/v1/racing/races/{self.race.pk}/').data
        self.assertEqual(data['entries'][0]['status'], 'scratched')
        self.assertIsNone(data['result'])

    def test_event_legs_overlap_but_cannot_cross_meetings(self):
        kind = EventType.objects.create(code='TEST_MULTI', name='Test multi', is_multi_race=True)
        e1 = BettingEvent.objects.create(meeting=self.race.meeting, event_type=kind, label='Event one', status='official')
        e2 = BettingEvent.objects.create(meeting=self.race.meeting, event_type=kind, label='Event two', status='official')
        EventLeg.objects.create(event=e1, race=self.race, sequence=1)
        EventLeg.objects.create(event=e2, race=self.race, sequence=1)
        wrong = self.make_race(self.day+timedelta(days=1), 1)
        with self.assertRaises(ValidationError):
            EventLeg.objects.create(event=e1, race=wrong, sequence=2)
        self.assertEqual(len(self.client.get(f'/api/v1/racing/races/{self.race.pk}/').data['events']), 2)

    def test_single_event_cannot_have_multiple_legs(self):
        kind = EventType.objects.create(code='WIN', name='Win')
        event = BettingEvent.objects.create(meeting=self.race.meeting, event_type=kind, label='Win')
        EventLeg.objects.create(event=event, race=self.race, sequence=1)
        with self.assertRaises(ValidationError):
            EventLeg.objects.create(event=event, race=self.make_race(self.day, 2), sequence=2)

    def test_unpublished_event_and_announcements_are_private(self):
        kind = EventType.objects.create(code='WIN', name='Win')
        event = BettingEvent.objects.create(meeting=self.race.meeting, event_type=kind, label='Private')
        EventLeg.objects.create(event=event, race=self.race, sequence=1)
        Announcement.objects.create(meeting=self.race.meeting, title='Private', content='Private')
        self.assertEqual(self.client.get(f'/api/v1/racing/events/{event.pk}/').status_code, 404)
        data = self.client.get(f'/api/v1/racing/meetings/{self.race.meeting_id}/').data
        self.assertEqual(data['events'], [])
        self.assertEqual(data['announcements'], [])

    def test_dividend_publication_is_append_only_and_preserves_unit(self):
        kind = EventType.objects.create(code='WIN', name='Win')
        event = BettingEvent.objects.create(meeting=self.race.meeting, event_type=kind, label='Win', status='official')
        d = OfficialDividend.objects.create(event=event, combination='1', amount='25.00', unit_stake='10.00',
            status='official', source='Test source', published_at=timezone.now())
        d.amount = '30.00'
        with self.assertRaises(ValidationError):
            d.save()
        correction = OfficialDividend.objects.create(event=event, combination='1', amount='30.00', unit_stake='10.00',
            status='corrected', source='Test correction', published_at=timezone.now(), supersedes=d, correction_reason='Operator correction')
        response = self.client.get(f'/api/v1/racing/events/{event.pk}/')
        self.assertEqual(len(response.data['dividends']), 2)
        self.assertEqual(response.data['dividends'][1]['supersedes_id'], d.pk)
        self.assertEqual(str(correction.unit_stake), '10.00')

    def test_results_keep_program_and_validate_placements(self):
        result = RaceResult.objects.create(race=self.race, status='official')
        RaceResultPlacement.objects.create(result=result, entry=self.entry, finish_position=1, is_dead_heat=True)
        result.stewards_notes = 'Corrected decision'
        result.status = 'corrected'
        result.save()
        self.assertEqual(result.revisions.count(), 1)
        data = self.client.get(f'/api/v1/racing/races/{self.race.pk}/').data
        self.assertEqual(len(data['entries']), 1)
        self.assertTrue(data['result']['placements'][0]['is_dead_heat'])
        other = RaceEntry.objects.exclude(race=self.race).first()
        with self.assertRaises(ValidationError):
            RaceResultPlacement.objects.create(result=result, entry=other, finish_position=2)
        with self.assertRaises(ValidationError):
            SectionalTime.objects.create(result=result, entry=other, label='Quarter', sequence=1, time_ms=10000)

    def test_participant_stats_derive_from_records_and_preserve_history(self):
        replacement = Jockey.objects.create(full_name='Replacement rider')
        old_entry = RaceEntry.objects.get(race__race_date=self.day-timedelta(days=10))
        old_entry.jockey = replacement
        old_entry.save()
        data = self.client.get(f'/api/v1/racing/people/jockeys/{self.jockey.pk}/').data
        self.assertEqual(data['stats']['recorded_finishes'], 4)
        self.assertEqual(data['stats']['wins'], 4)
        self.assertEqual(data['recent'][0]['trainer']['name'], self.trainer.full_name)
        replacement_data = self.client.get(f'/api/v1/racing/people/jockeys/{replacement.pk}/').data
        self.assertEqual(replacement_data['stats']['recorded_finishes'], 0)

    def test_favorites_are_isolated_and_premium_is_not_granted_by_login(self):
        one = User.objects.create_user(email='one@example.com', password='test-password-123')
        two = User.objects.create_user(email='two@example.com', password='test-password-123')
        self.client.force_authenticate(one)
        self.assertEqual(self.client.post('/api/v1/favorites/', {'target_type': 'horse', 'horse': self.horse.pk}).status_code, 201)
        self.assertFalse(self.client.get('/api/v1/racing/access/').data['premium_analytics'])
        self.client.force_authenticate(two)
        self.assertEqual(self.client.get('/api/v1/favorites/').data['count'], 0)

    def test_meeting_and_race_must_agree(self):
        self.race.venue = self.other_venue
        with self.assertRaises(ValidationError):
            self.race.save()
