from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from .services import active_subscription


class HasRacingAccess(BasePermission):
    def has_permission(self, request, view):
        if not getattr(settings, 'RACING_SUBSCRIPTION_REQUIRED', True):
            return True
        if not request.user.is_authenticated:
            raise NotAuthenticated('Sign in and choose a subscription to access racing information.')
        if not active_subscription(request.user):
            raise PermissionDenied('An active daily or monthly subscription is required.', code='subscription_required')
        return True
