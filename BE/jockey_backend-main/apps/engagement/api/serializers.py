from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.engagement.models import Favorite, Notification

TARGETS = ("horse", "jockey", "trainer", "race", "venue")


class FavoriteSerializer(serializers.ModelSerializer):
    target_name = serializers.SerializerMethodField()

    def get_target_name(self, obj):
        target = getattr(obj, obj.target_type, None)
        return str(target) if target else None

    class Meta:
        model = Favorite
        fields = ["id", "target_type", "target_name", "horse", "jockey", "trainer", "race", "venue",
                  "notify_on_race", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        user = self.context["request"].user
        try:
            Favorite(user=user, **attrs).clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages)
        target = {k: v for k, v in attrs.items() if k in TARGETS and v}
        if Favorite.objects.filter(user=user, **target).exists():
            raise serializers.ValidationError("Already in your favorites.")
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "type", "title", "body", "deep_link", "is_read", "created_at"]
