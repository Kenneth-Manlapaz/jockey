from django.urls import path
from .views import LoginView, LogoutView, MeView, RefreshView, RegisterView, csrf_token

urlpatterns = [
    path("auth/csrf/", csrf_token, name="auth-csrf"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/token/refresh/", RefreshView.as_view(), name="auth-token-refresh"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="me"),
]
