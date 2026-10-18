"""Jockeys, trainers and owners (the people and stables around a horse)."""
from django.db import models

from apps.core.fields import UnsignedAutoField as IdField


class Jockey(models.Model):
    id = IdField(primary_key=True)
    full_name = models.CharField(max_length=120)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    career_wins = models.PositiveIntegerField(default=0)
    career_starts = models.PositiveIntegerField(default=0)
    bio = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_fictional = models.BooleanField(default=True)

    class Meta:
        db_table = "jockeys"

    def __str__(self):
        return self.full_name


class Trainer(models.Model):
    id = IdField(primary_key=True)
    full_name = models.CharField(max_length=120)
    photo_url = models.CharField(max_length=500, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "trainers"

    def __str__(self):
        return self.full_name


class Owner(models.Model):
    id = IdField(primary_key=True)
    name = models.CharField(max_length=150)
    stable_name = models.CharField(max_length=150, null=True, blank=True)

    class Meta:
        db_table = "owners"

    def __str__(self):
        return self.name
