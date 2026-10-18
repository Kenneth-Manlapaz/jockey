"""Deterministic, generated racing records for a complete local platform preview.

No provider data is impersonated: is_demo/is_fictional remain set internally.
Existing records, user accounts, tickets and subscriptions are never reset.
"""
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from random import Random
from zoneinfo import ZoneInfo
from django.core.management import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.horses.models import Horse
from apps.participants.models import Jockey, Trainer, Owner
from apps.venues.models import Venue
from apps.races.models import Race, RaceEntry, RaceCategory, TipSheet, RaceTip
from apps.results.models import RaceResult, RaceResultPlacement
from apps.racing_info.models import EventType, BettingEvent, EventLeg, OfficialDividend, SectionalTime, Announcement

PREFIXES = ['Amihan', 'Copper', 'Moonlit', 'Pacific', 'Golden', 'Silver', 'Crimson', 'Emerald',
            'Royal', 'Island', 'Northern', 'Velvet', 'Bamboo', 'Coral', 'Summer', 'Midnight']
SUFFIXES = ['Dancer', 'Crest', 'Voyager', 'Promise', 'Arrow', 'Legacy', 'Breeze', 'Crown']
RIDERS = ['Mateo Reyes', 'Luis Mendoza', 'Nico Ramos', 'Paolo Santos', 'Adrian Cruz', 'Carlo Navarro',
          'Enzo Bautista', 'Gabriel Flores', 'Rafael Aquino', 'Miguel Santiago', 'Diego Mercado', 'Anton Soriano',
          'Julian Castillo', 'Marco Villanueva', 'Andres Rivera', 'Tomas Delgado', 'Emilio Torres', 'Leo Valencia']
TRAINERS = ['Rafael Navarro', 'Antonio Velasco', 'Elena Santiago', 'Roberto Medina', 'Cesar Villanueva',
            'Isabel Ramos', 'Daniel Lim', 'Manuel Ortega', 'Victor Salazar', 'Teresa Aquino', 'Gabriel Cruz', 'Pablo Reyes']
STABLES = ['Amihan Racing Stable', 'Crown Valley Stables', 'Bayview Thoroughbreds', 'Harborlight Racing',
           'Sierra Equine Partners', 'Bluewater Farm', 'Golden Acacia Stable', 'Isla Racing', 'Greenfield Stud', 'Northstar Racing']
RACE_NAMES = ['Sampaguita Sprint', 'Bayani Challenge', 'Perlas Cup', 'Harana Handicap',
              'Maharlika Stakes', 'Acacia Trophy', 'Harbor Mile', 'Sunset Challenge']
VENUE_NAMES = ['Crown Valley Racecourse', 'Bayview Racing Park', 'Highland Downs']


class Command(BaseCommand):
    help = 'Seed 128 horses, varied connections, 16 weeks of racing plus older history and upcoming meetings. Safe to rerun with the same --date.'

    def add_arguments(self, parser):
        parser.add_argument('--date', help='Anchor date YYYY-MM-DD; defaults to today in Asia/Manila.')
        parser.add_argument('--weeks', type=int, default=16)

    @transaction.atomic
    def handle(self, *args, **options):
        if Race.objects.filter(is_demo=False).exists():
            raise CommandError('Use a separate preview database; authoritative races are present.')
        try:
            anchor = date.fromisoformat(options['date']) if options['date'] else timezone.localdate(timezone=ZoneInfo('Asia/Manila'))
        except ValueError:
            raise CommandError('Use --date YYYY-MM-DD.')
        weeks = options['weeks']
        if not 1 <= weeks <= 52:
            raise CommandError('--weeks must be between 1 and 52.')
        venues = [Venue.objects.get_or_create(name=name, defaults={'city': city, 'province': province,
            'description': description, 'is_fictional': True})[0] for name, city, province, description in [
                (VENUE_NAMES[0], 'Santa Rosa', 'Laguna', 'A dirt racing oval with sprint and middle-distance programs.'),
                (VENUE_NAMES[1], 'Naic', 'Cavite', 'An open-air racing venue with an afternoon meeting program.'),
                (VENUE_NAMES[2], 'Tanauan', 'Batangas', 'A countryside venue hosting handicap and stakes programs.')]]
        jockeys = [Jockey.objects.get_or_create(full_name=name, defaults={'is_fictional': True,
            'weight_kg': Decimal('50.0') + Decimal(i % 7) / 2, 'bio': 'Professional rider with recorded sprint and middle-distance assignments.'})[0] for i, name in enumerate(RIDERS)]
        trainers = [Trainer.objects.get_or_create(full_name=name, defaults={'bio': 'Trainer of a varied stable competing across regional race meetings.'})[0] for name in TRAINERS]
        owners = [Owner.objects.get_or_create(name=name, defaults={'stable_name': name})[0] for name in STABLES]
        horses = []
        for i, name in enumerate(f'{first} {last}' for first in PREFIXES for last in SUFFIXES):
            horse, _ = Horse.objects.get_or_create(name=name, defaults={'birth_year': anchor.year - 4 - i % 4,
                'sex': ['gelding', 'mare', 'stallion'][i % 3], 'color': ['bay', 'chestnut', 'dark bay', 'gray'][i % 4],
                'country_of_origin': 'PH', 'sire': ['Pacific Crown', 'Royal Summit', 'Northern Wind', 'Golden Orchard'][i % 4],
                'dam': ['Summer Sonata', 'Velvet Dawn', 'Coral Song', 'Moonlit Garden'][i % 4],
                'trainer': trainers[i % len(trainers)], 'owner': owners[i % len(owners)], 'is_fictional': True,
                'bio': 'A locally bred thoroughbred with race-by-race performance and connection records.'})
            horses.append(horse)
        categories = {code: RaceCategory.objects.get_or_create(code=code, defaults={'name': label})[0]
                      for code, label in [('HANDICAP', 'Handicap'), ('STAKES', 'Stakes'), ('CONDITIONS', 'Conditions race')]}
        event_types = {}
        definitions = {'WIN': 'First-place selection in one race.', 'PLACE': 'A qualifying placing under the published field and operator conditions.',
            'FORECAST': 'First two finishers in exact order.', 'TRIFECTA': 'First three finishers in exact order.',
            'QUARTET': 'First four finishers in exact order.', 'PENTAFECTA': 'First five finishers in exact order.',
            'SUPER SIX': 'First six finishers in exact order in one race.', 'PICK 5': 'Winners across five designated races.',
            'PICK 6': 'Winners across six designated races.', 'WTA': 'Winners across seven designated races.',
            'XD': 'Winners of two designated non-consecutive races.', 'DD+1': 'Winners of three designated consecutive races.'}
        for code, definition in definitions.items():
            event_types[code], _ = EventType.objects.get_or_create(code=code, defaults={'name': code,
                'definition': definition, 'is_multi_race': code in ['PICK 5', 'PICK 6', 'WTA', 'XD', 'DD+1']})
            if event_types[code].definition.startswith(('Sample', 'Development')):
                event_types[code].definition = definition
                event_types[code].save(update_fields=['definition'])
        offsets = sorted(set([28, 20, *range(weeks, -3, -1)]), reverse=True)
        made = 0
        for week in offsets:
            day = anchor - timedelta(weeks=week)
            for meeting_index in range(2):
                venue = venues[(week + meeting_index) % len(venues)]
                race_count = 8 if (week + meeting_index) % 2 == 0 else 6
                meeting_races, winners = [], {}
                for number in range(1, race_count + 1):
                    rng = Random(f'jockey:{day}:{meeting_index}:{number}')
                    distance = [1200, 1400, 1600][(number - 1) % 3]
                    historical = week > 0
                    r, created = Race.objects.get_or_create(venue=venue, race_date=day, race_number=number, defaults={
                        'name': RACE_NAMES[number-1], 'post_time': datetime.combine(day, time(13, 0), tzinfo=ZoneInfo('Asia/Manila')) + timedelta(minutes=30*(number-1)),
                        'distance_m': distance, 'surface': 'dirt', 'track_condition': ['good', 'fast', 'sloppy'][week % 3],
                        'category': categories['STAKES' if number == race_count else 'HANDICAP' if number % 2 else 'CONDITIONS'],
                        'age_restriction': 'Four years old and above', 'description': 'A competitive field of four-year-olds and older over the declared distance. See entries for weight assignments and announcements for changes.',
                        'purse_amount': Decimal(180000 + number * 35000), 'max_entries': 8,
                        'status': 'completed' if historical else 'upcoming', 'is_demo': True})
                    made += int(created)
                    meeting_races.append(r)
                    block = (number - 1 + week) % 8
                    field = horses[meeting_index*64 + block*8:meeting_index*64 + block*8 + 8]
                    entries = []
                    for position, horse in enumerate(field, 1):
                        horse_index = horses.index(horse)
                        e, _ = RaceEntry.objects.get_or_create(race=r, horse=horse, defaults={
                            'horse_number': position, 'post_position': (position + number - 2) % 8 + 1,
                            'jockey': jockeys[(horse_index + week) % len(jockeys)], 'trainer': trainers[(horse_index + week // 8) % len(trainers)],
                            'owner': owners[(horse_index + week // 12) % len(owners)], 'weight_kg': Decimal('51.5') + Decimal((horse_index + week) % 8) / 2,
                            'current_odds': Decimal(rng.randrange(18, 125)) / 10,
                            'coupled_group': 'A' if number == 2 and position in [1, 2] else ''})
                        entries.append(e)
                    if historical and not hasattr(r, 'result'):
                        order = entries[:]; rng.shuffle(order)
                        winning_time = distance * 60 + rng.randrange(-1500, 2100)
                        result = RaceResult.objects.create(race=r, status='official', winning_time_ms=winning_time,
                            source='JOCKEY program archive', posted_at=r.post_time+timedelta(minutes=5), made_official_at=r.post_time+timedelta(minutes=8))
                        for finish, entry in enumerate(order, 1):
                            RaceResultPlacement.objects.create(result=result, entry=entry, finish_position=finish,
                                finish_time_ms=winning_time+(finish-1)*180+finish*(finish-1)*5, margin_lengths=Decimal(finish-1)/2,
                                intermediate_positions={'halfway': (finish+2)%8+1, 'quarter_to_go': (finish+1)%8+1})
                        splits = [winning_time//3, winning_time//3, winning_time-2*(winning_time//3)]
                        for sequence, split in enumerate(splits, 1):
                            SectionalTime.objects.create(result=result, label=f'Segment {sequence}', sequence=sequence, time_ms=split)
                    if historical:
                        winners[r.pk] = list(r.result.placements.order_by('finish_position').values_list('entry__horse_number', flat=True))
                    sheet, _ = TipSheet.objects.get_or_create(title=f'{venue.name} selections', race_date=day,
                        defaults={'compiler': 'Racing desk', 'source': 'JOCKEY program archive'})
                    picks = [e.horse_number for e in rng.sample(entries, 3)]
                    RaceTip.objects.get_or_create(sheet=sheet, race_number=number, tipster='Racing desk',
                        defaults={'race': r, 'raw_selection': '–'.join(map(str, picks)), 'horse_numbers': picks})
                    for code, size in [('WIN', 1), ('PLACE', 1), ('FORECAST', 2), ('TRIFECTA', 3), ('QUARTET', 4), ('PENTAFECTA', 5), ('SUPER SIX', 6)]:
                        event, _ = BettingEvent.objects.get_or_create(meeting=r.meeting, label=f'Race {number} · {code}',
                            defaults={'event_type': event_types[code], 'status': 'official', 'source': 'JOCKEY program archive', 'is_demo': True})
                        EventLeg.objects.get_or_create(event=event, race=r, defaults={'sequence': 1})
                        if historical:
                            combinations = list(map(str, winners[r.pk][:3])) if code == 'PLACE' else ['-'.join(map(str, winners[r.pk][:size]))]
                            for combination in combinations:
                                OfficialDividend.objects.get_or_create(event=event, combination=combination,
                                    defaults={'amount': Decimal(rng.randrange(12, 150)*(10**(size-1))), 'unit_stake': '10.00',
                                        'status': 'official', 'source': 'JOCKEY program archive', 'published_at': r.result.made_official_at})
                meeting = meeting_races[0].meeting
                meeting.status = 'completed' if week > 0 else 'scheduled'; meeting.source = 'JOCKEY program archive'; meeting.save()
                multi = [('PICK 5', [0,1,2,3,4]), ('PICK 6', [0,1,2,3,4,5]), ('XD', [0,2]), ('DD+1', [2,3,4])]
                if race_count >= 7:
                    multi.append(('WTA', [0,1,2,3,4,5,6]))
                for code, indices in multi:
                    event, _ = BettingEvent.objects.get_or_create(meeting=meeting, label=f'1st {code}', defaults={
                        'event_type': event_types[code], 'status': 'official', 'source': 'JOCKEY program archive', 'is_demo': True})
                    for sequence, index in enumerate(indices, 1):
                        EventLeg.objects.get_or_create(event=event, race=meeting_races[index], defaults={'sequence': sequence})
                    if week > 0:
                        combo = '-'.join(str(winners[meeting_races[index].pk][0]) for index in indices)
                        OfficialDividend.objects.get_or_create(event=event, combination=combo, defaults={
                            'amount': '1850.00' if code == 'XD' else '12450.00', 'unit_stake': '10.00', 'status': 'official',
                            'source': 'JOCKEY program archive', 'published_at': meeting_races[indices[-1]].result.made_official_at})
                Announcement.objects.get_or_create(meeting=meeting, title='Race day information', defaults={
                    'content': 'Review the declared entries and published conditions for each race. Post times are shown in Philippine time.', 'is_public': True})
        self.stdout.write(self.style.SUCCESS(f'Platform seed ready: {len(horses)} horses, {len(jockeys)} jockeys, '
            f'{len(trainers)} trainers, {len(owners)} owners; {made} new races. Anchor date: {anchor}. Existing records retained.'))
