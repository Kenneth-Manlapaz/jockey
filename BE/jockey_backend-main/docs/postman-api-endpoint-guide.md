# Philippine Jockey API: Postman Endpoint Guide

This guide lists the API routes implemented in this repository and how to call them from Postman.
The racing, odds, results, and betting data currently loaded by `seed_demo` are fictional demo data.

## Base URL

Use the public URL only if its port forwards to the updated Gunicorn instance on port `8002`:

```text
http://121.58.249.168:30142/api/v1
```

For local testing through the SSH tunnel (`-L 18002:192.168.10.142:8002`), use:

```text
http://localhost:18002/api/v1
```

In Postman, create an environment variable named `baseUrl` with the appropriate value above. Use
`{{baseUrl}}/health/` as the first request. The API root (`{{baseUrl}}/`) is not an index page and
may return 404.

Set `Content-Type: application/json` for requests with a JSON body. List endpoints generally return
paginated responses with `count`, `next`, `previous`, and `results`. Use `?page=2&page_size=50` to
change pagination.

## Authentication

In the updated test server, `AUTH_BEARER_ONLY=true` enables bearer-only authentication:

1. Send `POST {{baseUrl}}/auth/login/` with JSON such as:

   ```json
   {"email": "your-test-account@example.com", "password": "your-password"}
   ```

2. Copy the `access` value from the response.
3. For protected requests, choose **Authorization → Bearer Token** in Postman and paste the access
   token. Postman adds the `Authorization: Bearer ...` header.

In bearer-only mode, login, registration, and logout do not require CSRF. No refresh token is
issued; `/auth/token/refresh/` returns HTTP 410. Access tokens expire after five minutes by default.
On logout, clear the token from Postman or the frontend. The token itself is not revoked server-side
and expires naturally.

## Endpoint list

`{id}` is a database ID. `{ticket_number}` is a bet ticket number. Unless noted, list endpoints may
accept `page` and `page_size` query parameters.

### Health and authentication

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/health/` | Public | Returns app and database health. |
| GET | `/auth/csrf/` | Public | Legacy browser CSRF bootstrap; not needed in bearer-only mode. |
| POST | `/auth/register/` | Public | Creates an account. `accept_terms` must be `true`. |
| POST | `/auth/login/` | Public | Accepts `email` or `username`, plus `password`. |
| POST | `/auth/token/refresh/` | Public | Disabled in bearer-only mode; returns 410. |
| POST | `/auth/logout/` | Public | In bearer-only mode, clear the access token in the client. |
| GET | `/me/` | Access token | Current user's profile. |
| PUT, PATCH | `/me/` | Access token | Update profile fields; email, ID, and role are read-only. |

### Meetings, races, entries, and notes

| Method | Path | Access | Query or body details |
|---|---|---|---|
| GET | `/meetings/` | Public | Filters: `date`, `venue`. |
| GET | `/races/` | Public | Filters: `date`, `status`, `venue`, `featured`. |
| GET | `/races/{id}/` | Public | Race details, including entries. |
| GET | `/races/{id}/entries/` | Public | Entries for one race. |
| GET | `/entries/` | Public | Filters: `race`, `horse`. |
| GET | `/entries/{id}/` | Public | One race entry. |
| GET | `/tips/?date=YYYY-MM-DD` | Public | Tip sheets and picks for a meeting date. Staff manage them in Django admin. Tips can be added by race number before the race card is loaded. |
| GET | `/race-notes/?race_id={id}` | Access token | `race_id` is required. |
| GET | `/race-notes/{id}/` | Access token | Read one note. |
| POST | `/race-notes/` | Access token | Create a note; send JSON with race ID and note fields. |
| PUT | `/race-notes/{id}/` | Access token | Update a note. |
| DELETE | `/race-notes/{id}/` | Access token | Delete a note. |

Example race request:

```text
GET {{baseUrl}}/races/?date=2026-10-14&status=upcoming
```

### Horses, participants, clubs, and venues

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/horses/`, `/horses/{id}/` | Access token | Horse profiles; optional `search` filter. |
| GET | `/jockeys/`, `/jockeys/{id}/` | Public | Optional `search` filter. |
| GET | `/trainers/`, `/trainers/{id}/` | Public | Optional `search` filter. |
| GET | `/venues/`, `/venues/{id}/` | Public | Optional `search` filter. |
| GET | `/racing-clubs/`, `/racing-clubs/{id}/` | Access token | Optional `search` filter. |

### Results

| Method | Path | Access | Query details |
|---|---|---|---|
| GET | `/results/` | Public | Filters: `date`, `status`. |
| GET | `/results/{id}/` | Public | One result. |
| GET | `/races/{id}/results/` | Public | Result for one race; 404 if none exists. |

### Games and demo betting

These routes are registered when `ENABLE_BETTING_API` is enabled.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/games/`, `/games/{id}/` | Public | Active game types. |
| GET | `/games/wager_presets/` | Public | Available wager preset amounts. |
| GET | `/races/{id}/games/` | Public | Games open for a race. |
| POST | `/bets/` | Access token | Place a simulated bet. |
| GET | `/bets/` | Access token | Current user's tickets; optional `status` filter. |
| GET | `/bets/{ticket_number}/` | Access token | One of the user's tickets. |
| POST | `/races/{id}/settle/` | Staff access token | Finalize a race with a result and settle tickets. |

Example `POST /bets/` body:

```json
{
  "race": 3,
  "game": "WIN",
  "entries": [12],
  "wager_amount": "50.00"
}
```

The `race` and `entries` values must be IDs returned by this database. A cart/draft endpoint is not
currently exposed; the frontend can keep selections in its cart and submit a bet when confirmed.
Betting is simulated and does not move real money.

### Favorites and notifications

All routes in this section require an access token.

| Method | Path | Notes |
|---|---|---|
| GET | `/favorites/` | Optional `type` filter. |
| POST | `/favorites/` | Add a favorite. |
| DELETE | `/favorites/{id}/` | Remove a favorite. |
| GET | `/notifications/` | List current user's notifications. |
| GET | `/notifications/unread_count/` | Return unread notification count. |
| POST | `/notifications/{id}/read/` | Mark one notification read. |
| POST | `/notifications/read_all/` | Mark all notifications read. |

## Common status codes

| Status | Meaning |
|---|---|
| 200 | Request succeeded. |
| 201 | Account, note, or bet created. |
| 204 | Request succeeded with no response body, commonly logout or delete. |
| 400 | Invalid input or betting rule rejected the request. |
| 401 | Missing, invalid, or expired access token, or bad login credentials. |
| 403 | Authenticated user lacks permission. |
| 404 | Resource not found. |
| 410 | Refresh endpoint disabled in bearer-only mode. |

For complete serializer fields and response examples, see `docs/api-reference.md`.
