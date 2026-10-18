from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.engagement.models import Favorite, Notification

from .serializers import FavoriteSerializer, NotificationSerializer


class FavoriteViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.DestroyModelMixin,
                      viewsets.GenericViewSet):
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        qs = Favorite.objects.filter(user=self.request.user).select_related(
            'horse', 'jockey', 'trainer', 'race', 'venue').order_by("-created_at", "-id")
        if self.request.query_params.get("type"):
            qs = qs.filter(target_type=self.request.query_params["type"])
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=False)
    def unread_count(self, request):
        return Response({"unread": self.get_queryset().filter(is_read=False).count()})

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        self.get_queryset().filter(pk=pk, is_read=False).update(is_read=True, read_at=timezone.now())
        return Response(status=204)

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        n = self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({"marked_read": n})
