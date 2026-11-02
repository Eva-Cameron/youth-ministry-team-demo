# Fine halftone dot photos for the "Who is it for?" cards: dark dots on the route's light colour,
# written to assets/web/dots/ph-<name>-800.webp. Edit the settings, then run: python3 tools/halftone.py

# ---- Settings -------------------------------------------------------------
PHOTOS = {  # photo name: (paper colour, dot colour), matching each card's route
    "retreat-prayer": ("#f4bfd0", "#3d1630"),
    "youth-group": ("#7c8cff", "#0d1240"),
    "interns": ("#ddb5fa", "#1f1040"),
    "village-chalet": ("#cdd8c3", "#18281e"),
}
WIDTH = 1200     # output width in px
PITCH = 5        # distance between dot centres in px: smaller is finer
SUPERSAMPLE = 3  # drawn this many times larger, then scaled down for smooth dots
QUALITY = 84
# ---------------------------------------------------------------------------

import pathlib
from PIL import Image, ImageDraw, ImageOps

repo = pathlib.Path(__file__).resolve().parent.parent
web = repo / "assets" / "web"
out = web / "dots"
out.mkdir(exist_ok=True)

for name, (paper, ink) in PHOTOS.items():
    source = next(path for path in (web / f"ph-{name}-1600.webp", web / f"ph-{name}-800.webp") if path.exists())
    photo = Image.open(source).convert("L")
    height = round(photo.height * WIDTH / photo.width)
    photo = ImageOps.autocontrast(photo.resize((WIDTH, height), Image.LANCZOS), cutoff=1)
    columns, rows = WIDTH // PITCH + 1, height // PITCH + 1
    tones = photo.resize((columns, rows), Image.BOX)
    big = Image.new("RGB", (WIDTH * SUPERSAMPLE, height * SUPERSAMPLE), paper)
    draw = ImageDraw.Draw(big)
    step = PITCH * SUPERSAMPLE
    for row in range(rows):
        offset = step / 2 if row % 2 else 0
        for column in range(columns):
            darkness = 1 - tones.getpixel((column, row)) / 255
            radius = step * 0.5 * darkness ** 0.95
            if radius < SUPERSAMPLE * 0.35:
                continue
            centre_x, centre_y = column * step + offset, row * step
            draw.ellipse((centre_x - radius, centre_y - radius, centre_x + radius, centre_y + radius), fill=ink)
    big.resize((WIDTH, height), Image.LANCZOS).save(out / f"ph-{name}-800.webp", "WEBP", quality=QUALITY, method=6)
    print(f"dots/ph-{name}-800.webp")
