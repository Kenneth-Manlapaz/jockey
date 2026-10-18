"""Permanent horse profiles. A horse's entry in a specific race lives in `races`."""
from django.db import models
from django.utils import timezone

from apps.core.fields import UnsignedAutoField as IdField


class Sex(models.TextChoices):
    COLT = "colt", "Colt"
    FILLY = "filly", "Filly"
    GELDING = "gelding", "Gelding"
    MARE = "mare", "Mare"
    STALLION = "stallion", "Stallion"


class Horse(models.Model):
    id = IdField(primary_key=True)
    name = models.CharField(max_length=100, db_index=True)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    sex = models.CharField(max_length=10, choices=Sex.choices, null=True, blank=True)
    color = models.CharField(max_length=40, null=True, blank=True)
    birth_year = models.PositiveSmallIntegerField(null=True, blank=True)
    country_of_origin = models.CharField(max_length=2, null=True, blank=True)
    sire = models.CharField(max_length=100, null=True, blank=True)
    dam = models.CharField(max_length=100, null=True, blank=True)
    owner = models.ForeignKey("participants.Owner", models.SET_NULL, null=True, blank=True)
    trainer = models.ForeignKey("participants.Trainer", models.SET_NULL, null=True, blank=True)
    career_starts = models.PositiveIntegerField(default=0)
    career_wins = models.PositiveIntegerField(default=0)
    career_places = models.PositiveIntegerField(default=0)
    career_earnings = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    form_last5 = models.CharField(max_length=20, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_fictional = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "horses"

    def __str__(self):
        return self.name
