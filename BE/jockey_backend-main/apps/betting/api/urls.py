from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import BetViewSet, GameViewSet, RaceGamesView, SettleRaceView

router = SimpleRouter()
router.register("games", GameViewSet, basename="game")
router.register("bets", BetViewSet, basename="bet")

urlpatterns = [
    path("races/<int:race_id>/games/", RaceGamesView.as_view(), name="race-games"),
    path("races/<int:race_id>/settle/", SettleRaceView.as_view(), name="race-settle"),
] + router.urls
