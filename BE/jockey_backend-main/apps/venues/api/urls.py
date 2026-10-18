from rest_framework.routers import SimpleRouter

from .views import RacingClubViewSet, VenueViewSet

router = SimpleRouter()
router.register("racing-clubs", RacingClubViewSet, basename="racing-club")
router.register("venues", VenueViewSet, basename="venue")
urlpatterns = router.urls
