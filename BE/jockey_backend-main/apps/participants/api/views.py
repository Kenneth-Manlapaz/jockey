from rest_framework import viewsets
from apps.subscriptions.permissions import HasRacingAccess

from apps.participants import selectors

from .serializers import JockeySerializer, TrainerSerializer


class JockeyViewSet(viewsets.ReadOnlyModelViewSet):
    """Jockeys. Filter: ?search=name"""
    permission_classes = [HasRacingAccess]
    serializer_class = JockeySerializer

    def get_queryset(self):
        return selectors.jockeys_queryset(search=self.request.query_params.get("search")).order_by("full_name")


class TrainerViewSet(viewsets.ReadOnlyModelViewSet):
    """Trainers. Filter: ?search=name"""
    permission_classes = [HasRacingAccess]
    serializer_class = TrainerSerializer

    def get_queryset(self):
        return selectors.trainers_queryset(search=self.request.query_params.get("search")).order_by("full_name")
