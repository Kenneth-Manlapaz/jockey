"""One error shape for the whole API:

    {"error": {"code": "betting_error", "message": "Betting is closed for this race.", "details": {...}}}
"""
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def exception_handler(exc, context):
    from apps.betting.services import BettingError  # local import: apps are loaded by now

    if isinstance(exc, BettingError):
        return Response({"error": {"code": "betting_error", "message": str(exc), "details": {}}},
                        status=status.HTTP_400_BAD_REQUEST)

    response = drf_exception_handler(exc, context)
    if response is None:
        return None  # unhandled: Django returns a 500
    data = response.data
    if isinstance(data, dict) and set(data) == {"detail"}:
        message, details = str(data["detail"]), {}
    else:
        message, details = "Validation failed." if response.status_code == 400 else "Request failed.", data
        if isinstance(data, dict) and isinstance(data.get("detail"), (str, list)) and response.status_code == 400:
            message = str(data["detail"][0] if isinstance(data["detail"], list) else data["detail"])
    code = {400: "validation_error", 401: "not_authenticated", 403: "permission_denied",
            404: "not_found", 405: "method_not_allowed", 429: "throttled"}.get(response.status_code, "error")
    response.data = {"error": {"code": code, "message": message, "details": details}}
    return response
