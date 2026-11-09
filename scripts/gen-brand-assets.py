"""
Builds every brand image from ONE source: the cube logo SVG in "logo design/".

Outputs (all committed, all referenced by the pages):
  images/logo-mark.svg   the logo with its viewBox cropped to the cube — the
                         header and mobile nav use this directly (crisp at any size)
  images/logo-mark.png   raster copy of the mark (transparent), source for the rest
  og-logo-cube.jpg       1200x630 share card — the mark on a white rounded plate
                         over the footer's blue contour field (lifted from og-card.jpg)
  favicon-512.png        512x512, mark on white (search results, PWA)
  apple-touch-icon.png   180x180, same (iOS has no transparency)
  favicon.ico            16/32/48 bundle

Re-run after changing the source logo (no ImageMagick/Node needed):

  uv run --no-project --with resvg-py --with pillow python -I scripts/gen-brand-assets.py

A NEW share-card filename is required whenever the picture changes — LinkedIn,
Facebook and WhatsApp cache previews by image URL, so reusing a name keeps
serving the old picture. Bump the ?v= on the icon links too.
"""
import io
import re
from pathlib import Path

import resvg_py
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "logo design" / "cube-logo-v4.svg"
BG = ROOT / "og-card.jpg"  # background donor: the blue contour field
OG = ROOT / "og-logo-cube.jpg"

# 1. Page copy of the mark: crop the viewBox to the cube's bounds, drop comments.
svg = SRC.read_text()
svg = re.sub(r"\s*<!--.*?-->", "", svg, flags=re.S)
svg = svg.replace('width="1200" height="1200" viewBox="0 0 1200 1200"',
                  'width="1039.23" height="1200" viewBox="80.385 0 1039.23 1200"')
(ROOT / "images" / "logo-mark.svg").write_text(svg)


def render(height: int) -> Image.Image:
    png = resvg_py.svg_to_bytes(svg_string=svg, height=height)
    return Image.open(io.BytesIO(bytes(png))).convert("RGBA")


mark = render(968)
mark.save(ROOT / "images" / "logo-mark.png", optimize=True)

# 2. Share card: white rounded plate (360px) centred on the donor background.
card = Image.open(BG).convert("RGB")
ImageDraw.Draw(card).rounded_rectangle((420, 135, 780, 495), radius=76, fill="white")
m = render(272)
card.paste(m, ((card.width - m.width) // 2, (card.height - m.height) // 2), m)
card.save(OG, quality=88, progressive=True, optimize=True)


# 3. Icons: the mark on white with margin — launchers crop to a circle.
def icon(px: int, out: str) -> Image.Image:
    canvas = Image.new("RGB", (px, px), "white")
    m = render(round(px * 0.78))
    canvas.paste(m, ((px - m.width) // 2, (px - m.height) // 2), m)
    canvas.save(ROOT / out, optimize=True)
    return canvas


big = icon(512, "favicon-512.png")
icon(180, "apple-touch-icon.png")
big.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

print("wrote images/logo-mark.svg images/logo-mark.png og-logo-cube.jpg "
      "favicon-512.png apple-touch-icon.png favicon.ico")
