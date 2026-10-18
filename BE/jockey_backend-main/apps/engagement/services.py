from apps.accounts.models import UserSettings

from .models import Notification, NotificationType


def notify(user, type_, title, body="", race=None, bet=None, deep_link=None):
    """Create an in-app notification, honouring the user's settings."""
    prefs = UserSettings.objects.filter(user=user).first()
    if prefs is not None and type_ == NotificationType.BET_SETTLED and not prefs.notify_bet_settled:
        return None
    return Notification.objects.create(
        user=user, type=type_, title=title, body=body, race=race, bet=bet, deep_link=deep_link
    )
