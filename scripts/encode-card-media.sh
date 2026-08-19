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
# FRAMING. The cards are square but screen captures are 16:9, and the shipped clips
# do NOT crop — they letterbox, keeping the whole UI visible and filling the bars with
# a vertical ramp from the projects-section navy into the app's own edge colour, so the
# bar meets the frame without a seam. That is the default here: the bar colours are
# sampled from the clip itself. Pass --crop to fill the square instead, which suits a
# capture whose interesting part is a centred column.
#
# Both outputs land in images/projects/, which .gitignore un-ignores
# (`!images/projects/*.mp4`), so they ship with the Pages deploy. Keep the raw capture
# in reel/videos/ — that whole directory stays out of git.
#
# Options
#   --start SEC        trim from here (default 0)
#   --duration SEC     clip length (default: to the end; cards read best at 6-12s)
#   --poster SEC       frame to grab the poster from, relative to --start (default 0.5)
#   --crop W:H:X:Y     crop to this source-pixel rect instead of letterboxing
#   --crop center      crop to the largest centred square instead of letterboxing
#   --bar RRGGBB       force the outer bar colour (default 1b2236, the section navy)
#
# After running, point the card at it in main.js PROJECTS:
#   img: "images/projects/<slug>-poster.jpg", video: "images/projects/<slug>.mp4"
# then re-run `node scripts/gen-project-cards.mjs`.
set -euo pipefail

src=${1:?usage: encode-card-media.sh <source> <slug> [options]}
slug=${2:?usage: encode-card-media.sh <source> <slug> [options]}
shift 2

start=0; duration=; poster=0.5; crop=; bar=1b2236
while [ $# -gt 0 ]; do
  case $1 in
    --start)    start=$2;    shift 2 ;;
    --duration) duration=$2; shift 2 ;;
    --poster)   poster=$2;   shift 2 ;;
    --crop)     crop=$2;     shift 2 ;;
    --bar)      bar=${2#\#}; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done

[ -f "$src" ] || { echo "no such source: $src" >&2; exit 1; }

root=$(cd "$(dirname "$0")/.." && pwd)
out_mp4="$root/images/projects/$slug.mp4"
out_jpg="$root/images/projects/$slug-poster.jpg"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

trim=(-ss "$start")
[ -n "$duration" ] && trim+=(-t "$duration")

if [ -n "$crop" ]; then
  [ "$crop" = center ] && crop="'min(iw,ih)':'min(iw,ih)'"
  ffmpeg -v error -y "${trim[@]}" -i "$src" \
    -vf "crop=$crop,scale=900:900:flags=lanczos,fps=30" \
    -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf 30 -preset slow -movflags +faststart "$out_mp4"
else
  # Scaled height of the 16:9 frame inside a 900-wide square, rounded to even (yuv420p
  # needs even dimensions), and the bar height above and below it.
  read -r iw ih < <(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height -of csv=p=0 "$src" | tr ',' ' ')
  vh=$(( (900 * ih / iw + 1) / 2 * 2 ))
  [ "$vh" -ge 900 ] && { echo "source is not wider than tall — use --crop" >&2; exit 1; }
  barh=$(( (900 - vh) / 2 ))

  # Sample the clip's own top and bottom edge colours so each ramp lands on the colour
  # the frame actually starts with. One frame from the middle of the trimmed range.
  mid=$(awk -v s="$start" -v d="${duration:-4}" 'BEGIN{print s + d/2}')
  ffmpeg -v error -y -ss "$mid" -i "$src" -frames:v 1 "$tmp/f.png"
  topc=$(convert "$tmp/f.png" -gravity north -crop "${iw}x8+0+0" +repage \
           -resize 1x1! -format "%[hex:p{0,0}]" info: | cut -c1-6)
  botc=$(convert "$tmp/f.png" -gravity south -crop "${iw}x8+0+0" +repage \
           -resize 1x1! -format "%[hex:p{0,0}]" info: | cut -c1-6)

  # Backdrop: navy at the outer edge ramping to the frame's edge colour where they meet.
  convert -size "900x${barh}" "gradient:#${bar}-#${topc}" "$tmp/top.png"
  convert -size "900x$((900 - barh - vh + barh))" "gradient:#${botc}-#${bar}" "$tmp/bot.png"
  convert -size 900x900 "xc:#${topc}" \
    "$tmp/top.png" -geometry +0+0 -composite \
    "$tmp/bot.png" -geometry "+0+$((barh + vh))" -composite "$tmp/bg.png"

  ffmpeg -v error -y "${trim[@]}" -i "$src" -i "$tmp/bg.png" \
    -filter_complex "[0:v]scale=900:${vh}:flags=lanczos[v];[1:v][v]overlay=0:${barh},fps=30[o]" \
    -map "[o]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf 30 -preset slow -movflags +faststart "$out_mp4"
fi

# Poster is a frame of the encoded clip, not the source, so the card's still and its
# hover video are pixel-identical at the handover.
ffmpeg -v error -y -ss "$poster" -i "$out_mp4" -frames:v 1 -f image2pipe -vcodec png - \
  | convert - -colorspace sRGB -quality 82 -sampling-factor 2x2,1x1,1x1 \
      -interlace none -strip "$out_jpg"

printf '%s\t%s\n' "$(du -h "$out_mp4" | cut -f1)" "images/projects/$slug.mp4"
printf '%s\t%s\n' "$(du -h "$out_jpg" | cut -f1)" "images/projects/$slug-poster.jpg"
