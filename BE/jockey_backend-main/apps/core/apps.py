from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.core"
    label = "core"
