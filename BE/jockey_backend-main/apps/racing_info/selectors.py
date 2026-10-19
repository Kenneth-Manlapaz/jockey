"""Compute form only from published finishing records; never use cached career claims."""
from datetime import timedelta
from django.db.models import Min
from apps.races.models import RaceEntry
from apps.results.models import RaceResultPlacement
from .exploration import statistic_annotations


def participant(person):
    if person is None:
        return None
    return {'id': person.pk, 'name': getattr(person, 'full_name', None) or person.name}


def history_queryset():
    return RaceResultPlacement.objects.filter(result__status__in=['official', 'corrected']).select_related(
        'result__race__venue', 'result__race__category', 'entry__horse', 'entry__jockey', 'entry__trainer', 'entry__owner').prefetch_related('result__sectionals')


def performance(p):
    r, e = p.result.race, p.entry
    snapshot = p.participation_snapshot
    return {'race_id': r.pk, 'race_number': r.race_number, 'horse_number': e.horse_number, 'horse': snapshot.get('horse', participant(e.horse)),
            'date': r.race_date, 'venue': r.venue.name, 'venue_id': r.venue_id,
            'distance_m': r.distance_m, 'surface': r.surface, 'classification': r.category.name if r.category else None,
            'finish_position': p.finish_position, 'time_ms': p.finish_time_ms,
            'margin_lengths': p.margin_lengths, 'is_dead_heat': p.is_dead_heat, 'is_disqualified': p.is_disqualified,
            'jockey': snapshot.get('jockey', participant(e.jockey)), 'trainer': snapshot.get('trainer', participant(e.trainer)),
            'owner': snapshot.get('owner', participant(e.owner)),
            'weight_kg': snapshot.get('weight_kg', e.weight_kg), 'gate': snapshot.get('gate', e.post_position), 'intermediate_positions': p.intermediate_positions,
            'status': p.result.status, 'is_demo': r.is_demo,
            'sectionals': [{'label': s.label, 'time_ms': s.time_ms, 'sequence': s.sequence}
                          for s in p.result.sectionals.all() if s.entry_id == e.pk]}


def form(horse_id, race=None):
    qs = history_queryset().filter(entry__horse_id=horse_id)
    if race:
        qs = qs.filter(result__race__post_time__lt=race.post_time).exclude(result__race_id=race.pk)
    qs = qs.order_by('-result__race__post_time', '-id')
    comparable = qs.filter(result__race__venue_id=race.venue_id,
                           result__race__distance_m=race.distance_m,
                           result__race__surface=race.surface) if race else qs.none()
    best = comparable.filter(result__race__race_date__gte=race.race_date - timedelta(days=180),
                             is_disqualified=False, finish_time_ms__gt=0).aggregate(value=Min('finish_time_ms'))['value'] if race else None
    stats = qs.aggregate(**statistic_annotations())
    latest = [performance(p) for p in qs[:20]]
    sample_count = comparable.count()
    timed_count = comparable.filter(result__race__race_date__gte=race.race_date - timedelta(days=180),
        is_disqualified=False, finish_time_ms__gt=0).count() if race else 0
    time_reason = ('race_context_required' if race is None else 'no_comparable_records' if not sample_count
                   else 'no_eligible_individual_time' if best is None else None)
    return {'recent': latest[:5],
            'comparable': [performance(p) for p in comparable[:5]],
            'best_time_ms': best, 'best_time_window_days': 180,
            'comparable_count': sample_count, 'timed_comparable_count': timed_count, 'best_time_reason': time_reason,
            'basis': 'Recorded official/corrected finishes; comparable = same venue, surface and distance; before the selected race.' if race else 'All recorded official/corrected finishes. Select a race for comparable form and the 180-day window.',
            'stats': stats,
            'trend': list(reversed(latest))}


def declared_entry(e, race):
    declaration = dict(e.original_declaration)
    if 'connections' not in declaration:
        from apps.horses.models import Horse
        from apps.participants.models import Jockey, Trainer, Owner
        declaration['connections'] = {}
        for key, model in [('horse', Horse), ('jockey', Jockey), ('trainer', Trainer), ('owner', Owner)]:
            identity = declaration.get(f'{key}_id')
            original = model.objects.filter(pk=identity).first() if identity else None
            declaration['connections'][key] = str(original) if original else None
    return {'id': e.pk, 'horse': participant(e.horse), 'horse_number': e.horse_number,
            'gate': e.post_position, 'sex': e.horse.sex,
            'age': race.race_date.year - e.horse.birth_year if e.horse.birth_year else None,
            'jockey': participant(e.jockey), 'trainer': participant(e.trainer), 'owner': participant(e.owner),
            'weight_kg': e.weight_kg, 'morning_odds': e.morning_odds, 'published_odds': e.current_odds,
            'status': e.status, 'scratch_reason': e.scratch_reason, 'scratched_at': e.scratched_at,
            'coupled_group': e.coupled_group, 'original_declaration': declaration,
            'changes': [{'changes': c.changes, 'recorded_at': c.recorded_at} for c in e.changes.all()], 'form': form(e.horse_id, race)}
