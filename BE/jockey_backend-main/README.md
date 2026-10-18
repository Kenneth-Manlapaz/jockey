# Philippine Jockey: Django backend (modular monolith)

Racing information API with **demo (simulated) betting**, on MariaDB. One Django project, one
database, clearly separated apps. A Next.js frontend or a mobile WebView calls the versioned API
at `/api/v1/`. Demo data is always marked as demo; nothing here is official or live racing data.

## Structure

```
philippine_jockey/
├── manage.py   pyproject.toml   requirements.txt   .env.example   .gitignore
├── Dockerfile  docker-compose.yml  README.md
├── sql/                         01_philippine_jockey_tables.sql, 02_philippine_jockey_logic.sql
├── config/
│   ├── urls.py  asgi.py  wsgi.py
│   └── settings/  base.py  local.py  production.py
└── apps/
    ├── core/          shared base: fields, choices, pagination, health endpoint, demo seeder
    ├── accounts/      users, auth, permissions, audit log          (users, user_sessions, ...)
    ├── venues/        racecourses, surfaces, courses, facilities   (venues, racing_clubs, ...)
    ├── participants/  jockeys, trainers, owners
    ├── horses/        permanent horse profiles
    ├── races/         races, race entries (a horse in a race), odds history, live events
    ├── meetings/      a venue's race day: derived from races, no table of its own
    ├── results/       finishing order and race results
    ├── betting/       DEMO: games, tickets, dividends, settlement
    ├── engagement/    favorites, notifications, push devices
    └── api/           /api/v1 entry point and the one error format
```

Every app follows the same layout (files are added only when needed):

```
apps/races/
├── models.py       tables, fields, relations
├── services.py     write operations and business rules
├── selectors.py    read queries and filters
├── admin.py        Django admin
├── signals.py      (only where needed)
├── api/            serializers.py  views.py  urls.py  permissions.py
└── tests/          test_services.py  test_api.py  ...
```

Views stay thin: they call a selector to read or a service to write.

### Dependency rule
Models only point **down** this list, so there are no circular imports or migrations:

`core` → `accounts`, `venues`, `participants` → `horses` → `races` → `results` → `betting` → `engagement`

`meetings` and `api` only read from the apps above them. Admin screens may compose across apps
(for example the Race Result screen shows dividends from `betting`).

### Where this differs from the generic structure you were given
- **Race entries live in `races`, not `participants`.** A race entry points at a race, a horse, a jockey
  and a trainer. Putting it in `participants` would make `participants` and `horses` depend on each
  other, which breaks migrations. `participants` holds jockeys, trainers and owners.
- **`meetings` has no table.** The schema has no meetings table, so a meeting is derived from races
  (one venue on one date). `GET /api/v1/meetings/` works without any schema change.
- **`betting` and `engagement` are extra apps** because your Figma has simulated tickets, favorites and
  notifications. The recommendation says Phase 1 should be information-only: set
  `ENABLE_BETTING_API=0` and `/games`, `/bets` and `/races/{id}/settle` disappear from the API.
- **`data_sources` is not created yet.** Add it when you have a real provider to import from.
- Table and column names are exactly those in `sql/`, so the SQL files and Django stay in sync.

## Quick start

### A. SQLite (no database server)
```bash
python -m venv .venv && source .venv/bin/activate
pip install "Django>=5.2,<6.1" djangorestframework django-environ django-cors-headers whitenoise gunicorn
cp .env.example .env            # set DB_ENGINE=sqlite
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

### B. MariaDB with your SQL files (recommended)
```sql
CREATE DATABASE philippine_jockey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'racing_app'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON philippine_jockey.* TO 'racing_app'@'localhost';
```
```bash
mariadb -u racing_app -p philippine_jockey < sql/01_philippine_jockey_tables.sql
mariadb -u racing_app -p philippine_jockey < sql/02_philippine_jockey_logic.sql

sudo apt install libmariadb-dev pkg-config gcc          # Debian/Ubuntu: needed by mysqlclient
pip install -r requirements.txt
cp .env.example .env                                     # fill in DB_*
python manage.py migrate --fake-initial   # marks your tables as existing; creates Django's own
python manage.py seed_demo
python manage.py runserver
```
The SQL triggers keep working (`USE_DB_TRIGGERS` defaults to on for MariaDB), so bet status history
is written by the database and never twice.

### C. MariaDB, let Django create the tables
Set `USE_DB_TRIGGERS=0` in `.env`, then `python manage.py migrate` and
`python manage.py seed_demo --reference-only`. Django then creates the tables and does ticket numbers
and status history in Python. You will not have the four views from file 02 (the API does not use them).

### D. Docker Compose (not tested here)
```bash
docker compose up --build
```
Starts MariaDB (loading `sql/` on first start) and Django on http://localhost:8000.

Sign in at `/admin/` with `admin@example.com` / `admin12345`. The demo player is
`isabella@example.com` / `demo12345`. **Remove or change these before hosting.**

## API (`/api/v1/`)

New to the codebase? See the [code learning guide](docs/code-learning-guide.md) for the project structure, an endpoint walkthrough, and a hands-on exercise adding an API endpoint.

For endpoint methods, authentication rules, filters, request bodies and sample responses, see [the detailed API reference](docs/api-reference.md).

For frontend integration, the complete endpoint list, toast/error handling, response guidance, and database relationships, see the [frontend integration guide](docs/frontend-integration-guide.md).

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /health/` | none | App and database health |
| `GET /venues/` | none | Racetracks with surfaces, courses, facilities |
| `GET /racing-clubs/?search=` | token | Racing club profiles |
| `GET /meetings/?date=&venue=` | none | Race days (a venue on a date) |
| `GET /races/?date=&status=&venue=&featured=1` | none | Race schedule |
| `GET /races/{id}/` | none | Race details with entries |
| `GET /races/{id}/entries/` | none | Horses entered in the race |
| `GET /races/{id}/results/` | none | Result when available (404 until then) |
| `GET /entries/?race=&horse=` | none | All race entries |
| `GET /horses/?search=` | token | Horse profiles |
| `GET /jockeys/?search=` · `/trainers/?search=` | none | Participant profiles |
| `GET /results/?date=&status=` | none | Race Results list |
| `GET /games/` · `/games/wager_presets/` · `/races/{id}/games/` | none | Games & Guide (demo betting) |
| `GET /auth/csrf/` · `POST /auth/register/` · `POST /auth/login/` | none | CSRF bootstrap and account access (`username` = email) |
| `POST /auth/token/refresh/` · `POST /auth/logout/` | refresh cookie + CSRF | Rotate access token or revoke session |
| `GET/PATCH /me/` | token | Profile |
| `POST /bets/` · `GET /bets/?status=` · `GET /bets/{ticket}/` | token | Place and view demo tickets |
| `GET/POST/DELETE /favorites/` · `/notifications/` (+ `unread_count`, `read`, `read_all`) | token | Engagement |
| `POST /races/{id}/settle/` | staff token | Make the result official and settle tickets |

Lists are paginated the same way: `?page=2&page_size=50` returns
`{"count", "next", "previous", "results"}`. Every error has one shape:

```json
{"error": {"code": "betting_error", "message": "Betting is closed for this race.", "details": {}}}
```

Login and registration return a short-lived JWT `access` token. Send it as
`Authorization: Bearer <access>`. A longer-lived refresh token is stored in an HttpOnly cookie,
rotated at `/api/v1/auth/token/refresh/`, and revoked at `/api/v1/auth/logout/`. Browser clients first
call `/api/v1/auth/csrf/`, then send the returned `csrfToken` in `X-CSRFToken` on login, registration,
refresh and logout requests. Send cookies with credentials enabled. The older
`Authorization: Token <key>` format remains accepted for existing clients. CORS allows the origins in `CORS_ALLOWED_ORIGINS`
(default `http://localhost:3000`).

For local browser development, set `AUTH_BEARER_ONLY=true` in `.env` to use access-token-only
authentication. Registration and login then return a short-lived access JWT without setting a
refresh cookie, and these auth endpoints do not require CSRF. The frontend should keep the returned
`access` token while signed in, send it as `Authorization: Bearer <access>`, clear it on logout, and
stop calling `/auth/csrf/` and `/auth/token/refresh/`. With no refresh token, users must sign in
again when the access token expires (5 minutes by default). The default cookie-based refresh and
CSRF-protected flow remains active when `AUTH_BEARER_ONLY` is unset or false. Use bearer-only mode
for development only.

```bash
CSRF=$(curl -s -c cookies.txt localhost:8000/api/v1/auth/csrf/ | jq -r .csrfToken)
TOKEN=$(curl -s -b cookies.txt -c cookies.txt -X POST localhost:8000/api/v1/auth/login/ \
  -H "X-CSRFToken: $CSRF" -H "Content-Type: application/json" \
  -d '{"username":"isabella@example.com","password":"demo12345"}' | jq -r .access)
curl -X POST localhost:8000/api/v1/bets/ -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"race": 3, "game": "WIN", "entries": [12], "wager_amount": "50.00"}'
```

## Manipulating data

- **Admin site (`/admin/`):** add races and their entries, tick which games are open, enter results,
  then run **"Make OFFICIAL and settle all pending bets"** on a result. Cancel a race with
  **"Cancel selected races and VOID their pending bets"**. Roles: `admin` (everything), `steward`
  (races, entries, results, dividends only), `user` (no admin access).
- **Services (Python):**
  ```python
  # python manage.py shell
  from apps.betting import services
  services.place_bet(user=user, race=race, game_type=game, entry_ids=[12, 13], wager_amount=100)
  services.publish_result(race=race, finishing_order=[12, 13, 14], winning_time_ms=72840,
                          dividends=[("WIN", "1", 31), ("FORECAST", "1-2", 142)])
  services.finalize_race(race)
  ```
- **Commands:** `seed_demo [--date YYYY-MM-DD] [--reference-only]`, `settle_race <race_id>`.

Settlement rule: a ticket wins when its horses (pick order for ordered games, sorted for Reverse
Forecast) match a row in `race_dividends`. Payout = `wager / unit_stake x dividend`. Store dividends
only for winning combinations.

## Tests
```bash
python manage.py test apps --noinput            # 58 tests
DB_ENGINE=mysql python manage.py test apps       # same suite on MariaDB (set USE_DB_TRIGGERS=0)
```
Tests live next to the code (`apps/<app>/tests/`); API contract, permission and health tests are in
`apps/api/tests/`.

## Adding a new app
1. `mkdir apps/<name>` with `models.py`, `services.py`, `selectors.py`, `admin.py`, `api/`, `tests/` as needed.
2. `apps.py` with `name = "apps.<name>"` and `label = "<name>"`; add it to `LOCAL_APPS` in `settings/base.py`.
3. Reference models from lower layers by string (`"races.Race"`), never the other way round.
4. Add `path("", include("apps.<name>.api.urls"))` to `apps/api/urls.py`, then `makemigrations`.

## Hosting
For a production Ubuntu server deployment with Docker Compose, MariaDB, Caddy and automatic HTTPS, see [the Ubuntu hosting guide](docs/ubuntu-hosting.md).

```bash
export DJANGO_SETTINGS_MODULE=config.settings.production
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8000
```
Production settings refuse to start with the default secret key, force HTTPS, and use secure cookies.
Set `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS` and `CORS_ALLOWED_ORIGINS`.
Static files are served by WhiteNoise. Put HTTPS (nginx or your platform) in front.

## Limits
- Every bet is simulated (`is_simulated=True`). No wallet, deposits or payouts.
- `venue_facilities` and `race_games` have composite primary keys, so they are edited with checkbox
  lists inside the Venue and Race admin forms. This needs Django 5.2+.
- Dead heats are stored in the schema but the settlement helper does not handle them yet.
- Not included: password-reset emails, push sending, a bet-draft API, background jobs (add Redis +
  Celery only when you start importing external data), the Next.js frontend itself.
