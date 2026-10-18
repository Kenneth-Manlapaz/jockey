from django.db.models import Prefetch

from .models import Bet, BetSelection, GameType, WagerPreset


def bets_for_user(user, *, status=None):
    qs = Bet.objects.filter(user=user).select_related("race", "game_type").prefetch_related(
        Prefetch("selections", BetSelection.objects.select_related("entry__horse")))
    if status:
        qs = qs.filter(status=status)
    return qs


def open_games_for_race(race):
    return GameType.objects.filter(race_games__race=race, race_games__is_open=True, is_active=True)


def active_wager_presets():
    return list(WagerPreset.objects.filter(is_active=True).values_list("amount", flat=True))
