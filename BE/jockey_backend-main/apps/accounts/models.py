"""Users, authentication and permissions. Tables: users, user_sessions,
password_reset_tokens, user_settings, audit_logs."""
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.fields import UnsignedAutoField as IdField

# Models a steward (race official) may manage in the admin site, by app label.
STEWARD_PERMISSIONS = {
    "races": {"race", "raceentry", "racelivevent", "entryoddshistory"},
    "results": {"raceresult", "raceresultplacement"},
    "meetings": {"meeting"},
    "racing_info": {"bettingevent", "eventleg", "officialdividend", "announcement", "sectionaltime", "entrychange", "resultrevision"},
    "betting": {"racedividend", "racegame", "racepool"},
}


class UserRole(models.TextChoices):
    USER = "user", "User"
    ADMIN = "admin", "Admin"
    STEWARD = "steward", "Steward"


class UserManager(BaseUserManager):
    def _create(self, email, password, **extra):
        if not email:
            raise ValueError("An email address is required.")
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra):
        extra.setdefault("role", UserRole.USER)
        return self._create(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra["role"] = UserRole.ADMIN
        return self._create(email, password, **extra)


class User(AbstractBaseUser):
    """Table `users`. Login is by email; `password` maps to `password_hash`."""
    id = IdField(primary_key=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80)
    email = models.EmailField(max_length=255, unique=True)
    mobile_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    password = models.CharField("password", max_length=255, db_column="password_hash")
    last_login = models.DateTimeField("last login", null=True, blank=True, db_column="last_login_at")
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    role = models.CharField(max_length=10, choices=UserRole.choices, default=UserRole.USER)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    mobile_verified_at = models.DateTimeField(null=True, blank=True)
    terms_accepted_at = models.DateTimeField(default=timezone.now)
    terms_version = models.CharField(max_length=20, default="1.0")
    privacy_version = models.CharField(max_length=20, default="1.0")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()
    USERNAME_FIELD = "email"
    EMAIL_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    @property
    def initials(self):
        return f"{self.first_name[:1]}{self.last_name[:1]}".upper()

    # --- Django admin permissions, driven by `role` instead of groups ------
    @property
    def is_staff(self):
        return self.is_active and self.role in (UserRole.ADMIN, UserRole.STEWARD)

    @property
    def is_superuser(self):
        return self.is_active and self.role == UserRole.ADMIN

    def has_perm(self, perm, obj=None):
        if not self.is_active:
            return False
        if self.role == UserRole.ADMIN:
            return True
        if self.role == UserRole.STEWARD:
            app_label, _, codename = perm.partition(".")
            return codename.split("_", 1)[-1] in STEWARD_PERMISSIONS.get(app_label, ())
        return False

    def has_perms(self, perm_list, obj=None):
        return all(self.has_perm(p, obj) for p in perm_list)

    def has_module_perms(self, app_label):
        return self.is_staff and (self.role == UserRole.ADMIN or app_label in STEWARD_PERMISSIONS)


class UserSession(models.Model):
    user = models.ForeignKey(User, models.CASCADE, related_name="sessions_set")
    refresh_token_hash = models.CharField(max_length=255, unique=True)
    remember_me = models.BooleanField(default=False)
    device_name = models.CharField(max_length=120, null=True, blank=True)
    device_platform = models.CharField(max_length=30, null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    user_agent = models.CharField(max_length=500, null=True, blank=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "user_sessions"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, models.CASCADE)
    token_hash = models.CharField(max_length=255, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "password_reset_tokens"


class UserSettings(models.Model):
    user = models.OneToOneField(User, models.CASCADE, primary_key=True, related_name="settings")
    language = models.CharField(max_length=10, default="en")
    timezone = models.CharField(max_length=50, default="Asia/Manila")
    default_wager_amount = models.DecimalField(max_digits=12, decimal_places=2, default=50)
    push_enabled = models.BooleanField(default=True)
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    notify_race_reminders = models.BooleanField(default=True)
    notify_results = models.BooleanField(default=True)
    notify_bet_settled = models.BooleanField(default=True)
    show_odds_decimal = models.BooleanField(default=True)
    marketing_consent = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_settings"
        verbose_name_plural = "user settings"


class AuditLog(models.Model):
    actor = models.ForeignKey(User, models.SET_NULL, null=True, blank=True, related_name="+")
    action = models.CharField(max_length=80)
    entity = models.CharField(max_length=60)
    entity_id = models.CharField(max_length=64)
    before_data = models.JSONField(null=True, blank=True)
    after_data = models.JSONField(null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at", "-id"]
