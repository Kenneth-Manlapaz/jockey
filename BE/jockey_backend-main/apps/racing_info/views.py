from datetime import date
from zoneinfo import ZoneInfo
from django.db.models import Count, Q, F, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from apps.meetings.models import Meeting
from apps.races.models import Race, RaceEntry
from apps.horses.models import Horse
from apps.participants.models import Jockey, Trainer, Owner
from .models import BettingEvent, PUBLIC_STATUSES
from .selectors import participant, history_queryset, performance, form, declared_entry
from .exploration import integer, race_filters, history_filters, recorded_stats, statistic_annotations, rates, STATISTICS_BASIS
from apps.horses.models import Sex
from apps.venues.models import Venue
from apps.core.choices import Surface
from apps.results.models import RaceResultPlacement
from apps.subscriptions.permissions import HasRacingAccess
from apps.subscriptions.services import active_subscription


def parsed_date(value):
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        raise ValidationError({'date': 'Use a valid YYYY-MM-DD date.'})


def race_summary(r):
    return {'id': r.pk, 'meeting_id': r.meeting_id, 'race_number': r.race_number, 'name': r.name,
            'race_date': r.race_date, 'venue': r.venue.name, 'post_time': r.post_time,
            'timezone': r.meeting.timezone if r.meeting_id else 'Asia/Manila',
            'distance_m': r.distance_m, 'surface': r.surface, 'status': r.status,
            'entries_count': r._declared_count if hasattr(r, '_declared_count') else r.entries.count(), 'is_demo': r.is_demo}


def meeting_summary(m):
    return {'id': m.pk, 'name': m.name or m.venue.name, 'venue_id': m.venue_id, 'venue': m.venue.name,
            'date': m.race_date, 'timezone': m.timezone, 'status': m.status,
            'source': m.source, 'is_demo': m.is_demo, 'race_count': m.races.count()}


def event_data(event):
    return {'id': event.pk, 'meeting_id': event.meeting_id, 'label': event.label,
            'type': event.event_type.code, 'definition': event.event_type.definition or None,
            'rules_source': event.event_type.rules_source or None, 'is_multi_race': event.event_type.is_multi_race,
            'status': event.status, 'is_demo': event.is_demo, 'source': event.source,
            'pool_total': event.pool_total, 'distribution': event.distribution or None,
            'legs': [{'sequence': leg.sequence, 'race_id': leg.race_id, 'race_number': leg.race.race_number,
                      'race_name': leg.race.name} for leg in event.legs.select_related('race')],
            'dividends': list(event.dividends.filter(status__in=PUBLIC_STATUSES).values(
                'id', 'combination', 'amount', 'unit_stake', 'currency', 'status', 'source', 'published_at',
                'supersedes_id', 'correction_reason'))}


@api_view(['GET'])
@permission_classes([AllowAny])
def calendar(request):
    today = timezone.localdate(timezone=ZoneInfo('Asia/Manila'))
    try:
        year = int(request.query_params.get('year', today.year))
        month = int(request.query_params.get('month', today.month))
        if not 1 <= year <= 9998:
            raise ValueError('Unsupported calendar year')
        start = date(year, month, 1)
    except (ValueError, TypeError):
        raise ValidationError({'month': 'Use year 1–9998 and month 1–12.'})
    selected = parsed_date(request.query_params.get('date', today.isoformat()))
    all_dates = Meeting.objects.filter(races__isnull=False).order_by().values_list('race_date', flat=True).distinct()
    days = Meeting.objects.filter(race_date__year=year, race_date__month=month, races__isnull=False).values('race_date').annotate(
        meeting_count=Count('id', distinct=True), race_count=Count('races')).order_by('race_date')
    return Response({'year': start.year, 'month': start.month, 'today': today, 'selected_date': selected,
                     'timezone': 'Asia/Manila', 'days': list(days),
                     'previous_date': all_dates.filter(race_date__lt=selected).order_by('-race_date').first(),
                     'next_date': all_dates.filter(race_date__gt=selected).order_by('race_date').first(),
                     'meetings': [meeting_summary(m) for m in Meeting.objects.filter(race_date=selected).select_related('venue')]})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def meeting_detail(request, pk):
    m = get_object_or_404(Meeting.objects.select_related('venue'), pk=pk)
    return Response({**meeting_summary(m), 'races': [race_summary(r) for r in m.races.select_related('venue', 'meeting').order_by('race_number')],
                     'announcements': list(m.announcements.filter(is_public=True, published_at__lte=timezone.now()).values('race_id', 'title', 'content', 'source')),
                     'events': [event_data(e) for e in m.events.filter(status__in=PUBLIC_STATUSES).select_related('event_type')]})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def program(request, pk):
    r = get_object_or_404(Race.objects.select_related('venue', 'meeting', 'category'), pk=pk)
    entries = r.entries.select_related('horse', 'jockey', 'trainer', 'owner').prefetch_related('changes')
    result = getattr(r, 'result', None)
    published = result and result.status in PUBLIC_STATUSES
    return Response({**race_summary(r), 'conditions': r.description, 'classification': r.category.name if r.category else None,
        'age_restriction': r.age_restriction, 'track_condition': r.track_condition,
        'purse_amount': r.purse_amount, 'purse_currency': r.purse_currency,
        'entries': [declared_entry(e, r) for e in entries],
        'tips': list(r.tips.values('tipster', 'raw_selection', 'horse_numbers', 'note', 'sheet__source')),
        'announcements': list(r.announcements.filter(is_public=True, published_at__lte=timezone.now()).values('title', 'content', 'source')),
        'events': [event_data(e) for e in BettingEvent.objects.filter(legs__race=r, status__in=PUBLIC_STATUSES).select_related('event_type')],
        'result': {'status': result.status, 'winning_time_ms': result.winning_time_ms,
                   'source': result.source or None, 'replay_url': result.replay_url or None,
                   'decision': result.stewards_notes, 'protest_filed': result.protest_filed,
                   'published_at': result.posted_at, 'official_at': result.made_official_at,
                   'placements': [performance(p) for p in result.placements.select_related('result__race__venue',
                       'result__race__category', 'entry__horse', 'entry__jockey', 'entry__trainer', 'entry__owner').prefetch_related('result__sectionals').order_by('finish_position', 'entry__horse_number')],
                   'sectionals': list(result.sectionals.values('entry_id', 'label', 'sequence', 'time_ms')),
                   'revision_count': result.revisions.count()} if published else None})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def horse_detail(request, pk):
    h = get_object_or_404(Horse.objects.select_related('owner', 'trainer'), pk=pk)
    r = None
    if request.query_params.get('race'):
        try:
            race_id = int(request.query_params['race'])
        except (ValueError, TypeError):
            raise ValidationError({'race': 'Use a numeric race identifier.'})
        r = get_object_or_404(Race, pk=race_id)
    return Response({'id': h.pk, 'name': h.name, 'sex': h.sex, 'birth_year': h.birth_year, 'color': h.color,
                     'sire': h.sire, 'dam': h.dam, 'bio': h.bio, 'is_demo': h.is_fictional,
                     'current_owner': participant(h.owner), 'current_trainer': participant(h.trainer),
                     'form': form(h.pk, r)})


DIRECTORIES = {'horses': (Horse, 'name', 'horse'), 'jockeys': (Jockey, 'full_name', 'jockey'),
               'trainers': (Trainer, 'full_name', 'trainer'), 'owners': (Owner, 'name', 'owner')}


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def directory(request, kind):
    if kind not in DIRECTORIES:
        raise ValidationError('Unknown directory.')
    model, field, relation = DIRECTORIES[kind]
    params = request.query_params
    qs = model.objects.filter(**{f'{field}__icontains': params.get('search', '')})
    sorts = {'name': field, '-name': '-' + field}
    if kind == 'horses':
        qs = qs.select_related('owner', 'trainer')
        if params.get('sex'):
            if params['sex'] not in Sex.values:
                raise ValidationError({'sex': 'Unknown sex.'})
            qs = qs.filter(sex=params['sex'])
        for key, lookup in [('trainer', 'trainer__full_name'), ('owner', 'owner__name'), ('color', 'color')]:
            if params.get(key):
                qs = qs.filter(**{lookup + '__icontains': params[key]})
        birth_year = integer(params, 'birth_year', 9998)
        if birth_year:
            qs = qs.filter(birth_year=birth_year)
        sorts.update({'birth_year': 'birth_year', '-birth_year': '-birth_year', 'trainer': 'trainer__full_name', 'owner': 'owner__name'})
    sort = params.get('sort', 'name')
    if sort not in sorts:
        raise ValidationError({'sort': 'Unsupported sort order.'})
    ordering = sorts[sort]
    qs = qs.order_by(F(ordering.lstrip('-')).desc(nulls_last=True) if ordering.startswith('-') else F(ordering).asc(nulls_last=True), 'pk')
    from apps.core.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    if kind == 'horses':
        rows = [{**participant(h), 'sex': h.sex, 'birth_year': h.birth_year, 'color': h.color,
                 'country_of_origin': h.country_of_origin, 'current_trainer': participant(h.trainer),
                 'current_owner': participant(h.owner)} for h in page]
    else:
        key = f'participation_snapshot__{relation}__id'
        history = history_filters(params, history_queryset()).filter(**{key + '__in': [p.pk for p in page]})
        grouped = {int(row[key]): rates({k: row[k] for k in statistic_annotations()})
                   for row in history.order_by().values(key).annotate(**statistic_annotations())}
        empty = rates({k: 0 for k in statistic_annotations()})
        rows = [{**participant(p), 'stats': grouped.get(p.pk, empty)} for p in page]
    return paginator.get_paginated_response(rows)


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def person_detail(request, kind, pk):
    if kind not in DIRECTORIES or kind == 'horses':
        raise ValidationError('Unknown participant type.')
    model, _, relation = DIRECTORIES[kind]
    person = get_object_or_404(model, pk=pk)
    entries = RaceEntry.objects.filter(**{f'{relation}_id': pk})
    qs = history_filters(request.query_params, history_queryset().filter(**{f'participation_snapshot__{relation}__id': pk}))
    historical_ids = qs.order_by().values_list('participation_snapshot__horse__id', flat=True).distinct()
    ids = set(entries.order_by().values_list('horse_id', flat=True).distinct()) | {int(i) for i in historical_ids if i is not None}
    horses = Horse.objects.filter(pk__in=ids).order_by('name', 'pk')
    current = Horse.objects.filter(**{f'{relation}_id': pk}).order_by('name', 'pk') if relation in ['owner', 'trainer'] else Horse.objects.none()
    groups = qs.order_by().values('participation_snapshot__horse__id', 'participation_snapshot__horse__name').annotate(
        finishes=Count('pk'), wins=Count('pk', filter=Q(finish_position=1, is_disqualified=False))).order_by('-wins', 'participation_snapshot__horse__name', 'participation_snapshot__horse__id')
    return Response({**participant(person), 'kind': kind, 'bio': getattr(person, 'bio', None),
                     'stats': recorded_stats(qs), 'basis': STATISTICS_BASIS,
                     'horses_count': horses.count(), 'horses': [{'horse_id': h.pk, 'horse__name': h.name} for h in horses[:50]],
                     'current_horses_count': current.count(), 'current_horses': [participant(h) for h in current[:50]],
                     'recent': [performance(p) for p in qs.order_by('-result__race__post_time', '-pk')[:20]],
                     'combinations_count': groups.count(),
                     'combinations': [{'entry__horse_id': row['participation_snapshot__horse__id'],
                         'entry__horse__name': row['participation_snapshot__horse__name'], 'finishes': row['finishes'], 'wins': row['wins']} for row in groups[:20]]})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def results(request):
    params = request.query_params
    qs = race_filters(params, Race.objects.filter(result__status__in=PUBLIC_STATUSES)).select_related('venue', 'meeting', 'result')
    if params.get('status'):
        if params['status'] not in PUBLIC_STATUSES:
            raise ValidationError({'status': 'Unknown publication status.'})
        qs = qs.filter(result__status=params['status'])
    qs = qs.annotate(_declared_count=Count('entries', distinct=True)).prefetch_related(
        Prefetch('result__placements', queryset=RaceResultPlacement.objects.select_related('entry__horse').order_by('finish_position', 'entry__horse_number'))).order_by('-race_date', 'venue__name', 'venue_id', '-race_number', '-pk')
    from apps.core.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    rows = []
    for race in page:
        podium = [{'finish_position': p.finish_position, 'horse_number': p.entry.horse_number,
                   'horse': p.participation_snapshot.get('horse') or participant(p.entry.horse), 'is_dead_heat': p.is_dead_heat}
                  for p in race.result.placements.all() if 1 <= p.finish_position <= 3 and not p.is_disqualified]
        rows.append({**race_summary(race), 'result_status': race.result.status,
                     'winning_time_ms': race.result.winning_time_ms, 'podium': podium,
                     'winners': [p for p in podium if p['finish_position'] == 1], 'published_at': race.result.posted_at})
    return paginator.get_paginated_response(rows)


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def event_detail(request, pk):
    return Response(event_data(get_object_or_404(BettingEvent, pk=pk, status__in=PUBLIC_STATUSES)))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def access(request):
    # No paid entitlement is fabricated. A future subscription service owns this decision.
    return Response({'favorites': True, 'premium_analytics': active_subscription(request.user) is not None,
                     'premium_status': 'active' if active_subscription(request.user) else 'subscription_required'})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def filter_options(request):
    return Response({'venues': list(Venue.objects.order_by('name', 'pk').values('id', 'name')),
                     'surfaces': list(Surface.values), 'sexes': list(Sex.values)})


def history_response(request, qs):
    qs = history_filters(request.query_params, qs)
    sort = request.query_params.get('sort', '-date')
    orders = {'-date': ('-result__race__post_time', '-pk'), 'date': ('result__race__post_time', 'pk'),
              'finish': ('is_disqualified', 'finish_position', '-result__race__post_time', '-pk')}
    if sort not in orders:
        raise ValidationError({'sort': 'Choose newest, oldest or finish order.'})
    from apps.core.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs.order_by(*orders[sort]), request)
    response = paginator.get_paginated_response([performance(p) for p in page])
    response.data.update(stats=recorded_stats(qs), basis=STATISTICS_BASIS)
    return response


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def horse_history(request, pk):
    get_object_or_404(Horse, pk=pk)
    qs = history_queryset().filter(entry__horse_id=pk)
    context = integer(request.query_params, 'race', 4294967295)
    if context:
        race = get_object_or_404(Race, pk=context)
        qs = qs.filter(result__race__post_time__lt=race.post_time)
    return history_response(request, qs)


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def person_history(request, kind, pk):
    if kind not in DIRECTORIES or kind == 'horses':
        raise ValidationError('Unknown participant type.')
    model, _, relation = DIRECTORIES[kind]
    get_object_or_404(model, pk=pk)
    return history_response(request, history_queryset().filter(**{f'participation_snapshot__{relation}__id': pk}))
