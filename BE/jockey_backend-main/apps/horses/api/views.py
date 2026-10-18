from rest_framework import viewsets
from apps.subscriptions.permissions import HasRacingAccess

from apps.horses import selectors

from .serializers import HorseSerializer


class HorseViewSet(viewsets.ReadOnlyModelViewSet):
    """Horse profiles. Filter: ?search=name"""
    permission_classes = [HasRacingAccess]
    serializer_class = HorseSerializer

    def get_queryset(self):
        return selectors.horses_queryset(search=self.request.query_params.get("search"))
