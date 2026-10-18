"""Readable names for fictional preview data, including older seeded records."""
from django.db import transaction

VENUES = ('Sierra Verde Park', 'Laguna Downs')
HORSES = ('Amihan Express', 'Copper Horizon', 'Moonlit Harbor', 'Isla Bonita')
RACES = ('Sampaguita Sprint', 'Bayani Challenge', 'Perlas Cup', 'Harana Handicap', 'Maharlika Stakes')
RIDER = 'Mateo Reyes'
TRAINER = 'Rafael Navarro'
OWNER = 'Amihan Racing Stable'
SIRE = 'Pacific Crown'
DAM = 'Summer Sonata'


@transaction.atomic
def rename_existing_fixtures():
    from apps.venues.models import Venue
    from apps.horses.models import Horse
    from apps.participants.models import Jockey, Trainer, Owner
    from apps.races.models import Race, RaceEntry
    from apps.results.models import RaceResult, RaceResultPlacement
    from apps.racing_info.models import BettingEvent, Announcement, EventType, OfficialDividend

    names = {
        'Development Racing Ground': VENUES[0], 'Development Second Venue': VENUES[1],
        'Development Rider': RIDER, 'Development Trainer': TRAINER, 'Development Stable': OWNER,
        'Development Sire': SIRE, 'Development Dam': DAM,
        'Development Second Meeting': 'Laguna Welcome Sprint',
        **{f'Development Horse {i}': name for i, name in enumerate(HORSES, 1)},
        **{f'Development Race {i}': name for i, name in enumerate(RACES, 1)},
    }
    # Rename only known fictional fixtures. Primary keys and participation stay intact.
    fixture_venues = Venue.objects.filter(is_fictional=True, name__in=[*VENUES, 'Development Racing Ground', 'Development Second Venue'])
    venue_ids = list(fixture_venues.values_list('pk', flat=True))
    for old, new in names.items():
        Venue.objects.filter(pk__in=venue_ids, name=old).update(name=new)
        Horse.objects.filter(is_fictional=True, name=old).update(name=new)
        Race.objects.filter(is_demo=True, venue_id__in=venue_ids, name=old).update(name=new)
    Jockey.objects.filter(is_fictional=True, full_name='Development Rider').update(full_name=RIDER)
    Trainer.objects.filter(full_name='Development Trainer', raceentry__race__venue_id__in=venue_ids).update(full_name=TRAINER)
    Owner.objects.filter(name='Development Stable', raceentry__race__venue_id__in=venue_ids).update(name=OWNER)
    Horse.objects.filter(is_fictional=True, name__in=HORSES, sire='Development Sire').update(sire=SIRE)
    Horse.objects.filter(is_fictional=True, name__in=HORSES, dam='Development Dam').update(dam=DAM)

    def rename_values(value):
        if isinstance(value, dict):
            return {key: rename_values(item) for key, item in value.items()}
        if isinstance(value, list):
            return [rename_values(item) for item in value]
        return names.get(value, value) if isinstance(value, str) else value

    # Snapshots carry display names as well as IDs; keep the preview consistent.
    for entry in RaceEntry.objects.filter(race__is_demo=True, race__venue_id__in=venue_ids):
        RaceEntry.objects.filter(pk=entry.pk).update(original_declaration=rename_values(entry.original_declaration))
    for placement in RaceResultPlacement.objects.filter(result__race__is_demo=True, result__race__venue_id__in=venue_ids):
        RaceResultPlacement.objects.filter(pk=placement.pk).update(participation_snapshot=rename_values(placement.participation_snapshot))
    for event in BettingEvent.objects.filter(is_demo=True, meeting__venue_id__in=venue_ids):
        if event.label.startswith('Development '):
            event.label = 'Race 1 · WIN' if event.label == 'Development WIN dividend' else event.label.removeprefix('Development ')
            event.save(update_fields=['label'])
    Announcement.objects.filter(meeting__venue_id__in=venue_ids, title='Development data').update(
        title='Welcome to race day', content='Explore the sample race programs, horse form and published results. All racing records shown here are fictional sample data.')
    # Presentation copy only; keep the fictional flags, publication states and amounts.
    for model, field, scope in [
        (Race, 'description', {'is_demo': True, 'venue_id__in': venue_ids}),
        (RaceResult, 'source', {'race__is_demo': True, 'race__venue_id__in': venue_ids}),
        (BettingEvent, 'source', {'is_demo': True, 'meeting__venue_id__in': venue_ids}),
        (OfficialDividend, 'source', {'event__is_demo': True, 'event__meeting__venue_id__in': venue_ids}),
        (EventType, 'definition', {'bettingevent__is_demo': True, 'bettingevent__meeting__venue_id__in': venue_ids}),
    ]:
        for record in model.objects.filter(**scope).distinct():
            old = getattr(record, field)
            if old:
                new = old.replace('Development', 'Sample').replace('development', 'sample')
                if new != old:
                    model.objects.filter(pk=record.pk).update(**{field: new})
