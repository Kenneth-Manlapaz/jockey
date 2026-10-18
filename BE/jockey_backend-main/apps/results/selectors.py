from .models import RaceResult


def results_queryset(*, date=None, status=None):
    qs = RaceResult.objects.select_related("race", "race__venue", "race__club").prefetch_related(
        "placements__entry__horse", "placements__entry__jockey", "dividends__game_type")
    if date:
        qs = qs.filter(race__race_date=date)
    if status:
        qs = qs.filter(status=status)
    return qs.order_by("race__race_date", "race__race_number")
