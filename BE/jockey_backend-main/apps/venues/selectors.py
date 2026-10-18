from django.db.models import Prefetch

from .models import Venue, VenueCourse, VenueFacility, VenueTrackSurface


def venues_queryset(*, search=None, active_only=True):
    qs = Venue.objects.select_related("club").prefetch_related(
        Prefetch("surfaces", VenueTrackSurface.objects.all()),
        Prefetch("courses", VenueCourse.objects.all()),
        Prefetch("venue_facilities", VenueFacility.objects.select_related("facility")),
    )
    if active_only:
        qs = qs.filter(is_active=True)
    if search:
        qs = qs.filter(name__icontains=search)
    return qs.order_by("name")
