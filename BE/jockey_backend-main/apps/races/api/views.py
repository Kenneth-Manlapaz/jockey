from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.generics import ListAPIView
from apps.subscriptions.permissions import HasRacingAccess
from rest_framework.response import Response

from apps.races import selectors

from .serializers import EntrySerializer, RaceDetailSerializer, RaceSerializer, TipSheetSerializer
from apps.races.models import TipSheet


class RaceViewSet(viewsets.ReadOnlyModelViewSet):
    """Race schedule. Filters: ?date=2025-10-24  ?status=upcoming  ?venue=1  ?featured=1"""
    permission_classes = [HasRacingAccess]

    def get_queryset(self):
        p = self.request.query_params
        if self.action == "retrieve":
            return selectors.race_with_entries()
        return selectors.race_schedule(
            date=p.get("date"), status=p.get("status"), venue=p.get("venue"),
            featured=p.get("featured") in ("1", "true"))

    def get_serializer_class(self):
        return RaceDetailSerializer if self.action == "retrieve" else RaceSerializer

    @action(detail=True)
    def entries(self, request, pk=None):
        """GET /api/v1/races/{id}/entries/  Horses entered in the race."""
        qs = selectors.entries_queryset(race=pk)
        return Response(EntrySerializer(qs, many=True).data)


class EntryViewSet(viewsets.ReadOnlyModelViewSet):
    """Every race entry. Filters: ?race=3  ?horse=7"""
    permission_classes = [HasRacingAccess]
    serializer_class = EntrySerializer

    def get_queryset(self):
        p = self.request.query_params
        return selectors.entries_queryset(race=p.get("race"), horse=p.get("horse"))


class TipSheetListView(ListAPIView):
    """Public tip sheets. Filter by meeting date with ?date=YYYY-MM-DD."""
    permission_classes = [HasRacingAccess]
    serializer_class = TipSheetSerializer

    def get_queryset(self):
        qs = TipSheet.objects.prefetch_related("tips__race__entries__horse")
        race_date = self.request.query_params.get("date")
        if race_date:
            qs = qs.filter(race_date=race_date)
        return qs


from rest_framework import viewsets, status
from rest_framework.response import Response
from apps.races import selectors, services
from apps.races.api.serializers import RaceNoteSerializer, RaceNoteInputSerializer

class RaceNoteViewSet(viewsets.ViewSet):
    
    # GET /api/v1/race-notes/?race_id=1
    def list(self, request):
        race_id = request.query_params.get("race_id")
        if not race_id:
            return Response({"error": "race_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        notes = selectors.get_race_notes(race_id=race_id)
        serializer = RaceNoteSerializer(notes, many=True)
        return Response(serializer.data)

    # GET /api/v1/race-notes/{id}/
    def retrieve(self, request, pk=None):
        note = selectors.get_race_note_by_id(note_id=pk)
        if not note:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = RaceNoteSerializer(note)
        return Response(serializer.data)

    # POST /api/v1/race-notes/
    def create(self, request):
        race_id = request.data.get("race_id")
        input_serializer = RaceNoteInputSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)

        note = services.create_race_note(
            race_id=race_id,
            **input_serializer.validated_data
        )
        output_serializer = RaceNoteSerializer(note)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    # PUT /api/v1/race-notes/{id}/
    def update(self, request, pk=None):
        note = selectors.get_race_note_by_id(note_id=pk)
        if not note:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        input_serializer = RaceNoteInputSerializer(data=request.data, partial=True)
        input_serializer.is_valid(raise_exception=True)

        updated_note = services.update_race_note(
            note=note,
            **input_serializer.validated_data
        )
        return Response(RaceNoteSerializer(updated_note).data)

    # DELETE /api/v1/race-notes/{id}/
    def destroy(self, request, pk=None):
        note = selectors.get_race_note_by_id(note_id=pk)
        if not note:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        services.delete_race_note(note=note)
        return Response(status=status.HTTP_24_NO_CONTENT)
