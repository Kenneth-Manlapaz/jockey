from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import RaceResultView, ResultViewSet

router = SimpleRouter()
router.register("results", ResultViewSet, basename="result")

urlpatterns = [
    path("races/<int:race_id>/results/", RaceResultView.as_view(), name="race-results"),
] + router.urls
