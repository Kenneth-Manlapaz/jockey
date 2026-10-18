from datetime import date

from django.core.management.base import BaseCommand

from apps.core import demo


class Command(BaseCommand):
    help = "Load reference data (games, wager chips...) and, unless --reference-only, the Figma demo data."

    def add_arguments(self, parser):
        parser.add_argument("--reference-only", action="store_true",
                            help="Only game types, wager presets, facilities and race categories.")
        parser.add_argument("--date", help="Race date, YYYY-MM-DD (default: today in Manila).")

    def handle(self, *args, **opts):
        if opts["reference_only"]:
            demo.seed_reference_data()
            self.stdout.write(self.style.SUCCESS("Reference data loaded."))
            return
        race_date = date.fromisoformat(opts["date"]) if opts["date"] else None
        info = demo.seed_demo(race_date)
        self.stdout.write(self.style.SUCCESS(
            f"Demo loaded for {info['date']}: {info['races']} races.\n"
            f"  Admin:  {info['admin']} / admin12345\n"
            f"  Player: {info['user']} / demo12345\n"
            f"All names, races and results are fictional demo data."))
