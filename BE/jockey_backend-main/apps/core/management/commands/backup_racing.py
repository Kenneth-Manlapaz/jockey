"""Recoverable logical snapshot plus counts before applying reconstruction migrations."""
import json
from pathlib import Path
from itertools import chain
from django.core import serializers
from django.core.management import BaseCommand
from django.db import connection
from django.db.migrations.loader import MigrationLoader
from django.utils import timezone


class Command(BaseCommand):
    help = 'Back up all existing Django-managed records without modifying the database.'

    def add_arguments(self, parser):
        parser.add_argument('--output', default='backups')

    def handle(self, *args, **options):
        folder = Path(options['output']) / timezone.now().strftime('%Y%m%dT%H%M%S%fZ')
        folder.mkdir(parents=True, exist_ok=False)
        # Use the *applied* migration state, so this also works before new columns exist.
        loader = MigrationLoader(connection)
        apps = loader.project_state(nodes=list(loader.applied_migrations)).apps
        tables = set(connection.introspection.table_names())
        counts = {m._meta.label: m.objects.count() for m in apps.get_models()
                  if m._meta.managed and m._meta.db_table in tables}
        models = [m for m in apps.get_models() if m._meta.label in counts]
        with (folder / 'records.json').open('w', encoding='utf-8') as stream:
            serializers.serialize('json', chain.from_iterable(m.objects.all().iterator() for m in models), stream=stream, indent=2)
        (folder / 'counts.json').write_text(json.dumps(counts, indent=2), encoding='utf-8')
        if connection.vendor == 'sqlite':
            import sqlite3
            connection.ensure_connection()
            with sqlite3.connect(folder / 'database.sqlite3') as target:
                connection.connection.backup(target)
        self.stdout.write(self.style.SUCCESS(f'Backup: {folder.resolve()} ({sum(counts.values())} records)'))
