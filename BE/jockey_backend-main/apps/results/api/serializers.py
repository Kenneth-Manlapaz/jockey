from rest_framework import serializers

from apps.races.api.serializers import RaceSerializer
from apps.results.models import RaceResult, RaceResultPlacement


class PlacementSerializer(serializers.ModelSerializer):
    horse_number = serializers.IntegerField(source="entry.horse_number")
    horse_name = serializers.CharField(source="entry.horse.name")
    jockey_name = serializers.CharField(source="entry.jockey.full_name", default=None)

    class Meta:
        model = RaceResultPlacement
        fields = ["finish_position", "horse_number", "horse_name", "jockey_name", "final_odds"]


class ResultSerializer(serializers.ModelSerializer):
    race = RaceSerializer(read_only=True)
    placements = PlacementSerializer(many=True, read_only=True)
    dividends = serializers.SerializerMethodField()
    winning_time = serializers.CharField(source="winning_time_display", read_only=True)

    class Meta:
        model = RaceResult
        fields = ["id", "status", "race", "winning_time", "winning_time_ms", "track_condition",
                  "posted_at", "made_official_at", "placements", "dividends"]

    def get_dividends(self, result):
        # Dividends belong to the betting app. If that app is not installed (info-only
        # mode) the reverse relation does not exist and this is simply empty.
        related = getattr(result, "dividends", None)
        if related is None:
            return []
        return [{"game": d.game_type.code, "combination": d.combination,
                 "dividend_amount": d.dividend_amount, "unit_stake": d.unit_stake}
                for d in related.all()]
