from django import forms
from django.contrib import admin

from apps.accounts.services import audit
from apps.betting import services as betting_services
from apps.betting.models import GameType, RaceGame

from . import services
from .models import EntryOddsHistory, Race, RaceCategory, RaceEntry, RaceLiveEvent, RaceTip, TipSheet


class RaceAdminForm(forms.ModelForm):
    games = forms.ModelMultipleChoiceField(
        queryset=GameType.objects.filter(is_active=True), required=False,
        widget=forms.CheckboxSelectMultiple, help_text="Games that are open for betting on this race.")

    class Meta:
        model = Race
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["games"].initial = GameType.objects.filter(
                race_games__race=self.instance, race_games__is_open=True)
        else:
            self.fields["games"].initial = GameType.objects.filter(is_active=True)


class RaceEntryInline(admin.TabularInline):
    model = RaceEntry
    extra = 0
    autocomplete_fields = ("horse", "jockey", "trainer", "owner")
    fields = ("horse_number", "post_position", "horse", "jockey", "trainer", "owner", "weight_kg", "current_odds",
              "badge_color", "status", "coupled_group", "scratch_reason")


@admin.register(Race)
class RaceAdmin(admin.ModelAdmin):
    form = RaceAdminForm
    list_display = ("__str__", "venue", "post_time", "distance_m", "surface", "status",
                    "entries_count", "is_featured", "is_live")
    list_filter = ("status", "race_date", "venue", "surface", "is_featured", "is_live")
    search_fields = ("name",)
    date_hierarchy = "race_date"
    readonly_fields = ("entries_count",)
    inlines = [RaceEntryInline]
    actions = ["mark_ongoing", "cancel_and_void_bets"]
    fieldsets = (
        ("Race", {"fields": ("venue", "club", "course", "category", "race_number", "name", "description")}),
        ("Schedule", {"fields": ("race_date", "post_time", "status", "betting_opens_at", "betting_closes_at",
                                 "started_at", "finished_at")}),
        ("Track", {"fields": ("distance_m", "surface", "track_condition", "age_restriction",
                              "max_entries", "entries_count")}),
        ("Money and display", {"fields": ("purse_amount", "purse_currency", "hero_image_url",
                                          "is_featured", "is_live", "live_stream_url", "is_demo")}),
        ("Games open for betting", {"fields": ("games",)}),
    )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        chosen = form.cleaned_data.get("games")
        if chosen is not None:  # race_games has a composite key, so it is synced by hand
            race = form.instance
            RaceGame.objects.filter(race=race).exclude(game_type__in=chosen).delete()
            for game in chosen:
                RaceGame.objects.update_or_create(race=race, game_type=game, defaults={"is_open": True})

    @admin.action(description="Mark selected races as ongoing (closes betting)")
    def mark_ongoing(self, request, queryset):
        n = services.mark_ongoing(queryset)
        self.message_user(request, f"{n} race(s) set to ongoing.")

    @admin.action(description="Cancel selected races and VOID their pending bets")
    def cancel_and_void_bets(self, request, queryset):
        voided = 0
        for race in queryset:
            n = betting_services.cancel_race(race, changed_by=request.user)
            audit(request.user, "race.cancel", "race", race.pk, after={"voided": n})
            voided += n
        self.message_user(request, f"{queryset.count()} race(s) cancelled, {voided} bet(s) voided.")


@admin.register(RaceEntry)
class RaceEntryAdmin(admin.ModelAdmin):
    list_display = ("race", "horse_number", "horse", "jockey", "current_odds", "status")
    list_filter = ("status", "race__race_date")
    search_fields = ("horse__name", "race__name")
    autocomplete_fields = ("race", "horse", "jockey", "trainer", "owner")
    actions = ["scratch"]

    @admin.action(description="Scratch selected entries (withdrawn from the race)")
    def scratch(self, request, queryset):
        n = services.scratch_entries(queryset)
        self.message_user(request, f"{n} entr(ies) scratched.")


admin.site.register(RaceCategory)
admin.site.register(EntryOddsHistory)
admin.site.register(RaceLiveEvent)


class RaceTipInline(admin.TabularInline):
    model = RaceTip
    extra = 0
    autocomplete_fields = ("race",)
    fields = ("tipster", "race_number", "race", "raw_selection", "horse_numbers", "note")


@admin.register(TipSheet)
class TipSheetAdmin(admin.ModelAdmin):
    list_display = ("title", "race_date", "compiler", "source")
    list_filter = ("race_date",)
    search_fields = ("title", "compiler", "source", "tips__tipster")
    date_hierarchy = "race_date"
    inlines = [RaceTipInline]
