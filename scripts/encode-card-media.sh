#!/usr/bin/env bash
# Encode a raw screen recording into project-card media.
#
#   scripts/encode-card-media.sh <source> <slug> [options]
#
# Writes images/projects/<slug>.mp4 and images/projects/<slug>-poster.jpg in the
# exact format the existing cards use, so a new card matches the set:
#   video  900x900, 30fps, H.264 High, yuv420p, no audio track, +faststart
#   poster 900x900, sRGB, 4:2:0, non-progressive, stripped, q82
#
# Both land in images/projects/, which .gitignore un-ignores (`!images/projects/*.mp4`),
# so they ship with the Pages deploy. Keep the raw capture in reel/videos/ — that
# whole directory stays out of git.
#
# Options
#   --start SEC        trim from here (default 0)
#   --duration SEC     clip length (default: to the end; cards read best at 6-12s)
#   --poster SEC       frame to grab the poster from, relative to --start (default 0.5)
#   --crop W:H:X:Y     source-pixel crop before the square downscale
#                      (default: the largest centred square)
#
# After running, point the card at it in main.js PROJECTS:
#   img: "images/projects/<slug>-poster.jpg", video: "images/projects/<slug>.mp4"
# then re-run `node scripts/gen-project-cards.mjs`.
set -euo pipefail

src=${1:?usage: encode-card-media.sh <source> <slug> [options]}
slug=${2:?usage: encode-card-media.sh <source> <slug> [options]}
shift 2

start=0; duration=; poster=0.5; crop=
while [ $# -gt 0 ]; do
  case $1 in
    --start)    start=$2;    shift 2 ;;
    --duration) duration=$2; shift 2 ;;
    --poster)   poster=$2;   shift 2 ;;
    --crop)     crop=$2;     shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -f "$src" ] || { echo "no such source: $src" >&2; exit 1; }

root=$(cd "$(dirname "$0")/.." && pwd)
out_mp4="$root/images/projects/$slug.mp4"
out_jpg="$root/images/projects/$slug-poster.jpg"

# Default crop = the largest centred square, so a 1920x1080 capture keeps its middle
# 1080x1080. Pass --crop when the interesting part is off to one side.
if [ -z "$crop" ]; then
  vf_crop="crop='min(iw,ih)':'min(iw,ih)'"
else
  vf_crop="crop=$crop"
fi
vf="$vf_crop,scale=900:900:flags=lanczos,fps=30"

trim=(-ss "$start")
[ -n "$duration" ] && trim+=(-t "$duration")

ffmpeg -v error -y "${trim[@]}" -i "$src" \
  -vf "$vf" \
  -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -crf 30 -preset slow -movflags +faststart \
  "$out_mp4"

# Poster is a frame of the encoded clip, not the source, so the card's still and its
# hover video are pixel-identical at the handover.
ffmpeg -v error -y -ss "$poster" -i "$out_mp4" -frames:v 1 -f image2pipe -vcodec png - \
  | convert - -colorspace sRGB -quality 82 -sampling-factor 2x2,1x1,1x1 \
      -interlace none -strip "$out_jpg"

printf '%s  %s\n' "$(du -h "$out_mp4" | cut -f1)" "images/projects/$slug.mp4"
printf '%s  %s\n' "$(du -h "$out_jpg" | cut -f1)" "images/projects/$slug-poster.jpg"
