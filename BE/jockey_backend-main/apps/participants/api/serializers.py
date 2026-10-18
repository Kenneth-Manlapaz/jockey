from rest_framework import serializers

from apps.participants.models import Jockey, Trainer


class JockeySerializer(serializers.ModelSerializer):
    class Meta:
        model = Jockey
        fields = ["id", "full_name", "photo_url", "weight_kg", "career_wins", "career_starts", "bio",
                  "is_fictional"]


class TrainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trainer
        fields = ["id", "full_name", "photo_url", "bio"]
