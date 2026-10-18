"""Choices shared by several apps."""
from django.db import models


class Surface(models.TextChoices):
    TURF = "turf", "Turf"
    DIRT = "dirt", "Dirt"
    SYNTHETIC = "synthetic", "Synthetic"


class TrackCondition(models.TextChoices):
    FIRM = "firm", "Firm"
    GOOD = "good", "Good"
    YIELDING = "yielding", "Yielding"
    SOFT = "soft", "Soft"
    HEAVY = "heavy", "Heavy"
    FAST = "fast", "Fast"
    SLOPPY = "sloppy", "Sloppy"
    MUDDY = "muddy", "Muddy"
