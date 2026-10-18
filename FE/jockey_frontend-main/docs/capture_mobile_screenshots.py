"""Capture real mobile viewport screenshots from the running Next.js website.

Run the web app first (npm run dev -- --port 3001 from web/), then run this file.
Requires Playwright for Python and a locally installed Chrome browser.
"""

from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "assets"
BASE = "http://localhost:3001"

screens = {
    "mobile-dashboard": "/dashboard",
    "mobile-races": "/races",
    "mobile-race-entries": "/race/1/entries",
    "mobile-games-guide": "/games",
    "mobile-bet-cart": "/bet-cart",
    "mobile-bet-review": "/review",
    "mobile-live-center": "/live",
    "mobile-results": "/results",
    "mobile-official-result": "/result/1",
}

OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path=r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        args=["--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 430, "height": 932}, device_scale_factor=1)
    page.add_init_script("""localStorage.setItem('pj-web-bet-cart', JSON.stringify([{
      key:'demo-ticket-1', raceId:'1', raceNumber:1, raceName:'Maiden Sprint',
      raceDate:'Today', postTime:'1:30 PM', market:'WIN', stake:50,
      runners:[{id:'1',number:1,horse:'Golden Victory',jockey:'Marco de León',odds:3.1}]
    }]));""")
    for name, path in screens.items():
        response = page.goto(f"{BASE}{path}", wait_until="networkidle", timeout=45_000)
        page.add_style_tag(content="nextjs-portal { display: none !important; }")
        page.screenshot(path=str(OUT / f"{name}.png"), full_page=False)
        if name == "mobile-races" and page.locator(".schedule-club-card").count():
            page.locator(".schedule-club-card").first.click()
            page.screenshot(path=str(OUT / "mobile-race-schedule.png"), full_page=False)
            print("mobile-race-schedule: HTTP 200 -> selected a club and captured the date/race card")
        print(f"{name}: HTTP {response.status if response else 'no response'} -> {path}")
    browser.close()
