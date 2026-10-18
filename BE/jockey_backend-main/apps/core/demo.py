"""Reference data and demo data (mirrors the SQL seeds and your Figma screens).

This is the one place that knows about every app (a "composition root"), so it
lives in core and is only used by the seed_demo command and the tests."""
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.utils import timezone

from apps.accounts.models import User
from apps.betting import services as betting_services
from apps.betting.models import GameType, RaceGame, WagerPreset
from apps.horses.models import Horse
from apps.participants.models import Jockey, Owner, Trainer
from apps.races.models import Race, RaceCategory, RaceEntry
from apps.venues.models import Facility, RacingClub, Venue, VenueCourse, VenueFacility, VenueTrackSurface

GAMES = [
    ("WIN", "Win", "Choose the horse that finishes first.", 1, True, 1),
    ("PLACE", "Place", "Choose a horse to finish first or second.", 1, True, 2),
    ("FORECAST", "Forecast", "Pick the first two finishers in order.", 2, True, 2),
    ("REVERSE_FORECAST", "Reverse Forecast", "Pick the top two finishers in either order.", 2, False, 2),
    ("TRIFECTA", "Trifecta", "Pick the first three finishers in exact order.", 3, True, 3),
]
FACILITIES = [("grandstand", "Grandstand viewing"), ("paddock", "Paddock viewing"),
              ("betting_lounge", "Betting lounge"), ("accessible", "Accessible areas"),
              ("parking", "Parking"), ("test_lab", "Test Lab")]
CATEGORIES = [("MAIDEN", "Maiden"), ("HANDICAP", "Handicap"), ("STAKES", "Stakes"),
              ("CUP", "Cup"), ("CLASSIC", "Classic")]


def seed_reference_data():
    """Game types, wager chips, facilities, race categories. Safe to run twice."""
    for order, (code, name, desc, picks, ordered, places) in enumerate(GAMES, start=1):
        GameType.objects.get_or_create(code=code, defaults=dict(
            name=name, short_description=desc, selections_required=picks, is_ordered=ordered,
            max_finishing_positions=places, sort_order=order))
    for order, amount in enumerate((20, 50, 100, 200), start=1):
        WagerPreset.objects.get_or_create(amount=amount, defaults={"sort_order": order})
    for code, label in FACILITIES:
        Facility.objects.get_or_create(code=code, defaults={"label": label})
    for code, name in CATEGORIES:
        RaceCategory.objects.get_or_create(code=code, defaults={"name": name})


HORSES = [  # name, jockey, trainer, owner, odds, weight, badge colour
    ("Golden Victory", "Marco de León", "E. Villanueva", "Crown Estate Stable", "3.10", "58.0", "#C9A24D"),
    ("Midnight Thunder", "Luis Mercado", "A. Santos", "Northwind Farm", "3.80", "58.0", "#1F2937"),
    ("Royal Champion", "Paolo Reyes", "J. Mendoza", "Reyes Racing", "4.50", "56.0", "#7C3AED"),
    ("Silver Comet", "Diego Ramos", "M. Cruz", "Silverline Stables", "5.20", "57.0", "#64748B"),
    ("Emerald Star", "Nico Castillo", "R. Dela Cruz", "Green Valley Farm", "5.90", "56.5", "#059669"),
    ("Braveheart", "Anton Flores", "T. Garcia", "Lakeside Racing", "6.60", "55.0", "#DC2626"),
]
HORSE_PROFILES = [
    # name, sex, color, birth year, sire, dam, trainer, owner, starts, wins, places, earnings, form
    ("Copper Sunrise", "filly", "chestnut", 2022, "Sunrise Crown", "Copper Lily",
     "L. Navarro", "Sunrise Stable", 8, 2, 3, "385000.00", "1-2-4-1-3"),
    ("Windward King", "colt", "bay", 2021, "Northern Wind", "Queen's Harbor",
     "M. Santiago", "Harborlight Racing", 12, 4, 5, "920000.00", "2-1-1-3-2"),
    ("Velvet Horizon", "mare", "dark bay", 2020, "Evening Star", "Velvet Road",
     "A. Dizon", "Blue Horizon Farm", 18, 5, 7, "1475000.00", "3-2-5-1-4"),
    ("Golden Orchard", "gelding", "golden chestnut", 2019, "Harvest Moon", "Orchard Belle",
     "R. Bautista", "Golden Orchard Stable", 24, 6, 9, "2130000.00", "1-4-2-6-3"),
    ("Silver Monsoon", "stallion", "gray", 2021, "Silver Tempest", "Monsoon Song",
     "C. Mercado", "Silverline Racing", 10, 3, 4, "780000.00", "2-3-1-2-5"),
]
RACES = [  # number, name, hour, minute, distance, category, status
    (1, "Maiden Sprint", 13, 30, 1200, "MAIDEN", "upcoming"),
    (2, "Turf Challenge", 14, 30, 1800, "HANDICAP", "upcoming"),
    (3, "Champions' Mile", 15, 30, 1600, "CUP", "upcoming"),
    (4, "Heritage Cup", 16, 45, 1800, "STAKES", "upcoming"),
]
# Dividends per PHP 10 stake for the demo result of race 1 (winning combinations only).
DEMO_DIVIDENDS = [
    ("WIN", "1", 31), ("PLACE", "1", 14), ("PLACE", "2", 18), ("FORECAST", "1-2", 142),
    ("REVERSE_FORECAST", "1-2", 71), ("TRIFECTA", "1-2-3", 380),
]


def seed_demo(race_date=None, admin_password="admin12345", user_password="demo12345"):
    """Build the Figma demo: venue, 6 horses, 4 races, a demo user with tickets,
    and an official result for race 1. Returns a dict of what was created."""
    seed_reference_data()
    race_date = race_date or betting_services.manila_today()

    club, _ = RacingClub.objects.get_or_create(name="Philippine Racing Club")
    RacingClub.objects.get_or_create(
        name="Postman Demo Racing Club",
        defaults={"short_name": "PDRC"},
    )
    for (name, sex, color, birth_year, sire, dam, trainer_name, owner_name,
         starts, wins, places, earnings, form) in HORSE_PROFILES:
        trainer, _ = Trainer.objects.get_or_create(full_name=trainer_name)
        owner, _ = Owner.objects.get_or_create(name=owner_name)
        Horse.objects.get_or_create(name=name, defaults=dict(
            sex=sex, color=color, birth_year=birth_year, country_of_origin="PH",
            sire=sire, dam=dam, trainer=trainer, owner=owner,
            career_starts=starts, career_wins=wins, career_places=places,
            career_earnings=Decimal(earnings), form_last5=form,
            bio="Fictional demo horse profile.", is_fictional=True,
        ))
    venue, _ = Venue.objects.get_or_create(
        name="Sample Racing Venue", defaults=dict(
            club=club, city="Metro Manila", tagline="A modern racing destination",
            description="A fictional premium venue created for demonstration."))
    turf, _ = VenueTrackSurface.objects.get_or_create(venue=venue, surface="turf", defaults={"circumference_m": 1800})
    VenueTrackSurface.objects.get_or_create(venue=venue, surface="dirt", defaults={"circumference_m": 1600})
    for order, (name, lo, hi) in enumerate([("Main Oval", 1600, 2400), ("Sprint Course", 1000, 1400),
                                            ("Extended Route", 2400, 3200)]):
        VenueCourse.objects.get_or_create(venue=venue, name=name, defaults=dict(
            surface=turf, min_distance_m=lo, max_distance_m=hi, sort_order=order))
    for facility in Facility.objects.all():
        if not VenueFacility.objects.filter(venue=venue, facility=facility).exists():
            VenueFacility.objects.create(venue=venue, facility=facility)

    entries_by_race = {}
    games = list(GameType.objects.filter(is_active=True))
    for number, name, hour, minute, distance, cat, status in RACES:
        post = timezone.make_aware(datetime.combine(race_date, time(hour, minute)))  # Manila time
        race, _ = Race.objects.get_or_create(
            venue=venue, race_date=race_date, race_number=number, defaults=dict(
                club=club, name=name, post_time=post, distance_m=distance, surface="turf",
                track_condition="good", status=status, purse_amount=Decimal("1200000.00"),
                category=RaceCategory.objects.get(code=cat), is_featured=(number == 3),
                description="Fictional demonstration race."))
        for g in games:
            if not RaceGame.objects.filter(race=race, game_type=g).exists():
                RaceGame.objects.create(race=race, game_type=g, is_open=True)
        entries = []
        for n, (hname, jname, tname, oname, odds, weight, color) in enumerate(HORSES, start=1):
            jockey, _ = Jockey.objects.get_or_create(full_name=jname)
            trainer, _ = Trainer.objects.get_or_create(full_name=tname)
            owner, _ = Owner.objects.get_or_create(name=oname)
            horse, _ = Horse.objects.get_or_create(name=hname, defaults=dict(trainer=trainer, owner=owner))
            entry, _ = RaceEntry.objects.get_or_create(
                race=race, horse_number=n, defaults=dict(
                    horse=horse, jockey=jockey, trainer=trainer, owner=owner, badge_color=color,
                    weight_kg=Decimal(weight), current_odds=Decimal(odds), morning_odds=Decimal(odds)))
            entries.append(entry)
        entries_by_race[number] = entries

    admin, created = User.objects.get_or_create(email="admin@example.com", defaults=dict(
        first_name="Admin", last_name="User", role="admin"))
    if created:
        admin.set_password(admin_password)
        admin.save()
    isabella, created = User.objects.get_or_create(email="isabella@example.com", defaults=dict(
        first_name="Isabella", last_name="Santos", mobile_number="+639171234567"))
    if created:
        isabella.set_password(user_password)
        isabella.save()

    r1 = Race.objects.get(venue=venue, race_date=race_date, race_number=1)
    r3 = Race.objects.get(venue=venue, race_date=race_date, race_number=3)
    e1 = list(r1.entries.order_by("horse_number"))
    e3 = list(r3.entries.order_by("horse_number"))

    if not isabella.bets.filter(race__race_date=race_date).exists():
        win = GameType.objects.get(code="WIN")
        place = GameType.objects.get(code="PLACE")
        betting_services.place_bet(user=isabella, race=r1, game_type=win, entry_ids=[e1[0].pk], wager_amount=50)
        betting_services.place_bet(user=isabella, race=r1, game_type=place, entry_ids=[e1[5].pk], wager_amount=100)
        betting_services.place_bet(user=isabella, race=r3, game_type=win, entry_ids=[e3[0].pk], wager_amount=50)

    if not hasattr(r1, "result"):
        # Race 1 finishes: Golden Victory, Midnight Thunder, Royal Champion
        betting_services.publish_result(
            race=r1, finishing_order=[e1[0].pk, e1[1].pk, e1[2].pk], winning_time_ms=72840,
            dividends=DEMO_DIVIDENDS)
        betting_services.finalize_race(r1, changed_by=admin)

    return {"admin": admin.email, "user": isabella.email, "races": len(RACES), "date": str(race_date)}
