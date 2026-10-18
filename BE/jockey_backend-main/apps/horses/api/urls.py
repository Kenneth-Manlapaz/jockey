from rest_framework.routers import SimpleRouter

from .views import HorseViewSet

router = SimpleRouter()
router.register("horses", HorseViewSet, basename="horse")
urlpatterns = router.urls
