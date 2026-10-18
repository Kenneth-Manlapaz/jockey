from pathlib import Path
import re
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "Philippine-Jockey-System-Flow.pptx"
INTRO_SCREEN = ROOT / "docs" / "assets" / "mobile-login.png"

GREEN = "103B2F"
DEEP = "0A2D24"
PAPER = "F5F1E8"
GOLD = "C9A451"
INK = "1D2924"
MUTED = "718078"
LINE = "DCDDD5"
WHITE = "FFFFFF"
PALE_GREEN = "E5EEE9"
PALE_GOLD = "F1E8D1"
RED = "C74A43"
BLUE = "547A9E"
FONT = "Aptos"
SERIF = "Georgia"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]


def rgb(hex_value):
    return RGBColor.from_string(hex_value)


def shape(slide, x, y, w, h, fill, radius=True, line=None, transparency=0):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    item = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    item.fill.solid()
    item.fill.fore_color.rgb = rgb(fill)
    item.fill.transparency = transparency
    item.line.fill.background() if line is None else None
    if line:
        item.line.color.rgb = rgb(line)
        item.line.width = Pt(0.8)
    if radius:
        try:
            item.adjustments[0] = 0.14
        except (IndexError, ValueError):
            pass
    return item


def text(slide, value, x, y, w, h, size=12, color=INK, bold=False,
         font=FONT, align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP,
         margin=0.02, italic=False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    for index, line in enumerate(value.split("\n")):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(3)
        r = p.add_run()
        r.text = line
        r.font.name = font
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.italic = italic
        r.font.color.rgb = rgb(color)
    return box


def bullet_list(slide, items, x, y, w, line_h=0.38, size=13, color=INK,
                bullet_color=GOLD):
    for i, item in enumerate(items):
        yy = y + i * line_h
        shape(slide, x, yy + 0.09, 0.08, 0.08, bullet_color, radius=True)
        text(slide, item, x + 0.2, yy, w - 0.2, line_h, size=size, color=color)


def line(slide, x1, y1, x2, y2, color=LINE, width=1.2, arrow=False):
    c = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    c.line.color.rgb = rgb(color)
    c.line.width = Pt(width)
    if arrow:
        c.line.end_arrowhead = True
    return c


def base(title, kicker="SYSTEM FLOW", section=None):
    kicker = re.sub(r"^\d+\s*[·•]\s*", "", kicker)
    slide = prs.slides.add_slide(blank)
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = rgb(PAPER)
    shape(slide, 0, 0, 13.333, 0.12, GREEN, radius=False)
    text(slide, kicker, 0.62, 0.35, 5.5, 0.23, size=8, color=GOLD, bold=True)
    text(slide, title, 0.62, 0.66, 12.0, 0.55, size=27, color=GREEN, bold=True, font=SERIF)
    line(slide, 0.62, 1.36, 12.72, 1.36, LINE, 0.8)
    footer(slide, section)
    return slide


def footer(slide, section=None):
    number = len(prs.slides)
    text(slide, "PHILIPPINE JOCKEY  ·  SYSTEM OVERVIEW  ·  16 OCT 2026", 0.62, 7.16, 8.2, 0.16,
         size=7, color=MUTED, bold=True)
    if section:
        text(slide, section.upper(), 10.3, 7.16, 2.35, 0.16, size=7, color=MUTED, align=PP_ALIGN.RIGHT)
    text(slide, f"{number:02d}", 12.52, 7.11, 0.25, 0.2, size=8, color=GREEN, bold=True, align=PP_ALIGN.RIGHT)


def card(slide, x, y, w, h, title, body=None, accent=GOLD,
         fill=WHITE, title_size=14, body_size=10, title_color=GREEN):
    shape(slide, x, y, w, h, fill, line=LINE)
    shape(slide, x, y, 0.06, h, accent, radius=False)
    text(slide, title, x + 0.2, y + 0.15, w - 0.36, 0.32,
         size=title_size, color=title_color, bold=True)
    if body:
        text(slide, body, x + 0.2, y + 0.58, w - 0.38, h - 0.7,
             size=body_size, color=INK)


def pill(slide, label, x, y, w, fill=PALE_GREEN, color=GREEN):
    shape(slide, x, y, w, 0.28, fill)
    text(slide, label, x + 0.04, y + 0.025, w - 0.08, 0.19, size=7,
         color=color, bold=True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)


def mobile_preview(title, kicker, images, section="Mobile screens"):
    slide = base(title, kicker, section)
    count = len(images)
    if count == 2:
        pic_h, pic_w, y = 4.55, 4.55 * 430 / 932, 1.92
        centers = [3.55, 9.78]
        label_y, caption_y = 1.55, 6.61
        caption_size = 9
    else:
        pic_h, pic_w, y = 4.28, 4.28 * 430 / 932, 1.96
        centers = [2.65, 6.66, 10.67]
        label_y, caption_y = 1.55, 6.34
        caption_size = 8
    for (name, label, caption), center in zip(images, centers):
        x = center - pic_w / 2
        shape(slide, x - 0.08, y - 0.08, pic_w + 0.16, pic_h + 0.16, DEEP)
        image_path = ROOT / "docs" / "assets" / f"{name}.png"
        slide.shapes.add_picture(str(image_path), Inches(x), Inches(y), width=Inches(pic_w), height=Inches(pic_h))
        text(slide, label, center - 1.3, label_y, 2.6, 0.2, size=8, color=GOLD, bold=True, align=PP_ALIGN.CENTER)
        text(slide, caption, center - 1.58, caption_y, 3.16, 0.31, size=caption_size,
             color=INK, align=PP_ALIGN.CENTER)
    note_y = 6.96 if count == 2 else 6.75
    text(slide, "Captured from the running mobile website at 430 × 932 px. Names and race details may be demo content.",
         0.78, note_y, 11.65, 0.18, size=7, color=MUTED, italic=True)
    return slide


# 1 — Cover
slide = prs.slides.add_slide(blank)
slide.background.fill.solid()
slide.background.fill.fore_color.rgb = rgb(DEEP)
shape(slide, 0, 0, 8.0, 7.5, DEEP, radius=False)
shape(slide, 8.0, 0, 5.333, 7.5, GREEN, radius=False)
shape(slide, 9.08, 0.3, 3.3, 6.92, DEEP)
if INTRO_SCREEN.exists():
    slide.shapes.add_picture(str(INTRO_SCREEN), Inches(9.18), Inches(0.4), width=Inches(3.1), height=Inches(6.72))
shape(slide, 0.68, 0.66, 0.1, 0.36, GOLD, radius=False)
text(slide, "PHILIPPINE JOCKEY", 0.95, 0.68, 3.8, 0.24, size=10, color="E5D39B", bold=True)
text(slide, "How the system\nflows", 0.7, 1.85, 6.3, 1.75, size=38, color=WHITE, bold=True, font=SERIF)
text(slide, "A visual guide to the Philippine Jockey experience", 0.74, 4.0, 5.9, 0.45, size=15, color="D4DED8")
line(slide, 0.75, 4.72, 5.8, 4.72, GOLD, 1.4)
text(slide, "Visual guide  |  16 October 2026", 0.75, 4.95, 4.6, 0.3, size=11, color="C2D0C8")
text(slide, "PHILIPPINE JOCKEY  ·  SYSTEM OVERVIEW  ·  16 OCT 2026", 0.75, 7.16, 8.2, 0.16,
     size=7, color="AABCB2", bold=True)
text(slide, "01", 12.52, 7.11, 0.25, 0.2, size=8, color=WHITE, bold=True, align=PP_ALIGN.RIGHT)

# 2 — Executive snapshot
s = base("One experience, from first visit to race results", "01 · SYSTEM OVERVIEW", "The experience")
card(s, 0.72, 1.7, 3.8, 1.55, "Discover", "See today's featured race, choose a club, and browse the race schedule.", accent=GREEN)
card(s, 4.77, 1.7, 3.8, 1.55, "Take part", "Learn each game, choose horses, review a play-money wager, and receive a ticket.", accent=GOLD)
card(s, 8.82, 1.7, 3.8, 1.55, "Follow through", "Watch race-day updates, check official results, and explore winning horses and jockeys.", accent=BLUE)
text(s, "The journey", 0.75, 3.72, 2.0, 0.28, size=13, color=GOLD, bold=True)
text(s, "A simple race-day companion: find a race, understand your choices, follow the action, and see how the race finished.",
     0.75, 4.1, 11.6, 0.92, size=22, color=GREEN, font=SERIF)
pill(s, "Mobile-first screens", 0.75, 5.75, 1.95)
pill(s, "Play-money betting demo", 2.9, 5.75, 2.48, fill=PALE_GOLD, color=GREEN)
pill(s, "Race-day information flow", 5.55, 5.75, 2.48)
text(s, "Race names, odds, video and results shown in the demo may be sample content.", 0.75, 6.35, 11.5, 0.3, size=9, color=MUTED, italic=True)

# Real mobile screenshots from the running Next.js app.
mobile_preview("Mobile UI · Home and club selection", "02 · MOBILE SCREENSHOTS", [
    ("mobile-dashboard", "HOME", "Featured race, schedule, games and bottom navigation."),
    ("mobile-races", "RACES · CLUB PICKER", "The user chooses a racing club before seeing its card."),
])
mobile_preview("Mobile UI · Race card and entries", "03 · MOBILE SCREENSHOTS", [
    ("mobile-race-schedule", "RACE SCHEDULE", "Date rail, race status filters and club context."),
    ("mobile-race-entries", "RACE ENTRIES", "Runner number, horse, jockey, trainer and owner."),
])
mobile_preview("Mobile UI · Games and wager review", "04 · MOBILE SCREENSHOTS", [
    ("mobile-games-guide", "GAMES & GUIDE", "Choose the betting market and learn selection rules."),
    ("mobile-bet-cart", "BET CART", "Review chosen runners and remove or edit a ticket."),
    ("mobile-bet-review", "REVIEW", "Set wager, verify total, then confirm the play-money ticket."),
])
mobile_preview("Mobile UI · Live and post-race", "05 · MOBILE SCREENSHOTS", [
    ("mobile-live-center", "LIVE CENTER", "Stream entry point and race-day updates."),
    ("mobile-results", "RESULTS", "Filter the result list by official / provisional / cancelled."),
    ("mobile-official-result", "OFFICIAL RESULT", "Placings link to horse and jockey profiles."),
])

# 3 — Main navigation and journey
s = base("The customer journey at a glance", "06 · PRODUCT FLOW", "Experience")
tabs = [("HOME", "Discover today's\nmeeting and featured race"), ("RACES", "Choose club / date,\nopen a race and entries"),
        ("LIVE", "Watch the stream and\nfollow race updates"), ("RESULTS", "Review official placings,\nthen contender profiles"),
        ("PROFILE", "Manage preferences,\nfavorites and account")]
for i, (title, body) in enumerate(tabs):
    x = 0.72 + i * 2.52
    shape(s, x, 2.0, 2.23, 2.02, GREEN if i == 1 else WHITE, line=None if i == 1 else LINE)
    color = WHITE if i == 1 else GREEN
    text(s, f"0{i+1}", x + 0.18, 2.18, 0.38, 0.25, size=10, color=GOLD, bold=True)
    text(s, title, x + 0.18, 2.55, 1.9, 0.3, size=13, color=color, bold=True)
    text(s, body, x + 0.18, 2.98, 1.9, 0.72, size=10, color="E3E9E4" if i == 1 else MUTED)
    if i < len(tabs) - 1:
        line(s, x + 2.25, 3.0, x + 2.49, 3.0, GOLD, 1.5, arrow=True)
text(s, "Shared navigation", 0.75, 4.55, 2.5, 0.26, size=12, color=GREEN, bold=True)
text(s, "Mobile tab bar: Home · Races · Live · Results · Profile", 0.75, 4.92, 6.0, 0.3, size=14, color=INK)
card(s, 7.15, 4.45, 5.0, 1.25, "Supporting destinations", "Games & Guide · Totalizer · Betting history · Favorites · Notifications · Settings", accent=GOLD, title_size=12, body_size=10)
text(s, "The five main destinations stay within reach through the mobile navigation.", 0.75, 6.3, 11.0, 0.25, size=9, color=MUTED, italic=True)

# 4 — Betting flow
s = base("Betting flow · from race discovery to ticket", "07 · PLACE A BET", "Betting")
steps = [
    ("1", "Pick a club / race", "Browse meeting dates, clubs, race cards, and entries."),
    ("2", "Pick a game", "WIN · PLACE · FORECAST · TRIFECTA and supported game rules."),
    ("3", "Pick runner(s)", "Selection count follows the game requirement; review odds snapshot."),
    ("4", "Cart & review", "Edit or remove tickets; set wager from presets / allowed range."),
    ("5", "Confirm", "Show confirmation and the ticket reference."),
    ("6", "Track ticket", "Betting history and ticket status after placement / settlement."),
]
coords = [(0.72,1.8),(4.78,1.8),(8.84,1.8),(8.84,4.05),(4.78,4.05),(0.72,4.05)]
for i, ((num, title, body), (x, y)) in enumerate(zip(steps, coords)):
    shape(s, x, y, 3.58, 1.52, WHITE, line=LINE)
    shape(s, x + 0.18, y + 0.18, 0.42, 0.42, GREEN)
    text(s, num, x + 0.18, y + 0.24, 0.42, 0.24, size=11, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    text(s, title, x + 0.75, y + 0.18, 2.55, 0.3, size=13, color=GREEN, bold=True)
    text(s, body, x + 0.75, y + 0.57, 2.55, 0.7, size=9, color=MUTED)
    if i in (0, 1):
        line(s, x + 3.61, y + 0.75, x + 3.96, y + 0.75, GOLD, 1.4, arrow=True)
    elif i == 2:
        line(s, x + 1.79, y + 1.55, x + 1.79, y + 2.15, GOLD, 1.4, arrow=True)
    elif i in (3, 4):
        line(s, x - 0.04, y + 0.75, x - 0.4, y + 0.75, GOLD, 1.4, arrow=True)
text(s, "All wagers shown here are play-money only; no real currency is used in this demo.",
     0.76, 6.15, 11.7, 0.45, size=11, color=RED, bold=True)

# Bet confirmation flow
s = base("Bet flow · from chosen game to ticket", "08 · BETTING FLOW", "Take part")
confirm_steps = [
    ("CHOOSE", "Pick a game", "WIN · PLACE\nFORECAST · TRIFECTA"),
    ("SELECT", "Choose horses", "Follow the game's\nselection guide"),
    ("CHECK", "Review bet cart", "Edit or remove\nyour selections"),
    ("SET", "Choose wager", "Use a preset or\nenter an amount"),
    ("CONFIRM", "Receive ticket", "See confirmation\nand open history"),
]
for i, (label, title, body) in enumerate(confirm_steps):
    x = 0.72 + i * 2.53
    shape(s, x, 2.08, 2.13, 1.58, GREEN if i == 4 else WHITE, line=None if i == 4 else LINE)
    primary = WHITE if i == 4 else GREEN
    text(s, label, x + 0.12, 2.2, 1.9, 0.2, size=7, color=GOLD, bold=True, align=PP_ALIGN.CENTER)
    text(s, title, x + 0.12, 2.53, 1.9, 0.28, size=11, color=primary, bold=True, align=PP_ALIGN.CENTER)
    text(s, body, x + 0.12, 2.96, 1.9, 0.51, size=8, color="E6ECE8" if i == 4 else MUTED, align=PP_ALIGN.CENTER)
    if i < len(confirm_steps) - 1:
        line(s, x + 2.15, 2.86, x + 2.48, 2.86, GOLD, 1.5, arrow=True)
card(s, 0.85, 4.22, 5.5, 1.36, "Before you confirm", "Check the race, game, selected horses and wager total. If a selection is incomplete, return to the relevant step and finish it.", accent=GREEN, title_size=12, body_size=10)
card(s, 6.78, 4.22, 5.5, 1.36, "After you confirm", "The system shows a ticket confirmation. Open Betting History to find the ticket again and follow its status.", accent=GOLD, title_size=12, body_size=10)
pill(s, "Play-money demonstration", 0.9, 5.94, 2.53, fill="F4DEDB", color=RED)
pill(s, "Review before confirming", 3.6, 5.94, 2.55)
pill(s, "Find tickets in history", 6.32, 5.94, 2.5, fill=PALE_GOLD)

# Account and profile flow
s = base("Account flow · sign in and manage your profile", "09 · ACCOUNT FLOW", "Your account")
account_steps = [
    ("WELCOME", "Choose sign in or create an account"),
    ("ACCOUNT", "Enter your details and continue"),
    ("HOME", "Arrive at your race-day dashboard"),
    ("PROFILE", "Open history, favorites and settings"),
]
for i, (title, body) in enumerate(account_steps):
    x = 0.87 + i * 3.05
    shape(s, x, 2.0, 2.55, 1.42, GREEN if i == 2 else WHITE, line=None if i == 2 else LINE)
    c = WHITE if i == 2 else GREEN
    text(s, f"0{i+1}", x + 0.13, 2.16, 0.35, 0.2, size=9, color=GOLD, bold=True)
    text(s, title, x + 0.54, 2.14, 1.85, 0.25, size=11, color=c, bold=True)
    text(s, body, x + 0.15, 2.61, 2.25, 0.57, size=9, color="E5ECE7" if i == 2 else MUTED, align=PP_ALIGN.CENTER)
    if i < 3:
        line(s, x + 2.58, 2.7, x + 2.98, 2.7, GOLD, 1.5, arrow=True)
card(s, 0.9, 4.08, 5.55, 1.42, "Your race-day tools", "Betting history · favorites · rewards · notifications · profile settings.", accent=GREEN, title_size=12, body_size=11)
card(s, 6.83, 4.08, 5.55, 1.42, "A clear return path", "Use the bottom navigation to return to Home, Races, Live, Results or Profile from the main screens.", accent=GOLD, title_size=12, body_size=11)
text(s, "The same core destinations are designed for mobile website and app visitors.", 0.93, 5.98, 11.3, 0.4, size=13, color=GREEN, bold=True)

# 5 — Race day lifecycle
s = base("Race-day flow · before, during and after", "10 · RACE LIFECYCLE", "Racing")
phases = [
    ("BEFORE", "Schedule → club → race → entries", "Dates / status chips / race details / runner list.\nBet entry point is attached to the race.", GREEN),
    ("DURING", "Live center → stream → updates", "Stream and update screens exist. Live video and real-time positions need a confirmed provider/feed.", BLUE),
    ("AFTER", "Results → official result → profiles", "Result detail → winning horse and jockey → statistics. Use official status and result timestamps.", GOLD),
]
for i, (phase, heading, body, accent) in enumerate(phases):
    x = 0.75 + i * 4.12
    shape(s, x, 1.92, 3.64, 3.42, WHITE, line=LINE)
    shape(s, x, 1.92, 3.64, 0.49, accent)
    text(s, phase, x + 0.18, 2.04, 3.2, 0.22, size=9, color=WHITE if accent != GOLD else GREEN, bold=True)
    text(s, heading, x + 0.2, 2.72, 3.15, 0.68, size=18, color=GREEN, bold=True, font=SERIF)
    line(s, x + 0.2, 3.58, x + 3.4, 3.58, LINE, 0.8)
    text(s, body, x + 0.2, 3.82, 3.17, 1.03, size=11, color=MUTED)
    if i < 2:
        line(s, x + 3.68, 3.57, x + 4.05, 3.57, GOLD, 1.5, arrow=True)
text(s, "Operational owner to confirm: race status transitions, official result publication, feed freshness, and incident corrections.",
     0.78, 5.95, 11.5, 0.4, size=11, color=INK)

# 6 — Post-race flow
s = base("Post-race flow · result to contender insight", "11 · POST-RACE FLOW", "Results")
post = [("Results list", "Filter by result status"), ("Official result", "Placings · time · venue"),
        ("Winner profile", "Horse profile / statistics"), ("Jockey profile", "Race performance / stats")]
for i, (title, body) in enumerate(post):
    x = 0.8 + i * 3.08
    shape(s, x, 2.1, 2.65, 1.55, GREEN if i == 1 else WHITE, line=None if i == 1 else LINE)
    color = WHITE if i == 1 else GREEN
    text(s, f"0{i+1}", x + 0.16, 2.26, 0.4, 0.25, size=10, color=GOLD, bold=True)
    text(s, title, x + 0.16, 2.64, 2.3, 0.3, size=12, color=color, bold=True)
    text(s, body, x + 0.16, 3.02, 2.28, 0.4, size=9, color="E5ECE7" if i == 1 else MUTED)
    if i < 3:
        line(s, x + 2.69, 2.86, x + 3.0, 2.86, GOLD, 1.5, arrow=True)
card(s, 0.8, 4.22, 5.55, 1.35, "Clear result labels", "Show an official result only after it has been declared. Include the published time and tell users if a correction is made.", accent=GREEN, title_size=12)
card(s, 6.72, 4.22, 5.55, 1.35, "Current profile limitation", "Available contracts do not include full historical horse/jockey career records. The UI avoids inventing career totals.", accent=GOLD, title_size=12)
text(s, "Website routes: /results → /result/[id] → /horse/[id] or /jockey/[id] → /statistics", 0.85, 6.05, 11.8, 0.32, size=11, color=GREEN, bold=True)

# Full journey overview
s = base("The full race-day journey", "12 · SYSTEM FLOW MAP", "How it all connects")
journey = [
    ("DISCOVER", "Home → Races", "Find a featured race or open the schedule."),
    ("CHOOSE", "Club → Date → Race", "Choose where and when to race; open entries."),
    ("PREPARE", "Games → Selections", "Learn the game and select horse(s)."),
    ("TAKE PART", "Cart → Review → Ticket", "Check selections, set wager, confirm."),
    ("FOLLOW", "Live → Results", "Follow race updates, then see official placings."),
]
for i, (label, heading, body) in enumerate(journey):
    x = 0.72 + i * 2.53
    shape(s, x, 2.0, 2.13, 1.72, GREEN if i == 3 else WHITE, line=None if i == 3 else LINE)
    c = WHITE if i == 3 else GREEN
    text(s, f"0{i+1} · {label}", x + 0.12, 2.16, 1.9, 0.2, size=7, color=GOLD, bold=True, align=PP_ALIGN.CENTER)
    text(s, heading, x + 0.12, 2.5, 1.9, 0.42, size=10, color=c, bold=True, align=PP_ALIGN.CENTER)
    text(s, body, x + 0.12, 3.02, 1.9, 0.56, size=8, color="E6ECE8" if i == 3 else MUTED, align=PP_ALIGN.CENTER)
    if i < len(journey) - 1:
        line(s, x + 2.15, 2.84, x + 2.48, 2.84, GOLD, 1.5, arrow=True)
card(s, 0.82, 4.42, 3.58, 1.26, "Before the race", "Race schedule · entries · game guide · bet review", accent=GREEN, title_size=11, body_size=9)
card(s, 4.86, 4.42, 3.58, 1.26, "During the race", "Live center · video area · race updates", accent=GOLD, title_size=11, body_size=9)
card(s, 8.9, 4.42, 3.58, 1.26, "After the race", "Results · winning horse · winning jockey", accent=BLUE, title_size=11, body_size=9)
text(s, "Profile, settings, favorites and betting history remain available as supporting destinations.", 0.88, 6.08, 11.4, 0.35, size=11, color=GREEN, bold=True)

# Main destinations
s = base("Where each part of the experience takes you", "13 · MAIN DESTINATIONS", "Navigation")
columns = [0.8, 3.35, 8.18]
widths = [2.35, 4.55, 4.35]
headers = ["DESTINATION", "WHAT YOU CAN DO", "NEXT STEP"]
for x, w, h in zip(columns, widths, headers):
    shape(s, x, 1.75, w, 0.42, GREEN)
    text(s, h, x + 0.1, 1.84, w - 0.2, 0.22, size=8, color=WHITE, bold=True)
rows = [
    ("Home", "View the featured race and today's highlights", "Open schedule or live race"),
    ("Races", "Choose a club, date, race and horse", "Open entries or place a bet"),
    ("Games", "Understand Win, Place, Forecast and more", "Choose selections"),
    ("Live", "Open the live race center and updates", "Return to races or results"),
    ("Results", "See race finish order and official result", "Explore winning contenders"),
    ("Profile", "Open account tools, favorites and history", "Manage personal preferences"),
]
for idx, row in enumerate(rows):
    y = 2.22 + idx * 0.62
    fill = WHITE if idx % 2 == 0 else "F0ECE2"
    for col, (x, w, value) in enumerate(zip(columns, widths, row)):
        shape(s, x, y, w, 0.53, fill, radius=False, line=LINE)
        text(s, value, x + 0.1, y + 0.11, w - 0.2, 0.33, size=9,
             color=GREEN if col == 0 else INK, bold=(col == 0))
text(s, "The five-tab mobile navigation keeps the main journey within easy reach.", 0.82, 6.15, 11.7, 0.35, size=10, color=GREEN, bold=True)

# Status transitions, described for all audiences
s = base("How a race and a bet move forward", "14 · STATUS CHANGES", "What happens next")
text(s, "RACE", 0.85, 1.8, 1.1, 0.28, size=11, color=GOLD, bold=True)
race_states = [("Upcoming", "Waiting for post time"), ("Ongoing", "Race is in progress"), ("Completed", "Race has finished"), ("Official", "Results are declared")]
for i, (title, detail) in enumerate(race_states):
    x = 0.86 + i * 3.04
    shape(s, x, 2.14, 2.35, 0.98, GREEN if i == 3 else WHITE, line=None if i == 3 else LINE)
    c = WHITE if i == 3 else GREEN
    text(s, title, x + 0.12, 2.29, 2.1, 0.25, size=12, color=c, bold=True, align=PP_ALIGN.CENTER)
    text(s, detail, x + 0.12, 2.66, 2.1, 0.24, size=8, color="E5ECE7" if i == 3 else MUTED, align=PP_ALIGN.CENTER)
    if i < len(race_states) - 1:
        line(s, x + 2.37, 2.63, x + 2.96, 2.63, GOLD, 1.5, arrow=True)
text(s, "BET", 0.85, 3.73, 1.1, 0.28, size=11, color=GOLD, bold=True)
bet_states = [("Draft", "Choose game and horses"), ("Review", "Check ticket and wager"), ("Confirmed", "Ticket is created"), ("History", "Check ticket progress")]
for i, (title, detail) in enumerate(bet_states):
    x = 0.86 + i * 3.04
    shape(s, x, 4.06, 2.35, 0.98, GOLD if i == 2 else WHITE, line=None if i == 2 else LINE)
    c = GREEN if i == 2 else GREEN
    text(s, title, x + 0.12, 4.21, 2.1, 0.25, size=12, color=c, bold=True, align=PP_ALIGN.CENTER)
    text(s, detail, x + 0.12, 4.58, 2.1, 0.24, size=8, color=INK if i == 2 else MUTED, align=PP_ALIGN.CENTER)
    if i < len(bet_states) - 1:
        line(s, x + 2.37, 4.55, x + 2.96, 4.55, GOLD, 1.5, arrow=True)
card(s, 0.87, 5.55, 11.5, 0.76, "The key hand-off", "Race details guide the choice. The bet ticket keeps the selection together. Results complete the race story.", accent=GREEN, title_size=11, body_size=9)

# Friendly recovery states
s = base("If a user gets stuck, make the next step clear", "15 · HELPFUL MOMENTS", "Guidance and feedback")
recovery = [
    ("No races on this date", "Offer nearby dates and let the user switch days."),
    ("No horse selected", "Return to race entries and explain the game requirement."),
    ("Wager needs attention", "Show the total clearly and explain how to correct it."),
    ("Bet was not completed", "Keep selections available so the user can review again."),
    ("Live video unavailable", "Keep race updates and schedule details easy to reach."),
    ("Result is not official yet", "Label the result clearly and guide users back later."),
]
for idx, (title, body) in enumerate(recovery):
    col, row = idx % 2, idx // 2
    x, y = 0.85 + col * 6.0, 1.82 + row * 1.42
    card(s, x, y, 5.58, 1.12, title, body, accent=GOLD if row == 1 else GREEN, title_size=11, body_size=9)
text(s, "Every interruption should preserve the user's place and show a simple next action.", 0.9, 6.3, 11.5, 0.35, size=12, color=GREEN, bold=True)

# Content checklist
s = base("What users need to see at every step", "16 · RACE-DAY CONTENT", "A complete experience")
content_groups = [
    ("FIND A RACE", "Club name and location\nMeeting dates and race status\nDistance, time and entry count", GREEN),
    ("MAKE A CHOICE", "Game instructions and selection count\nHorse / jockey / trainer details\nWager amount and ticket summary", GOLD),
    ("FOLLOW THE STORY", "Live status and useful race updates\nClear provisional / official result labels\nWinning horse and jockey profiles", BLUE),
]
for i, (heading, body, accent) in enumerate(content_groups):
    x = 0.8 + 4.12 * i
    card(s, x, 1.95, 3.68, 2.48, heading, body, accent=accent, title_size=11, body_size=12)
text(s, "Also keep help, account settings and betting history easy to find from the main navigation.", 0.82, 4.92, 11.5, 0.38, size=12, color=GREEN, bold=True)
shape(s, 0.82, 5.62, 11.52, 0.65, PALE_GOLD)
text(s, "Demo note: the current experience uses play-money bets; race content and photos can be sample material.", 1.05, 5.81, 11.05, 0.25, size=11, color=GREEN, bold=True, align=PP_ALIGN.CENTER)

# Suggested all-audience walkthrough
s = base("A simple walkthrough for any audience", "17 · PRESENTATION FLOW", "Show the experience")
walkthrough = [
    ("1", "Start at Home", "Point out the featured race and bottom navigation."),
    ("2", "Choose a club and race", "Show the date rail, race status, and horse entries."),
    ("3", "Build a practice bet", "Choose a game, select horses, review the cart and wager."),
    ("4", "Follow race day", "Open Live and explain where race updates appear."),
    ("5", "Close the race story", "Show results and open the winning horse / jockey profiles."),
]
for i, (num, title, body) in enumerate(walkthrough):
    y = 1.82 + i * 0.89
    shape(s, 0.88, y, 11.45, 0.7, WHITE, line=LINE)
    shape(s, 1.05, y + 0.12, 0.45, 0.45, GREEN)
    text(s, num, 1.05, y + 0.2, 0.45, 0.22, size=11, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    text(s, title, 1.72, y + 0.11, 2.55, 0.28, size=12, color=GREEN, bold=True)
    text(s, body, 4.25, y + 0.1, 7.78, 0.49, size=9, color=INK)
text(s, "This order follows the way a race-day visitor naturally explores the system.", 0.92, 6.48, 10.8, 0.26, size=10, color=MUTED, italic=True)

# Closing summary
s = base("One clear journey from race discovery to results", "18 · SYSTEM FLOW", "Thank you")
shape(s, 0.88, 1.92, 11.45, 2.05, GREEN)
text(s, "DISCOVER  →  CHOOSE  →  PLACE A PRACTICE BET  →  FOLLOW LIVE  →  SEE RESULTS", 1.2, 2.54, 10.8, 0.66,
     size=20, color=WHITE, bold=True, align=PP_ALIGN.CENTER, valign=MSO_ANCHOR.MIDDLE)
text(s, "Then explore the winning horse, jockey and race history.", 1.2, 3.28, 10.8, 0.3, size=13, color="D8E1DA", align=PP_ALIGN.CENTER)
text(s, "Discussion prompts", 0.95, 4.62, 2.5, 0.28, size=13, color=GOLD, bold=True)
bullet_list(s, ["Does each screen make the next action obvious?", "Where should a visitor be able to return or change a choice?", "What race-day information should be easiest to find?"],
            1.0, 5.0, 10.9, line_h=0.43, size=11)

# Sequence the overview and journey maps first, followed by the visitor's screens
# and the flows that explain each stage. The cover includes the sign-in screen.
slide_order = [0, 12, 6, 7, 8, 2, 3, 4, 10, 5, 11, 9, 14, 13, 15, 16, 17, 18]
slide_ids = list(prs.slides._sldIdLst)
slide_list = prs.slides._sldIdLst
for slide_id in list(slide_list):
    slide_list.remove(slide_id)
for index in slide_order:
    slide_list.append(slide_ids[index])

# Refresh the page number in each footer after reordering.
for page_number, slide in enumerate(prs.slides, start=1):
    for item in slide.shapes:
        if item.has_text_frame and item.left > Inches(12.3) and item.top > Inches(7.0):
            paragraph = item.text_frame.paragraphs[0]
            if paragraph.runs:
                paragraph.runs[0].text = f"{page_number:02d}"

prs.core_properties.title = "Philippine Jockey — System Flow"
prs.core_properties.subject = "User journeys, mobile screens, and race-day experience"
prs.core_properties.author = "System overview"
prs.core_properties.keywords = "Philippine Jockey, system flow, mobile screens, race-day experience"
OUT.parent.mkdir(parents=True, exist_ok=True)
prs.save(OUT)

# Add a gentle fade between every presentation slide.
temp_out = OUT.with_name(OUT.stem + ".tmp.pptx")
ns = {"p": "http://schemas.openxmlformats.org/presentationml/2006/main"}
with ZipFile(OUT, "r") as source, ZipFile(temp_out, "w", ZIP_DEFLATED) as target:
    for item in source.infolist():
        payload = source.read(item.filename)
        if item.filename.startswith("ppt/slides/slide") and item.filename.endswith(".xml"):
            root = etree.fromstring(payload)
            transition = root.find("p:transition", ns)
            if transition is None:
                transition = etree.Element("{http://schemas.openxmlformats.org/presentationml/2006/main}transition")
                transition.set("spd", "med")
                transition.set("advClick", "1")
                etree.SubElement(transition, "{http://schemas.openxmlformats.org/presentationml/2006/main}fade")
                insert_after = max((i for i, child in enumerate(root) if etree.QName(child).localname in {"cSld", "clrMapOvr"}), default=-1)
                root.insert(insert_after + 1, transition)
                payload = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
        target.writestr(item, payload)
temp_out.replace(OUT)
print(f"Created {OUT} ({len(prs.slides)} slides)")
