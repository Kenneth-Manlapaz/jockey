"""Favorites, notifications and push devices."""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class NotificationType(models.TextChoices):
    RACE_REMINDER = "race_reminder", "Race reminder"
    RACE_STARTED = "race_started", "Race started"
    RESULT_POSTED = "result_posted", "Result posted"
    BET_SETTLED = "bet_settled", "Bet settled"
    SYSTEM = "system", "System"
    PROMO = "promo", "Promo"


class FavoriteTarget(models.TextChoices):
    HORSE = "horse", "Horse"
    JOCKEY = "jockey", "Jockey"
    TRAINER = "trainer", "Trainer"
    RACE = "race", "Race"
    VENUE = "venue", "Venue"


class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name="favorites")
    target_type = models.CharField(max_length=10, choices=FavoriteTarget.choices)
    horse = models.ForeignKey("horses.Horse", models.CASCADE, null=True, blank=True)
    jockey = models.ForeignKey("participants.Jockey", models.CASCADE, null=True, blank=True)
    trainer = models.ForeignKey("participants.Trainer", models.CASCADE, null=True, blank=True)
    race = models.ForeignKey("races.Race", models.CASCADE, null=True, blank=True)
    venue = models.ForeignKey("venues.Venue", models.CASCADE, null=True, blank=True)
    notify_on_race = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "favorites"
        # NULLs never collide in a unique key, so each of these only
        # blocks duplicates of the target type that is actually filled in.
        unique_together = [
            ("user", "horse"), ("user", "jockey"), ("user", "trainer"),
            ("user", "race"), ("user", "venue"),
        ]

    def clean(self):
        targets = {
            "horse": self.horse_id, "jockey": self.jockey_id, "trainer": self.trainer_id,
            "race": self.race_id, "venue": self.venue_id,
        }
        filled = [name for name, value in targets.items() if value]
        if filled != [self.target_type]:
            raise ValidationError("Fill in exactly one target, and it must match target_type.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=15, choices=NotificationType.choices)
    title = models.CharField(max_length=150)
    body = models.TextField(null=True, blank=True)
    race = models.ForeignKey("races.Race", models.SET_NULL, null=True, blank=True)
    bet = models.ForeignKey("betting.Bet", models.SET_NULL, null=True, blank=True)
    deep_link = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at", "-id"]


class PushDevice(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name="push_devices")
    platform = models.CharField(max_length=20)
    push_token = models.CharField(max_length=512, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "push_devices"
