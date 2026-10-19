# JOCKEY data presentation review

19 October 2026. Compared the five Dazo screenshots supplied by the user with the current JOCKEY web pages, API responses, selectors and models. The assessment below records the baseline gaps. The implementation status in the next section describes the changes delivered after approval. Observations about Dazo apply to the supplied screenshots, not to unobserved features or the complete service.

## Delivered after approval

The website now includes richer horse directories with current connections, metadata filters and stable server sorting; scoped participant directory statistics; compact race programs with expandable declarations and source-attributed selections; dedicated finishing tables; latest dividend summaries with units and correction history; and result listings grouped by date and venue with dead-heat-aware podiums.

Horse and participant profiles link to paginated full history. Date, year, venue, surface, distance, status and horse-name filters apply to the full matching archive and its statistics. Horse history opened from a race retains the cutoff before that race. Participant profiles separate current owner/trainer assignments from declared and historical connections. Statistics show wins, seconds, thirds and defined rates with sample counts.

Readers can select two to four active runners in one race and compare recent finishes, comparable sample counts, individual times, assigned riders/weights, connections and published odds. Scratched/withdrawn runners cannot be selected. Missing timing explains whether a race context is needed, matching performances are absent, or eligible individual times are absent within 180 days. No rating or forecast is generated.

The new endpoints require the existing active membership. This release changes no schema, seed records, prices or payment settings. No migration or reseeding is required. Deployment instructions are in `SETUP.md`.

Verification: 93 backend tests, 20 web UI tests, seven HTTP journey checks and the real account/membership/SSR/history/comparison verification passed. Production build, web lint and migration drift checks passed. Interactive browser and physical-device visual QA remain outstanding because browser discovery returned no available browser. Compact layouts, scroll containers, sticky identity columns, touch controls and focus rules have implementation and DOM coverage; that does not establish their rendered appearance on every device.

## Direction

Build an information workspace that lets a reader find a horse, compare runners and understand a result with fewer page changes and less scrolling. Keep JOCKEY's forest green, gold and warm paper styling. Use compact, labelled data tables for comparison and reserve cards for summaries. Keep headings subordinate to the information.

The supplied reference demonstrates useful density, connected profiles and access to historical records. JOCKEY can improve on that presentation with explicit column labels, consistent units, scoped statistics, clear publication status, mobile layouts and explanations of missing data. Some reference columns and abbreviations are not fully labelled; their meanings should not be inferred.

## Prioritized gaps

| Priority | Area | Reference observation | Current JOCKEY gap | Decision |
|---|---|---|---|---|
| P1 | Horse directory | Owner, trainer, sex, age and colour appear alongside the name. | Our directory returns only ID/name and renders a name list. Connections and identity require opening each horse. | Expand the horse directory response and use a searchable desktop table: horse, current trainer, current owner, sex, birth year or labelled approximate age, colour. Add filters and sorting with stable pagination. |
| P1 | Race program | A compact race header, event labels, selections and runner rows can be scanned together. | Conditions, entries, picks and events are distributed across long sections. Favorite buttons and declaration details make rows tall. | Put race facts, scratches/announcements and published event coverage into a compact summary above the field. Keep the runner table compact; expand declarations and detailed form only on demand. |
| P1 | Race results | Placing, intermediate positions, time and dividend combinations appear together. Scratches remain visible. | We reuse the general historical form table, repeating date/venue information for each runner. Dividends sit farther down the page. | Create a result-specific table with finish, number, horse, rider, weight, individual time and margin. Place published dividend summaries next to or immediately after it. Keep scratches and disqualifications explicit. |
| P1 | Results directory | The reference result view exposes the outcome, not just a race name. | Our results list returns race metadata and result status, with no winner or winning time summary. | Add winner/placing summaries and winning time to the listing response. Use date/venue groupings and filters so the list answers what happened before opening a race. |
| P2 | Horse history | A horse page exposes a dated archive, including year groupings. | Recent/comparable lists contain five performances; the trend contains 20. There is no paginated, filterable full-history endpoint for the website. | Add a full-history endpoint and table with year, venue, surface, distance and status filters; preserve the short recent-form summary. |
| P2 | Participant statistics | The reference separates wins, seconds and thirds and connects people to horses. | We show recorded finishes, wins and top three. Date/venue filters, second/third counts and rate definitions are absent. | Compute seconds and thirds from published finishing records. Add clearly scoped win/top-three rates, date and venue filters and sample counts. Do not relabel recorded finishes as verified career starts. |
| P2 | Connections | Owner and trainer links provide context throughout the reference. | Our associated-horse list combines declarations and published history. That union is easy to mistake for current ownership or training. | Distinguish current owner/trainer assignments from historical associations. Show the period and evidence behind combination statistics. For jockeys, use ride history and declared assignments rather than ownership language. |
| P2 | Comparison | Dense runner rows make side-by-side inspection possible. | We have contextual form but no compare selection or shared comparison view. | Add a Compare action for two to four runners in one selected race, with recent finishes, comparable sample size, weight, rider and best comparable time. Keep the comparison descriptive; do not manufacture predictions. |
| P2 | Status and missing information | Scratches, favourites, results and replay have visible treatments. | Status often appears as small raw text, while missing fields repeatedly say Unavailable without the reason. | Use labelled status badges and a consistent scratch treatment. Distinguish no matching performances, missing individual time and missing race context. Show publication source/time and correction status where recorded. |
| P3 | Small screens and navigation | The supplied images establish desktop behavior only. | Wide tables scroll horizontally; the horse comparison context is easy to lose while opening profiles. | Keep number/horse identification visible while scrolling. Offer essential mobile columns and expandable row details. Preserve race/date/filter context in links and back navigation. Verify on actual narrow viewports before shipping. |

## What already exists and should be preserved

- Permanent horse and participant links, per-user favorites, meeting/date navigation and membership authorization.
- Recent form before a selected race, matching venue/surface/distance and a 180-day comparable-time window. Missing individual times are not replaced with a winner's time.
- Historical participation snapshots so later declaration edits do not rewrite result connections.
- Preserved programs after results, published result states, revision records, explicit event legs and stored dividend correction relationships.
- Dividend combination, currency, amount, unit stake and source. These are information publications; no payout calculator or settlement rewrite is needed for the presentation improvements.
- Recorded sectionals, intermediate positions, decisions and replay links where supplied. The task is to expose them clearly and avoid inferring absent values.

## Proposed first release

Deliver three coherent improvements first:

1. **Useful directories:** expose horse metadata and connections, add search/filter/sort controls, and keep a compact table on desktop with a readable row layout on phones. Participant directories can gain scoped performance summaries after their aggregation contract is defined.
2. **A compact race workspace:** keep the race facts and field together; show number/gate, horse, rider/weight, last five finishes, comparable best time, published odds and entry status. Use a small favorite action with a proper accessible name. Move declaration history into expandable details. Put source-attributed picks and event coverage near the field without implying that every event label applies to every race.
3. **Results that answer the question:** show the winner and time in the results directory, then provide a dedicated finish-order table, published dividends with their units, scratches, decisions and replay on the detail page. Keep the declared program accessible through the same race identity.

Then add searchable history and comparison. This order makes the existing data easier to use before introducing new analytics.

## Data and API work

### Existing fields that can support the first release

`Horse` already stores sex, colour, birth year, country of origin, sire, dam, current trainer and owner. Actual population varies, so field availability must be checked and empty values remain explicit. Country of origin is not a verified birthplace or breeding history.

The website directory currently calls `participant()` for every type, producing only `{id, name}`. Rich horse rows therefore require an API response change, not CSS alone. Fetch owner and trainer with `select_related` so the richer list does not introduce one query per row.

Race responses already include declarations, status, weights, form, events and published results. Result placements already store finishing position, individual time, margin, intermediate positions, disqualification and dead-heat flags. Their serializer currently does not expose every stored field, such as final odds. Decide whether those fields are useful and sufficiently populated before adding columns.

### Queries and definitions to add

- Paginated history and explicit date/venue/distance/surface/status filters.
- Stable server sorting for directory and history fields, including deterministic tie-breaking and null placement. Sorting only the currently loaded page would be misleading.
- Aggregated second/third counts and rates with a published definition. If a rate uses recorded official/corrected finishes as the denominator, label it that way and state how disqualifications and dead heats are handled. A genuine starts denominator requires its own definition and eligible records.
- Winner and timing summaries in the results list, including dead-heat and provisional/corrected handling.
- Clear separation of current owner/trainer relationships and snapshot-based historical assignments.
- Coverage/reason metadata for comparable timing so the UI can explain an empty value accurately.

### Information that needs an external source or additional capture

- Exact birth date: the current horse model stores a year. Do not invent a birthday or imply exact age calculated from one.
- Authoritative live programs, timing, ratings, announcements, dividends and operator-specific event rules.
- Participant nationality, year started and biography when not stored. Their absence is not a reason to generate facts.
- Lifetime earnings, official lifetime starts, private ratings or predictive scores: do not display legacy counters or fabricated totals as verified history.

The screenshot's unlabeled numeric columns, stars, letters, abbreviations and split notation do not establish their meanings. Use the relevant operator definition before adopting or calculating them.

## Acceptance checks

- Readers can see a horse's current connections from the directory and reach the horse or participant through stable links.
- Program rows remain consistent in height until expanded. The core facts and column headers remain available while comparing runners.
- Default result order is finishing order, with clear finish numbers. Scratched runners are visible and cannot be mistaken for finishers. Disqualifications, dead heats and corrections retain their meaning.
- Dividends always show the published combination, currency and unit stake, or explicitly state the missing unit. Multi-race events show their actual recorded legs.
- Filters apply to the whole dataset and to the displayed statistics, and survive pagination/back navigation.
- No-context comparable timing is explained as requiring a race context; no matches and missing times are distinguished.
- Directory/history endpoints have pagination and reasonable query counts; profile views do not return an unbounded set of associations.
- Keyboard navigation, focus states, contrast, narrow layouts and long names are checked in a browser. Responsive CSS inspection alone is insufficient.
- Existing membership authorization, account isolation, favorites, historical snapshots and correction behavior keep passing their checks.

## Implementation references reviewed

- `BE/jockey_backend-main/apps/racing_info/views.py`: directory, horse, participant and results contracts.
- `BE/jockey_backend-main/apps/racing_info/selectors.py`: recorded-form selection, history scope and snapshots.
- `BE/jockey_backend-main/apps/horses/models.py`: identity and current connections.
- `BE/jockey_backend-main/apps/participants/models.py`: available participant fields.
- `BE/jockey_backend-main/apps/results/models.py`: published results, placements and revisions.
- `FE/jockey_frontend-main/web/src/features/racing/components/program-page.tsx`: current program hierarchy.
- `FE/jockey_frontend-main/web/src/features/racing/components/information.tsx`: shared form and event/dividend tables.
- Website directory, horse, participant and results pages under `web/src/app/(dashboard)`.
- The five user-supplied `viber_image_2026-10-19_*` references: program, result, horse directory, owner profile and horse history.
