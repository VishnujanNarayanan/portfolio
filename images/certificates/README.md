# Certificates

Source certificates are PDFs (kept here). They're displayed in the certificate gallery as
PNGs rendered from page 1 (PDF iframes don't display full-size cleanly), and each slide keeps
an "Open ↗" link to the original PDF.

Each PNG is one sticky, full-screen slide; scrolling brings the next up to cover the previous
(the same cover-scroll the features section does over blog).

Files: `<slug>.png` (display) alongside the original `*.pdf`.

To regenerate a PNG from a PDF (ImageMagick's PDF policy is blocked here, so use Ghostscript):

    gs -q -dNOPAUSE -dBATCH -dFirstPage=1 -dLastPage=1 -sDEVICE=png16m -r200 \
       -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -sOutputFile=<slug>.png "<file>.pdf"
    # then downscale if large:
    convert <slug>.png -resize 2400x2400\> -strip -quality 92 <slug>.png

To add/replace/reorder certificates: render the PNG, drop both files here, and edit the
`CERT_DOCS` list in `main.js` (cert IIFE) — `{ img, pdf, title }` per entry, in display order.
