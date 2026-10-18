from rest_framework.routers import SimpleRouter
from django.urls import path

from .views import EntryViewSet, RaceNoteViewSet, RaceViewSet, TipSheetListView

router = SimpleRouter()
router.register("races", RaceViewSet, basename="race")
router.register("entries", EntryViewSet, basename="entry")
router.register(r"race-notes", RaceNoteViewSet, basename="race-notes")
urlpatterns = [path("tips/", TipSheetListView.as_view(), name="tip-sheets")] + router.urls
