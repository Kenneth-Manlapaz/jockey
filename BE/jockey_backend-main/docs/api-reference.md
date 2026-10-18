# Philippine Jockey API reference

Detailed reference for the API currently implemented in this repository. The API is a Django REST Framework backend; the examples use the fictional demo data and IDs can differ in another database.

## 1. Base URL and conventions

Local base URL:

```text
http://127.0.0.1:8000/api/v1
```

In Postman, create an environment variable named `baseUrl` with that value. Then use `{{baseUrl}}/horses/`, for example. Use the same host consistently for the frontend, API, and cookies: `localhost` and `127.0.0.1` are different hosts.

For JSON requests, set `Content-Type: application/json`. List endpoints use page-number pagination by default:

```json
{
  "count": 11,
  "next": null,
  "previous": null,
  "results": []
}
```

Use `?page=2&page_size=50` to select a page and page size. The default page size is 20 and the maximum is 100. `next` and `previous` are URLs or `null`.

Dates use `YYYY-MM-DD`; timestamps are ISO 8601 and include a timezone. Decimal amounts are returned as JSON strings to preserve precision.

## 2. Authentication and permissions

Protected requests use the JWT **access** token:

```http
Authorization: Bearer <access-token>
```

In Postman, use **Authorization → Bearer Token** and paste only the JWT value. Postman adds the `Bearer` prefix.

Login and registration return an access token that lasts 5 minutes. A longer-lived refresh JWT (7 days) is set as an HttpOnly cookie. The refresh token is rotated and the previous token blacklisted when refreshed. Do not send the refresh cookie as a Bearer token.

### Browser CSRF flow

Login, registration, refresh, and logout are CSRF-protected because the browser stores and automatically sends the refresh cookie:

1. `GET /auth/csrf/` with browser credentials included.
2. Read the response's `csrfToken` and preserve the returned CSRF cookie.
3. Send the `csrfToken` as `X-CSRFToken` on the relevant POST request. Include credentials so the browser sends cookies.

A normal GET that authenticates with the Bearer header does not need a CSRF token.

### Permission summary

| Access | Endpoints |
|---|---|
| Public | health, CSRF bootstrap, login, registration, venues, meetings, races, entries, results, jockeys, trainers, games, race games |
| Access token required | `/me/`, racing clubs, horses, bets, favorites, notifications |
| Staff access token required (`admin` or `steward`) | race settlement |
| Browser CSRF required on POST | login, registration, refresh, logout |

The public data endpoints are read-only. `racing-clubs` and `horses` are protected in the current implementation. Betting endpoints are demo-only: no wallet, deposits, or real payouts.

## 3. Common errors

Most API errors use this shape:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed.",
    "details": {
      "email": ["An account with this email already exists."]
    }
  }
}
```

Common codes include `validation_error` (400), `not_authenticated` (401), `permission_denied` (403), `not_found` (404), `method_not_allowed` (405), and `betting_error` (400). Login with a wrong password returns 401. A missing, expired, or invalid access token returns 401. A logged-in non-staff user trying to settle a race gets 403.

## 4. Health

### `GET /health/`

Public database/application health check. No request body.

```json
{
  "status": "ok",
  "database": "ok",
  "api_version": "v1",
  "time": "2026-10-13T20:00:00+08:00",
  "data_notice": "Demo data. Not official or live racing information."
}
```

Returns HTTP 503 and `status: "degraded"` if the database check fails.

## 5. Authentication and user profile

### `GET /auth/csrf/`

Public CSRF bootstrap. Browser clients must include credentials. The response also sets a CSRF cookie.

```json
{"csrfToken": "masked-csrf-token-value"}
```

### `POST /auth/register/`

Public account creation. Send `X-CSRFToken` for browser calls. `accept_terms` must be `true`.

```json
{
  "first_name": "Jamie",
  "last_name": "Reyes",
  "email": "jamie@example.com",
  "mobile_number": "09171234567",
  "password": "Strong-pass-123",
  "accept_terms": true
}
```

`mobile_number` is optional. The password must pass Django's password validators. Success is HTTP 201; it sets the refresh cookie and returns:

```json
{
  "access": "eyJ...access-jwt...",
  "token_type": "Bearer",
  "user": {
    "id": 14,
    "first_name": "Jamie",
    "last_name": "Reyes",
    "email": "jamie@example.com",
    "mobile_number": "09171234567",
    "avatar_url": null,
    "initials": "JR",
    "role": "user"
  }
}
```

### `POST /auth/login/`

Public login. Send `X-CSRFToken` for browser calls. The backend accepts either `username` (the email address) or `email` plus `password`.

```json
{
  "username": "jamie@example.com",
  "password": "Strong-pass-123"
}
```

Success is HTTP 200, sets the refresh cookie, and returns:

```json
{
  "access": "eyJ...access-jwt...",
  "token_type": "Bearer"
}
```

Wrong credentials return HTTP 401. Use the access value in the Authorization header on protected endpoints.

### `POST /auth/token/refresh/`

No JSON body. Send the refresh cookie and `X-CSRFToken`; browser calls must include credentials. The API rotates the refresh cookie and returns a new access token:

```json
{
  "access": "eyJ...new-access-jwt...",
  "token_type": "Bearer"
}
```

If there is no valid refresh cookie, the response is 401. The client should clear its in-memory access token and prompt for login.

### `POST /auth/logout/`

No JSON body. Send the refresh cookie and `X-CSRFToken`. The endpoint revokes the refresh token, clears its cookie, and returns HTTP 204 with an empty body.

### `GET /me/`

Access token required. Returns the current user's profile:

```json
{
  "id": 14,
  "first_name": "Jamie",
  "last_name": "Reyes",
  "email": "jamie@example.com",
  "mobile_number": "09171234567",
  "avatar_url": null,
  "initials": "JR",
  "role": "user"
}
```

### `PUT /me/` and `PATCH /me/`

Access token required. Only profile fields can be changed; `id`, `email`, and `role` are read-only. `PUT` sends the profile fields to replace; `PATCH` changes only the fields supplied. Example:

```json
{
  "first_name": "Jamie",
  "last_name": "Santos",
  "mobile_number": "09170000000",
  "avatar_url": "https://example.test/jamie.png"
}
```

The response is the updated profile in the same shape as `GET /me/`.

## 6. Racing clubs and venues

### `GET /racing-clubs/` and `GET /racing-clubs/{id}/`

Access token required. Optional filter: `search` (case-insensitive club name search).

```http
GET /racing-clubs/?search=Postman
```

The list is paginated:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 2,
      "name": "Postman Demo Racing Club",
      "short_name": "PDRC",
      "logo_url": null,
      "website_url": null,
      "created_at": "2026-10-13T20:13:12+08:00"
    }
  ]
}
```

### `GET /venues/` and `GET /venues/{id}/`

Public, read-only. Optional filter: `search` (venue name).

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Sample Racing Venue",
      "tagline": "A modern racing destination",
      "description": "A fictional premium venue created for demonstration.",
      "city": "Metro Manila",
      "province": null,
      "country_code": "PH",
      "hero_image_url": null,
      "club_name": "Philippine Racing Club",
      "is_fictional": true,
      "surfaces": [
        {"surface": "turf", "circumference_m": 1800},
        {"surface": "dirt", "circumference_m": 1600}
      ],
      "courses": [
        {"name": "Main Oval", "min_distance_m": 1600, "max_distance_m": 2400, "description": null}
      ],
      "facilities": [
        {"code": "grandstand", "label": "Grandstand viewing"}
      ]
    }
  ]
}
```

Venue fields `surfaces`, `courses`, and `facilities` are nested arrays. Surface values are `turf`, `dirt`, or `synthetic`.

## 7. Meetings, races, and entries

### `GET /meetings/`

Public, derived from races (there is no meetings table). Optional filters: `date=YYYY-MM-DD`, `venue=<venue-id>`.

```http
GET /meetings/?date=2026-10-13&venue=1
```

Paginated response:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "venue_id": 1,
      "venue_name": "Sample Racing Venue",
      "race_date": "2026-10-13",
      "race_count": 4,
      "first_post_time": "2026-10-13T13:30:00+08:00"
    }
  ]
}
```

### `GET /races/` and `GET /races/{id}/`

Public, read-only. List filters: `date`, `status`, `venue`, `featured`. `featured=1` or `featured=true` enables the featured-only filter. Status values: `upcoming`, `ongoing`, `completed`, `cancelled`, `postponed`.

### `GET /tips/`

Public, read-only tip sheets. Optionally filter by meeting date with `?date=YYYY-MM-DD`. Staff add tip sheets and per-race selections in Django admin under **Tip sheets**. `raw_selection` preserves exactly how the tip was published; `horse_numbers` should only be populated when the selection has been parsed confidently. Each tip has a `race_number`; linking its optional `race` record lets `matched_entries` include entry IDs and horse names when numbers match loaded race entries.

```http
GET /tips/?date=2026-10-17
```

Each sheet includes its title, compiler, source, disclaimer, and tips. Sheets and tips can be entered before the official race card is loaded, using race numbers; link race records later to resolve picks to horse names. Empty `horse_numbers` means the raw text has not been resolved to horse entries yet.

```http
GET /races/?date=2026-10-13&status=upcoming&venue=1&featured=1
```

List response is paginated. A race item:

```json
{
  "id": 1,
  "race_number": 1,
  "name": "Maiden Sprint",
  "race_date": "2026-10-13",
  "post_time": "2026-10-13T13:30:00+08:00",
  "distance_m": 1200,
  "surface": "turf",
  "track_condition": "good",
  "status": "upcoming",
  "entries_count": 6,
  "purse_amount": "1200000.00",
  "purse_currency": "PHP",
  "is_featured": false,
  "is_live": false,
  "hero_image_url": null,
  "venue_name": "Sample Racing Venue",
  "club_name": "Philippine Racing Club",
  "is_demo": true
}
```

The detail endpoint returns those fields plus `description`, `age_restriction`, and nested `entries`:

```json
{
  "id": 1,
  "race_number": 1,
  "name": "Maiden Sprint",
  "race_date": "2026-10-13",
  "post_time": "2026-10-13T13:30:00+08:00",
  "distance_m": 1200,
  "surface": "turf",
  "track_condition": "good",
  "status": "upcoming",
  "entries_count": 6,
  "purse_amount": "1200000.00",
  "purse_currency": "PHP",
  "is_featured": false,
  "is_live": false,
  "hero_image_url": null,
  "venue_name": "Sample Racing Venue",
  "club_name": "Philippine Racing Club",
  "is_demo": true,
  "description": "Fictional demonstration race.",
  "age_restriction": null,
  "entries": [
    {
      "id": 1,
      "race_id": 1,
      "horse_id": 1,
      "horse_number": 1,
      "badge_color": "#C9A24D",
      "horse_name": "Golden Victory",
      "horse_photo": null,
      "jockey_name": "Marco de León",
      "trainer_name": "E. Villanueva",
      "owner_name": "Crown Estate Stable",
      "weight_kg": "58.0",
      "current_odds": "3.10",
      "status": "confirmed"
    }
  ]
}
```

### `GET /races/{id}/entries/`

Public list of entries in a race. Returns an array directly (not paginated):

```json
[
  {
    "id": 1,
    "race_id": 1,
    "horse_id": 1,
    "horse_number": 1,
    "badge_color": "#C9A24D",
    "horse_name": "Golden Victory",
    "horse_photo": null,
    "jockey_name": "Marco de León",
    "trainer_name": "E. Villanueva",
    "owner_name": "Crown Estate Stable",
    "weight_kg": "58.0",
    "current_odds": "3.10",
    "status": "confirmed"
  }
]
```

### `GET /entries/` and `GET /entries/{id}/`

Public, read-only. Optional list filters: `race=<race-id>` and `horse=<horse-id>`. The list is paginated; item shape matches the race entries response above.

## 8. Horses and participants

### `GET /horses/` and `GET /horses/{id}/`

Access token required. Optional filter: `search` (horse name). Only active horses are returned. Example: `GET /horses/?search=Copper`.

Paginated response item:

```json
{
  "id": 7,
  "name": "Copper Sunrise",
  "photo_url": null,
  "sex": "filly",
  "color": "chestnut",
  "birth_year": 2022,
  "country_of_origin": "PH",
  "sire": "Sunrise Crown",
  "dam": "Copper Lily",
  "owner_name": "Sunrise Stable",
  "trainer_name": "L. Navarro",
  "career_starts": 8,
  "career_wins": 2,
  "career_places": 3,
  "form_last5": "1-2-4-1-3",
  "bio": "Fictional demo horse profile.",
  "is_fictional": true
}
```

### `GET /jockeys/` and `GET /jockeys/{id}/`

Public, read-only. Optional filter: `search` (jockey name). Paginated list item:

```json
{
  "id": 1,
  "full_name": "Marco de León",
  "photo_url": null,
  "weight_kg": null,
  "career_wins": 0,
  "career_starts": 0,
  "bio": null,
  "is_fictional": true
}
```

### `GET /trainers/` and `GET /trainers/{id}/`

Public, read-only. Optional filter: `search` (trainer name). Paginated list item:

```json
{"id": 1, "full_name": "E. Villanueva", "photo_url": null, "bio": null}
```

## 9. Results

### `GET /results/` and `GET /results/{id}/`

Public, read-only. Optional list filters: `date=YYYY-MM-DD` and `status=official|provisional|cancelled`. List is paginated. A result item:

```json
{
  "id": 1,
  "status": "official",
  "race": {
    "id": 1,
    "race_number": 1,
    "name": "Maiden Sprint",
    "race_date": "2026-10-13",
    "post_time": "2026-10-13T13:30:00+08:00",
    "distance_m": 1200,
    "surface": "turf",
    "track_condition": "good",
    "status": "completed",
    "entries_count": 6,
    "purse_amount": "1200000.00",
    "purse_currency": "PHP",
    "is_featured": false,
    "is_live": false,
    "hero_image_url": null,
    "venue_name": "Sample Racing Venue",
    "club_name": "Philippine Racing Club",
    "is_demo": true
  },
  "winning_time": "1:12.84",
  "winning_time_ms": 72840,
  "track_condition": "good",
  "posted_at": "2026-10-13T17:00:00+08:00",
  "made_official_at": "2026-10-13T17:05:00+08:00",
  "placements": [
    {"finish_position": 1, "horse_number": 1, "horse_name": "Golden Victory", "jockey_name": "Marco de León", "final_odds": "3.10"},
    {"finish_position": 2, "horse_number": 2, "horse_name": "Midnight Thunder", "jockey_name": "Luis Mercado", "final_odds": "3.80"}
  ],
  "dividends": [
    {"game": "WIN", "combination": "1", "dividend_amount": "31.00", "unit_stake": "10.00"}
  ]
}
```

### `GET /races/{race_id}/results/`

Public. Returns the result for that race in the same shape as above. Returns 404 until a result exists.

## 10. Games and demo betting

The routes in this section exist only when `ENABLE_BETTING_API` is enabled. All tickets are simulated.

### `GET /games/` and `GET /games/{id}/`

Public; no pagination. Game item:

```json
{
  "id": 1,
  "code": "WIN",
  "name": "Win",
  "short_description": "Choose the horse that finishes first.",
  "selections_required": 1,
  "is_ordered": true,
  "min_wager": "20.00",
  "max_wager": "10000.00"
}
```

The demo game codes and number of picks are:

| Code | Selections | Ordered picks? |
|---|---:|---|
| `WIN` | 1 | Yes |
| `PLACE` | 1 | Yes |
| `FORECAST` | 2 | Yes, first pick must finish before second |
| `REVERSE_FORECAST` | 2 | No, either order wins |
| `TRIFECTA` | 3 | Yes |

### `GET /games/wager_presets/`

Public array of active preset amounts:

```json
["20.00", "50.00", "100.00", "200.00"]
```

### `GET /races/{id}/games/`

Public, no pagination. Returns active games open for betting on that race, using the game item shape above. Unknown race ID returns 404.

### `POST /bets/`

Access token required. Creates a simulated ticket for the signed-in user. `entries` are **race entry IDs**, in pick order (not horse profile IDs). Example:

```json
{
  "race": 1,
  "game": "WIN",
  "entries": [1],
  "wager_amount": "50.00"
}
```

The game must be active and open on that race; the race must be open; the wager must be within the game's min/max; the number of entry IDs must match `selections_required`; picks must be unique and confirmed participants in that race. A successful request returns HTTP 201:

```json
{
  "ticket_number": "PJA-DEMO-261013-0001",
  "status": "pending",
  "is_simulated": true,
  "race": {"id": 1, "race_number": 1, "name": "Maiden Sprint", "race_date": "2026-10-13"},
  "game": "WIN",
  "game_name": "Win",
  "wager_amount": "50.00",
  "odds_snapshot": "3.10",
  "estimated_return": "155.00",
  "payout_amount": null,
  "placed_at": "2026-10-13T20:00:00+08:00",
  "settled_at": null,
  "selections": [
    {"leg_position": 1, "horse_number": 1, "horse_name": "Golden Victory", "odds_snapshot": "3.10"}
  ]
}
```

Typical business-rule errors are `Betting is closed for this race.`, `WIN is not open for this race.`, `Wager must be between ...`, or `WIN needs exactly 1 horse(s).` They use the `betting_error` response code.

### `GET /bets/` and `GET /bets/{ticket_number}/`

Access token required. The API only returns the signed-in user's own tickets. Optional list filter: `status=pending|won|lost|void`. The list is paginated. A ticket item uses the same shape as the successful POST response.

### `POST /races/{id}/settle/`

Requires an access token belonging to an `admin` or `steward`. No body. Makes the race result official and settles pending demo tickets. The race must have a result.

```json
{"won": 1, "lost": 2, "payout_total": "155.00"}
```

Returns a business-rule error if the result does not exist. This is an operational/staff endpoint, not a normal frontend player action.

## 11. Favorites and notifications

### `GET /favorites/`

Access token required. Returns only the current user's favorites. Optional filter: `type=horse|jockey|trainer|race|venue`. Paginated item:

```json
{
  "id": 1,
  "target_type": "horse",
  "horse": 7,
  "jockey": null,
  "trainer": null,
  "race": null,
  "venue": null,
  "notify_on_race": true,
  "created_at": "2026-10-13T20:00:00+08:00"
}
```

### `POST /favorites/`

Access token required. Set `target_type` and exactly one matching target ID. Example:

```json
{"target_type": "horse", "horse": 7, "notify_on_race": true}
```

Returns HTTP 201 and the favorite item shape above. Duplicate favorites and target mismatches return validation errors.

### `DELETE /favorites/{id}/`

Access token required. Deletes only the signed-in user's favorite. Returns HTTP 204 with an empty body.

### `GET /notifications/`

Access token required. Returns the current user's notifications, newest first. Paginated item:

```json
{
  "id": 9,
  "type": "bet_settled",
  "title": "Ticket PJA-DEMO-261013-0001 won",
  "body": "You won PHP 155.00 (demo).",
  "deep_link": "/tickets/PJA-DEMO-261013-0001",
  "is_read": false,
  "created_at": "2026-10-13T20:00:00+08:00"
}
```

### `GET /notifications/unread_count/`

Access token required:

```json
{"unread": 2}
```

### `POST /notifications/{id}/read/`

Access token required. No body. Marks the current user's notification read; returns HTTP 204. A notification belonging to another user is not modified.

### `POST /notifications/read_all/`

Access token required. No body:

```json
{"marked_read": 2}
```

## 12. Endpoint checklist

This summarizes every API route family and method currently registered. `id` means a database ID; ticket lookups use the ticket number.

| Method | Path | Access |
|---|---|---|
| GET | `/health/` | Public |
| GET | `/auth/csrf/` | Public |
| POST | `/auth/register/` | CSRF |
| POST | `/auth/login/` | CSRF |
| POST | `/auth/token/refresh/` | Refresh cookie + CSRF |
| POST | `/auth/logout/` | Refresh cookie + CSRF |
| GET, PUT, PATCH | `/me/` | Access token |
| GET | `/racing-clubs/`, `/racing-clubs/{id}/` | Access token |
| GET | `/venues/`, `/venues/{id}/` | Public |
| GET | `/meetings/` | Public |
| GET | `/races/`, `/races/{id}/` | Public |
| GET | `/races/{id}/entries/` | Public |
| GET | `/races/{id}/results/` | Public |
| GET | `/races/{id}/games/` | Public, when betting API enabled |
| POST | `/races/{id}/settle/` | Staff access token, when betting API enabled |
| GET | `/entries/`, `/entries/{id}/` | Public |
| GET | `/horses/`, `/horses/{id}/` | Access token |
| GET | `/jockeys/`, `/jockeys/{id}/` | Public |
| GET | `/trainers/`, `/trainers/{id}/` | Public |
| GET | `/results/`, `/results/{id}/` | Public |
| GET | `/games/`, `/games/{id}/`, `/games/wager_presets/` | Public, when betting API enabled |
| GET, POST, GET by ticket | `/bets/`, `/bets/{ticket_number}/` | Access token, when betting API enabled |
| GET, POST, DELETE by ID | `/favorites/`, `/favorites/{id}/` | Access token |
| GET | `/notifications/`, `/notifications/unread_count/` | Access token |
| POST | `/notifications/{id}/read/`, `/notifications/read_all/` | Access token |

Read-only resource routes support GET list and GET detail only; they do not create or edit horses, races, participants, venues, or results. Data administration is done through Django admin/services in this implementation.
