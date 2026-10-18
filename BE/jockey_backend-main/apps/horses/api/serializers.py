from rest_framework import serializers

from apps.horses.models import Horse


class HorseSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source="owner.name", read_only=True, default=None)
    trainer_name = serializers.CharField(source="trainer.full_name", read_only=True, default=None)

    class Meta:
        model = Horse
        fields = ["id", "name", "photo_url", "sex", "color", "birth_year", "country_of_origin", "sire", "dam",
                  "owner_name", "trainer_name", "career_starts", "career_wins", "career_places",
                  "form_last5", "bio", "is_fictional"]
