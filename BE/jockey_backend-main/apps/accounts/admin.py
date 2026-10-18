from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import BaseUserCreationForm, UserChangeForm

from .models import AuditLog, PasswordResetToken, User, UserSession, UserSettings


class UserCreateForm(BaseUserCreationForm):
    class Meta:
        model = User
        fields = ("email", "first_name", "last_name", "role")


class UserEditForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"


class UserSettingsInline(admin.StackedInline):
    model = UserSettings
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserEditForm
    add_form = UserCreateForm
    list_display = ("email", "first_name", "last_name", "role", "is_active", "created_at")
    list_filter = ("role", "is_active")
    search_fields = ("email", "first_name", "last_name", "mobile_number")
    ordering = ("-created_at",)
    filter_horizontal = ()
    inlines = [UserSettingsInline]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("first_name", "last_name", "mobile_number", "avatar_url")}),
        ("Access", {"fields": ("role", "is_active")}),
        ("Consent", {"fields": ("terms_accepted_at", "terms_version", "privacy_version")}),
        ("Dates", {"fields": ("email_verified_at", "mobile_verified_at", "last_login", "deleted_at")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",),
                "fields": ("email", "first_name", "last_name", "role", "password1", "password2")}),
    )


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "entity", "entity_id")
    list_filter = ("action", "entity")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


admin.site.register(UserSession)
admin.site.register(PasswordResetToken)
