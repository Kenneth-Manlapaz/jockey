from django.apps import AppConfig


class RacesConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.races"
    label = "races"

    def ready(self):
        from . import signals  # noqa: F401
