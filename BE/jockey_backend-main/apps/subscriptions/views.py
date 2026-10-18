from django.conf import settings
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import serializers
from .models import Plan, Checkout
from .services import active_subscription, complete_preview


@api_view(['GET'])
@permission_classes([AllowAny])
def plans(request):
    return Response({'plans': list(Plan.objects.filter(is_active=True).order_by('price').values('id', 'code', 'name', 'period', 'price', 'currency')),
                     'preview_checkout_enabled': settings.ENABLE_PREVIEW_SUBSCRIPTIONS})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def status(request):
    subscription = active_subscription(request.user)
    access_until = subscription.expires_at if subscription else None
    if access_until:
        from .models import Subscription
        for upcoming in Subscription.objects.filter(user=request.user, status='active', expires_at__gt=access_until).order_by('starts_at'):
            if upcoming.starts_at <= access_until:
                access_until = max(access_until, upcoming.expires_at)
    return Response({'active': subscription is not None, 'subscription': {
        'id': subscription.pk, 'plan': subscription.plan.name, 'period': subscription.checkout.period if subscription.checkout else subscription.plan.period,
        'starts_at': subscription.starts_at, 'expires_at': subscription.expires_at} if subscription else None,
        'access_until': access_until})


class CheckoutInput(serializers.Serializer):
    plan = serializers.SlugRelatedField(slug_field='code', queryset=Plan.objects.filter(is_active=True))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def checkout(request):
    if not settings.ENABLE_PREVIEW_SUBSCRIPTIONS:
        raise PermissionDenied('Checkout is not yet available. A payment provider must be configured.')
    serializer = CheckoutInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    plan = serializer.validated_data['plan']
    item = Checkout.objects.create(user=request.user, plan=plan, price=plan.price, currency=plan.currency, period=plan.period)
    return Response({'id': str(item.pk), 'price': item.price, 'currency': item.currency, 'plan': plan.name, 'period': item.period, 'provider': 'preview'}, status=201)


class CompletionInput(serializers.Serializer):
    checkout_id = serializers.UUIDField()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_preview(request):
    serializer = CompletionInput(data=request.data)
    serializer.is_valid(raise_exception=True)
    sub = complete_preview(user=request.user, checkout_id=serializer.validated_data['checkout_id'])
    return Response({'active': sub.starts_at <= timezone.now(),
                     'starts_at': sub.starts_at, 'expires_at': sub.expires_at})
