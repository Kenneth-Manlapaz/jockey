from calendar import monthrange
from datetime import timedelta
from zoneinfo import ZoneInfo
from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.accounts.models import User
from .models import Checkout, Subscription


def active_subscription(user, now=None):
    if not user or not user.is_authenticated:
        return None
    now = now or timezone.now()
    return Subscription.objects.filter(user=user, status='active', starts_at__lte=now, expires_at__gt=now).select_related('plan').order_by('-expires_at').first()


def expiry(start, period):
    if period == 'daily':
        return start + timedelta(hours=24)
    if period != 'monthly':
        raise ValidationError('Unknown subscription period.')
    local = start.astimezone(ZoneInfo('Asia/Manila'))
    year, month = (local.year + 1, 1) if local.month == 12 else (local.year, local.month + 1)
    return local.replace(year=year, month=month, day=min(local.day, monthrange(year, month)[1]))


@transaction.atomic
def complete_preview(*, user, checkout_id):
    # Never use this endpoint for a real provider. Real activation must follow verified payment webhooks.
    if not settings.ENABLE_PREVIEW_SUBSCRIPTIONS:
        raise PermissionDenied('Preview payments are disabled. A payment provider must be configured.')
    User.objects.select_for_update().get(pk=user.pk)  # Serialize all purchases for this account.
    try:
        checkout = Checkout.objects.select_for_update().get(pk=checkout_id, user=user)
    except (Checkout.DoesNotExist, ValueError):
        raise ValidationError('Checkout not found.')
    if checkout.provider != 'preview':
        raise PermissionDenied('This checkout requires payment provider verification.')
    if checkout.status == 'completed':
        return checkout.subscription
    now = timezone.now()
    if checkout.status != 'pending' or checkout.created_at < now - timedelta(minutes=30):
        raise ValidationError('This checkout has expired. Please start again.')
    existing = Subscription.objects.filter(user=user, status='active', expires_at__gt=now).order_by('-expires_at').first()
    start = max(now, existing.expires_at) if existing else now
    subscription = Subscription.objects.create(user=user, plan=checkout.plan, checkout=checkout,
        starts_at=start, expires_at=expiry(start, checkout.period))
    checkout.status, checkout.completed_at = 'completed', now
    checkout.save(update_fields=['status', 'completed_at'])
    return subscription
