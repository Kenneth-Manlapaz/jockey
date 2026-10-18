from rest_framework import serializers

from apps.races.models import Race, RaceEntry, RaceLiveEvent, RaceTip, TipSheet


class RaceSerializer(serializers.ModelSerializer):
    venue_name = serializers.CharField(source="venue.name", read_only=True)
    club_name = serializers.CharField(source="club.name", read_only=True, default=None)

    class Meta:
        model = Race
        fields = [
            "id", "race_number", "name", "race_date", "post_time", "distance_m", "surface",
            "track_condition", "status", "entries_count", "purse_amount", "purse_currency",
            "is_featured", "is_live", "hero_image_url", "venue_name", "club_name", "is_demo",
        ]


class EntrySerializer(serializers.ModelSerializer):
    horse_id = serializers.IntegerField(read_only=True)
    horse_name = serializers.CharField(source="horse.name", read_only=True)
    horse_photo = serializers.CharField(source="horse.photo_url", read_only=True, default=None)
    jockey_name = serializers.CharField(source="jockey.full_name", read_only=True, default=None)
    trainer_name = serializers.CharField(source="trainer.full_name", read_only=True, default=None)
    owner_name = serializers.CharField(source="owner.name", read_only=True, default=None)

    class Meta:
        model = RaceEntry
        fields = [
            "id", "race_id", "horse_id", "horse_number", "badge_color", "horse_name", "horse_photo",
            "jockey_name", "trainer_name", "owner_name", "weight_kg", "current_odds", "status",
        ]


class RaceDetailSerializer(RaceSerializer):
    entries = EntrySerializer(many=True, read_only=True)

    class Meta(RaceSerializer.Meta):
        fields = RaceSerializer.Meta.fields + ["description", "age_restriction", "entries"]


class RaceLiveEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RaceLiveEvent
        fields = [
            "id", "race_id", "event_type", "description", "occurred_at"
        ]


class RaceTipSerializer(serializers.ModelSerializer):
    matched_entries = serializers.SerializerMethodField()

    class Meta:
        model = RaceTip
        fields = ["id", "race_id", "race_number", "tipster", "raw_selection",
                  "horse_numbers", "matched_entries", "note"]

    def get_matched_entries(self, obj):
        """Resolve parsed picks to the race entries when that race card is loaded."""
        if not obj.race_id or not obj.horse_numbers:
            return []
        entries = {
            entry.horse_number: entry
            for entry in obj.race.entries.select_related("horse").filter(
                horse_number__in=obj.horse_numbers
            )
        }
        return [
            {"entry_id": entries[number].pk, "horse_number": number,
             "horse_name": entries[number].horse.name}
            for number in obj.horse_numbers if number in entries
        ]


class TipSheetSerializer(serializers.ModelSerializer):
    tips = RaceTipSerializer(many=True, read_only=True)

    class Meta:
        model = TipSheet
        fields = ["id", "title", "race_date", "compiler", "source", "disclaimer", "tips"]



from rest_framework import serializers
from apps.races.models import RaceNote

# Output Serializer (Converts model data to JSON)
class RaceNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RaceNote
        fields = ["id", "race_id", "author", "content", "is_flagged", "created_at", "updated_at"]

# Input Serializer (Validates incoming request payload for Create/Update)
class RaceNoteInputSerializer(serializers.Serializer):
    author = serializers.CharField(max_length=100)
    content = serializers.CharField()
    is_flagged = serializers.BooleanField(required=False, default=False)
