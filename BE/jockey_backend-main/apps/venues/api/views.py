from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.venues import selectors
from apps.venues.models import RacingClub

from .serializers import RacingClubSerializer, VenueSerializer


class RacingClubViewSet(viewsets.ReadOnlyModelViewSet):
    """Racing clubs. Filter: ?search=name"""
    permission_classes = [IsAuthenticated]
    serializer_class = RacingClubSerializer
    queryset = RacingClub.objects.all().order_by("name")

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class VenueViewSet(viewsets.ReadOnlyModelViewSet):
    """Racetracks. Filter: ?search=name"""
    permission_classes = [AllowAny]
    serializer_class = VenueSerializer

    def get_queryset(self):
        return selectors.venues_queryset(search=self.request.query_params.get("search"))
