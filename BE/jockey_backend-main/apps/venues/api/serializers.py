from rest_framework import serializers

from apps.venues.models import RacingClub, Venue, VenueCourse, VenueTrackSurface


class RacingClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = RacingClub
        fields = ["id", "name", "short_name", "logo_url", "website_url", "created_at"]


class SurfaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueTrackSurface
        fields = ["surface", "circumference_m"]


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenueCourse
        fields = ["name", "min_distance_m", "max_distance_m", "description"]


class VenueSerializer(serializers.ModelSerializer):
    club_name = serializers.CharField(source="club.name", read_only=True, default=None)
    surfaces = SurfaceSerializer(many=True, read_only=True)
    courses = CourseSerializer(many=True, read_only=True)
    facilities = serializers.SerializerMethodField()

    class Meta:
        model = Venue
        fields = ["id", "name", "tagline", "description", "city", "province", "country_code",
                  "hero_image_url", "club_name", "is_fictional", "surfaces", "courses", "facilities"]

    def get_facilities(self, venue):
        return [{"code": vf.facility.code, "label": vf.facility.label} for vf in venue.venue_facilities.all()]
