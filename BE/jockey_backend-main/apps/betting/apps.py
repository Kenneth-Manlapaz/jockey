from django.apps import AppConfig


class BettingConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.betting"
    label = "betting"
