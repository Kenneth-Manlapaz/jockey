"""Copy published legacy records without touching settlement tables or tickets."""
from django.db import migrations


def preserve(apps, schema_editor):
    Dividend = apps.get_model('betting', 'RaceDividend')
    EventType = apps.get_model('racing_info', 'EventType')
    Event = apps.get_model('racing_info', 'BettingEvent')
    Leg = apps.get_model('racing_info', 'EventLeg')
    Published = apps.get_model('racing_info', 'OfficialDividend')
    db = schema_editor.connection.alias
    # Legacy payouts are single-race records. Do not infer any multi-race mappings.
    for d in Dividend.objects.using(db).select_related('result__race', 'game_type').iterator():
        r = d.result.race
        if d.result.status not in ('official', 'corrected', 'provisional'):
            continue
        kind, _ = EventType.objects.using(db).get_or_create(code=d.game_type.code, defaults={
            'name': d.game_type.name, 'definition': 'Imported legacy single-race category. Operator rules unverified.'})
        event, _ = Event.objects.using(db).get_or_create(meeting_id=r.meeting_id, event_type=kind,
            label=f'Race {r.race_number} · {d.game_type.code}', defaults={
                'status': d.result.status, 'is_demo': r.is_demo, 'source': 'Existing database; external source unavailable'})
        Leg.objects.using(db).get_or_create(event=event, race_id=r.pk, defaults={'sequence': 1})
        Published.objects.using(db).get_or_create(event=event, combination=d.combination, defaults={
            'amount': d.dividend_amount, 'unit_stake': d.unit_stake, 'status': d.result.status,
            'source': 'Existing database; external source unavailable',
            'published_at': d.result.made_official_at or d.result.posted_at or d.result.created_at})


class Migration(migrations.Migration):
    dependencies = [('racing_info', '0001_initial'), ('races', '0007_alter_race_meeting'), ('betting', '0001_initial')]
    operations = [migrations.RunPython(preserve, migrations.RunPython.noop)]
