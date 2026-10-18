"""Versioned API entry point: /api/v1/...  Each app owns its own routes in <app>/api/urls.py.

The betting (demo) routes are mounted unless ENABLE_BETTING_API=0, which gives an
information-only API (races, entries, results, horses, venues)."""
from django.conf import settings
from django.urls import include, path

urlpatterns = [
    path('subscriptions/', include('apps.subscriptions.urls')),
    path("racing/", include("apps.racing_info.urls")),
    path("", include("apps.core.api.urls")),
    path("", include("apps.accounts.api.urls")),
    path("", include("apps.venues.api.urls")),
    path("", include("apps.meetings.api.urls")),
    path("", include("apps.races.api.urls")),
    path("", include("apps.horses.api.urls")),
    path("", include("apps.participants.api.urls")),
    path("", include("apps.results.api.urls")),
    path("", include("apps.engagement.api.urls")),
]
if settings.ENABLE_BETTING_API:
    urlpatterns.append(path("", include("apps.betting.api.urls")))
