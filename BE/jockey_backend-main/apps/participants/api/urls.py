from rest_framework.routers import SimpleRouter

from .views import JockeyViewSet, TrainerViewSet

router = SimpleRouter()
router.register("jockeys", JockeyViewSet, basename="jockey")
router.register("trainers", TrainerViewSet, basename="trainer")
urlpatterns = router.urls
