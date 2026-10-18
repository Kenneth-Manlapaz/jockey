from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.api.permissions import IsStaffRole
from apps.betting import selectors, services
from apps.betting.models import GameType
from apps.races.models import Race

from .serializers import BetSerializer, GameTypeSerializer, PlaceBetSerializer


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    """Games & Guide screen."""
    permission_classes = [AllowAny]
    serializer_class = GameTypeSerializer
    queryset = GameType.objects.filter(is_active=True)
    pagination_class = None

    @action(detail=False)
    def wager_presets(self, request):
        return Response(selectors.active_wager_presets())


class RaceGamesView(APIView):
    """GET /api/v1/races/{id}/games/  Games open for betting on this race."""
    permission_classes = [AllowAny]

    def get(self, request, race_id):
        race = get_object_or_404(Race, pk=race_id)
        return Response(GameTypeSerializer(selectors.open_games_for_race(race), many=True).data)


class BetViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin,
                 viewsets.GenericViewSet):
    """The signed-in user's tickets. Filter: ?status=pending|won|lost|void
    POST body: {"race": 3, "game": "WIN", "entries": [12], "wager_amount": "50.00"}"""
    lookup_field = "ticket_number"
    lookup_value_regex = r"[\w-]+"

    def get_queryset(self):
        return selectors.bets_for_user(self.request.user, status=self.request.query_params.get("status"))

    def get_serializer_class(self):
        return PlaceBetSerializer if self.action == "create" else BetSerializer

    def create(self, request, *args, **kwargs):
        serializer = PlaceBetSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        bet = serializer.save()
        return Response(BetSerializer(bet).data, status=status.HTTP_201_CREATED)


class SettleRaceView(APIView):
    """POST /api/v1/races/{id}/settle/  Staff only: make the result official and settle tickets."""
    permission_classes = [IsStaffRole]

    def post(self, request, race_id):
        race = get_object_or_404(Race, pk=race_id)
        if not hasattr(race, "result"):
            raise services.BettingError("This race has no result yet.")
        summary = services.finalize_race(race, changed_by=request.user)
        return Response({"won": summary["won"], "lost": summary["lost"],
                         "payout_total": str(summary["payout_total"])})
