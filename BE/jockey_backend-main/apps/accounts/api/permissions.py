from rest_framework.permissions import BasePermission

from apps.accounts.models import UserRole


class IsAdminRole(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == UserRole.ADMIN)


class IsStaffRole(BasePermission):
    """Admins and stewards (race officials)."""
    message = "Staff access required."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role in (UserRole.ADMIN, UserRole.STEWARD))
