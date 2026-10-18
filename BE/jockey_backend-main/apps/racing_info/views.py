from datetime import date
from zoneinfo import ZoneInfo
from django.db.models import Count, Q
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
            'entries_count': r.entries.count(), 'is_demo': r.is_demo}


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
                       'result__race__category', 'entry__horse', 'entry__jockey', 'entry__trainer', 'entry__owner')],
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
    model, field, _ = DIRECTORIES[kind]
    qs = model.objects.filter(**{f'{field}__icontains': request.query_params.get('search', '')}).order_by(field, 'pk')
    from apps.core.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response([participant(p) for p in page])


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def person_detail(request, kind, pk):
    if kind not in DIRECTORIES or kind == 'horses':
        raise ValidationError('Unknown participant type.')
    model, _, relation = DIRECTORIES[kind]
    person = get_object_or_404(model, pk=pk)
    entries = RaceEntry.objects.filter(**{f'{relation}_id': pk})
    qs = history_queryset().filter(**{f'participation_snapshot__{relation}__id': pk})
    horses = {e['horse_id']: e['horse__name'] for e in entries.values('horse_id', 'horse__name')}
    horses.update({p.entry.horse_id: p.entry.horse.name for p in qs})
    return Response({**participant(person), 'kind': kind, 'bio': getattr(person, 'bio', None),
                     'stats': {'recorded_finishes': qs.count(), 'wins': qs.filter(finish_position=1, is_disqualified=False).count(),
                               'top_three': qs.filter(finish_position__lte=3, is_disqualified=False).count()},
                     'basis': 'All recorded official/corrected finishes for this participant; top three includes wins. Disqualifications excluded from wins/placings.',
                     'horses': [{'horse_id': key, 'horse__name': value} for key, value in sorted(horses.items())],
                     'recent': [performance(p) for p in qs.order_by('-result__race__post_time', '-pk')[:20]],
                     'combinations': list(qs.values('entry__horse_id', 'entry__horse__name').annotate(
                         finishes=Count('pk'), wins=Count('pk', filter=Q(finish_position=1, is_disqualified=False))))})


@api_view(['GET'])
@permission_classes([HasRacingAccess])
def results(request):
    qs = Race.objects.filter(result__status__in=PUBLIC_STATUSES).select_related('venue', 'meeting').order_by('-race_date', '-race_number')
    if request.query_params.get('date'):
        qs = qs.filter(race_date=parsed_date(request.query_params['date']))
    from apps.core.pagination import StandardPagination
    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)
    return paginator.get_paginated_response([{**race_summary(r), 'result_status': r.result.status} for r in page])


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
