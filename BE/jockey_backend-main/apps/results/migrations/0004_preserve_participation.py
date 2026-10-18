from django.db import migrations


def preserve(apps, schema_editor):
    Placement = apps.get_model('results', 'RaceResultPlacement')
    for p in Placement.objects.using(schema_editor.connection.alias).select_related(
            'entry__horse', 'entry__jockey', 'entry__trainer', 'entry__owner').iterator():
        snapshot = {}
        for key in ('horse', 'jockey', 'trainer', 'owner'):
            person = getattr(p.entry, key)
            snapshot[key] = {'id': person.pk, 'name': getattr(person, 'name', None) or person.full_name} if person else None
        snapshot.update(weight_kg=str(p.entry.weight_kg) if p.entry.weight_kg is not None else None, gate=p.entry.post_position)
        Placement.objects.using(schema_editor.connection.alias).filter(pk=p.pk).update(participation_snapshot=snapshot)


class Migration(migrations.Migration):
    dependencies = [('results', '0003_raceresultplacement_participation_snapshot')]
    operations = [migrations.RunPython(preserve, migrations.RunPython.noop)]
