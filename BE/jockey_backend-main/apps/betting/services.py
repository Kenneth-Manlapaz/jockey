"""All betting and settlement rules in one place (DEMO: simulated tickets only).

The REST API, admin actions, management commands and the demo seeder all call
these functions, so each rule is written once. They also repeat the checks that
the MariaDB triggers make, so behaviour is the same with or without the triggers.
"""
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.engagement.models import NotificationType
from apps.engagement.services import notify
from apps.races.models import EntryStatus, Race, RaceEntry, RaceStatus
from apps.results import services as result_services
from apps.results.models import RaceResult, ResultStatus

from .models import (
    Bet, BetDraft, BetSelection, BetStatus, BetStatusHistory, GameType, RaceDividend, RaceGame,
    TicketCounter,
)

MANILA_OFFSET = timedelta(hours=8)
CENT = Decimal("0.01")


class BettingError(Exception):
    """A rule was broken. The message is safe to show to the user."""


# ------------------------------------------------------------- tickets
def manila_today():
    return (timezone.now() + MANILA_OFFSET).date()


def next_ticket_number(is_simulated=True):
    """PJA-DEMO-YYMMDD-NNNN, restarting at 0001 every Manila day.
    Must run inside a transaction (place_bet provides one)."""
    day = manila_today()
    TicketCounter.objects.get_or_create(counter_date=day, defaults={"last_seq": 0})
    counter = TicketCounter.objects.select_for_update().get(counter_date=day)
    counter.last_seq += 1
    counter.save(update_fields=["last_seq"])
    kind = "DEMO" if is_simulated else "LIVE"
    return f"PJA-{kind}-{day:%y%m%d}-{counter.last_seq:04d}"


# ------------------------------------------------------------ placing
@transaction.atomic
def place_bet(*, user, race, game_type, entry_ids, wager_amount, is_simulated=True):
    """Validate and create a ticket with its selections. Returns the Bet.

    entry_ids is the picks in order: first pick first. For ordered games
    (FORECAST, TRIFECTA) that order is part of the bet.
    """
    wager = Decimal(str(wager_amount)).quantize(CENT)
    entry_ids = list(entry_ids)

    if not race.is_betting_open():
        raise BettingError("Betting is closed for this race.")
    if not game_type.is_active or not RaceGame.objects.filter(
        race=race, game_type=game_type, is_open=True
    ).exists():
        raise BettingError(f"{game_type.name} is not open for this race.")
    if wager < game_type.min_wager or wager > game_type.max_wager:
        raise BettingError(f"Wager must be between {game_type.min_wager} and {game_type.max_wager}.")
    if len(entry_ids) != game_type.selections_required:
        raise BettingError(f"{game_type.name} needs exactly {game_type.selections_required} horse(s).")
    if len(set(entry_ids)) != len(entry_ids):
        raise BettingError("Each horse can only be picked once per ticket.")

    entries = {e.pk: e for e in RaceEntry.objects.filter(race=race, pk__in=entry_ids).select_related("horse")}
    if len(entries) != len(entry_ids):
        raise BettingError("One of the selected horses is not running in this race.")
    for entry in entries.values():
        if entry.status != EntryStatus.CONFIRMED:
            raise BettingError(f"{entry.horse.name} is not confirmed to run.")

    odds = estimated = None
    if game_type.selections_required == 1:  # illustrative return for single picks
        odds = entries[entry_ids[0]].current_odds
        if odds:
            estimated = (wager * odds).quantize(CENT)

    bet = Bet.objects.create(
        ticket_number=next_ticket_number(is_simulated),
        user=user, race=race, game_type=game_type, wager_amount=wager,
        odds_snapshot=odds, estimated_return=estimated, is_simulated=is_simulated,
    )
    BetSelection.objects.bulk_create([
        BetSelection(bet=bet, entry=entries[eid], leg_position=i, odds_snapshot=entries[eid].current_odds)
        for i, eid in enumerate(entry_ids, start=1)
    ])
    BetDraft.objects.filter(user=user, race=race, game_type=game_type).delete()
    return bet


# ------------------------------------------------------ status changes
def set_bet_status(bet, new_status, *, reason="", changed_by=None, **fields):
    """Change a bet's status. With the MariaDB trigger installed the history
    row is written by the database; otherwise we write it here."""
    old_status = bet.status
    bet.status = new_status
    for name, value in fields.items():
        setattr(bet, name, value)
    bet.save()
    if not settings.USE_DB_TRIGGERS and old_status != new_status:
        BetStatusHistory.objects.create(
            bet=bet, from_status=old_status, to_status=new_status,
            reason=reason or None, changed_by=changed_by,
        )


# ------------------------------------------------------------- results
@transaction.atomic
def publish_result(*, race, finishing_order, winning_time_ms=None, dividends=(),
                   track_condition=None, final_odds=None):
    """Create (or replace) a provisional result with its dividends.

    dividends: iterable of (game_code, combination, amount), only for the
               winning combinations, e.g. ("FORECAST", "1-2", 142).
    """
    try:
        result = result_services.publish_placements(
            race=race, finishing_order=finishing_order, winning_time_ms=winning_time_ms,
            track_condition=track_condition, final_odds=final_odds)
    except result_services.ResultError as exc:
        raise BettingError(str(exc)) from exc
    result.dividends.all().delete()
    games = {g.code: g for g in GameType.objects.all()}
    RaceDividend.objects.bulk_create([
        RaceDividend(result=result, game_type=games[code], combination=combo,
                     dividend_amount=Decimal(str(amount)))
        for code, combo, amount in dividends
    ])
    return result


def combination_for(bet):
    """The bet's picks in the same text format as race_dividends.combination."""
    legs = list(bet.selections.select_related("entry").order_by("leg_position"))
    numbers = [leg.entry.horse_number for leg in legs]
    if not bet.game_type.is_ordered:
        numbers.sort()
    return "-".join(str(n) for n in numbers)


@transaction.atomic
def settle_bets(race, *, changed_by=None):
    """Mark every pending ticket for the race won or lost. A ticket wins when
    its combination has a dividend; payout = wager / unit_stake * dividend."""
    result = RaceResult.objects.filter(race=race).first()
    if result is None or result.status != ResultStatus.OFFICIAL:
        raise BettingError("Make the race result official before settling bets.")

    dividends = {(d.game_type_id, d.combination): d for d in result.dividends.all()}
    now = timezone.now()
    summary = {"won": 0, "lost": 0, "payout_total": Decimal("0.00")}
    pending = Bet.objects.filter(race=race, status=BetStatus.PENDING).select_related("user", "game_type")
    for bet in pending.select_for_update():
        dividend = dividends.get((bet.game_type_id, combination_for(bet)))
        if dividend:
            payout = (bet.wager_amount / dividend.unit_stake * dividend.dividend_amount).quantize(CENT)
            set_bet_status(bet, BetStatus.WON, changed_by=changed_by, reason="Race result",
                           payout_amount=payout, settled_at=now, result=result)
            summary["won"] += 1
            summary["payout_total"] += payout
            title, body = f"Ticket {bet.ticket_number} won", f"You won PHP {payout:,.2f} (demo)."
        else:
            set_bet_status(bet, BetStatus.LOST, changed_by=changed_by, reason="Race result",
                           settled_at=now, result=result)
            summary["lost"] += 1
            title, body = f"Ticket {bet.ticket_number} settled", "This ticket did not win."
        notify(bet.user, NotificationType.BET_SETTLED, title, body, race=race, bet=bet,
               deep_link=f"/tickets/{bet.ticket_number}")
    return summary


@transaction.atomic
def finalize_race(race, *, changed_by=None):
    """Make the result official (if it is not already) and settle all tickets."""
    result = race.result
    if result.status != ResultStatus.OFFICIAL:
        result_services.make_result_official(result)
    return settle_bets(race, changed_by=changed_by)


@transaction.atomic
def void_pending_bets(race, reason, *, changed_by=None):
    """Void every pending ticket for a race. Returns the count."""
    count = 0
    now = timezone.now()
    for bet in Bet.objects.filter(race=race, status=BetStatus.PENDING).select_for_update():
        set_bet_status(bet, BetStatus.VOID, changed_by=changed_by, reason=reason,
                       void_reason=reason, settled_at=now)
        notify(bet.user, NotificationType.BET_SETTLED, f"Ticket {bet.ticket_number} voided",
               reason, race=race, bet=bet, deep_link=f"/tickets/{bet.ticket_number}")
        count += 1
    return count


@transaction.atomic
def cancel_race(race, *, reason="Race cancelled", changed_by=None):
    """Cancel a race and void its pending tickets. Returns the number voided."""
    race.status = RaceStatus.CANCELLED
    race.is_live = False
    race.save()
    return void_pending_bets(race, reason, changed_by=changed_by)
