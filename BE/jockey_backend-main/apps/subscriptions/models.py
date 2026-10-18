import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class Plan(models.Model):
    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=100)
    period = models.CharField(max_length=10, choices=[('daily', '24 hours'), ('monthly', 'One calendar month')])
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='PHP')
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(price__gt=0), name='positive_subscription_price')]

    def __str__(self):
        return self.name


class Checkout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.PROTECT, related_name='subscription_checkouts')
    plan = models.ForeignKey(Plan, models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3)
    period = models.CharField(max_length=10)
    provider = models.CharField(max_length=30, default='preview')
    status = models.CharField(max_length=16, default='pending', choices=[('pending', 'Pending'), ('completed', 'Completed'), ('expired', 'Expired')])
    created_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)


class Subscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, models.PROTECT, related_name='subscriptions')
    plan = models.ForeignKey(Plan, models.PROTECT)
    checkout = models.OneToOneField(Checkout, models.PROTECT, null=True, blank=True, related_name='subscription')
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(db_index=True)
    status = models.CharField(max_length=12, default='active', choices=[('active', 'Active'), ('cancelled', 'Cancelled')])
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(expires_at__gt=models.F('starts_at')), name='subscription_positive_duration')]
        indexes = [models.Index(fields=['user', 'status', 'expires_at'], name='subscription_access_idx')]
