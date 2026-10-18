"""Published sporting information, deliberately independent of tickets/settlement."""
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class PublicationStatus(models.TextChoices):
    UNPUBLISHED = 'unpublished', 'Unpublished'
    PROVISIONAL = 'provisional', 'Provisional'
    OFFICIAL = 'official', 'Official'
    CORRECTED = 'corrected', 'Corrected'
    UNAVAILABLE = 'unavailable', 'Unavailable'


PUBLIC_STATUSES = ['provisional', 'official', 'corrected']


class EventType(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=100)
    definition = models.TextField(blank=True)
    rules_source = models.URLField(blank=True)
    is_multi_race = models.BooleanField(default=False)

    def __str__(self):
        return self.code


class BettingEvent(models.Model):
    meeting = models.ForeignKey('meetings.Meeting', models.PROTECT, related_name='events')
    event_type = models.ForeignKey(EventType, models.PROTECT)
    label = models.CharField(max_length=150)
    source = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=16, choices=PublicationStatus.choices, default='unpublished')
    pool_total = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    distribution = models.TextField(blank=True)
    is_demo = models.BooleanField(default=True)

    def __str__(self):
        return self.label

    def clean(self):
        if self.pk and self.legs.exclude(race__meeting_id=self.meeting_id).exists():
            raise ValidationError('An event cannot move away from its published race legs.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class EventLeg(models.Model):
    event = models.ForeignKey(BettingEvent, models.CASCADE, related_name='legs')
    race = models.ForeignKey('races.Race', models.PROTECT, related_name='event_legs')
    sequence = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['sequence']
        constraints = [
            models.UniqueConstraint(fields=['event', 'sequence'], name='unique_event_leg_sequence'),
            models.UniqueConstraint(fields=['event', 'race'], name='unique_event_leg_race'),
            models.CheckConstraint(condition=models.Q(sequence__gte=1), name='positive_event_leg'),
        ]

    def clean(self):
        if self.event_id and self.race_id and self.event.meeting_id != self.race.meeting_id:
            raise ValidationError('All event legs must belong to the event meeting.')
        if self.event_id and not self.event.event_type.is_multi_race:
            if self.sequence != 1 or type(self).objects.filter(event_id=self.event_id).exclude(pk=self.pk).exists():
                raise ValidationError('A single-race event has exactly one leg, numbered 1.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class OfficialDividend(models.Model):
    event = models.ForeignKey(BettingEvent, models.PROTECT, related_name='dividends')
    combination = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=16, decimal_places=2, null=True, blank=True)
    unit_stake = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='PHP')
    status = models.CharField(max_length=16, choices=PublicationStatus.choices, default='unpublished')
    source = models.CharField(max_length=500, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    supersedes = models.OneToOneField('self', models.PROTECT, null=True, blank=True, related_name='correction')
    correction_reason = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__isnull=True) | models.Q(amount__gte=0), name='nonnegative_published_dividend'),
            models.CheckConstraint(condition=models.Q(unit_stake__isnull=True) | models.Q(unit_stake__gt=0), name='positive_dividend_unit'),
        ]

    def clean(self):
        if self.status in PUBLIC_STATUSES and not self.source:
            raise ValidationError('Published dividends require a source.')
        if self.status in ('official', 'corrected') and (self.amount is None or not self.published_at):
            raise ValidationError('Official dividends require an amount and publication time.')
        if self.supersedes_id:
            if self.supersedes_id == self.pk or self.supersedes.event_id != self.event_id:
                raise ValidationError('A correction must replace a different dividend in the same event.')
            if self.status != 'corrected' or not self.correction_reason:
                raise ValidationError('A correction requires corrected status and a reason.')

    def save(self, *args, **kwargs):
        if self.pk:
            old = type(self).objects.get(pk=self.pk)
            if old.status in PUBLIC_STATUSES:
                raise ValidationError('Published dividends are immutable; create a correction referencing supersedes.')
        self.full_clean()
        return super().save(*args, **kwargs)


class Announcement(models.Model):
    meeting = models.ForeignKey('meetings.Meeting', models.PROTECT, related_name='announcements')
    race = models.ForeignKey('races.Race', models.PROTECT, null=True, blank=True, related_name='announcements')
    title = models.CharField(max_length=150)
    content = models.TextField()
    source = models.CharField(max_length=500, blank=True)
    is_public = models.BooleanField(default=False)
    published_at = models.DateTimeField(default=timezone.now)

    def clean(self):
        if self.race_id and self.race.meeting_id != self.meeting_id:
            raise ValidationError('Announcement race must belong to its meeting.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class EntryChange(models.Model):
    entry = models.ForeignKey('races.RaceEntry', models.PROTECT, related_name='changes')
    changes = models.JSONField()
    recorded_at = models.DateTimeField(default=timezone.now)


class ResultRevision(models.Model):
    result = models.ForeignKey('results.RaceResult', models.PROTECT, related_name='revisions')
    snapshot = models.JSONField()
    recorded_at = models.DateTimeField(default=timezone.now)


class SectionalTime(models.Model):
    result = models.ForeignKey('results.RaceResult', models.CASCADE, related_name='sectionals')
    entry = models.ForeignKey('races.RaceEntry', models.PROTECT, null=True, blank=True)
    label = models.CharField(max_length=60)
    sequence = models.PositiveSmallIntegerField()
    time_ms = models.PositiveIntegerField()

    class Meta:
        ordering = ['sequence']

    def clean(self):
        if self.entry_id and self.entry.race_id != self.result.race_id:
            raise ValidationError('Sectional entry must belong to this race.')

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
