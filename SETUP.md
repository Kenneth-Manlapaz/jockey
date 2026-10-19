# Run JOCKEY on another server

JOCKEY now has a public calendar and learning guide, with membership required for race programs, profiles, statistics, results and dividends. The website uses the existing green/gold design without repeated sample-data banners. The seed is generated preview data; provenance flags remain in the database for later replacement with an authorized feed.

## Database and backend

Work from `BE/jockey_backend-main`. Install the Python dependencies in your virtual environment. For MariaDB/MySQL, use `requirements.txt` and ensure the `mysqlclient` driver prerequisites are installed. SQLite remains available for local use.

Copy `.env.example` to `.env` and set your connection:

```dotenv
DB_ENGINE=mysql
DB_NAME=jockey
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=127.0.0.1
DB_PORT=3306
DJANGO_SECRET_KEY=your_unique_server_secret
DJANGO_ALLOWED_HOSTS=your-api-hostname
CORS_ALLOWED_ORIGINS=https://your-website-hostname
DJANGO_CSRF_TRUSTED_ORIGINS=https://your-website-hostname
RACING_SUBSCRIPTION_REQUIRED=True
ENABLE_PREVIEW_SUBSCRIPTIONS=True
```

`ENABLE_PREVIEW_SUBSCRIPTIONS=True` enables the no-charge checkout flow requested for this preview. It allows a signed-in account to activate membership without a real payment. For a real payment launch, set it to `False` and implement a verified payment-provider integration before enabling sales. It defaults to `False` when unset. This option is separate from the betting platform.

For an existing populated database, take a native database backup and run `python manage.py backup_racing` before migrations. For an empty preview database, run:

```bash
python manage.py migrate
python manage.py seed_platform
python manage.py verify_racing_integrity
python manage.py createsuperuser
```

On this Windows workspace, replace `python` with `./.venv/Scripts/python` if the virtual environment is not activated. On Linux an equivalent virtual environment uses `.venv/bin/python`.

`seed_platform` creates:

- 128 named horses with varied sex, age, colour, pedigree and connections
- 18 jockeys, 12 trainers, 10 owners, and three racing venues
- 16 weeks of recent history, older archive dates, current meetings and two upcoming weeks
- Six- and eight-race programs, eight declarations per race, assigned riders/weights/gates and coupled-group examples
- Varied finishing orders, individual times, intermediate positions and sectionals
- Published tipster selections and announcements
- WIN, PLACE, FORECAST, TRIFECTA, QUARTET, PENTAFECTA and SUPER SIX events; PICK 5, PICK 6, XD, DD+1 and qualifying WTA coverage, with stored legs and dividend records

The generated events are preview program assignments, not a claim about a real operator's schedule. The command creates no accounts, tickets, wallets or memberships, and refuses to add generated races to a database containing authoritative race records. Existing records are retained.

For reproducible dates across servers:

```bash
python manage.py seed_platform --date 2026-10-18 --weeks 16
```

Use the same anchor date to repeat the same schedule. Rerunning with the same parameters does not duplicate races or published dividends. Omitting `--date` uses the Philippine local date when run. Choosing another date creates a schedule around that date. Use this command instead of the older small `seed_racing_info` or simulated-betting `seed_demo` commands.

The current workspace contains 132 horses, 18 jockeys, 12 trainers, 10 owners, 50 meetings, 306 races, 2,396 entries, 2,036 finishing records, 2,251 events and 2,431 dividends because it also retains the earlier records. A fresh database receives the new seed without the earlier small dataset.

## Website

Work from `FE/jockey_frontend-main/web`. Install dependencies with `npm ci`, then configure the backend URL in `.env.local`:

```dotenv
JOCKEY_API_BASE_URL=http://your-backend-host:8000/api/v1
NEXT_PUBLIC_API_BASE_URL=http://your-backend-host:8000/api/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

`JOCKEY_API_BASE_URL` is used by server-rendered pages and the same-origin API proxy. Use the address reachable from the website server. If both services run on the same server, `http://127.0.0.1:8000/api/v1` works for that server-side connection. Visitors use the website's hostname rather than that backend loopback address.

```bash
npm run build
npm run start -- --hostname 0.0.0.0
```

Use the repository's existing Django production settings, process manager/reverse proxy and HTTPS configuration for deployment. The local workspace still runs Django at `127.0.0.1:8000` and the built website at `127.0.0.1:3000`.

## Try membership

1. Open the website and select **Membership**, or open a locked race/statistics page.
2. Choose **Daily Access — ₱50 / 24 hours** or **Monthly Membership — ₱499 / calendar month**.
3. Sign in or create an account. The chosen plan and intended page are carried through authentication.
4. Choose the plan and press **Confirm payment** in the confirmation section. Every completed demo confirmation activates access. No payment details or money are collected. **Cancel** returns to the plans without activating anything.
5. Continue to racing. **Account → My membership** shows the active period and lets you extend access.

Daily access lasts exactly 24 hours. Monthly access ends at the same Philippine local time in the next calendar month, clamped to the final day for shorter months. Renewal queues after existing access; the membership page shows the combined continuous access end. There is no automatic renewal. The monthly plan saves ₱1,001 compared with 30 daily passes.

Prices are stored in the `subscriptions.Plan` model and can be changed in Django admin. Checkout records snapshot the selected price, currency and period, so later plan edits do not alter an existing checkout. Admins can also grant or cancel subscriptions. Ordinary account registration does not grant racing access.

Membership confirmation uses ordinary buttons on the membership page. There is no payment iframe, provider script or cross-window message. Confirm directly requests demo membership activation from Django; the backend still stores the access period so protected race pages open normally. The demo flag `ENABLE_PREVIEW_SUBSCRIPTIONS=True` remains required on the backend. If the backend does not respond within 15 seconds, the page shows an error and re-enables Confirm; retrying a created checkout uses the same record to avoid duplicate access periods.

For the 19 October button update, deploy the updated `FE/jockey_frontend-main/web` code, run `npm run build` there, and restart the frontend process. No database migration is needed. The old `/subscription/payment-frame` route has been removed. Future real payments require a separately implemented and verified payment-provider integration.

## Access rules and checks

Public: calendar dates/meeting summaries, learning guide, About, Contact and membership plans. Racing programs, race lists/entries, horse and participant statistics/profiles, results and event/dividend records require a signed-in account plus a currently active subscription. Both the new `/api/v1/racing/` endpoints and the older racing read endpoints enforce this rule. Ticket, wallet and settlement code is unchanged; older API clients reading protected racing information now need membership as well.

New access cookies are HttpOnly, scoped to the website and forwarded as bearer tokens for server rendering. Mutations continue to require explicit bearer authorization; cookie-only writes are not automatically authorized. Tokens and refresh cookies are cleared during logout. No page cache is used for subscriber data.

Checks for this update: 86 backend tests, 82 existing frontend tests, 17 React DOM interaction tests, seven public/locked HTTP journey checks, lint/typechecks, migration drift checks and a production build. The local `scripts/verify_web_auth.py` additionally exercises account creation, membership activation, subscriber APIs and server-rendered race/horse pages, refresh and logout, then removes only its temporary verification account.

MariaDB deployment and a real payment provider are not configured in this workspace. Browser discovery has returned no available browser; the checkout interaction has DOM tests and the membership/API/SSR flow has HTTP verification, while screenshot and physical-device QA remain unverified.


## Data workspace update - 19 October 2026

Deploy both the updated backend and `FE/jockey_frontend-main/web`. Restart the Django/Gunicorn process, run `npm run build` in the web directory, then restart its Next.js process. Use your existing process-manager names. This update adds read APIs and UI components; it has no model migration and requires no reseeding or environment-setting changes. Existing accounts, memberships and racing records remain in the configured database.

Try **Racing Stats > Horses** for searchable metadata and current connections. Participant directories and profiles include scoped recorded statistics. Open a race, select two to four active runners, and press **Compare**. Horse/participant profiles now provide **Search full history**; filters survive paging, and a horse history opened from a race remains limited to earlier performances. Results show podiums and publication status, with finishing details and published dividends on the race page.

New GET endpoints, under `/api/v1/racing/`, require the existing racing membership:

| Endpoint | Filters and behavior |
|---|---|
| `filters/` | Available venues, surfaces and horse sex values |
| `horses/{id}/history/` | `race` optionally limits history before that race |
| `people/{kind}/{id}/history/` | Snapshot-based jockey/trainer/owner history |
| `directory/horses/` | `search`, `trainer`, `owner`, `sex`, `color`, `birth_year`; sorts `name`, `-name`, `birth_year`, `-birth_year`, `trainer`, `owner` |
| `directory/{jockeys,trainers,owners}/` | `search`, date/venue scope for statistics; sorts `name`, `-name` |
| `results/` | Published podium, winning time and publication status; date/venue grouping on the website |

History supports `from`, `to`, `year`, `venue` (ID), `distance` (metres), `surface`, `status` (official/corrected), `horse` (name), and `sort` (`-date`, `date`, `finish`). Results support date/race filters, including exact `date`, and provisional/official/corrected status. Dates use `YYYY-MM-DD`. Paginated lists support `page` and `page_size` (maximum 100). History statistics describe the full filtered archive rather than the current page. Recorded finishes include DQ in rate denominators; wins and placings exclude DQ; dead heats count at the recorded position; top three includes wins.

Checks for the data update: 93 backend tests, 20 web UI tests, seven HTTP checks and the temporary-account subscriber verification passed. The latter now covers richer directories, full horse history, valid/invalid runner comparison and grouped results. No original account count changed. Browser visual QA remains unavailable; see `DATA_PRESENTATION_REVIEW.md` for the remaining data-source and device-validation limits.
