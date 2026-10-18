from django.db import migrations


def preserve(apps, schema_editor):
    Race = apps.get_model('races', 'Race')
    Entry = apps.get_model('races', 'RaceEntry')
    Meeting = apps.get_model('meetings', 'Meeting')
    db = schema_editor.connection.alias
    for r in Race.objects.using(db).all().iterator():
        m, _ = Meeting.objects.using(db).get_or_create(venue_id=r.venue_id, race_date=r.race_date,
                                                     defaults={'is_demo': r.is_demo})
        Race.objects.using(db).filter(pk=r.pk).update(meeting_id=m.pk)
    for e in Entry.objects.using(db).all().iterator():
        snapshot = {key: str(getattr(e, key)) if getattr(e, key) is not None else None
                    for key in ('horse_id', 'jockey_id', 'trainer_id', 'owner_id', 'horse_number',
                                'post_position', 'weight_kg', 'status')}
        snapshot['captured_at_migration'] = True  # Earlier declaration changes cannot be reconstructed.
        Entry.objects.using(db).filter(pk=e.pk).update(original_declaration=snapshot)


class Migration(migrations.Migration):
    dependencies = [('races', '0005_race_meeting_raceentry_coupled_group_and_more')]
    operations = [migrations.RunPython(preserve, migrations.RunPython.noop)]
