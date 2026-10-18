from django.core.management.base import BaseCommand, CommandError

from apps.betting import services
from apps.races.models import Race


class Command(BaseCommand):
    help = "Make a race's result official and settle its pending bets: settle_race <race_id>"

    def add_arguments(self, parser):
        parser.add_argument("race_id", type=int)

    def handle(self, *args, **opts):
        try:
            race = Race.objects.get(pk=opts["race_id"])
            summary = services.finalize_race(race)
        except Race.DoesNotExist:
            raise CommandError("No such race.")
        except services.BettingError as exc:
            raise CommandError(str(exc))
        except Exception as exc:  # RelatedObjectDoesNotExist when the race has no result row yet
            if exc.__class__.__name__ == "RelatedObjectDoesNotExist":
                raise CommandError("This race has no result yet.")
            raise
        self.stdout.write(self.style.SUCCESS(
            f"{race}: {summary['won']} won, {summary['lost']} lost, "
            f"PHP {summary['payout_total']:,.2f} paid out."))
