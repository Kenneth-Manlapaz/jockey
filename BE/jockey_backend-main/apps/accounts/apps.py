from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.accounts"
    label = "accounts"

    def ready(self):
        from . import signals  # noqa: F401
