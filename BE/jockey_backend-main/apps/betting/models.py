"""Games, simulated bets (demo tickets), dividends and pools. DEMO ONLY: no real money."""
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.fields import UnsignedAutoField as IdField


class BetStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    WON = "won", "Won"
    LOST = "lost", "Lost"
    VOID = "void", "Void"


class Difficulty(models.TextChoices):
    BEGINNER = "beginner", "Beginner"
    INTERMEDIATE = "intermediate", "Intermediate"
    ADVANCED = "advanced", "Advanced"


class GameType(models.Model):
    id = IdField(primary_key=True)
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=60)
    short_description = models.CharField(max_length=255)
    full_description = models.TextField(null=True, blank=True)
    selections_required = models.PositiveSmallIntegerField()
    is_ordered = models.BooleanField()
    max_finishing_positions = models.PositiveSmallIntegerField(default=1)
    sort_order = models.PositiveSmallIntegerField(default=0)
    icon = models.CharField(max_length=50, null=True, blank=True)
    min_wager = models.DecimalField(max_digits=12, decimal_places=2, default=20)
    max_wager = models.DecimalField(max_digits=12, decimal_places=2, default=10000)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "game_types"
        ordering = ["sort_order"]

    def __str__(self):
        return self.name


class RaceGame(models.Model):
    """Which games are open on a race. Composite primary key (race_id, game_type_id)."""
    pk = models.CompositePrimaryKey("race_id", "game_type_id")
    race = models.ForeignKey("races.Race", models.CASCADE, related_name="race_games")
    game_type = models.ForeignKey(GameType, models.PROTECT, related_name="race_games")
    is_open = models.BooleanField(default=True)

    class Meta:
        db_table = "race_games"


class WagerPreset(models.Model):
    id = IdField(primary_key=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, unique=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "wager_presets"
        ordering = ["sort_order"]

    def __str__(self):
        return f"PHP {self.amount}"


class GuideArticle(models.Model):
    id = IdField(primary_key=True)
    game_type = models.ForeignKey(GameType, models.SET_NULL, null=True, blank=True)
    slug = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)
    summary = models.CharField(max_length=300, null=True, blank=True)
    body_markdown = models.TextField()
    difficulty = models.CharField(max_length=15, choices=Difficulty.choices, default=Difficulty.BEGINNER)
    sort_order = models.SmallIntegerField(default=0)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guide_articles"

    def __str__(self):
        return self.title


class RaceDividend(models.Model):
    id = IdField(primary_key=True)
    result = models.ForeignKey("results.RaceResult", models.CASCADE, related_name="dividends")
    game_type = models.ForeignKey(GameType, models.PROTECT)
    combination = models.CharField(max_length=30, help_text="Horse numbers, e.g. 1-2 or 1-2-3")
    dividend_amount = models.DecimalField(max_digits=12, decimal_places=2)
    unit_stake = models.DecimalField(max_digits=8, decimal_places=2, default=10)

    class Meta:
        db_table = "race_dividends"
        unique_together = [("result", "game_type", "combination")]

    def __str__(self):
        return f"{self.game_type.code} {self.combination} = {self.dividend_amount}"


class RacePool(models.Model):
    id = IdField(primary_key=True)
    race = models.ForeignKey("races.Race", models.CASCADE, related_name="pools")
    game_type = models.ForeignKey(GameType, models.PROTECT)
    total_pool = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    takeout_pct = models.DecimalField(max_digits=4, decimal_places=2, default=15)
    is_demo = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "race_pools"
        unique_together = [("race", "game_type")]


class TicketCounter(models.Model):
    counter_date = models.DateField(primary_key=True)
    last_seq = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "ticket_counters"


class Bet(models.Model):
    ticket_number = models.CharField(max_length=40, unique=True, blank=True, default="")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.PROTECT, related_name="bets")
    race = models.ForeignKey("races.Race", models.PROTECT, related_name="bets")
    game_type = models.ForeignKey(GameType, models.PROTECT, related_name="bets")
    result = models.ForeignKey("results.RaceResult", models.SET_NULL, null=True, blank=True, related_name="bets")
    wager_amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="PHP")
    odds_snapshot = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    estimated_return = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    payout_amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=10, choices=BetStatus.choices, default=BetStatus.PENDING)
    is_simulated = models.BooleanField(default=True)
    void_reason = models.CharField(max_length=255, null=True, blank=True)
    placed_at = models.DateTimeField(default=timezone.now)
    settled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bets"
        ordering = ["-placed_at", "-id"]
        indexes = [
            models.Index(fields=["user", "status", "placed_at"], name="idx_bets_user_status"),
            models.Index(fields=["race", "status"], name="idx_bets_race_status"),
        ]

    def __str__(self):
        return self.ticket_number or f"Bet #{self.pk}"


class BetSelection(models.Model):
    bet = models.ForeignKey(Bet, models.CASCADE, related_name="selections")
    entry = models.ForeignKey("races.RaceEntry", models.PROTECT, related_name="bet_selections")
    leg_position = models.PositiveSmallIntegerField()
    odds_snapshot = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = "bet_selections"
        unique_together = [("bet", "leg_position"), ("bet", "entry")]
        ordering = ["leg_position"]


def default_draft_expiry():
    return timezone.now() + timedelta(minutes=30)


class BetDraft(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.CASCADE, related_name="bet_drafts")
    race = models.ForeignKey("races.Race", models.CASCADE)
    game_type = models.ForeignKey(GameType, models.PROTECT)
    selections = models.JSONField(default=list, help_text='[{"entry_id": 12, "leg_position": 1}]')
    wager_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    expires_at = models.DateTimeField(default=default_draft_expiry)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bet_drafts"
        unique_together = [("user", "race", "game_type")]


class BetStatusHistory(models.Model):
    bet = models.ForeignKey(Bet, models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=10, choices=BetStatus.choices, null=True, blank=True)
    to_status = models.CharField(max_length=10, choices=BetStatus.choices)
    reason = models.CharField(max_length=255, null=True, blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, models.SET_NULL, null=True, blank=True, related_name="+")
    changed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "bet_status_history"
        verbose_name_plural = "bet status history"
        ordering = ["changed_at", "id"]
