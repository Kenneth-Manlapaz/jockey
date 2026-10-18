from rest_framework import viewsets
from rest_framework.generics import RetrieveAPIView
from apps.subscriptions.permissions import HasRacingAccess

from apps.results import selectors
from apps.results.models import RaceResult

from .serializers import ResultSerializer


class ResultViewSet(viewsets.ReadOnlyModelViewSet):
    """Race Results list. Filters: ?date=...  ?status=official|provisional|cancelled"""
    permission_classes = [HasRacingAccess]
    serializer_class = ResultSerializer

    def get_queryset(self):
        p = self.request.query_params
        return selectors.results_queryset(date=p.get("date"), status=p.get("status"))


class RaceResultView(RetrieveAPIView):
    """GET /api/v1/races/{race_id}/results/  The result when available (404 until then)."""
    permission_classes = [HasRacingAccess]
    serializer_class = ResultSerializer
    lookup_url_kwarg = "race_id"

    def get_queryset(self):
        return selectors.results_queryset()

    def get_object(self):
        from django.shortcuts import get_object_or_404
        return get_object_or_404(self.get_queryset(), race_id=self.kwargs["race_id"])
