"""Write operations for race results (placements and the official stamp)."""
from django.db import transaction
from django.utils import timezone

from apps.races.models import RaceEntry, RaceStatus

from .models import RaceResult, RaceResultPlacement, ResultStatus


class ResultError(Exception):
    """A result could not be saved. The message is safe to show."""


@transaction.atomic
def publish_placements(*, race, finishing_order, winning_time_ms=None, track_condition=None, final_odds=None):
    """Create or replace a provisional result with its finishing order.

    finishing_order: RaceEntry ids, first place first (dead heats: edit in the admin).
    """
    entries = {e.pk: e for e in RaceEntry.objects.filter(race=race, pk__in=finishing_order)}
    if len(entries) != len(finishing_order):
        raise ResultError("Every horse in the finishing order must be in this race.")

    result, _ = RaceResult.objects.update_or_create(
        race=race,
        defaults={"status": ResultStatus.PROVISIONAL, "winning_time_ms": winning_time_ms,
                  "track_condition": track_condition or race.track_condition,
                  "posted_at": timezone.now()},
    )
    result.placements.all().delete()
    RaceResultPlacement.objects.bulk_create([
        RaceResultPlacement(
            result=result, entry=entries[eid], finish_position=pos,
            final_odds=(final_odds or {}).get(eid, entries[eid].current_odds),
        )
        for pos, eid in enumerate(finishing_order, start=1)
    ])
    return result


@transaction.atomic
def make_result_official(result):
    """Stamp the result official and complete the race."""
    now = timezone.now()
    result.status = ResultStatus.OFFICIAL
    result.made_official_at = now
    result.save()
    race = result.race
    race.status = RaceStatus.COMPLETED
    race.is_live = False
    race.finished_at = race.finished_at or now
    race.save()
    return result
