from datetime import date, datetime
from zoneinfo import ZoneInfo
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class ReconstructionMigrationTests(TransactionTestCase):
    """Exercise a populated pre-reconstruction schema, not just an empty database."""
    def test_existing_ids_users_relationships_and_dividends_survive(self):
        executor = MigrationExecutor(connection)
        latest = executor.loader.graph.leaf_nodes()
        old = [('races', '0004_racetip_race_number'), ('racing_info', None), ('meetings', None), ('results', '0001_initial')]
        try:
            executor.migrate(old)
            executor = MigrationExecutor(connection)
            state = executor.loader.project_state([('races', '0004_racetip_race_number'),
                ('results', '0001_initial'), ('betting', '0001_initial'), ('accounts', '0001_initial')]).apps
            venue = state.get_model('venues', 'Venue').objects.create(name='Migration venue')
            user = state.get_model('accounts', 'User').objects.create(email='preserve@example.com', password='preserved-hash', first_name='Keep', last_name='Account')
            horse = state.get_model('horses', 'Horse').objects.create(name='Migration horse')
            race = state.get_model('races', 'Race').objects.create(venue=venue, name='Existing race', race_number=1,
                race_date=date(2026, 1, 1), post_time=datetime(2026, 1, 1, 14, tzinfo=ZoneInfo('Asia/Manila')), distance_m=1200, surface='dirt')
            entry = state.get_model('races', 'RaceEntry').objects.create(race=race, horse=horse, horse_number=1)
            result = state.get_model('results', 'RaceResult').objects.create(race=race, status='official')
            state.get_model('results', 'RaceResultPlacement').objects.create(result=result, entry=entry, finish_position=1, finish_time_ms=72000)
            game = state.get_model('betting', 'GameType').objects.create(code='WIN', name='Win', short_description='Legacy', selections_required=1, is_ordered=True)
            dividend = state.get_model('betting', 'RaceDividend').objects.create(result=result, game_type=game,
                combination='1', dividend_amount='25.00', unit_stake='10.00')
            executor.migrate(latest)
            from apps.accounts.models import User
            from apps.races.models import Race, RaceEntry
            from apps.results.models import RaceResultPlacement
            from apps.betting.models import RaceDividend
            from apps.racing_info.models import OfficialDividend, EventLeg
            self.assertEqual(User.objects.get(pk=user.pk).password, 'preserved-hash')
            self.assertEqual(Race.objects.get(pk=race.pk).meeting.race_date, date(2026, 1, 1))
            self.assertTrue(RaceEntry.objects.get(pk=entry.pk).original_declaration['captured_at_migration'])
            self.assertEqual(RaceResultPlacement.objects.get(entry_id=entry.pk).participation_snapshot['horse']['id'], horse.pk)
            self.assertEqual(str(RaceDividend.objects.get(pk=dividend.pk).dividend_amount), '25.00')
            self.assertEqual(str(OfficialDividend.objects.get().amount), '25.00')
            self.assertEqual(EventLeg.objects.get().race_id, race.pk)
        finally:
            MigrationExecutor(connection).migrate(latest)
