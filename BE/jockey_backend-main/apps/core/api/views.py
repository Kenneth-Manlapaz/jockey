from django.db import connection
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """GET /api/v1/health/  ->  200 when the app and database respond, 503 otherwise."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            database = "ok"
        except Exception:  # noqa: BLE001  (any failure means unhealthy)
            database = "error"
        body = {"status": "ok" if database == "ok" else "degraded", "database": database,
                "api_version": "v1", "time": timezone.now().isoformat(),
                "data_notice": "Demo data. Not official or live racing information."}
        return Response(body, status=200 if database == "ok" else 503)
