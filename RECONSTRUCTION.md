# JOCKEY reconstruction handoff

**Current setup and access policy:** see [SETUP.md](SETUP.md). The later membership update supersedes the original public-race access policy below. Calendar and education remain public; racing content requires an active subscription. The expanded seed and no-charge checkout instructions are documented there. Earlier sections remain a record of the reconstruction stages.

Implemented 18 October 2026. The public information website is running locally at http://127.0.0.1:3000, with Django at http://127.0.0.1:8000.

## Audit findings

- `FE/jockey_frontend-main/web`: Next.js 16 App Router, React 19, TypeScript, existing plain CSS and Lucide icons. The original visual language uses DM Sans, Libre Caslon Display, forest green, gold, paper backgrounds, rounded cards, and the existing desktop/mobile navigation. Those assets and tokens remain in use; the information screens extend the existing components and CSS.
- `FE/jockey_frontend-main/src`: Expo 57 / React Native, NativeWind, Zustand and TanStack Query. Its native screens and wager-selection, ticket, wallet and transaction implementations were left in place. Shared authentication transport and public horse requests were corrected.
- `BE/jockey_backend-main`: Django / DRF, JWT plus legacy token/session authentication, migration-managed MariaDB schema with unsigned legacy keys. SQLite is an existing supported development option.
- Existing routes included landing/dashboard, schedules, race/entry details, results, entry-dependent horse and jockey profiles, guide pages, account pages, and simulated betting screens. The information journey previously led through race/betting demos, horse profiles depended on an entry context, jockey links used generated name slugs, and stored career totals were not backed by historical finishing records.
- Existing race entries already held race-specific jockey, trainer, owner and weight relationships. These were preserved. Meetings previously had no persistent identity. Dividends belonged to simulated settlement, with no explicit multi-race event/leg structure. Some horse endpoints unexpectedly required login. The web auth proxy dropped cookies while the client omitted CSRF setup.
- Read `DAZO_REFERENCE_README.md` completely, inspected the public Dazo homepage and guide, and examined `calendar.jpg`, `stats_dex.jpg`, and the supplied printed racing sheet. Dazo member-only screens and complete operator rules were not accessed or inferred.
- No existing database file, configured production connection, credentials, official racing feed, or data export was supplied. A new SQLite development database was created; no external or production database was changed.

## Implemented structure and behavior

The homepage opens directly to a backend-driven racing calendar. Month/year controls, day selection, previous/next racing-date navigation, historical dates, empty dates, and multiple venues on one date use stored meeting/race records. Selection persists in URLs and calendar return links. The calendar uses Asia/Manila dates; race post times use the meeting's timezone.

Persistent meetings now own races and information-only betting events. The existing public `/meetings/` contract remains available for older consumers; the reconstructed website uses `/racing/meetings/` with stable primary keys. There is one meeting per venue/date, with different venues supported on the same date. The existing venue/date/race-number uniqueness is retained.

New public programs show conditions, purse where recorded, declared entries, horse numbers and gates, connections, weights, scratches, coupled-group labels, published odds, source-attributed tipster picks, announcements, preserved declarations, results and associated events. The original program stays available after results. Horse links use permanent horse IDs.

Recent form is the latest five recorded official/corrected finishes before the selected race. Comparable form additionally matches venue, surface and distance. Best recorded time uses that comparable set in the 180-day window before the race, excludes disqualified performances, and requires an actual individual finishing time. No winner time is substituted for a missing horse time. Horse pages show pedigree, current connections, historical assignments, recorded statistics and a finishing-position trend. Jockey/trainer/owner directories support search and pagination, with profiles, horse associations, combinations and scoped recorded statistics. Stored legacy career totals and generated tip scores are not used by these screens.

Result participation snapshots preserve the connections and weight captured at the time the finishing record is created. Subsequent declaration edits do not rewrite those historical connections or participant win counts. Entry changes and result revisions are recorded atomically through model saves. `QuerySet.update()`, bulk writes and direct SQL bypass model hooks and must not be used to edit declarations or published history.

Information events use explicit ordered legs, which may overlap but cannot cross meetings. Event types and definitions are configurable in admin; no event is inferred from a label or assumed available for every race. Published dividends retain combination, amount, currency, unit, source, publication status and correction relationships. Published dividend rows are immutable through model/admin editing; corrections create a new row referencing the earlier publication. Unpublished events/dividends and private or future announcements are excluded from public responses. Missing data is displayed as unavailable.

Authentication remains intact. Public information reads need no account. Favorites and personal APIs retain server authorization and per-user isolation. Web account pages prompt contextually, login/registration return to a validated local destination, and the cookie/CSRF/refresh transport now works through the web proxy. Personal favorites can be saved from a horse or entry, opened from the favorites list, and removed. Premium access is denied by default until a real entitlement service is configured; no checkout or payment system was added.

The existing betting tables, ticket identifiers, wager-selection code and settlement rules were not reconstructed. Legacy betting/live/totalizer routes remain for the separate workflow; they are not presented as completed information features. The information navigation links the public calendar, directories, guide, results and favorites.

## API

All paths below are under `/api/v1/racing/`. Public endpoints are GET-only:

| Endpoint | Purpose |
|---|---|
| `calendar/?year=&month=&date=` | Monthly activity, selected date's meetings and nearest real racing dates |
| `meetings/{id}/` | Meeting, scheduled races, published events and public announcements |
| `races/{id}/` | Preserved program, declarations, form, results, events and dividends |
| `horses/{id}/?race=` | Permanent profile and recent/comparable form; `race` sets the comparison context |
| `directory/{horses\|jockeys\|trainers\|owners}/?search=&page=` | Searchable, paginated profiles |
| `people/{jockeys\|trainers\|owners}/{id}/` | Historical participant statistics and connections |
| `results/?date=&page=` | Published race results |
| `events/{id}/` | Published event, ordered legs and dividend history |
| `access/` | **Authenticated only**; personal-feature access and default-denied premium readiness |

Public `/api/v1/horses/` and `/api/v1/horses/{id}/` were also corrected to allow anonymous reads. Existing private endpoints were not made public.

## Migrations and recovery

The new migrations add tables/columns, backfill meeting IDs and declaration snapshots, enforce the meeting FK after backfill, preserve participation snapshots, and copy existing published legacy single-race dividends into information events. Original race, entry, result, horse, user and settlement rows retain their IDs. No table drops, destructive data migrations or account resets were performed. No destructive migration is awaiting approval.

Existing declaration snapshots are marked as captured during migration: changes that happened before the supplied schema cannot be reconstructed. Imported legacy dividends explicitly say their external source is unavailable; importing them does not verify their authority. No multi-race legs are inferred from old single-race dividends.

Before applying migrations to an existing installation, stop writes and run from the backend directory:

```powershell
./.venv/Scripts/python manage.py backup_racing
./.venv/Scripts/python manage.py migrate
./.venv/Scripts/python manage.py verify_racing_integrity --baseline backups/<timestamp>/counts.json
```

`backup_racing` uses the *applied migration state*, so it can back up a database before the new columns exist. It saves a logical records export and model counts, plus an exact SQLite backup where applicable. For MariaDB, also take a native full database dump including triggers/routines before deployment; the Django logical export covers managed records, not server objects. Restore SQLite from the exact backup while the service is stopped, or restore the MariaDB native dump with the matching application version.

A local recoverable snapshot is at `BE/jockey_backend-main/backups/20261018T073251655939Z/`. The subsequent integrity check verified 12 races, 44 entries, 20 finishing records and 9 event legs, with no decrease in the backed-up model counts. No existing user accounts were present in the supplied workspace database; a populated-schema automated migration test verifies account/password-hash and record preservation.

## Running locally

The backend virtual environment and frontend dependencies are installed. The ignored backend `.env` selects SQLite with development debug settings. Restart with:

```powershell
# Terminal 1: BE/jockey_backend-main
./.venv/Scripts/python manage.py runserver 127.0.0.1:8000

# Terminal 2: FE/jockey_frontend-main/web
npm run dev -- --hostname 127.0.0.1
```

For a fresh development database, migrate and run `python manage.py seed_racing_info`. This opt-in, idempotent command adds clearly fictional schedules, historical finishing records, multiple meetings, sample event relationships and one labelled sample dividend. It creates no accounts or tickets and refuses to run alongside authoritative race records. The fixture dates are relative to the Philippine local date on first seeding. The five-leg development PICK 5 example is a relationship fixture, not a verified operator program. Changing the fixture seed does not overwrite existing published records or event legs.

Sample names now use Sierra Verde Park and Laguna Downs, horses such as Amihan Express and Copper Horizon, and named races such as Sampaguita Sprint and Perlas Cup. `python manage.py rename_racing_fixtures` updates older generic fixture names in place, including display names in participation snapshots, while retaining IDs, results, amounts and fictional-data flags. A backup was taken before this naming update; model counts and relationship integrity were verified afterward.

Use Django admin (`python manage.py createsuperuser` for a local account) to enter and publish verified data. Administrators can configure event types; stewards can maintain meetings, declarations, events, results and dividends within their existing role model. Keep the database-native backup and application version together for recovery.

## Verification

- Django system checks and migration drift check passed.
- All 75 backend tests passed, including 17 new tests covering populated-schema migration preservation, multiple meetings/date navigation, form windows and matching, declaration changes, historical connections, event-leg validation, dividend corrections, result references and private-access isolation.
- All 82 existing frontend Jest tests passed; CSRF auth tests were updated for the corrected transport.
- Both frontend typechecks and lint commands passed. Next.js production build passed.
- Five HTTP integration tests passed against the running Next.js website and Django API: public calendar/month rollover, meeting → race → horse/participant journey, explicit event relationships, result/program retention, and protected APIs/CSRF forwarding. Run with both servers up: `npm run test:integration` in `web` (Node 24 used here).
- The built production website also passed the real cookie-based registration/login/profile/favorites/refresh/logout workflow through its proxy. `python scripts/verify_web_auth.py` creates and removes one isolated local verification account; the original account count was preserved.
- Browser connection discovery returned no available browser. Responsive CSS was inspected, including the original mobile navigation visibility rules; interactive browser behavior and screenshot-based visual QA remain unverified.
- MariaDB service/credentials were unavailable. Production MariaDB migration and deployment were not executed. New relationships reference the existing ORM keys so legacy unsigned foreign-key types are preserved.

## Remaining external dependencies and limits

- An authorized source/import feed is still needed for real schedules, programs, race conditions, jockey/trainer/owner assignments, horse histories, official timing, sectionals, decisions, replays and published dividends. All locally supplied racing fixtures are labelled development data.
- Operator rules and authoritative leg assignments are needed before configuring actual WIN, PLACE, FORECAST, TRIFECTA, QUARTET, PENTAFECTA, SUPER SIX, WTA, PICK 5, PICK 6, XD or DD+1 events. The schema accepts these labels; it does not invent definitions or publish unverified offerings.
- Paid entitlement rules and expanded historical archives require actual product policy and data. No paid access is granted by a client-side flag.
- Existing Expo dependencies report 74 audit findings during clean installation (21 moderate, 53 high). No automatic dependency upgrade or unrelated native migration was applied. The separate Next.js installation reported no audit findings.

Functional reference: [Dazo homepage](https://beta.dazo.ph/) and [public program/results guide](https://beta.dazo.ph/learn-how-to-race), together with the supplied reference README and images. The existing JOCKEY frontend remains the visual reference.

## Navigation and illustrated learning update

The information website now groups the existing horse, jockey, trainer and owner directories under an accessible **Racing Stats** disclosure. The main navigation also includes Calendar / Races, Learn How to Race, Results, About Us, Contact Us, and Sign in / Account. Verified signed-in users retain Favorites in the account menu. Mobile navigation collapses into an expandable menu.

`/race-guide` now contains eight original JOCKEY chapters, an annotated interactive program, recent/comparable/best-time form filters, a twelve-race event coverage diagram, result-field explanations, an odds/dividend comparison, a searchable glossary and three knowledge checks. All illustrations and teaching records are maintained locally and labelled fictional. The guide has no Dazo links, branding, embedded pages, hotlinked assets or runtime dependencies. Operator terminology was checked against PRCI's published rules; the visitor-facing explanations remain self-contained.

`/about` and `/contact` are internal pages. A public support channel has not been supplied, so Contact Us offers relevant FAQs and a working local support-note download, explicitly stating that it sends no message. No mailbox or delivery workflow is fabricated.

Validation for this update: 12 new React DOM interaction tests, all 82 existing frontend tests, six HTTP journey checks against the production preview, both frontend typechecks/lints, and the Next.js production build passed. No backend model/data or native betting workflow was changed. Browser discovery still returned no available browser; screenshot and physical touch-device QA remain unverified.

See `FE/jockey_frontend-main/web/docs/education-editorial-notes.md` for the content sources, illustrative assumptions, navigation behavior and test commands. The supplied update brief ended mid-sentence after the event-coverage example; all complete requirements in that attachment were addressed.


## Data presentation follow-up - 19 October 2026

Implemented the approved comparison with the supplied Dazo screenshots: metadata-rich directories, scoped participant statistics, compact program/finish tables, latest dividend summaries, filtered full history and comparison of two to four active runners in one race. Existing membership authorization, participation snapshots and dividend corrections remain in use. Timing stays individual, context-specific and before the selected race. No database migration, reseeding or payment configuration change is needed for this update. See `DATA_PRESENTATION_REVIEW.md` for scope/verification and `SETUP.md` for deployment and API filters.
