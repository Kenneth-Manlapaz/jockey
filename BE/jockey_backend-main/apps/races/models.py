"""Races, race entries (a horse running in a race), odds history, live events."""
from django.db import models, transaction
from django.utils import timezone

from apps.core.choices import Surface, TrackCondition
from apps.core.fields import UnsignedAutoField as IdField


class RaceStatus(models.TextChoices):
    UPCOMING = "upcoming", "Upcoming"
    ONGOING = "ongoing", "Ongoing"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"
    POSTPONED = "postponed", "Postponed"


class EntryStatus(models.TextChoices):
    CONFIRMED = "confirmed", "Confirmed"
    PENDING = "pending", "Pending"
    SCRATCHED = "scratched", "Scratched"
    WITHDRAWN = "withdrawn", "Withdrawn"
    RESERVE = "reserve", "Reserve"


class RaceCategory(models.Model):
    id = IdField(primary_key=True)
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=80)

    class Meta:
        db_table = "race_categories"
        verbose_name_plural = "race categories"

    def __str__(self):
        return self.name


class Race(models.Model):
    id = IdField(primary_key=True)
    meeting = models.ForeignKey('meetings.Meeting', models.PROTECT, related_name='races')
    venue = models.ForeignKey("venues.Venue", models.PROTECT)
    club = models.ForeignKey("venues.RacingClub", models.SET_NULL, null=True, blank=True)
    course = models.ForeignKey("venues.VenueCourse", models.SET_NULL, null=True, blank=True)
    category = models.ForeignKey(RaceCategory, models.SET_NULL, null=True, blank=True)
    race_number = models.PositiveSmallIntegerField()
    name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    race_date = models.DateField()
    post_time = models.DateTimeField()
    distance_m = models.PositiveIntegerField()
    surface = models.CharField(max_length=10, choices=Surface.choices)
    track_condition = models.CharField(max_length=10, choices=TrackCondition.choices, null=True, blank=True)
    age_restriction = models.CharField(max_length=60, null=True, blank=True)
    status = models.CharField(max_length=10, choices=RaceStatus.choices, default=RaceStatus.UPCOMING)
    max_entries = models.PositiveSmallIntegerField(null=True, blank=True)
    entries_count = models.PositiveSmallIntegerField(default=0, editable=False)
    purse_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    purse_currency = models.CharField(max_length=3, default="PHP")
    hero_image_url = models.CharField(max_length=500, null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_live = models.BooleanField(default=False)
    live_stream_url = models.CharField(max_length=500, null=True, blank=True)
    betting_opens_at = models.DateTimeField(null=True, blank=True)
    betting_closes_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    is_demo = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "races"
        unique_together = [("venue", "race_date", "race_number")]
        ordering = ["race_date", "race_number"]
        indexes = [models.Index(fields=["race_date", "status"], name="idx_races_date_status")]

    def __str__(self):
        return f"R{self.race_number} {self.name} ({self.race_date})"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.meeting_id and (self.meeting.venue_id != self.venue_id or self.meeting.race_date != self.race_date):
            raise ValidationError('Race venue and date must match its meeting.')

    @transaction.atomic
    def save(self, *args, **kwargs):
        from apps.meetings.models import Meeting
        from django.core.exceptions import ValidationError
        if self.meeting_id:
            if self.meeting.venue_id != self.venue_id or self.meeting.race_date != self.race_date:
                raise ValidationError('Race venue and date must match its meeting.')
        else:
            self.meeting, _ = Meeting.objects.get_or_create(
                venue_id=self.venue_id, race_date=self.race_date, defaults={'is_demo': self.is_demo})
        if kwargs.get('update_fields') is not None:
            kwargs['update_fields'] = set(kwargs['update_fields']) | {'meeting'}
        super().save(*args, **kwargs)

    def is_betting_open(self, now=None):
        now = now or timezone.now()
        if self.status != RaceStatus.UPCOMING:
            return False
        if self.betting_opens_at and now < self.betting_opens_at:
            return False
        if self.betting_closes_at and now > self.betting_closes_at:
            return False
        return True


class RaceEntry(models.Model):
    id = IdField(primary_key=True)
    coupled_group = models.CharField(max_length=30, blank=True)
    original_declaration = models.JSONField(default=dict, blank=True, editable=False)
    race = models.ForeignKey(Race, models.CASCADE, related_name="entries")
    horse = models.ForeignKey("horses.Horse", models.PROTECT, related_name="entries")
    jockey = models.ForeignKey("participants.Jockey", models.SET_NULL, null=True, blank=True)
    trainer = models.ForeignKey("participants.Trainer", models.SET_NULL, null=True, blank=True)
    owner = models.ForeignKey("participants.Owner", models.SET_NULL, null=True, blank=True)
    horse_number = models.PositiveSmallIntegerField()
    post_position = models.PositiveSmallIntegerField(null=True, blank=True)
    badge_color = models.CharField(max_length=7, null=True, blank=True, help_text="Hex colour such as #C9A24D")
    weight_kg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    handicap_rating = models.SmallIntegerField(null=True, blank=True)
    morning_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    current_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=EntryStatus.choices, default=EntryStatus.CONFIRMED)
    scratched_at = models.DateTimeField(null=True, blank=True)
    scratch_reason = models.CharField(max_length=255, null=True, blank=True)
    silks_description = models.CharField(max_length=255, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "race_entries"
        unique_together = [("race", "horse_number"), ("race", "horse")]
        ordering = ["race_id", "horse_number"]
        verbose_name_plural = "race entries"

    def __str__(self):
        return f"#{self.horse_number} {self.horse.name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        previous = type(self).objects.filter(pk=self.pk).first() if self.pk else None
        if previous and (previous.horse_id != self.horse_id or previous.race_id != self.race_id):
            raise ValidationError('Race entry identity is immutable. Add the correct declaration separately.')

    @transaction.atomic
    def save(self, *args, **kwargs):
        # An immutable declaration snapshot survives scratches and rider changes.
        previous = type(self).objects.select_for_update().filter(pk=self.pk).first() if self.pk else None
        if previous and (previous.horse_id != self.horse_id or previous.race_id != self.race_id):
            from django.core.exceptions import ValidationError
            raise ValidationError('Race entry identity is immutable. Add the correct declaration separately.')
        if previous and previous.original_declaration:
            self.original_declaration = previous.original_declaration
        elif not self.original_declaration:
            self.original_declaration = {key: str(getattr(self, key)) if getattr(self, key) is not None else None
                for key in ('horse_id', 'jockey_id', 'trainer_id', 'owner_id', 'horse_number',
                            'post_position', 'weight_kg', 'status', 'coupled_group')}
            self.original_declaration['connections'] = {
                key: str(getattr(self, key)) if getattr(self, key) else None
                for key in ('horse', 'jockey', 'trainer', 'owner')}
        super().save(*args, **kwargs)
        if previous:
            changed = {key: {'before': str(getattr(previous, key)), 'after': str(getattr(self, key))}
                for key in ('jockey_id', 'trainer_id', 'owner_id', 'weight_kg', 'post_position',
                            'status', 'scratch_reason', 'coupled_group')
                if getattr(previous, key) != getattr(self, key)}
            if changed:
                from apps.racing_info.models import EntryChange
                EntryChange.objects.create(entry=self, changes=changed)


class EntryOddsHistory(models.Model):
    entry = models.ForeignKey(RaceEntry, models.CASCADE, related_name="odds_history")
    odds = models.DecimalField(max_digits=6, decimal_places=2)
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "entry_odds_history"
        verbose_name_plural = "entry odds history"


class RaceLiveEvent(models.Model):
    race = models.ForeignKey(Race, models.CASCADE, related_name="live_events")
    event_type = models.CharField(max_length=40)
    commentary = models.TextField(null=True, blank=True)
    positions = models.JSONField(null=True, blank=True)
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "race_live_events"

class RaceNote(models.Model):
    race = models.ForeignKey("races.Race", on_delete=models.CASCADE, related_name="notes")
    author = models.CharField(max_length=100)
    content = models.TextField()
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Note by {self.author} for Race {self.race_id}"


class TipSheet(models.Model):
    """A dated collection of racing tips from one published source."""
    title = models.CharField(max_length=150)
    race_date = models.DateField(db_index=True)
    compiler = models.CharField(max_length=120, blank=True)
    source = models.CharField(max_length=255, blank=True)
    disclaimer = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-race_date", "title"]

    def __str__(self):
        return f"{self.title} ({self.race_date})"


class RaceTip(models.Model):
    """One tipster's selections for one race. Keep source text for ambiguous numbers."""
    sheet = models.ForeignKey(TipSheet, on_delete=models.CASCADE, related_name="tips")
    race = models.ForeignKey(Race, on_delete=models.CASCADE, related_name="tips", null=True, blank=True)
    race_number = models.PositiveSmallIntegerField()
    tipster = models.CharField(max_length=120)
    raw_selection = models.CharField(
        max_length=255,
        help_text="As published, e.g. '7,6' or '76'. Preserve unclear number formatting.",
    )
    horse_numbers = models.JSONField(
        default=list,
        blank=True,
        help_text="Optional parsed horse numbers, e.g. [7, 6]. Leave empty if ambiguous.",
    )
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["race_number", "tipster"]
        constraints = [models.UniqueConstraint(fields=["sheet", "race_number", "tipster"], name="uq_race_tipster_sheet_race")]

    def __str__(self):
        return f"{self.tipster}: R{self.race_number} {self.raw_selection}"
