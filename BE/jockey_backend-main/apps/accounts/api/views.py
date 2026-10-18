from django.contrib.auth import authenticate
from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt, csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import ProfileSerializer, RegisterSerializer


_auth_csrf_decorator = csrf_exempt if settings.AUTH_BEARER_ONLY else csrf_protect


def _issue_login_response(user, *, created=False):
    if settings.AUTH_BEARER_ONLY:
        access = AccessToken.for_user(user)
        body = {"access": str(access), "token_type": "Bearer"}
        if created:
            body["user"] = ProfileSerializer(user).data
        return Response(body, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    refresh = RefreshToken.for_user(user)
    body = {"access": str(refresh.access_token), "token_type": "Bearer"}
    if created:
        body["user"] = ProfileSerializer(user).data
    response = Response(body, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    _set_refresh_cookie(response, str(refresh))
    return response


def _set_refresh_cookie(response, token):
    response.set_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        token,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=True,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
    )


def _clear_refresh_cookie(response):
    response.delete_cookie(
        settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
@authentication_classes([])
def csrf_token(request):
    """Issue the CSRF cookie and return the value the browser sends in X-CSRFToken."""
    return Response({"csrfToken": get_token(request)})


@method_decorator(_auth_csrf_decorator, name="dispatch")
class RegisterView(APIView):
    """Create an account and return a bearer token."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _issue_login_response(user, created=True)


@method_decorator(_auth_csrf_decorator, name="dispatch")
class LoginView(APIView):
    """Exchange email and password for JWT bearer tokens."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = request.data.get("username") or request.data.get("email")
        password = request.data.get("password")
        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({"detail": "No active account found with the given credentials"},
                            status=status.HTTP_401_UNAUTHORIZED)
        return _issue_login_response(user)


@method_decorator(_auth_csrf_decorator, name="dispatch")
class RefreshView(APIView):
    """Rotate the HttpOnly refresh cookie and return a new short-lived access token."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if settings.AUTH_BEARER_ONLY:
            return Response({"detail": "Refresh tokens are disabled in bearer-only mode."},
                            status=status.HTTP_410_GONE)
        refresh = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh:
            return Response({"detail": "Refresh token is missing."}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = TokenRefreshSerializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        response = Response({"access": serializer.validated_data["access"], "token_type": "Bearer"})
        rotated_refresh = serializer.validated_data.get("refresh")
        if rotated_refresh:
            _set_refresh_cookie(response, rotated_refresh)
        return response


@method_decorator(_auth_csrf_decorator, name="dispatch")
class LogoutView(APIView):
    """Revoke the current refresh token and clear its cookie."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if settings.AUTH_BEARER_ONLY:
            # Access tokens are stateless; the client discards its token on logout.
            return Response(status=status.HTTP_204_NO_CONTENT)
        refresh = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if refresh:
            try:
                RefreshToken(refresh).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        _clear_refresh_cookie(response)
        return response


class MeView(RetrieveUpdateAPIView):
    """GET/PATCH the signed-in user's profile."""
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user
