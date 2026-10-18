from django.apps import AppConfig


class HorsesConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.horses"
    label = "horses"
