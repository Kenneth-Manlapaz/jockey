from rest_framework import serializers


class MeetingSerializer(serializers.Serializer):
    venue_id = serializers.IntegerField()
    venue_name = serializers.CharField(source="venue__name")
    race_date = serializers.DateField()
    race_count = serializers.IntegerField()
    first_post_time = serializers.DateTimeField()
