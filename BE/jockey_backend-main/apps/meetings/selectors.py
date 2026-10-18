"""A *meeting* is a venue's race day. The schema has no meetings table, so meetings
are derived from races (group by venue and date): no extra table to keep in sync."""
from django.db.models import Count, Min

from apps.races.models import Race


def list_meetings(*, date=None, venue=None):
    qs = Race.objects.all()
    if date:
        qs = qs.filter(race_date=date)
    if venue:
        qs = qs.filter(venue_id=venue)
    return (qs.values("venue_id", "venue__name", "race_date")
              .annotate(race_count=Count("id"), first_post_time=Min("post_time"))
              .order_by("race_date", "venue__name"))
