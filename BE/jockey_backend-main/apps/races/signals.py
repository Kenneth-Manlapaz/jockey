from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import RaceEntry
from .services import recount_entries


@receiver(post_save, sender=RaceEntry)
def entry_saved(sender, instance, **kwargs):
    recount_entries(instance.race_id)


@receiver(post_delete, sender=RaceEntry)
def entry_deleted(sender, instance, **kwargs):
    recount_entries(instance.race_id)
