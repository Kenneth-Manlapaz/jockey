"""Settings shared by every environment. local.py and production.py extend this."""
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env(DJANGO_DEBUG=(bool, False))
if (BASE_DIR / ".env").exists():
    environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="dev-only-insecure-key-change-me")
DEBUG = env("DJANGO_DEBUG")
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CSRF_TRUSTED_ORIGINS = env.list("DJANGO_CSRF_TRUSTED_ORIGINS", default=[])

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework.authtoken",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
]
# Order matters only for reading: lower layers first (see README "Dependency rule").
LOCAL_APPS = [
    "apps.core",
    "apps.accounts",
    "apps.venues",
    "apps.participants",
    "apps.horses",
    "apps.races",
    "apps.meetings",
    "apps.results",
    "apps.racing_info",
    "apps.subscriptions",
    "apps.betting",       # DEMO betting (simulated tickets only; no real money)
    "apps.engagement",
    "apps.api",
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

# ---- Database ----------------------------------------------------------
DB_ENGINE = env("DB_ENGINE", default="mysql").lower()
if DB_ENGINE in ("mysql", "mariadb"):
    DATABASES = {"default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": env("DB_NAME", default="philippine_jockey"),
        "USER": env("DB_USER", default="root"),
        "PASSWORD": env("DB_PASSWORD", default=""),
        "HOST": env("DB_HOST", default="127.0.0.1"),
        "PORT": env("DB_PORT", default="3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }}
else:  # sqlite: quick start and tests without a database server
    DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": BASE_DIR / "db.sqlite3"}}

# True when the triggers from sql/02_philippine_jockey_logic.sql are installed.
# They already write bet status history, so Django must not write it twice.
USE_DB_TRIGGERS = env.bool("USE_DB_TRIGGERS", default=DB_ENGINE in ("mysql", "mariadb"))

AUTH_USER_MODEL = "accounts.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
]

LANGUAGE_CODE = "en"
TIME_ZONE = "Asia/Manila"   # display only; the database stores UTC
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_ROOT.mkdir(exist_ok=True)   # keeps WhiteNoise quiet before the first collectstatic
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Phase 1 is information-only: set ENABLE_BETTING_API=0 to hide the games, bets and settle endpoints.
ENABLE_BETTING_API = env.bool("ENABLE_BETTING_API", default=True)

# ---- API ---------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "apps.core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "EXCEPTION_HANDLER": "apps.api.exceptions.exception_handler",
}

# Origins of your Next.js frontend, e.g. http://localhost:3000
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:3000"])
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = list(dict.fromkeys(CSRF_TRUSTED_ORIGINS + CORS_ALLOWED_ORIGINS))

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
AUTH_REFRESH_COOKIE_NAME = "refresh_token"
AUTH_REFRESH_COOKIE_PATH = "/api/v1/auth/"
AUTH_REFRESH_COOKIE_SECURE = not DEBUG
AUTH_REFRESH_COOKIE_SAMESITE = "Lax"
# Optional bearer-only auth for local browser development. No cookie refresh token is issued.
AUTH_BEARER_ONLY = env.bool("AUTH_BEARER_ONLY", default=False)

RACING_SUBSCRIPTION_REQUIRED = env.bool('RACING_SUBSCRIPTION_REQUIRED', default=True)
ENABLE_PREVIEW_SUBSCRIPTIONS = env.bool('ENABLE_PREVIEW_SUBSCRIPTIONS', default=False)
