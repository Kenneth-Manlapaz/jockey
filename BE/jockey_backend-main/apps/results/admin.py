from django.contrib import admin, messages

from apps.accounts.services import audit
from apps.betting import services as betting_services
from apps.betting.models import RaceDividend
from apps.races.models import RaceEntry

from .models import RaceResult, RaceResultPlacement


class PlacementInline(admin.TabularInline):
    model = RaceResultPlacement
    extra = 0

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "entry":  # only offer horses that ran in this race
            result_id = request.resolver_match.kwargs.get("object_id")
            result = RaceResult.objects.filter(pk=result_id).first() if result_id else None
            if result:
                kwargs["queryset"] = RaceEntry.objects.filter(race=result.race).select_related("horse")
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class DividendInline(admin.TabularInline):
    model = RaceDividend
    extra = 0


@admin.register(RaceResult)
class RaceResultAdmin(admin.ModelAdmin):
    list_display = ("race", "status", "winning_time_ms", "posted_at", "made_official_at")
    list_filter = ("status",)
    autocomplete_fields = ("race",)
    inlines = [PlacementInline, DividendInline]
    actions = ["finalize"]

    @admin.action(description="Make OFFICIAL and settle all pending bets")
    def finalize(self, request, queryset):
        for result in queryset:
            try:
                summary = betting_services.finalize_race(result.race, changed_by=request.user)
            except betting_services.BettingError as exc:
                self.message_user(request, f"{result.race}: {exc}", messages.ERROR)
                continue
            audit(request.user, "result.finalize", "race", result.race_id,
                  after={k: str(v) for k, v in summary.items()})
            self.message_user(
                request,
                f"{result.race}: {summary['won']} won, {summary['lost']} lost, "
                f"PHP {summary['payout_total']:,.2f} paid out (demo).")
