from rest_framework.routers import SimpleRouter

from .views import FavoriteViewSet, NotificationViewSet

router = SimpleRouter()
router.register("favorites", FavoriteViewSet, basename="favorite")
router.register("notifications", NotificationViewSet, basename="notification")
urlpatterns = router.urls
