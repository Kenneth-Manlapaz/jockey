# Philippine Jockey API

The frontend API wrappers follow the supplied Backend and Frontend Integration Guide.
Local base URL: `http://127.0.0.1:8000/api/v1` (override with
`EXPO_PUBLIC_API_BASE_URL`). The EAS preview build keeps its deployed API URL because
loopback on a phone or cloud build does not point to the developer's computer.

## Endpoint coverage

Every path is relative to `/api/v1`. Typed wrappers are in `endpoints.ts`, and wire
payloads are in `types.ts`.

| Area | Supported methods and paths |
|---|---|
| Health and auth | `GET /health/`, `POST /auth/register/`, `POST /auth/login/`, `POST /auth/token/refresh/`, `POST /auth/logout/` |
| Profile | `GET /me/`, `PUT /me/`, `PATCH /me/` |
| Venues and clubs | `GET /venues/`, `GET /venues/{id}/`, `GET /racing-clubs/`, `GET /racing-clubs/{id}/` |
| Schedule and entries | `GET /meetings/`, `GET /races/`, `GET /races/{id}/`, `GET /races/{id}/entries/`, `GET /entries/`, `GET /entries/{id}/` |
| Tips and participants | `GET /tips/`, `GET /horses/`, `GET /horses/{id}/`, `GET /jockeys/`, `GET /jockeys/{id}/`, `GET /trainers/`, `GET /trainers/{id}/` |
| Results | `GET /results/`, `GET /results/{id}/`, `GET /races/{id}/results/` |
| Betting rules and tickets | `GET /games/`, `GET /games/{id}/`, `GET /games/wager_presets/`, `GET /races/{id}/games/`, `GET /bets/`, `GET /bets/{ticket_number}/`, `POST /bets/`, `POST /races/{id}/settle/` |
| Race notes | `GET /race-notes/?race_id={id}`, `GET /race-notes/{id}/`, `POST /race-notes/`, `PUT /race-notes/{id}/`, `DELETE /race-notes/{id}/` |
| Favorites | `GET /favorites/`, `POST /favorites/`, `DELETE /favorites/{id}/` |
| Notifications | `GET /notifications/`, `GET /notifications/unread_count/`, `POST /notifications/{id}/read/`, `POST /notifications/read_all/` |

Most lists are paginated and are fetched through the shared `allPages` helper. The
provided guide says meetings are unpaginated, while the running local API currently
returns a paginated envelope; the wrapper accepts either shape. Race-note and favorites
lists also accept either arrays or paginated envelopes.

The web app calls the same API client. Set `NEXT_PUBLIC_API_BASE_URL` to override the
base URL for Next.js, or use the shared `EXPO_PUBLIC_API_BASE_URL` in local development.

## Missing backend endpoints

These features are not available as frontend API routes in the supplied guide. Suggested
paths below are proposals for backend discussion only; they are **not implemented routes**.

| Missing capability | Suggested route(s), not implemented | Notes |
|---|---|---|
| Race-card administration | `POST /races/`, `PATCH /races/{id}/`, `DELETE /races/{id}/` | Race schedule data is currently maintained through Django admin. Public race reads exist. |
| Horse, jockey, trainer, and venue administration | `POST`, `PUT/PATCH`, and `DELETE` on their existing collection/detail routes | Read routes exist (horse reads require sign-in); frontend CRUD routes do not. |
| Tip-sheet administration | `POST/PUT/PATCH/DELETE /tips/` and `/tips/{id}/` | `GET /tips/` is available; publishing and editing tips are not exposed. |
| Game and guide administration | Write routes for `/games/`, `/races/{id}/games/`, `/games/wager_presets/`, and guide articles | Existing game and guide APIs are read-only. |
| Live race events and stream | `GET /races/{id}/events/` or a documented WebSocket/SSE route; replay/stream route | `race_live_events` has no public endpoint, and there is no live-video or replay API. |
| Odds history | `GET /entries/{id}/odds-history/` | `entry_odds_history` has no retrieval route. Current odds are available on entries. |
| Push-device registration | `POST/DELETE /notifications/devices/` | `push_devices` exists in the database, but there is no API for registering or removing device tokens. In-app notifications do have routes. |
| Password reset | `POST /auth/password-reset/` and a confirmation route such as `POST /auth/password-reset/confirm/` | Password-reset token storage exists; reset endpoints are not exposed. |
| User settings | `GET/PATCH /me/settings/` | `user_settings` exists but notification preferences, locale, and default wager settings have no API. |
| User session and audit management | Routes to list/revoke sessions and read audit events, if required | Session and audit tables exist; no session-management or audit-log endpoints are documented. |
| Bet drafts | `GET/POST /bet-drafts/`, `GET/PATCH/DELETE /bet-drafts/{id}/` | Draft storage exists; bet drafts have no API resource. |
| Bet status history | `GET /bets/{ticket_number}/history/` | Status history exists in storage but is not returned through a dedicated route. Current ticket status is available on bet responses. |
| Race pools/totalizers | `GET /races/{id}/pools/` or `GET /pools/` | `race_pools` has no endpoint. Dividends are included in result responses. |
| Owner profiles | `GET /owners/` and `GET /owners/{id}/` | Owners are represented in entry/horse data, but there is no owner profile endpoint. |
| Wallet and money movement | Wallet balance/ledger, deposit, withdrawal, and payout routes | The current betting API is simulated and has no real-money wallet or payment endpoints. |

## New database work likely required

Based on the supplied guide and the notes above, these features appear to need new
persistent records or data fields. Confirm against the actual Django models and migrations
before creating anything; the guide may not describe every existing model.

| Capability | Database work likely needed | Backend work needed |
|---|---|---|
| Wallet | Wallet/account balance and an immutable transaction ledger. Add deposit, withdrawal, and payout records only if those flows are in scope. | Balance/ledger APIs, transaction validation, idempotency, and payment-provider integration. Do not store card or banking credentials directly. |
| Live video and replay | Usually no video stored in the app database if a streaming provider hosts it; store provider, stream/replay identifiers, race association, and availability metadata if absent. | Integrate a streaming provider and expose authorized stream/replay metadata. |
| Race-event history | The guide says a `race_live_events` table exists, so new storage may not be needed. Check that it retains the event types and timestamps the app needs. | Add event retrieval or WebSocket/SSE delivery and define ordering, reconnect, and race-status behavior. |
| Odds history | The guide says `entry_odds_history` exists, so new storage may not be needed. Verify it records each odds change with timestamp and entry reference. | Add read API, filters, and retention policy. |
| Push devices | The guide says `push_devices` exists, so new storage may not be needed. Verify token uniqueness, platform, user ownership, and revoked state. | Add register/remove endpoints and push-provider delivery. |
| Password reset | The guide says password-reset token storage exists, so new storage may not be needed. Verify expiry, one-time use, and hashed token storage. | Add request/confirm endpoints and email delivery. |
| User settings | The guide says `user_settings` exists, so new storage may not be needed. Add fields only for preferences the product supports. | Add read/update endpoints and validate supported settings. |
| Session/audit management | The guide says session and audit tables exist, so new storage may not be needed. Verify required event coverage and retention. | Add appropriately permissioned list/revoke/read endpoints if needed. |
| Bet drafts | The guide says draft storage exists, so new storage may not be needed. Verify it stores selections, stake, race/game references, owner, and expiry. | Add draft CRUD endpoints and validate draft state transitions. |
| Bet status history | The guide says status history exists, so new storage may not be needed. Verify status transitions are append-only and tied to a ticket. | Add ticket history endpoint and access control. |
| Race pools/totalizers | The guide says `race_pools` exists, so new storage may not be needed. Verify pool totals and dividend fields match the required display. | Add pool/totalizer reads and settlement updates. |
| Owner profiles | New tables are only needed if owners are not already represented as first-class records; otherwise add missing profile fields to the existing owner model. | Add owner read endpoints and connect owners consistently to horses/entries. |

## Suggested demo seed data

The records below are fictional seed examples for local development. They are not
production data and do not create database tables by themselves. Use the project's
Django fixtures or a data migration to load them after the backend models exist.

```json
{
  "wallets": [
    { "id": "demo-wallet-1", "user_id": "demo-user-1", "currency": "PHP", "balance": "2500.00", "status": "active" }
  ],
  "wallet_transactions": [
    { "id": "demo-txn-1", "wallet_id": "demo-wallet-1", "type": "demo_credit", "amount": "2500.00", "status": "completed", "reference": "DEMO-CREDIT-001", "created_at": "2026-10-17T09:00:00+08:00" }
  ],
  "race_streams": [
    { "race_id": "race-3", "provider": "demo", "stream_id": "demo-race-3", "replay_url": null, "status": "scheduled" }
  ],
  "race_live_events": [
    { "id": "demo-event-1", "race_id": "race-3", "type": "race_status", "data": { "status": "upcoming" }, "occurred_at": "2026-10-17T15:30:00+08:00" }
  ],
  "entry_odds_history": [
    { "id": "demo-odds-1", "entry_id": "entry-1", "odds": "3.10", "recorded_at": "2026-10-17T14:00:00+08:00" }
  ],
  "user_settings": [
    { "user_id": "demo-user-1", "locale": "en-PH", "push_notifications": true, "default_wager_php": "50.00" }
  ],
  "push_devices": [
    { "id": "demo-device-1", "user_id": "demo-user-1", "platform": "web", "token": "DEMO-ONLY-NOT-A-REAL-PUSH-TOKEN", "revoked_at": null }
  ],
  "bet_drafts": [
    { "id": "demo-draft-1", "user_id": "demo-user-1", "race_id": "race-3", "game": "WIN", "selections": [{ "horse_number": 1 }], "stake": "50.00", "expires_at": "2026-10-17T16:00:00+08:00" }
  ],
  "bet_status_history": [
    { "id": "demo-status-1", "ticket_number": "PJA-DEMO-001", "status": "pending", "changed_at": "2026-10-17T14:05:00+08:00" }
  ],
  "race_pools": [
    { "id": "demo-pool-1", "race_id": "race-3", "game": "WIN", "total_php": "248500.00", "per_unit_php": "10.00", "status": "open" }
  ],
  "owners": [
    { "id": "demo-owner-1", "name": "Sample Racing Stable", "location": "Batangas", "is_demo": true }
  ]
}
```

Keep demo balances and pool totals isolated from real-money environments. The sample
device token and stream identifiers are placeholders and cannot deliver notifications or
video.

## Backend work that likely does not need new tables

These are primarily API permissions and write operations over existing race, participant,
tip, and game records. New schema is needed only if the current models lack required fields.

- Create, update, and delete race cards, horses, jockeys, trainers, venues, tips, and game
  definitions; enforce staff/admin permissions and validation.
- Publish guide content through a stable read API if guide articles are intended to be
  editable through the backend.
- Add database fields only when needed for race conditions, withdrawals, coupled entries,
  announcements, sponsor/prize notes, or other data required by the UI but absent from the
  existing models.

Before wiring any item above into the UI, the backend needs to confirm its route, access
rules, request/response schema, and error behavior.

Betting is simulated. Do not present the API as accepting real money or providing
real-world payouts.
