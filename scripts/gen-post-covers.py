#!/usr/bin/env python3
"""Generate the hero and share images for blog posts.

Each cover is a set of nested contour lines — the same topographic motif the site
draws behind its dark sections — in the site palette, seeded from the post slug so
a given post always renders the same image and two posts never collide.

Why generated rather than stock photography: these are decorative, they must not
introduce licensing questions on a portfolio, and a seeded pattern stays on-brand
without a designer in the loop. Replace any of them with a real image by simply
overwriting the file; nothing here runs at build time.

    python3 scripts/gen-post-covers.py [slug ...]

Writes images/blog/<slug>.jpg (1000x563) and images/blog/share-<slug>.jpg (1200x630).
"""

import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "images" / "blog"

# styles.css: --color-dark #050419 and the projects field navy.
INK = (5, 4, 25)
FIELD = (15, 22, 40)

# Accent per cover, so nine cards in a grid are told apart at a glance. All three
# sit within a step of --color-highlight rather than introducing new brand colours.
ACCENTS = {
    0: (57, 50, 220),     # --color-highlight
    1: (77, 109, 220),    # a step towards the site's mid blue
    2: (96, 60, 200),     # a step towards indigo
}

# name -> the image basename used in partials/posts.json
COVERS = {
    "playwright-selenium": 3,
    "blocked-scraper": 7,
    "rate-limits": 11,
    "local-llm": 17,
    "pipeline-tests": 23,
    "ingestion-bugs": 29,
    "scraping": 31,
    "resumable-etl": 37,
    "intraday-model": 41,
}

SS = 3          # supersample factor; the only antialiasing in play
RINGS = 15      # nested contour lines per cover


def blob(draw, cx, cy, base, harmonics, colour, width):
    """One closed contour: a circle whose radius is modulated by a few harmonics."""
    pts = []
    steps = 720
    for i in range(steps + 1):
        t = 2 * math.pi * i / steps
        r = base
        for k, amp, phase in harmonics:
            r += base * amp * math.sin(k * t + phase)
        pts.append((cx + r * math.cos(t), cy + r * math.sin(t) * 0.82))
    draw.line(pts, fill=colour, width=width, joint="curve")


def cover(seed, w, h):
    rnd = random.Random(seed)
    line = ACCENTS[seed % 3]
    img = Image.new("RGB", (w * SS, h * SS), FIELD)
    draw = ImageDraw.Draw(img)

    # A soft vignette towards the darker ink colour, drawn as widening bands so the
    # corners recede and the contours read against the middle.
    for i in range(60):
        f = i / 60
        band = tuple(int(FIELD[c] + (INK[c] - FIELD[c]) * (1 - f) ** 2) for c in range(3))
        m = int(f * min(w, h) * SS * 0.9)
        draw.rectangle([-m, -m, w * SS + m, h * SS + m], outline=band, width=int(6 * SS))

    # Two clusters of nested contours, offset from centre, like two hills on a map.
    for cluster in range(2):
        cx = w * SS * (0.34 + 0.42 * cluster) + rnd.uniform(-0.06, 0.06) * w * SS
        cy = h * SS * (0.45 + 0.2 * (cluster % 2)) + rnd.uniform(-0.08, 0.08) * h * SS
        harmonics = [(k, rnd.uniform(0.04, 0.11), rnd.uniform(0, 6.28)) for k in (2, 3, 5)]
        for ring in range(RINGS):
            f = (ring + 1) / RINGS
            base = h * SS * (0.06 + 0.42 * f)
            # Outer rings fade so the plate does not read as a target.
            alpha = 0.75 * (1 - f) ** 1.35 + 0.06
            colour = tuple(int(FIELD[c] + (line[c] - FIELD[c]) * alpha) for c in range(3))
            blob(draw, cx, cy, base, harmonics, colour, max(1, int(1.15 * SS)))

    # The vignette bands can leave a hairline at the very edge; crop it off rather
    # than trying to land the band spacing exactly on the boundary.
    pad = int(8 * SS)
    img = img.crop((pad, pad, w * SS - pad, h * SS - pad)).resize((w, h), Image.LANCZOS)
    return img.filter(ImageFilter.SMOOTH)


def main(argv):
    wanted = argv[1:] or list(COVERS)
    for name in wanted:
        seed = COVERS.get(name, sum(map(ord, name)))
        cover(seed, 1000, 563).save(OUT / f"{name}.jpg", quality=86, optimize=True)
        cover(seed, 1200, 630).save(OUT / f"share-{name}.jpg", quality=86, optimize=True)
        print(f"wrote images/blog/{name}.jpg and share-{name}.jpg")


if __name__ == "__main__":
    main(sys.argv)
