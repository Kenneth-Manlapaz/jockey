from django.contrib import admin

from apps.accounts.services import audit

from . import services
from .models import (
    Bet, BetDraft, BetSelection, BetStatus, BetStatusHistory, GameType, GuideArticle, RacePool,
    TicketCounter, WagerPreset,
)


class ReadOnlyInline(admin.TabularInline):
    extra = 0
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


class BetSelectionInline(ReadOnlyInline):
    model = BetSelection


class BetHistoryInline(ReadOnlyInline):
    model = BetStatusHistory


@admin.register(Bet)
class BetAdmin(admin.ModelAdmin):
    """Tickets are created through the API (or services.place_bet), not by hand."""
    list_display = ("ticket_number", "user", "race", "game_type", "wager_amount", "status",
                    "payout_amount", "placed_at")
    list_filter = ("status", "game_type", "is_simulated", "placed_at")
    search_fields = ("ticket_number", "user__email", "race__name")
    inlines = [BetSelectionInline, BetHistoryInline]
    actions = ["void_selected"]

    def get_readonly_fields(self, request, obj=None):
        return [f.name for f in self.model._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description="VOID selected pending bets")
    def void_selected(self, request, queryset):
        n = 0
        for bet in queryset.filter(status=BetStatus.PENDING):
            services.set_bet_status(bet, BetStatus.VOID, reason="Voided by admin", changed_by=request.user,
                                    void_reason="Voided by admin")
            n += 1
        audit(request.user, "bet.void", "bet", "bulk", after={"count": n})
        self.message_user(request, f"{n} bet(s) voided.")


@admin.register(GameType)
class GameTypeAdmin(admin.ModelAdmin):
    list_display = ("sort_order", "code", "name", "selections_required", "is_ordered", "min_wager",
                    "max_wager", "is_active")
    list_display_links = ("code",)


for _model in (WagerPreset, GuideArticle, RacePool, BetDraft, TicketCounter):
    admin.site.register(_model)
