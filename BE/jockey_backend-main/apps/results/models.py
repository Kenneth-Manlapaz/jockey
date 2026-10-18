"""Official finishing positions and race results."""
from django.db import models, transaction
from django.utils import timezone

from apps.core.choices import TrackCondition
from apps.core.fields import UnsignedAutoField as IdField


class ResultStatus(models.TextChoices):
    PROVISIONAL = "provisional", "Provisional"
    OFFICIAL = "official", "Official"
    CANCELLED = "cancelled", "Cancelled"
    CORRECTED = "corrected", "Corrected"


class RaceResult(models.Model):
    id = IdField(primary_key=True)
    race = models.OneToOneField("races.Race", models.CASCADE, related_name="result")
    status = models.CharField(max_length=12, choices=ResultStatus.choices, default=ResultStatus.PROVISIONAL)
    winning_time_ms = models.PositiveIntegerField(null=True, blank=True, help_text="1:12.84 = 72840")
    track_condition = models.CharField(max_length=10, choices=TrackCondition.choices, null=True, blank=True)
    weather = models.CharField(max_length=60, null=True, blank=True)
    replay_url = models.URLField(blank=True)
    source = models.CharField(max_length=500, blank=True)
    protest_filed = models.BooleanField(default=False)
    stewards_notes = models.TextField(null=True, blank=True)
    posted_at = models.DateTimeField(null=True, blank=True)
    made_official_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "race_results"

    def __str__(self):
        return f"Result: {self.race} [{self.status}]"

    @transaction.atomic
    def save(self, *args, **kwargs):
        if self.pk:
            old = type(self).objects.select_for_update().filter(pk=self.pk).first()
            if old and old.status in ('official', 'corrected'):
                from apps.racing_info.models import ResultRevision
                from django.core.serializers.json import DjangoJSONEncoder
                import json
                snapshot = {field.name: getattr(old, field.attname) for field in old._meta.fields}
                snapshot['placements'] = list(old.placements.values())
                ResultRevision.objects.create(result=old, snapshot=json.loads(json.dumps(snapshot, cls=DjangoJSONEncoder)))
        super().save(*args, **kwargs)

    @property
    def winning_time_display(self):
        if self.winning_time_ms is None:
            return None
        minutes, rest = divmod(self.winning_time_ms, 60000)
        return f"{minutes}:{rest / 1000:05.2f}"


class RaceResultPlacement(models.Model):
    id = IdField(primary_key=True)
    result = models.ForeignKey(RaceResult, models.CASCADE, related_name="placements")
    entry = models.ForeignKey("races.RaceEntry", models.PROTECT)
    finish_position = models.PositiveSmallIntegerField()
    is_dead_heat = models.BooleanField(default=False)
    is_disqualified = models.BooleanField(default=False)
    intermediate_positions = models.JSONField(default=dict, blank=True)
    participation_snapshot = models.JSONField(default=dict, blank=True, editable=False)
    margin_lengths = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    finish_time_ms = models.PositiveIntegerField(null=True, blank=True)
    final_odds = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "race_result_placements"
        unique_together = [("result", "entry")]
        ordering = ["finish_position"]

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.entry_id and self.result_id and self.entry.race_id != self.result.race_id:
            raise ValidationError('Finishing entry must belong to the result race.')

    @transaction.atomic
    def save(self, *args, **kwargs):
        self.full_clean()
        previous = type(self).objects.filter(pk=self.pk).first() if self.pk else None
        if previous and previous.participation_snapshot:
            self.participation_snapshot = previous.participation_snapshot
        elif not self.participation_snapshot:
            e = self.entry
            self.participation_snapshot = {
                key: {'id': getattr(e, key).pk, 'name': str(getattr(e, key))} if getattr(e, key) else None
                for key in ('horse', 'jockey', 'trainer', 'owner')}
            self.participation_snapshot.update(weight_kg=str(e.weight_kg) if e.weight_kg is not None else None,
                                               gate=e.post_position)
        if self.pk and self.result.status in ('official', 'corrected'):
            from apps.racing_info.models import ResultRevision
            from django.core.serializers.json import DjangoJSONEncoder
            import json
            ResultRevision.objects.create(result=self.result, snapshot=json.loads(json.dumps({
                'placements': list(self.result.placements.values())}, cls=DjangoJSONEncoder)))
        super().save(*args, **kwargs)
