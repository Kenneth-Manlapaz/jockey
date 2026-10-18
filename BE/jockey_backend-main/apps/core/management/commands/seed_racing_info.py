"""Small explicitly fictional information fixtures; never invoke on authoritative data."""
from datetime import datetime, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.races.models import Race, RaceEntry
from apps.horses.models import Horse
from apps.participants.models import Jockey, Trainer, Owner
from apps.venues.models import Venue
from apps.results.models import RaceResult, RaceResultPlacement
from apps.racing_info.models import EventType, BettingEvent, EventLeg, OfficialDividend, Announcement, SectionalTime
from apps.core.racing_fixture_names import VENUES, HORSES, RACES, RIDER, TRAINER, OWNER, SIRE, DAM, rename_existing_fixtures


class Command(BaseCommand):
    help = 'Create labelled development racing fixtures, including historical form and overlapping event legs. No accounts or tickets.'

    @transaction.atomic
    def handle(self, *args, **options):
        if Race.objects.filter(is_demo=False).exists():
            raise CommandError('Refusing to seed fixtures alongside authoritative races.')
        rename_existing_fixtures()
        today = timezone.localdate(timezone=ZoneInfo('Asia/Manila'))
        v, _ = Venue.objects.get_or_create(name=VENUES[0], defaults={'is_fictional': True})
        v2, _ = Venue.objects.get_or_create(name=VENUES[1], defaults={'is_fictional': True})
        jockey, _ = Jockey.objects.get_or_create(full_name=RIDER)
        trainer, _ = Trainer.objects.get_or_create(full_name=TRAINER)
        owner, _ = Owner.objects.get_or_create(name=OWNER)
        horses = [Horse.objects.get_or_create(name=name, defaults={
            'sex': 'gelding', 'birth_year': today.year - 4, 'trainer': trainer, 'owner': owner,
            'sire': SIRE, 'dam': DAM})[0] for name in HORSES]
        current = []
        for offset in [-200, -120, -60, -21, -7, 0, 7]:
            day = today + timedelta(days=offset)
            for n in range(1, 6 if offset == 0 else 2):
                r, _ = Race.objects.get_or_create(venue=v, race_date=day, race_number=n, defaults={
                    'name': RACES[n-1], 'post_time': datetime(day.year, day.month, day.day, 13+n, 0, tzinfo=ZoneInfo('Asia/Manila')),
                    'distance_m': 1200, 'surface': 'dirt', 'status': 'completed' if offset < 0 else 'upcoming',
                    'description': 'Fictional sample program. Not an official racing program.'})
                entries = []
                for i, horse in enumerate(horses, 1):
                    e, _ = RaceEntry.objects.get_or_create(race=r, horse=horse, defaults={'horse_number': i,
                        'post_position': i, 'jockey': jockey, 'trainer': trainer, 'owner': owner, 'weight_kg': Decimal('54.0')})
                    entries.append(e)
                if offset < 0:
                    result, _ = RaceResult.objects.get_or_create(race=r, defaults={'status': 'official', 'winning_time_ms': 72000,
                        'source': 'Sample data; not authoritative', 'posted_at': r.post_time, 'made_official_at': r.post_time})
                    for i, e in enumerate(entries, 1):
                        RaceResultPlacement.objects.get_or_create(result=result, entry=e,
                            defaults={'finish_position': i, 'finish_time_ms': 72000 + i*100 + abs(offset), 'margin_lengths': i-1})
                    SectionalTime.objects.get_or_create(result=result, label='Quarter 1', sequence=1, defaults={'time_ms': 18000})
                if offset == 0:
                    current.append(r)
        Race.objects.get_or_create(venue=v2, race_date=today, race_number=1, defaults={
            'name': 'Laguna Welcome Sprint', 'post_time': timezone.now(), 'distance_m': 1400, 'surface': 'dirt'})
        for code, multi, legs in [('WIN', False, [current[0]]), ('PICK 5', True, current), ('XD', True, current[1:3])]:
            kind, _ = EventType.objects.get_or_create(code=code, defaults={'name': code, 'is_multi_race': multi,
                'definition': 'Sample event only. Operator rules and actual legs are unverified.'})
            event, _ = BettingEvent.objects.get_or_create(meeting=current[0].meeting, event_type=kind,
                defaults={'label': code, 'status': 'provisional', 'source': 'Fictional sample program'})
            for index, r in enumerate(legs, 1):
                EventLeg.objects.get_or_create(event=event, race=r, defaults={'sequence': index})
        historical = Race.objects.get(venue=v, race_date=today-timedelta(days=7), race_number=1)
        win = EventType.objects.get(code='WIN')
        event, _ = BettingEvent.objects.get_or_create(meeting=historical.meeting, event_type=win,
            defaults={'label': 'Race 1 · WIN', 'status': 'official', 'source': 'Fictional sample program'})
        EventLeg.objects.get_or_create(event=event, race=historical, defaults={'sequence': 1})
        OfficialDividend.objects.get_or_create(event=event, combination='1', defaults={
            'amount': '25.00', 'unit_stake': '10.00', 'status': 'official', 'source': 'Sample data, not an official payout', 'published_at': timezone.now()})
        Announcement.objects.get_or_create(meeting=current[0].meeting, title='Welcome to race day',
            defaults={'content': 'Explore the sample race programs, horse form and published results. All racing records shown here are fictional sample data.', 'is_public': True})
        self.stdout.write(self.style.SUCCESS('Development information fixtures ready. No user accounts or tickets changed.'))
