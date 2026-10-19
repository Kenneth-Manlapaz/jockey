"""Read-only filters and summaries shared by directories and historical views."""
from datetime import date
from django.db.models import Count, Q, Min, Max
from rest_framework.exceptions import ValidationError
from apps.core.choices import Surface


def integer(params, key, maximum=999999):
    value = params.get(key)
    if not value:
        return None
    try:
        number = int(value)
        if not 1 <= number <= maximum:
            raise ValueError
        return number
    except (TypeError, ValueError):
        raise ValidationError({key: 'Use a positive integer within the supported range.'})


def race_filters(params, qs, prefix=''):
    dates = {}
    for key in ['date', 'from', 'to']:
        if params.get(key):
            try:
                value = date.fromisoformat(params[key])
                if value.isoformat() != params[key]:
                    raise ValueError
            except (ValueError, TypeError):
                raise ValidationError({key: 'Use YYYY-MM-DD.'})
            suffix = {'date': '', 'from': '__gte', 'to': '__lte'}[key]
            dates[key] = value
            qs = qs.filter(**{f'{prefix}race_date{suffix}': value})
    if dates.get('from') and dates.get('to') and dates['from'] > dates['to']:
        raise ValidationError({'to': 'End date must be on or after the start date.'})
    for key, field, maximum in [('year', 'race_date__year', 9998), ('venue', 'venue_id', 4294967295), ('distance', 'distance_m', 100000)]:
        value = integer(params, key, maximum)
        if value is not None:
            qs = qs.filter(**{prefix + field: value})
    if params.get('surface'):
        if params['surface'] not in Surface.values:
            raise ValidationError({'surface': 'Unknown surface.'})
        qs = qs.filter(**{prefix + 'surface': params['surface']})
    return qs


def history_filters(params, qs):
    qs = race_filters(params, qs, 'result__race__')
    if params.get('status'):
        if params['status'] not in ['official', 'corrected']:
            raise ValidationError({'status': 'Choose official or corrected.'})
        qs = qs.filter(result__status=params['status'])
    if params.get('horse'):
        qs = qs.filter(entry__horse__name__icontains=params['horse'])
    return qs


def statistic_annotations():
    valid = Q(is_disqualified=False)
    return {'recorded_finishes': Count('pk'),
            'wins': Count('pk', filter=valid & Q(finish_position=1)),
            'seconds': Count('pk', filter=valid & Q(finish_position=2)),
            'thirds': Count('pk', filter=valid & Q(finish_position=3)),
            'top_three': Count('pk', filter=valid & Q(finish_position__gte=1, finish_position__lte=3))}


def rates(stats):
    count = stats['recorded_finishes']
    return {**stats, 'win_rate': round(stats['wins'] * 100 / count, 2) if count else None,
            'top_three_rate': round(stats['top_three'] * 100 / count, 2) if count else None}


def recorded_stats(qs):
    return rates(qs.aggregate(**statistic_annotations(),
        first_date=Min('result__race__race_date'), last_date=Max('result__race__race_date')))


STATISTICS_BASIS = ('Rates use the filtered official/corrected finishing records, including disqualified records in the denominator. '
                    'Wins and placings exclude disqualifications; dead heats count at their recorded position. '
                    'Top three includes wins. These are recorded finishes, not verified lifetime starts.')
