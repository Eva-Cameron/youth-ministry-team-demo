# Colour-pop photos: greyscale with one colour family left in, written to assets/web/pop/<same name>.webp.
# Edit PHOTOS, then run: python3 tools/colour_pop.py
# Each photo name (without -800 / -1600, and shared by its strip- crop) maps to (hue in degrees, width in degrees),
# with an optional third number: the saturation (0-255) a colour needs to stay in, for photos lit all one colour.
# Hue guide: 0 red · 30 orange · 50 gold · 60 yellow · 120 green · 210 sky blue · 240 blue · 280 purple · 330 pink.

# ---- Settings -------------------------------------------------------------
PHOTOS = {
    "adoration-altar": (42, 40),
    "candid-1": (235, 50),
    "crew": (352, 30),
    "event-night": (35, 40),
    "fellowship": (352, 30),
    "festival-crowd": (215, 50),
    "festival-stage": (345, 40),
    "festival-worship": (215, 46),
    "hope": (58, 34),
    "hope-letters": (58, 34),
    "interns": (330, 50),
    "retreat-prayer": (262, 24, 175),
    "sacraments": (355, 36),
    "valley": (30, 36),
    "village-aerial": (5, 36),
    "village-chalet": (25, 36),
    "village-event": (215, 50),
    "village-grotto": (210, 50),
    "village-lounge": (0, 36),
    "village-sunset": (20, 44),
    "worship-night": (215, 46),
    "worship-uplight": (262, 24, 175),
    "youth-council-field": (40, 30),
    "youth-group": (215, 46),
}
KEEP_COLOUR = False  # False: plain greyscale at rest (Eva, 2 Nov); True: keep each photo's colour family below
SOFT = 24            # degrees over which the colour fades out at each side of the range
MIN_SATURATION = 70  # 0-255: greys and pale skin below this stay grey
FEATHER = 0.004      # mask blur, as a share of the photo's width
QUALITY = 82
# ---------------------------------------------------------------------------

import pathlib
from PIL import Image, ImageChops, ImageFilter, ImageOps

repo = pathlib.Path(__file__).resolve().parent.parent
web = repo / "assets" / "web"
out = web / "pop"
out.mkdir(exist_ok=True)

done = 0
for name, (hue, width, *rest) in PHOTOS.items():
    min_saturation = rest[0] if rest else MIN_SATURATION
    files = sorted(web.glob(f"ph-{name}-*.webp")) + sorted(web.glob(f"strip-{name}.webp"))
    files = [path for path in files if path.stem.removeprefix(f"ph-{name}-").isdigit() or path.stem.startswith("strip-")]
    if not files:
        print(f"no files for {name}")
        continue
    hue_lut = []
    for value in range(256):
        distance = abs((value * 360 / 256 - hue + 180) % 360 - 180)
        inside = 1 - (distance - width / 2) / SOFT
        hue_lut.append(round(255 * min(1, max(0, inside))))
    saturation_lut = [round(255 * min(1, max(0, (value - min_saturation) / 30))) for value in range(256)]
    value_lut = [round(255 * min(1, max(0, (value - 30) / 40))) for value in range(256)]
    for path in files:
        photo = Image.open(path).convert("RGB")
        hue_band, saturation_band, value_band = photo.convert("HSV").split()
        mask = ImageChops.multiply(hue_band.point(hue_lut), saturation_band.point(saturation_lut))
        mask = ImageChops.multiply(mask, value_band.point(value_lut))
        mask = mask.filter(ImageFilter.GaussianBlur(max(1, photo.width * FEATHER)))
        grey = ImageOps.autocontrast(ImageOps.grayscale(photo), cutoff=0.5).convert("RGB")
        (Image.composite(photo, grey, mask) if KEEP_COLOUR else grey).save(out / path.name, "WEBP", quality=QUALITY, method=6)
        done += 1
print(f"{done} photos written to {out.relative_to(repo)}")
