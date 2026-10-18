"""Capture the Expo app's mobile routes in a phone-sized Chromium viewport."""
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "mobile-screenshots"
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8081"
ROUTES = [
    ("Splash", "/splash"),
    ("Onboarding", "/onboarding/onboarding"),
    ("Welcome", "/welcome"),
    ("Login", "/login"),
    ("Sign up", "/signup"),
    ("Home dashboard", "/"),
    ("Dashboard", "/dashboard"),
    ("Races", "/races"),
    ("Live", "/live"),
    ("Results", "/results"),
    ("Profile", "/profile"),
    ("Race detail", "/race/race-1"),
    ("Race entries", "/race/race-1/entries"),
    ("Race bet screen", "/race/race-1/bet"),
    ("Bet selection", "/selection/race-1?market=WIN"),
    ("Bet cart", "/bet-cart"),
    ("Bet review", "/review"),
    ("Bet confirmation", "/bet-complete"),
    ("Ticket detail", "/ticket/PJA-DEMO-001"),
    ("Betting history", "/betting-history"),
    ("Result detail", "/result/res-1"),
    ("Notifications", "/notifications"),
    ("Favorites", "/favorites"),
    ("Horse profile", "/horse/r1?race=race-1"),
    ("Horse statistics", "/horse/r1/statistics?race=race-1"),
    ("Jockey profile", "/jockey/marco-de-leon?race=race-1"),
    ("Jockey statistics", "/jockey/marco-de-leon/statistics?race=race-1"),
    ("Club profile", "/club/manila-turf-club"),
    ("Live stream", "/live/stream"),
    ("Live updates", "/live/updates"),
    ("Games", "/games"),
    ("Game detail", "/games/win"),
    ("Racing guide", "/racing-guide"),
    ("JockeyPH guide", "/jockeyph-guide"),
    ("Contender", "/contender"),
    ("Rewards", "/rewards"),
    ("Settings", "/settings"),
    ("Edit profile", "/edit-profile"),
    ("Withdraw demo balance", "/withdraw"),
    ("Totalizer", "/totalizer/race-3"),
    ("Pool detail", "/totalizer/pool/pool-win-r3"),
    ("Dividend detail", "/totalizer/dividend/pool-place-r3"),
    ("Registration", "/register"),
]

errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        headless=True,
        args=["--no-sandbox", "--disable-gpu"],
    )
    context = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=1,
        is_mobile=True,
        has_touch=True,
    )
    page = context.new_page()
    page.on("pageerror", lambda err: errors.append(str(err)))
    manifest = []
    for index, (title, route) in enumerate(ROUTES, start=1):
        image = OUT / f"{index:02d}-{title.lower().replace(' ', '-')}.png"
        try:
            page.goto(BASE + route, wait_until="domcontentloaded", timeout=90000)
            page.wait_for_timeout(1800)
            page.screenshot(path=str(image), full_page=False, animations="disabled")
            manifest.append({"title": title, "route": route, "image": image.name})
            print(f"Captured {index:02d}/{len(ROUTES)} {title}: {route}")
        except Exception as exc:
            errors.append(f"{title} ({route}): {exc}")
            print(f"FAILED {title}: {exc}")
    context.close()
    browser.close()

(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
(OUT / "capture-errors.txt").write_text("\n".join(errors), encoding="utf-8")
print(f"Saved {len(manifest)} screenshots to {OUT}")
