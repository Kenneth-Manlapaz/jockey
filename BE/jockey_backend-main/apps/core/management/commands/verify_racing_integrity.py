import json
from pathlib import Path
from django.apps import apps
from django.core.management import BaseCommand, CommandError
from django.db.models import F
from apps.races.models import Race, RaceEntry
from apps.results.models import RaceResultPlacement
from apps.racing_info.models import EventLeg


class Command(BaseCommand):
    help = 'Check migrated racing relationships, snapshots and optional pre-migration model counts.'

    def add_arguments(self, parser):
        parser.add_argument('--baseline', help='Path to backup counts.json; existing model counts must not decrease.')

    def handle(self, *args, **options):
        errors = []
        if Race.objects.exclude(venue_id=F('meeting__venue_id'), race_date=F('meeting__race_date')).exists():
            errors.append('Race/meeting venue or date mismatch')
        if RaceEntry.objects.filter(original_declaration={}).exists():
            errors.append('Missing declaration snapshots')
        if RaceResultPlacement.objects.filter(participation_snapshot={}).exists():
            errors.append('Missing recorded participation snapshots')
        if RaceResultPlacement.objects.exclude(entry__race_id=F('result__race_id')).exists():
            errors.append('Placement references a different race')
        if EventLeg.objects.exclude(race__meeting_id=F('event__meeting_id')).exists():
            errors.append('Event leg crosses meetings')
        if options.get('baseline'):
            for label, count in json.loads(Path(options['baseline']).read_text(encoding='utf-8')).items():
                model = apps.get_model(label)
                actual = model.objects.count()
                if actual < count:
                    errors.append(f'{label}: records decreased from {count} to {actual}')
        if errors:
            raise CommandError('; '.join(errors))
        self.stdout.write(self.style.SUCCESS(f'Integrity verified: {Race.objects.count()} races, '
            f'{RaceEntry.objects.count()} entries, {RaceResultPlacement.objects.count()} finishing records, {EventLeg.objects.count()} event legs.'))
