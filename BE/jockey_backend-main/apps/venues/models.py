"""Racetracks and racecourse information."""
from django.db import models
from django.utils import timezone

from apps.core.choices import Surface
from apps.core.fields import UnsignedAutoField as IdField


class RacingClub(models.Model):
    id = IdField(primary_key=True)
    name = models.CharField(max_length=150, unique=True)
    short_name = models.CharField(max_length=50, null=True, blank=True)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    website_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "racing_clubs"

    def __str__(self):
        return self.name


class Venue(models.Model):
    id = IdField(primary_key=True)
    club = models.ForeignKey(RacingClub, models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=150)
    tagline = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    province = models.CharField(max_length=100, null=True, blank=True)
    country_code = models.CharField(max_length=2, default="PH")
    address = models.CharField(max_length=500, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    hero_image_url = models.CharField(max_length=500, null=True, blank=True)
    capacity = models.PositiveIntegerField(null=True, blank=True)
    is_fictional = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "venues"

    def __str__(self):
        return self.name


class VenueTrackSurface(models.Model):
    id = IdField(primary_key=True)
    venue = models.ForeignKey(Venue, models.CASCADE, related_name="surfaces")
    surface = models.CharField(max_length=10, choices=Surface.choices)
    circumference_m = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "venue_track_surfaces"
        unique_together = [("venue", "surface")]

    def __str__(self):
        return f"{self.venue} - {self.surface}"


class VenueCourse(models.Model):
    id = IdField(primary_key=True)
    venue = models.ForeignKey(Venue, models.CASCADE, related_name="courses")
    surface = models.ForeignKey(VenueTrackSurface, models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=100)
    min_distance_m = models.PositiveIntegerField(null=True, blank=True)
    max_distance_m = models.PositiveIntegerField(null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    layout_image_url = models.CharField(max_length=500, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "venue_courses"
        unique_together = [("venue", "name")]
        ordering = ["sort_order", "name"]

    def __str__(self):
        return f"{self.venue} - {self.name}"


class Facility(models.Model):
    id = IdField(primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = "facilities"
        verbose_name_plural = "facilities"

    def __str__(self):
        return self.label


class VenueFacility(models.Model):
    """Junction table with a composite primary key (venue_id, facility_id)."""
    pk = models.CompositePrimaryKey("venue_id", "facility_id")
    venue = models.ForeignKey(Venue, models.CASCADE, related_name="venue_facilities")
    facility = models.ForeignKey(Facility, models.CASCADE, related_name="venue_facilities")

    class Meta:
        db_table = "venue_facilities"
        verbose_name_plural = "venue facilities"
