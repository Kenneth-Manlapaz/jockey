"""Persistent meeting identities; legacy venue/date APIs remain compatible."""
from django.db import models


class Meeting(models.Model):
    venue = models.ForeignKey('venues.Venue', models.PROTECT)
    race_date = models.DateField(db_index=True)
    name = models.CharField(max_length=150, blank=True)
    timezone = models.CharField(max_length=64, default='Asia/Manila')
    status = models.CharField(max_length=16, default='scheduled', choices=[
        ('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled')])
    source = models.CharField(max_length=500, blank=True)
    is_demo = models.BooleanField(default=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['venue', 'race_date'], name='unique_meeting_venue_date')]
        ordering = ['race_date', 'venue_id']

    def __str__(self):
        return f'{self.venue} · {self.race_date}'
