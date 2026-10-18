from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from apps.accounts.models import User
from apps.subscriptions.models import Plan, Checkout, Subscription
from apps.subscriptions.services import expiry, complete_preview


@override_settings(RACING_SUBSCRIPTION_REQUIRED=True, ENABLE_PREVIEW_SUBSCRIPTIONS=True)
class MembershipTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='member@example.com', password='member-password-123')
        self.client = APIClient()
        self.daily = Plan.objects.get(code='daily')
        self.monthly = Plan.objects.get(code='monthly')

    def open_checkout(self, plan='daily'):
        self.client.force_authenticate(self.user)
        response = self.client.post('/api/v1/subscriptions/checkout/', {'plan': plan}, format='json')
        self.assertEqual(response.status_code, 201)
        return response.data['id']

    def test_prices_and_public_calendar(self):
        plans = self.client.get('/api/v1/subscriptions/plans/')
        self.assertEqual(plans.status_code, 200)
        self.assertEqual(str(plans.data['plans'][0]['price']), '50.00')
        self.assertEqual(self.client.get('/api/v1/racing/calendar/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/subscriptions/status/').status_code, 401)

    def test_anonymous_and_signed_in_without_subscription_cannot_read_racing_apis(self):
        paths = ['/api/v1/racing/results/', '/api/v1/racing/directory/horses/', '/api/v1/racing/races/1/',
                 '/api/v1/racing/horses/1/', '/api/v1/racing/meetings/1/', '/api/v1/racing/events/1/',
                 '/api/v1/races/', '/api/v1/entries/', '/api/v1/horses/', '/api/v1/results/',
                 '/api/v1/jockeys/', '/api/v1/trainers/', '/api/v1/tips/']
        for path in paths:
            self.assertEqual(self.client.get(path).status_code, 401, path)
        self.client.force_authenticate(self.user)
        for path in paths:
            response = self.client.get(path)
            self.assertEqual(response.status_code, 403, path)
            self.assertNotIn('results', response.data)

    def test_preview_activates_daily_access_for_exactly_24_hours(self):
        checkout = self.open_checkout()
        response = self.client.post('/api/v1/subscriptions/confirm-preview/', {'checkout_id': checkout}, format='json')
        self.assertEqual(response.status_code, 200)
        sub = Subscription.objects.get(checkout_id=checkout)
        self.assertEqual(sub.expires_at - sub.starts_at, timedelta(hours=24))
        self.assertTrue(self.client.get('/api/v1/subscriptions/status/').data['active'])

    def test_status_shows_the_combined_end_of_a_contiguous_renewal(self):
        first = complete_preview(user=self.user, checkout_id=self.open_checkout())
        second = complete_preview(user=self.user, checkout_id=self.open_checkout('monthly'))
        response = self.client.get('/api/v1/subscriptions/status/')
        self.assertEqual(response.data['access_until'], second.expires_at)
        self.assertEqual(response.data['subscription']['expires_at'], first.expires_at)
        self.assertEqual(self.client.get('/api/v1/racing/results/').status_code, 200)
        self.assertEqual(self.client.get('/api/v1/horses/').status_code, 200)

    def test_monthly_is_a_calendar_month_and_clamps_month_end(self):
        start = datetime(2026, 1, 31, 16, 15, tzinfo=ZoneInfo('Asia/Manila'))
        end = expiry(start, 'monthly')
        self.assertEqual(end, datetime(2026, 2, 28, 16, 15, tzinfo=ZoneInfo('Asia/Manila')))
        self.assertEqual(expiry(datetime(2028, 1, 31, tzinfo=ZoneInfo('Asia/Manila')), 'monthly').day, 29)
        self.assertEqual(expiry(datetime(2026, 12, 20, tzinfo=ZoneInfo('Asia/Manila')), 'monthly').year, 2027)

    def test_completed_checkout_is_idempotent(self):
        checkout = self.open_checkout()
        one = complete_preview(user=self.user, checkout_id=checkout)
        two = complete_preview(user=self.user, checkout_id=checkout)
        self.assertEqual(one.pk, two.pk)
        self.assertEqual(Subscription.objects.count(), 1)

    def test_expired_cancelled_and_future_subscriptions_do_not_grant_access(self):
        self.client.force_authenticate(self.user)
        now = timezone.now()
        for start, end, status in [(now-timedelta(days=2), now-timedelta(days=1), 'active'),
                                  (now, now+timedelta(days=1), 'cancelled'),
                                  (now+timedelta(days=1), now+timedelta(days=2), 'active')]:
            Subscription.objects.create(user=self.user, plan=self.daily, starts_at=start, expires_at=end, status=status)
        self.assertFalse(self.client.get('/api/v1/subscriptions/status/').data['active'])
        self.assertEqual(self.client.get('/api/v1/racing/results/').status_code, 403)

    def test_checkout_is_owned_and_price_duration_are_snapshotted(self):
        checkout = self.open_checkout()
        self.daily.price = '999.00'; self.daily.period = 'monthly'; self.daily.save()
        sub = complete_preview(user=self.user, checkout_id=checkout)
        self.assertEqual(sub.expires_at-sub.starts_at, timedelta(hours=24))
        self.assertEqual(str(Checkout.objects.get(pk=checkout).price), '50.00')
        other = User.objects.create_user(email='other@example.com', password='other-password-123')
        self.client.force_authenticate(other)
        self.assertEqual(self.client.post('/api/v1/subscriptions/confirm-preview/', {'checkout_id': checkout}).status_code, 400)
        self.assertFalse(self.client.get('/api/v1/subscriptions/status/').data['active'])

    def test_renewal_preserves_existing_time(self):
        first = complete_preview(user=self.user, checkout_id=self.open_checkout())
        second = complete_preview(user=self.user, checkout_id=self.open_checkout('monthly'))
        self.assertEqual(second.starts_at, first.expires_at)
        self.assertEqual(second.expires_at, expiry(first.expires_at, 'monthly'))
        self.assertTrue(self.client.get('/api/v1/subscriptions/status/').data['active'])

    @override_settings(ENABLE_PREVIEW_SUBSCRIPTIONS=False)
    def test_preview_can_be_disabled_without_granting_access(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.post('/api/v1/subscriptions/checkout/', {'plan': 'daily'}).status_code, 403)
        item = Checkout.objects.create(user=self.user, plan=self.daily, price='50', currency='PHP', period='daily')
        self.assertEqual(self.client.post('/api/v1/subscriptions/confirm-preview/', {'checkout_id': item.pk}).status_code, 403)
        self.assertEqual(Subscription.objects.count(), 0)

    def test_checkout_expiry_and_invalid_inputs(self):
        checkout = self.open_checkout()
        Checkout.objects.filter(pk=checkout).update(created_at=timezone.now()-timedelta(hours=1))
        self.assertEqual(self.client.post('/api/v1/subscriptions/confirm-preview/', {'checkout_id': checkout}).status_code, 400)
        self.assertEqual(self.client.post('/api/v1/subscriptions/confirm-preview/', {'checkout_id': 'broken'}).status_code, 400)
        self.assertEqual(self.client.post('/api/v1/subscriptions/checkout/', {'plan': 'broken'}).status_code, 400)
        self.assertEqual(Subscription.objects.count(), 0)
