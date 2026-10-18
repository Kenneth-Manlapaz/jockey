from django.apps import AppConfig


class ParticipantsConfig(AppConfig):
    default_auto_field = "apps.core.fields.UnsignedBigAutoField"
    name = "apps.participants"
    label = "participants"
