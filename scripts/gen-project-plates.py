#!/usr/bin/env python3
"""Compose project card images from the figures already inside the notebooks.

The project cards are near-square (the frame viewBox is 407x411) and the media is
`object-fit: cover`, so a 1600x1000 chart dropped in raw loses about a third of its
width — which is exactly where the axis labels and the source line live. Each plot
is therefore letterboxed onto a square plate whose background is sampled from the
plot's own corner pixel, so the padding is seamless rather than a visible box.

Sources are the PNGs in reel/plots, extracted from the notebooks by
reel/extract_plots.py (nothing is re-run and no notebook is modified).

    python3 scripts/gen-project-plates.py [slug ...]

Writes images/projects/<slug>.jpg at PLATE px square.
"""

import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "reel" / "plots"
OUT = ROOT / "images" / "projects"
# Sources that are screenshots rather than extracted notebook figures.
EXTRA_SRC = [Path("/home/vishnu/projects/Trading_Bot/screenshots")]

PLATE = 900          # square, matching the card's 407x411 frame
PAD = 0.045          # breathing room each side, as a fraction of the plate
QUALITY = 82

# The card title is white text at top:16px (styles.css .proj-card__label), and the
# card only dims the media to brightness(.78) — not enough for white to read against
# a chart's near-white paper. A navy scrim is baked into the top of the plate so the
# title has something to sit on, fading out before it reaches the plot area.
SCRIM_RGB = (15, 22, 40)   # the projects field navy (main.js darkSecs .features fill)
SCRIM_H = 0.22             # fraction of the plate the scrim spans
SCRIM_A = 0.92             # opacity at the very top, easing to 0 at SCRIM_H

# Trimming: the figures carry wide internal margins, which on a square plate become
# dead bands. Anything within this per-channel distance of the paper colour is margin.
TRIM_TOL = 10
MAX_UPSCALE = 1.6

# Terminal captures are ~5:1 strips. Letterboxed whole onto a square plate the text
# lands about 3px tall on a card and is unreadable, so these are cropped to a window
# and zoomed instead: the TOP-LEFT corner, where the prompt and output begin.
#
# The window is a FIXED number of SOURCE pixels, not a fixed aspect ratio. Cropping to
# an aspect gave each frame a different window (427px wide for the short captures,
# 1227px for the tall ones), so each got a different scale factor and the set cycled
# between zoomed-in and zoomed-out frames. A constant window means one scale for every
# frame, so the type stays the same size as the card steps through them.
TERMINAL = {"trading-bot"}
TERM_WINDOW = (430, 226)  # source px kept from the top-left; 1.9:1 to match the plate
TERM_UPSCALE = 3.0        # flat-background monospace survives this; photos would not

# slug -> source figure. Chosen as the one plot that states the project's claim:
# not the prettiest chart, the one a reader can check the headline number against.
PLATES = {
    # PR curve rather than ROC: at a 0.13% fraud rate ROC flatters every model.
    "fraud-detection": "fraud-13-precision-recall-curves.png",
    "neural-net-scratch": "neural-net-breast-cancer-01-loss-curve.png",
    "linear-regression-scratch": "linear-regression-02-linear-fit.png",
    "trader-sentiment": "trader-sentiment-13.png",
    # Not extracted from a notebook — that notebook printed numbers and never plotted.
    # Rebuilt from the raw tapes by scripts/gen-nse-precision-plot.py; run that first.
    "nse-stock-prediction": "nse-precision-threshold.png",
    # A LIST means a multi-frame set: the card cycles these on hover (see the
    # data-frames wiring in main.js). Written as <slug>-1.jpg ... <slug>-N.jpg, in
    # the order given — here, the order the CLI actually walks through.
    "trading-bot": [
        "interactive_menu.png",
        "completed_order.png",
        "failed_order.png",
        "clean_logs.png",
    ],
}

# Deliberately NOT generated, so the reason survives the next person to look:
#   age-gender-01.png  — a photograph of a real person's face, not a figure. It is
#                        not ours to publish on a public page.
#   nexora-01.png      — scores 0.5 / 0.5 / 0.0; the third query matches nothing.
#                        Publishing it advertises the failure case.


def trim(img, bg):
    """Crop the figure's own margins, so the plate is filled by ink not whitespace."""
    # Difference against a flat field of the paper colour, thresholded: getbbox()
    # then returns the box of everything that is not paper.
    diff = ImageChops.difference(img, Image.new("RGB", img.size, bg))
    mask = diff.convert("L").point(lambda v: 255 if v > TRIM_TOL else 0)
    return img.crop(mask.getbbox() or (0, 0, img.width, img.height))


def scrim(canvas):
    """Bake the top gradient that the card's white title sits on."""
    band = int(PLATE * SCRIM_H)
    if band < 1:
        return canvas
    # One column of the gradient, stretched across the plate — cheaper than per-pixel
    # and exactly as smooth, since the ramp is vertical only.
    alpha = Image.new("L", (1, band))
    alpha.putdata([round(SCRIM_A * 255 * (1 - y / band) ** 2.2) for y in range(band)])
    layer = Image.new("RGBA", (PLATE, band), SCRIM_RGB + (0,))
    layer.putalpha(alpha.resize((PLATE, band)))
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(layer)
    return canvas.convert("RGB")


def plate(src_path, dest_path, terminal=False):
    """Letterbox one figure onto a square plate on its own background colour."""
    img = Image.open(src_path).convert("RGB")

    # The figure's own paper colour, so the padding reads as part of the chart.
    # Corner pixel rather than a mean: the mean is dragged by the plotted ink.
    bg = img.getpixel((2, 2))
    img = trim(img, bg)

    if terminal:
        # Top-left corner: terminal output starts there, and the rest of a wide
        # capture is the empty remainder of each line.
        img = img.crop((0, 0, min(TERM_WINDOW[0], img.width), min(TERM_WINDOW[1], img.height)))

    # The chart sits BELOW the scrim, not centred on the plate, so the card title
    # never lands on top of the plot.
    pad = int(PLATE * PAD)
    top = int(PLATE * SCRIM_H)
    avail_w, avail_h = PLATE - 2 * pad, PLATE - top - pad
    scale = min(avail_w / img.width, avail_h / img.height)
    # The seaborn figures are only ~980px wide and would otherwise sit small in the
    # middle of the plate. Allow a bounded upscale so they fill it; past this they
    # visibly soften, and the plate is already ~3x the size the card ever displays.
    scale = min(scale, TERM_UPSCALE if terminal else MAX_UPSCALE)
    w, h = max(1, round(img.width * scale)), max(1, round(img.height * scale))
    img = img.resize((w, h), Image.LANCZOS)

    canvas = Image.new("RGB", (PLATE, PLATE), bg)
    canvas.paste(img, ((PLATE - w) // 2, top + (avail_h - h) // 2))
    canvas = scrim(canvas)
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(dest_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return dest_path


def resolve(name):
    """Find a source by name across reel/plots and the screenshot directories."""
    for base in [SRC, *EXTRA_SRC]:
        p = base / name
        if p.exists():
            return p
    sys.exit(f"missing source image: {name}\nlooked in: {SRC}, {', '.join(map(str, EXTRA_SRC))}")


def main(argv):
    wanted = argv or list(PLATES)
    unknown = [s for s in wanted if s not in PLATES]
    if unknown:
        sys.exit(f"unknown slug(s): {', '.join(unknown)}\nknown: {', '.join(PLATES)}")

    for slug in wanted:
        spec = PLATES[slug]
        names = spec if isinstance(spec, list) else [spec]
        for i, name in enumerate(names, 1):
            # Single-frame projects keep the bare slug filename, so existing
            # references in main.js do not have to change.
            out_name = f"{slug}.jpg" if len(names) == 1 else f"{slug}-{i}.jpg"
            dest = plate(resolve(name), OUT / out_name, terminal=slug in TERMINAL)
            kb = dest.stat().st_size / 1024
            print(f"{dest.relative_to(ROOT)}  {PLATE}x{PLATE}  {kb:.0f}KB  <- {name}")


if __name__ == "__main__":
    main(sys.argv[1:])
