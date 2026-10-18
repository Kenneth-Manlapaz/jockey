/* global process, fetch */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localReturn } from '../src/lib/return-path.ts';

const site = process.env.TEST_SITE_URL ?? 'http://127.0.0.1:3000';
const api = `${site}/api/backend`;
async function json(path, init) {
  const response = await fetch(`${api}${path}`, init);
  assert.equal(response.status, 200, path);
  return response.json();
}
async function html(path) {
  const response = await fetch(`${site}${path}`);
  assert.equal(response.status, 200, path);
  return response.text();
}

test('return destinations remain inside the application', () => {
  for (const value of ['https://example.com', '//example.com', '/\\example.com', '/\n/evil']) assert.equal(localReturn(value), '/');
  assert.equal(localReturn('/horse/1?race=2'), '/horse/1?race=2');
});

test('anonymous homepage renders a real calendar and date navigation', async () => {
  const data = await json('/racing/calendar/');
  const page = await html('/');
  assert.match(page, /Find a race meeting/);
  assert.match(page, /aria-label="Racing calendar"/);
  assert.match(page, /Year/);
  if (data.previous_date) assert.ok(page.includes(data.previous_date));
  if (data.next_date) assert.ok(page.includes(data.next_date));
  const december = await html('/?year=2026&month=12');
  assert.match(december, /December 2026/);
  assert.ok(december.includes('year=2027&amp;month=1'));
});

test('learning guide and navigation are public, complete and self-contained', async () => {
  const page = await html('/race-guide');
  for (const chapter of ['getting-started', 'program', 'horse-form', 'racing-statistics', 'betting-terminology', 'official-results', 'dividends', 'glossary']) {
    assert.ok(page.includes(`id="${chapter}"`), `Missing guide chapter ${chapter}`);
  }
  for (const label of ['Racing Stats', 'Learn How to Race', 'About Us', 'Contact Us', 'ILLUSTRATED PROGRAM', 'Last 5 DIST', 'SUPER SIX', 'DD+1']) assert.ok(page.includes(label), label);
  assert.doesNotMatch(page, /dazo\.ph|dividendazo|<iframe/i);
  assert.match(page, /jockey-stats-links/);
  assert.match(page, /aria-controls="jockey-main-navigation"/);
  assert.match(await html('/about'), /independent Philippine racing information/);
  const contact = await html('/contact');
  assert.match(contact, /Download support note/);
  assert.match(contact, /does not send a message/);
  assert.doesNotMatch(contact, /<iframe|dazo\.ph/i);
});

test('calendar is public while meeting programs require membership', async () => {
  const calendar = await json('/racing/calendar/');
  assert.ok(calendar.meetings.length, 'Run seed_platform before journey checks.');
  const meetingId = calendar.meetings[0].id;
  assert.equal((await fetch(`${api}/racing/meetings/${meetingId}/`)).status, 401);
  const page = await fetch(`${site}/meeting/${meetingId}`, { redirect: 'manual' });
  assert.equal(page.status, 307);
  assert.match(page.headers.get('location'), /subscribe\?next=/);
  assert.match(await html('/'), /View membership plans/);
  assert.doesNotMatch(await html('/'), /Sample data · Fictional racing information/);
});

test('race results and statistics cannot be read through legacy or information APIs anonymously', async () => {
  for (const path of ['/racing/results/', '/racing/directory/horses/', '/races/', '/horses/', '/entries/', '/results/']) {
    assert.equal((await fetch(api + path)).status, 401, path);
  }
  for (const path of ['/results', '/directory/horses', '/race/1']) {
    const page = await fetch(site + path, { redirect: 'manual' });
    assert.equal(page.status, 307, path);
    assert.match(page.headers.get('location'), /subscribe\?next=/);
  }
});

test('membership prices and local payment integration are available', async () => {
  const catalog = await json('/subscriptions/plans/');
  assert.equal(Number(catalog.plans.find(p => p.code === 'daily').price), 50);
  assert.equal(Number(catalog.plans.find(p => p.code === 'monthly').price), 499);
  assert.match(await html('/subscribe'), /JOCKEY MEMBERSHIP/);
  const frame = await html('/subscription/payment-frame?checkout=11111111-1111-1111-1111-111111111111');
  assert.match(frame, /Complete preview payment/);
  assert.match(frame, /No money will be charged/);
  assert.equal((await fetch(site + '/subscription/payment-frame?checkout=invalid')).status, 400);
});

test('anonymous private API requests remain unauthorized through the proxy', async () => {
  for (const path of ['/me/', '/favorites/', '/notifications/', '/racing/access/']) {
    assert.equal((await fetch(`${api}${path}`)).status, 401, path);
  }
  const csrf = await fetch(`${api}/auth/csrf/`);
  assert.equal(csrf.status, 200);
  assert.ok(csrf.headers.getSetCookie().some(c => c.startsWith('csrftoken=')));
  const { csrfToken } = await csrf.json();
  assert.ok(csrfToken);
  const login = await fetch(`${api}/auth/login/`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken,
      Cookie: csrf.headers.getSetCookie().map(c => c.split(';')[0]).join('; ') },
    body: JSON.stringify({ username: 'no-such-user@example.invalid', password: 'invalid-local-test-password' }) });
  assert.equal(login.status, 401, 'Invalid credentials should reach login, not fail proxy CSRF validation.');
});
