from django.core.management import BaseCommand
from apps.core.racing_fixture_names import rename_existing_fixtures


class Command(BaseCommand):
    help = 'Give previously seeded fictional racing fixtures readable names without changing IDs or results.'

    def handle(self, *args, **options):
        rename_existing_fixtures()
        self.stdout.write(self.style.SUCCESS('Sample racing names updated. IDs, results and account records preserved.'))
