from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from apps.meetings import selectors

from .serializers import MeetingSerializer


class MeetingListView(ListAPIView):
    """Race meetings (a venue's race day). Filters: ?date=2025-10-24  ?venue=1"""
    permission_classes = [AllowAny]
    serializer_class = MeetingSerializer

    def get_queryset(self):
        p = self.request.query_params
        return selectors.list_meetings(date=p.get("date"), venue=p.get("venue"))
