"""Production settings: HTTPS, secure cookies, no insecure defaults."""
from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

if SECRET_KEY.startswith("dev-only"):  # noqa: F405
    raise ImproperlyConfigured("Set DJANGO_SECRET_KEY to a long random value in production.")

SECURE_SSL_REDIRECT = env.bool("DJANGO_SSL_REDIRECT", default=True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
AUTH_REFRESH_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = env.int("DJANGO_HSTS_SECONDS", default=31536000)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_CONTENT_TYPE_NOSNIFF = True
