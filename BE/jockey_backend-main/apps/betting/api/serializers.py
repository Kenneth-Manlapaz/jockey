from rest_framework import serializers

from apps.betting import services
from apps.betting.models import Bet, BetSelection, GameType
from apps.races.models import Race


class GameTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameType
        fields = ["id", "code", "name", "short_description", "selections_required",
                  "is_ordered", "min_wager", "max_wager"]


class SelectionSerializer(serializers.ModelSerializer):
    horse_number = serializers.IntegerField(source="entry.horse_number")
    horse_name = serializers.CharField(source="entry.horse.name")

    class Meta:
        model = BetSelection
        fields = ["leg_position", "horse_number", "horse_name", "odds_snapshot"]


class BetSerializer(serializers.ModelSerializer):
    race = serializers.SerializerMethodField()
    game = serializers.CharField(source="game_type.code")
    game_name = serializers.CharField(source="game_type.name")
    selections = SelectionSerializer(many=True, read_only=True)

    class Meta:
        model = Bet
        fields = ["ticket_number", "status", "is_simulated", "race", "game", "game_name",
                  "wager_amount", "odds_snapshot", "estimated_return", "payout_amount",
                  "placed_at", "settled_at", "selections"]

    def get_race(self, bet):
        return {"id": bet.race_id, "race_number": bet.race.race_number, "name": bet.race.name,
                "race_date": bet.race.race_date}


class PlaceBetSerializer(serializers.Serializer):
    race = serializers.PrimaryKeyRelatedField(queryset=Race.objects.all())
    game = serializers.SlugRelatedField(slug_field="code", queryset=GameType.objects.all())
    entries = serializers.ListField(child=serializers.IntegerField(), allow_empty=False,
                                    help_text="RaceEntry ids in pick order")
    wager_amount = serializers.DecimalField(max_digits=12, decimal_places=2)

    def create(self, validated):
        return services.place_bet(
            user=self.context["request"].user, race=validated["race"], game_type=validated["game"],
            entry_ids=validated["entries"], wager_amount=validated["wager_amount"])
