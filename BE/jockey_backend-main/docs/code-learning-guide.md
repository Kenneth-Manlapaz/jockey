# Learn the code: adding API data

This guide explains how a request travels through this Django project, where to make common changes, and a practice exercise you can type in yourself. It does not change the app code.

## 1. The project in one picture

```text
HTTP request
    ↓
config/urls.py                  mounts the API under /api/v1/
    ↓
apps/api/urls.py                gathers routes from each app
    ↓
apps/<app>/api/urls.py          maps a URL to a view or viewset
    ↓
apps/<app>/api/views.py         handles the request and response
    ↓
apps/<app>/selectors.py         reads/querysets from the database
    ↓
apps/<app>/api/serializers.py   turns model data into JSON
```

For a write request, the view usually validates input through a serializer and calls a function in `services.py` to apply the business rules and save changes. The model describes the stored data and its relationships.

## 2. What each file is for

| File | Responsibility | Example in this project |
|---|---|---|
| `models.py` | Database records, fields, and relationships | `Race`, `RaceEntry`, `RaceLiveEvent` |
| `selectors.py` | Database reads and query/filter logic | `race_schedule()` |
| `services.py` | Actions that change data and enforce business rules | `scratch_entries()` |
| `api/serializers.py` | JSON input/output fields and validation | `RaceSerializer` |
| `api/views.py` | HTTP behavior, permissions, and calls to selectors/services | `RaceViewSet` |
| `api/urls.py` | URLs provided by that app | router for `races` and `entries` |
| `migrations/` | Versioned database structure changes | `0001_initial.py` |
| `admin.py` | Django admin screens | race and entry admin |
| `tests/` | Automated checks for expected behavior | race API tests |

Apps group related features: for example `apps/races`, `apps/horses`, `apps/venues`, and `apps/accounts`. An API URL can be traced from [config/urls.py](../config/urls.py) to [apps/api/urls.py](../apps/api/urls.py), then into an app such as [apps/races/api/urls.py](../apps/races/api/urls.py).

## 3. Trace an existing endpoint

Try tracing `GET /api/v1/races/?featured=1` through these files:

1. [config/urls.py](../config/urls.py) adds the `/api/v1/` prefix.
2. [apps/api/urls.py](../apps/api/urls.py) includes `apps.races.api.urls`.
3. [apps/races/api/urls.py](../apps/races/api/urls.py) registers `RaceViewSet` with a router under `races`.
4. [apps/races/api/views.py](../apps/races/api/views.py) defines `get_queryset()`. It reads `featured` from query parameters and calls `selectors.race_schedule(...)`.
5. [apps/races/selectors.py](../apps/races/selectors.py) builds the database query and filters featured races.
6. [apps/races/api/serializers.py](../apps/races/api/serializers.py) decides which race fields appear in JSON.

Because `RaceViewSet` is a `ReadOnlyModelViewSet`, the router provides read operations (list and detail). Its `entries` action adds the extra route `GET /api/v1/races/{id}/entries/`.

You can run the app locally with `python manage.py runserver` and visit `http://127.0.0.1:8000/api/v1/races/`. Add `?featured=1` to see filtering. A list may be wrapped in pagination JSON with `count`, `next`, `previous`, and `results`.

## 4. Which file should I edit?

- **Show another field already stored on the same model:** add it to the serializer's `fields` list.
- **Show related information:** add a read-only serializer field using `source=...`, like `venue_name` in `RaceSerializer`.
- **Filter or order results:** add the query logic in the app's selector, then pass the request parameter from the view.
- **Add a read endpoint:** add a serializer if needed, a selector for the query, and a view/action; connect it to the app router if it is a separate view.
- **Accept data that creates or updates records:** define serializer input validation, check permissions, and call a service from the view.
- **Add a new kind of stored record:** add a model and migration, then build its serializer, selector, view, and URL.

Keep query logic out of views as it grows. Keep business rules out of serializers and views; put reusable write operations in services.

## 5. Practice: add a race live-events endpoint

Goal: create `GET /api/v1/races/{id}/live-events/`, returning the live events for one race. The model already exists as `RaceLiveEvent` in [apps/races/models.py](../apps/races/models.py), with fields `event_type`, `commentary`, `positions`, and `occurred_at`. This exercise only reads existing data, so you do not need a database migration.

### Step A: add a selector

In `apps/races/selectors.py`, import `RaceLiveEvent` from `.models`, then add:

```python
def live_events_queryset(*, race):
    return RaceLiveEvent.objects.filter(race_id=race).order_by("occurred_at", "id")
```

The selector owns the database query. `race_id=race` filters events for the requested race.

### Step B: add a serializer

In `apps/races/api/serializers.py`, import `RaceLiveEvent` and add:

```python
class RaceLiveEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = RaceLiveEvent
        fields = ["id", "race_id", "event_type", "commentary", "positions", "occurred_at"]
```

The serializer controls the JSON fields. `positions` is a JSON field, so its stored structure is returned as JSON.

### Step C: add an action to the race viewset

In `apps/races/api/views.py`, import `RaceLiveEventSerializer` with the other serializers. Inside `RaceViewSet`, add:

```python
    @action(detail=True, methods=["get"], url_path="live-events")
    def live_events(self, request, pk=None):
        qs = selectors.live_events_queryset(race=pk)
        return Response(RaceLiveEventSerializer(qs, many=True).data)
```

`detail=True` means the route includes a race ID. Since `RaceViewSet` is read-only and has `AllowAny`, this is a public GET endpoint like the other race reads.

### Step D: try the endpoint

Run the server and request:

```text
GET http://127.0.0.1:8000/api/v1/races/1/live-events/
```

With curl:

```bash
curl http://127.0.0.1:8000/api/v1/races/1/live-events/
```

It may return `[]` if that race has no events yet. That still confirms the URL is connected and the query works. If you get a 404, check that race ID 1 exists in your database. If Django reports an import or attribute error, compare the serializer import and method indentation with the surrounding code.

### Step E: check your understanding

Try these variations yourself:

1. Add `race_id` to the returned fields if it is missing.
2. Change the ordering to newest event first.
3. Add a `?event_type=` filter to the selector and pass it from the view.
4. Decide what a missing race ID should return. The current action will return an empty list; you can change it to return a 404 if that better fits the API behavior.

## 6. When do I need a migration?

Changing a serializer, selector, view, URL, or response formatting does not change the database schema, so it does not need a migration.

Changing a Django model's database fields usually does. The basic local workflow is:

```bash
python manage.py makemigrations
python manage.py migrate
```

Review the generated migration before applying it. This project also has SQL schema files in `sql/`, so a new database table may need corresponding SQL changes to keep MariaDB's initial schema setup consistent. A migration should be created and committed with the model change.

## 7. How to debug a new endpoint

Check each layer in order:

1. **404:** Is the app URL included in `apps/api/urls.py`? Is the path/action spelled correctly?
2. **403 or 401:** Check the view's permission classes and whether a token is required.
3. **Empty results:** Check the selector's filter and whether matching rows exist in this database.
4. **Missing JSON field:** Check the serializer's `fields` list and any `source` path.
5. **Server error:** Read the terminal running Django; the traceback points to the failing file and line.
6. **Works locally but not deployed:** deploy the code and apply migrations if the model/schema changed.

The existing API reference is [docs/api-reference.md](api-reference.md). It describes current endpoints and authentication conventions.
