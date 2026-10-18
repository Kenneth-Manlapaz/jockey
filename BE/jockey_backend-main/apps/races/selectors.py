"""Read queries for races. Keep filter logic here so views stay thin."""
from django.db.models import Prefetch

from .models import Race, RaceEntry, RaceLiveEvent


def race_schedule(*, date=None, status=None, venue=None, featured=False, meeting_date=None):
    qs = Race.objects.select_related("venue", "club")
    date = date or meeting_date
    if date:
        qs = qs.filter(race_date=date)
    if status:
        qs = qs.filter(status=status)
    if venue:
        qs = qs.filter(venue_id=venue)
    if featured:
        qs = qs.filter(is_featured=True)
    return qs.order_by("race_date", "race_number")


def race_with_entries():
    entries = RaceEntry.objects.select_related("horse", "jockey", "trainer", "owner")
    return Race.objects.select_related("venue", "club").prefetch_related(Prefetch("entries", entries))


def entries_queryset(*, race=None, horse=None):
    qs = RaceEntry.objects.select_related("horse", "jockey", "trainer", "owner", "race")
    if race:
        qs = qs.filter(race_id=race)
    if horse:
        qs = qs.filter(horse_id=horse)
    return qs.order_by("race_id", "horse_number")


def live_events_queryset(*, race):    return RaceLiveEvent.objects.filter(race_id=race).order_by("occurred_at", "id")


from apps.races.models import RaceNote  # Make sure RaceNote is imported

def get_race_notes(race_id, is_flagged=None):
    """Fetch all notes for a specific race with optional filtering."""
    qs = RaceNote.objects.filter(race_id=race_id)
    if is_flagged is not None:
        qs = qs.filter(is_flagged=is_flagged)
    return qs.order_by("-created_at")

def get_race_note_by_id(note_id):
    """Fetch a single race note by ID."""
    return RaceNote.objects.filter(id=note_id).first()

