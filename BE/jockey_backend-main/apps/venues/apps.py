from django.apps import AppConfig


class VenuesConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.venues"
    label = "venues"
