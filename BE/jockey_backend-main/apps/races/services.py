"""Write operations for races and entries."""
from django.utils import timezone

from .models import EntryStatus, Race, RaceEntry, RaceStatus


def recount_entries(race_id):
    """Keep races.entries_count in step. Safe next to the MariaDB triggers: both
    compute the same number, so doing it twice changes nothing."""
    count = RaceEntry.objects.filter(
        race_id=race_id, status__in=[EntryStatus.CONFIRMED, EntryStatus.PENDING]
    ).count()
    Race.objects.filter(pk=race_id).update(entries_count=count)


def mark_ongoing(races):
    """Close betting by moving upcoming races to ongoing. Returns the number changed."""
    return races.filter(status=RaceStatus.UPCOMING).update(status=RaceStatus.ONGOING)


def scratch_entries(entries, reason=""):
    """Withdraw horses from their races and refresh the horse counts."""
    race_ids = set(entries.values_list("race_id", flat=True))
    n = entries.update(status=EntryStatus.SCRATCHED, scratched_at=timezone.now(),
                       scratch_reason=reason or None)
    for race_id in race_ids:
        recount_entries(race_id)
    return n


from django.core.exceptions import ValidationError
from apps.races.models import RaceNote, Race

def create_race_note(*, race_id: int, author: str, content: str, is_flagged: bool = False) -> RaceNote:
    """Create a new race note after validating input and applying business logic."""
    if not Race.objects.filter(id=race_id).exists():
        raise ValidationError("Race does not exist.")
    
    # Business rule: Automatically flag notes containing urgent keywords
    urgent_keywords = ["foul", "inquiry", "disqualified", "injury"]
    if any(keyword in content.lower() for keyword in urgent_keywords):
        is_flagged = True

    note = RaceNote.objects.create(
        race_id=race_id,
        author=author,
        content=content,
        is_flagged=is_flagged
    )
    return note


def update_race_note(*, note: RaceNote, author: str = None, content: str = None, is_flagged: bool = None) -> RaceNote:
    """Update an existing race note."""
    if author is not None:
        note.author = author
    if content is not None:
        note.content = content
        # Re-evaluate business rules on content update
        urgent_keywords = ["foul", "inquiry", "disqualified", "injury"]
        if any(keyword in content.lower() for keyword in urgent_keywords):
            note.is_flagged = True

    if is_flagged is not None:
        note.is_flagged = is_flagged

    note.save()
    return note


def delete_race_note(*, note: RaceNote) -> None:
    """Delete a race note."""
    note.delete()
