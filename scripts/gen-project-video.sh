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
#
# The encodes currently shipping, so any of them can be reproduced exactly:
#
#   SPEED=1.5 ./gen-project-video.sh reel/videos/Dekhlaw.mp4          dekhlaw          2 12 1.3 white
#   SPEED=1.5 ./gen-project-video.sh reel/videos/scpls_final.mp4      law-firm         0 10 1.3 white 35 -135
#   SPEED=1.5 ./gen-project-video.sh "reel/videos/product explorer final.mp4" product-explorer 2 "" 1.0 '#0a0f0d'
#   SPEED=1.5 ./gen-project-video.sh "reel/videos/quate retriever final.mp4"  quote-retrieval  2 14 1.0 '#12151e'
#   SPEED=1.5 ./gen-project-video.sh reel/videos/task_manager_final.mp4 task-manager    0 16 1.0 '#fbfbf8'
#
# Product Explorer passes an empty duration deliberately: it runs to the end of its
# recording, because the product-detail pages at the tail are part of the demo.
#
# The law firm needs XSHIFT because its hero text starts ~5% from the left margin, so
# a centred crop clips the first letter at any zoom above ~1.10.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="${1:?usage: gen-project-video.sh <input.mp4> <slug> [start] [duration]}"
SLUG="${2:?missing slug}"
START="${3:-0}"
DUR="${4:-}"
ZOOM="${5:-1.0}"    # 1.0 = whole frame, no crop; raise only to fill the square
PAD="${6:-white}"   # colour of any remaining band; match the recorded page
YSHIFT="${7:-0}"    # nudge the frame down (+) or up (-) inside the square, in px
# Bias the horizontal crop off centre, in px of the SCALED frame: negative keeps the
# left edge. Needed when zooming a page whose headline starts near the left margin —
# a centred crop clips the first letter long before the zoom is high enough to help.
XSHIFT="${8:-0}"

CRF="${CRF:-32}"    # x264 quality; the cards display at ~260px, so 32 is invisible here
SPEED="${SPEED:-1}" # playback speed multiplier baked into the encode (setpts)
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
CROP_X="(iw-ow)/2"
[ "$XSHIFT" != "0" ] && CROP_X="max(0\,min(iw-ow\,(iw-ow)/2+(${XSHIFT})))"
# Speed is baked in with setpts rather than left to playbackRate, so the shipped file
# is shorter and lighter too, and a card that is hovered briefly still gets through
# more of the demo. There is no audio to keep in sync.
SPT=""
[ "$SPEED" != "1" ] && SPT=",setpts=PTS/${SPEED}"
filter="[0:v]scale=${SCALED_W}:-2,crop='min(iw,${PLATE})':'min(ih,${PLATE})':${CROP_X}:0,pad=${PLATE}:${PLATE}:(ow-iw)/2:${PAD_Y}:color=${PAD}${SPT}[v];[v][1:v]overlay=0:0[out]"

ffmpeg -v error -y "${trim[@]}" -i "$SRC" -i "$SCRIM" \
  -filter_complex "$filter" -map "[out]" \
  -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf "$CRF" -preset slow \
  -movflags +faststart \
  "$OUT"

# Poster: the first frame, so the static markup carries a real image for crawlers
# and for anyone who never hovers.
ffmpeg -v error -y "${trim[@]}" -i "$SRC" -i "$SCRIM" \
  -filter_complex "$filter" -map "[out]" \
  -frames:v 1 -q:v 4 "$POSTER"

printf '%s  %s  %sKB\n' "${OUT#"$ROOT"/}" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT" | cut -d. -f1)s" "$(( $(stat -c%s "$OUT") / 1024 ))"
printf '%s  %sKB\n' "${POSTER#"$ROOT"/}" "$(( $(stat -c%s "$POSTER") / 1024 ))"
