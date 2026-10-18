"""Exercise the real Next.js auth proxy with a temporary, isolated local account.

Run from the backend directory while both development servers are running.
The account created by this script is removed in finally; no existing account is changed.
"""
import http.cookiejar
import json
import os
import sys
import uuid
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, build_opener, HTTPCookieProcessor

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.local')
import django
django.setup()
from django.conf import settings
from apps.accounts.models import User
from apps.races.models import Race
from apps.subscriptions.models import Subscription, Checkout

if settings.DB_ENGINE != 'sqlite' or Race.objects.filter(is_demo=False).exists():
    raise SystemExit('This verification script only runs against the local fictional SQLite database.')

base = 'http://127.0.0.1:3000/api/backend'
cookies = http.cookiejar.CookieJar()
opener = build_opener(HTTPCookieProcessor(cookies))
email = f'proxy-verification-{uuid.uuid4().hex}@example.invalid'
password = uuid.uuid4().hex + 'Aa!'
original_users = User.objects.count()


def send(path, body=None, access=None, csrf=None, method=None):
    headers = {'Accept': 'application/json'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    if access:
        headers['Authorization'] = f'Bearer {access}'
    if csrf:
        headers['X-CSRFToken'] = csrf
    # Next.js canonicalizes to slashless browser-facing paths; urllib does not replay POST 308s.
    request = Request(base + path.rstrip('/'), data=json.dumps(body).encode() if body is not None else None,
                      headers=headers, method=method)
    try:
        with opener.open(request, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except HTTPError as error:
        raw = error.read()
        try:
            return error.code, json.loads(raw)
        except ValueError:
            return error.code, {'error': 'Non-JSON error response'}


try:
    status, data = send('/auth/csrf/')
    assert status == 200
    csrf = data['csrfToken']
    status, registered = send('/auth/register/', {'first_name': 'Temporary', 'last_name': 'Verification',
        'email': email, 'password': password, 'accept_terms': True}, csrf=csrf)
    assert status == 201, (status, registered)
    assert any(c.name == 'refresh_token' and c.path == '/api/backend/auth/' for c in cookies), 'Refresh cookie proxy path was not preserved.'
    status, person = send('/me/', access=registered['access'])
    assert status == 200 and person['email'] == email
    status, signed_in = send('/auth/login/', {'username': email, 'password': password}, csrf=csrf)
    assert status == 200
    status, _ = send('/racing/results/', access=signed_in['access'])
    assert status == 403, 'An account alone must not unlock racing records.'
    status, checkout = send('/subscriptions/checkout/', {'plan': 'daily'}, access=signed_in['access'])
    assert status == 201
    assert float(checkout['price']) == 50
    status, access = send('/subscriptions/confirm-preview/', {'checkout_id': checkout['id']}, access=signed_in['access'])
    assert status == 200
    status, catalog = send('/racing/directory/horses/', access=signed_in['access'])
    assert status == 200 and catalog['count'] >= 128
    status, calendar = send('/racing/calendar/')
    meeting_id = next(m['id'] for m in calendar['meetings'] if m['venue'] in ['Crown Valley Racecourse', 'Bayview Racing Park', 'Highland Downs'])
    status, meeting = send(f'/racing/meetings/{meeting_id}/', access=signed_in['access'])
    assert status == 200
    race_id = meeting['races'][0]['id']
    status, program = send(f'/racing/races/{race_id}/', access=signed_in['access'])
    assert status == 200 and len(program['entries']) == 8
    # No Authorization header: SSR must use the HttpOnly access cookie set by the proxy.
    with opener.open(f'http://127.0.0.1:3000/race/{race_id}', timeout=30) as page:
        rendered = page.read().decode()
        assert 'Declared entries' in rendered and 'Sample data ·' not in rendered
    with opener.open(f"http://127.0.0.1:3000/horse/{program['entries'][0]['horse']['id']}?race={race_id}", timeout=30) as page:
        assert 'Comparable form' in page.read().decode()
    status, published = send('/racing/results/', access=signed_in['access'])
    assert status == 200 and published['count'] > 200
    horse = Race.objects.filter(entries__isnull=False).first().entries.first().horse_id
    status, favorite = send('/favorites/', {'target_type': 'horse', 'horse': horse}, access=signed_in['access'])
    assert status == 201
    status, saved = send('/favorites/', access=signed_in['access'])
    assert status == 200 and saved['count'] == 1
    status, _ = send(f"/favorites/{favorite['id']}/", access=signed_in['access'], method='DELETE')
    assert status == 204
    status, refreshed = send('/auth/token/refresh/', {}, csrf=csrf)
    assert status == 200 and refreshed['access']
    status, _ = send('/auth/logout/', {}, csrf=csrf)
    assert status == 204
    status, _ = send('/auth/token/refresh/', {}, csrf=csrf)
    assert status == 401, 'Logged-out refresh session was still usable.'
    print('PASS: registration/login, membership checkout/activation, gated APIs, subscriber SSR race/horse pages, results, favorites, refresh and logout.')
finally:
    Subscription.objects.filter(user__email=email).delete()
    Checkout.objects.filter(user__email=email).delete()
    User.objects.filter(email=email).delete()
    assert User.objects.count() == original_users, 'Unexpected account count change.'
    print('Temporary verification account removed; original account count preserved.')
