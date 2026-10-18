from pathlib import Path
from shutil import copy2
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import etree
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Inches, Pt


ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(r"C:\Users\elisha.landicho\Downloads\Philippine-Jockey-System-Flow-Revised.pptx")
OUT = ROOT / "Philippine-Jockey-System-Flow-All-Pages.pptx"
DOWNLOAD_OUT = Path(r"C:\Users\elisha.landicho\Downloads\Philippine-Jockey-System-Flow-All-Pages.pptx")
ASSETS = ROOT / "docs" / "assets"

GREEN = "103B2F"
DEEP = "0A2D24"
PAPER = "F5F1E8"
GOLD = "C9A451"
INK = "1D2924"
MUTED = "718078"
LINE = "DCDDD5"
FONT = "Aptos"
SERIF = "Georgia"


def rgb(value):
    return RGBColor.from_string(value)


def add_text(slide, value, x, y, w, h, size, color, bold=False, font=FONT,
             align=PP_ALIGN.LEFT, italic=False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.clear()
    frame.word_wrap = True
    frame.margin_left = Inches(0.02)
    frame.margin_right = Inches(0.02)
    frame.margin_top = Inches(0.02)
    frame.margin_bottom = Inches(0.02)
    frame.vertical_anchor = MSO_ANCHOR.MIDDLE
    paragraph = frame.paragraphs[0]
    paragraph.alignment = align
    run = paragraph.add_run()
    run.text = value
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = rgb(color)
    return box


def add_mobile_screen_slide(prs, title, phase, screens):
    """Add a 2- or 3-screen page in the same layout as the reference deck."""
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = rgb(PAPER)

    stripe = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = rgb(GREEN)
    stripe.line.fill.background()

    add_text(slide, phase.upper(), 0.62, 0.35, 5.5, 0.23, 8, GOLD, True)
    add_text(slide, title, 0.62, 0.66, 12.0, 0.55, 27, GREEN, True, SERIF)
    divider = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.62), Inches(1.36), Inches(12.1), Inches(0.01))
    divider.fill.solid()
    divider.fill.fore_color.rgb = rgb(LINE)
    divider.line.fill.background()

    count = len(screens)
    if count == 2:
        picture_h = 4.55
        picture_w = picture_h * 430 / 932
        y = 1.92
        centers = [3.55, 9.78]
        label_y, caption_y = 1.55, 6.61
        caption_size = 9
    elif count == 3:
        picture_h = 4.28
        picture_w = picture_h * 430 / 932
        y = 1.96
        centers = [2.65, 6.66, 10.67]
        label_y, caption_y = 1.55, 6.34
        caption_size = 8
    else:
        raise ValueError(f"Expected 2 or 3 screenshots, got {count}")

    for (asset_name, label, caption), center in zip(screens, centers):
        image_path = ASSETS / f"{asset_name}.png"
        if not image_path.exists():
            raise FileNotFoundError(image_path)

        frame = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE,
            Inches(center - picture_w / 2 - 0.08), Inches(y - 0.08),
            Inches(picture_w + 0.16), Inches(picture_h + 0.16),
        )
        frame.fill.solid()
        frame.fill.fore_color.rgb = rgb(DEEP)
        frame.line.fill.background()
        frame.adjustments[0] = 0.12

        slide.shapes.add_picture(
            str(image_path), Inches(center - picture_w / 2), Inches(y),
            width=Inches(picture_w), height=Inches(picture_h),
        )
        add_text(slide, label, center - 1.3, label_y, 2.6, 0.2, 8, GOLD, True, align=PP_ALIGN.CENTER)
        add_text(slide, caption, center - 1.58, caption_y, 3.16, 0.31,
                 caption_size, INK, align=PP_ALIGN.CENTER)

    section = add_text(slide, phase.upper(), 10.3, 7.16, 2.35, 0.16, 7, MUTED, True,
                       align=PP_ALIGN.RIGHT)
    footer = add_text(slide, "PHILIPPINE JOCKEY  |  SYSTEM OVERVIEW  |  16 OCT 2026",
                      0.62, 7.16, 8.2, 0.16, 7, MUTED, True)
    add_text(slide, "00", 12.52, 7.11, 0.25, 0.2, 8, GREEN, True, align=PP_ALIGN.RIGHT)
    return slide


prs = Presentation(str(INPUT))
if len(prs.slides) != 10:
    raise RuntimeError(f"Expected the 10-slide reference deck, found {len(prs.slides)} slides")

original_ids = list(prs.slides._sldIdLst)
new_slides = []

# Optional entry, before browsing races.
new_slides.append(add_mobile_screen_slide(prs, "Create an account or sign in", "Pre-race", [
    ("mobile-login", "SIGN IN", "Return to the racing experience."),
    ("mobile-register", "CREATE ACCOUNT", "Create a profile to get started."),
]))

# Club, race, and selection pages that sit between the existing schedule and bet screens.
new_slides.append(add_mobile_screen_slide(prs, "Open a club, race, and game", "Pre-race", [
    ("mobile-club-profile", "CLUB PROFILE", "Browse the club and its race card."),
    ("mobile-race-detail", "RACE DETAILS", "Check time, distance, entries, and venue."),
    ("mobile-race-game-picker", "CHOOSE A GAME", "Compare the available game types."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Choose runners and confirm a ticket", "Pre-race", [
    ("mobile-runner-selection", "RUNNER SELECTION", "Pick the horse or horses for the game."),
    ("mobile-bet-confirmation", "TICKET CONFIRMATION", "Review the ticket and its reference."),
]))

# During the race.
new_slides.append(add_mobile_screen_slide(prs, "Watch the race live", "During the race", [
    ("mobile-live-center", "LIVE CENTER", "Open the race stream and live tools."),
    ("mobile-live-stream", "LIVE STREAM", "Watch the race and open race updates."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Follow updates and pool information", "During the race", [
    ("mobile-live-updates", "RACE UPDATES", "Follow official positions and entrant status."),
    ("mobile-totalizer", "TOTALIZER", "Review available pools and current totals."),
]))

# After the finish.
new_slides.append(add_mobile_screen_slide(prs, "Review official race results", "Post-race", [
    ("mobile-results", "RESULTS", "Browse finished and provisional races."),
    ("mobile-official-result", "OFFICIAL RESULT", "See confirmed placings and race details."),
    ("mobile-result-detail", "RESULT DETAIL", "Open a race result and its contenders."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Explore the winning horse", "Post-race", [
    ("mobile-horse-profile", "HORSE PROFILE", "Review the horse's details and race record."),
    ("mobile-horse-statistics", "HORSE STATISTICS", "See form, finishes, and recent performance."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Explore the winning jockey", "Post-race", [
    ("mobile-jockey-profile", "JOCKEY PROFILE", "Review the winning jockey's profile."),
    ("mobile-jockey-statistics", "JOCKEY STATISTICS", "See participation and recent results."),
]))

# Profile pages and account tools.
new_slides.append(add_mobile_screen_slide(prs, "Manage your profile", "Profile", [
    ("mobile-profile", "PROFILE", "Open account tools and saved information."),
    ("mobile-profile-settings", "SETTINGS", "Manage preferences and account options."),
    ("mobile-edit-profile", "EDIT PROFILE", "Update the profile details."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Open saved racing activity", "Profile", [
    ("mobile-favorites", "FAVORITES", "Return to saved horses and jockeys."),
    ("mobile-betting-history", "BETTING HISTORY", "Review past demo tickets."),
]))
new_slides.append(add_mobile_screen_slide(prs, "Notifications and rewards", "Profile", [
    ("mobile-notifications", "NOTIFICATIONS", "Review race-day and account updates."),
    ("mobile-rewards", "REWARDS", "Review available rewards and progress."),
]))

# The input deck's ninth slide mixed live, results, and official results together.
# Replace it with the phase-specific pages above and keep the closing slide last.
new_ids = list(prs.slides._sldIdLst)[len(original_ids):]
slide_list = prs.slides._sldIdLst
for slide_id in list(slide_list):
    slide_list.remove(slide_id)

# Keep the cover and flow diagrams, then place screenshots in chronological order.
# Original indices: 0 cover, 1 map, 2 navigation, 3 betting flow, 4 selection flow,
# 5 home/club, 6 schedule/entries, 7 games/cart/review, 8 mixed live/results, 9 closing.
sequence = [
    original_ids[0], original_ids[1], original_ids[2], original_ids[3], original_ids[4],
    new_ids[0], original_ids[5], original_ids[6], new_ids[1], original_ids[7],
    new_ids[2], new_ids[3], new_ids[4], new_ids[5], new_ids[6], new_ids[7],
    new_ids[8], new_ids[9], new_ids[10], original_ids[9],
]
for slide_id in sequence:
    slide_list.append(slide_id)

# Renumber the page footer consistently after inserting all pages.
for page_number, slide in enumerate(prs.slides, start=1):
    for item in slide.shapes:
        if item.has_text_frame and item.left > Inches(12.3) and item.top > Inches(7.0):
            paragraph = item.text_frame.paragraphs[0]
            if paragraph.runs:
                paragraph.runs[0].text = f"{page_number:02d}"

prs.core_properties.title = "Philippine Jockey - Complete System Flow"
prs.core_properties.subject = "Pre-race, live race, post-race, and profile screens"
prs.core_properties.author = "System overview"
prs.save(OUT)

# Keep the reference deck's gentle fade transitions on every slide, including new pages.
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
                root.append(transition)
                payload = etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)
        target.writestr(item, payload)
temp_out.replace(OUT)
copy2(OUT, DOWNLOAD_OUT)
print(f"Created {OUT} and {DOWNLOAD_OUT} ({len(prs.slides)} slides)")
