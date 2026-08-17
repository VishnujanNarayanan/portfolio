#!/usr/bin/env bash
# Encode a raw screen recording into a square, web-ready project-card video.
#
# Card media is square (the frame viewBox is 407x411), so a 16:9 recording is scaled
# to the plate width and padded to a square rather than centre-cropped: these are
# whole-page walkthroughs, and cropping to square cuts the nav off one side and the
# hero image off the other. The same navy scrim the still plates bake in is overlaid
# on top, so a card carrying a video and a card carrying a chart look like one set.
#
# Audio is stripped: the card autoplays on hover, and autoplay only works muted.
#
#   scripts/gen-project-video.sh <input.mp4> <slug> [start] [duration] [zoom] [pad]
#
# ZOOM is how much of the square the frame fills: 1.0 fits the full width (leaving
# bands above and below), and anything at or above the source aspect ratio fills the
# square completely with no bands at all.
#
# PAD is the colour of whatever band remains. Set it to the RECORDED PAGE'S OWN
# background so the band disappears into the frame instead of reading as a letterbox
# bar: white for a light page, the app's own near-black for a dark-themed one.
#
# Writes images/projects/<slug>.mp4 and images/projects/<slug>-poster.jpg.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:?usage: gen-project-video.sh <input.mp4> <slug> [start] [duration]}"
SLUG="${2:?missing slug}"
START="${3:-0}"
DUR="${4:-}"
ZOOM="${5:-1.0}"    # 1.0 = whole frame, no crop; raise only to fill the square
PAD="${6:-white}"   # colour of any remaining band; match the recorded page
YSHIFT="${7:-0}"    # nudge the frame down (+) or up (-) inside the square, in px

PLATE=900
SCRIM="$ROOT/scripts/plate-scrim.png"
OUT_DIR="$ROOT/images/projects"
OUT="$OUT_DIR/$SLUG.mp4"
POSTER="$OUT_DIR/$SLUG-poster.jpg"

[ -f "$SRC" ] || { echo "no such input: $SRC" >&2; exit 1; }
[ -f "$SCRIM" ] || { echo "missing $SCRIM — regenerate it, see gen-project-plates.py" >&2; exit 1; }
mkdir -p "$OUT_DIR"

trim=(-ss "$START")
[ -n "$DUR" ] && trim+=(-t "$DUR")

# Scale to PLATE*ZOOM wide, centre-crop anything past the square, then pad whatever is
# still short in PAD, and lay the scrim over the result. YSHIFT moves the frame within
# the square — used to push content clear of the scrim, or off dead space at one edge.
# The offset is clamped to the band so the frame can never be pushed outside the plate.
SCALED_W=$(awk -v p="$PLATE" -v z="$ZOOM" 'BEGIN{w=int(p*z); print w + (w%2)}')
PAD_Y="(oh-ih)/2"
[ "$YSHIFT" != "0" ] && PAD_Y="max(0\,min(oh-ih\,(oh-ih)/2+(${YSHIFT})))"
filter="[0:v]scale=${SCALED_W}:-2,crop='min(iw,${PLATE})':'min(ih,${PLATE})',pad=${PLATE}:${PLATE}:(ow-iw)/2:${PAD_Y}:color=${PAD}[v];[v][1:v]overlay=0:0[out]"

ffmpeg -v error -y "${trim[@]}" -i "$SRC" -i "$SCRIM" \
  -filter_complex "$filter" -map "[out]" \
  -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 30 -preset slow \
  -movflags +faststart \
  "$OUT"

# Poster: the first frame, so the static markup carries a real image for crawlers
# and for anyone who never hovers.
ffmpeg -v error -y "${trim[@]}" -i "$SRC" -i "$SCRIM" \
  -filter_complex "$filter" -map "[out]" \
  -frames:v 1 -q:v 4 "$POSTER"

printf '%s  %s  %sKB\n' "${OUT#"$ROOT"/}" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -d. -f1)s" "$(( $(stat -c%s "$OUT") / 1024 ))"
printf '%s  %sKB\n' "${POSTER#"$ROOT"/}" "$(( $(stat -c%s "$POSTER") / 1024 ))"
