#!/usr/bin/env bash
# Regenerate sitemap.xml with <lastmod> taken from each page's last git commit date.
#
# Uniform, stale lastmod values get ignored by Google as a crawl hint, so this derives
# them from real history instead of a hardcoded date. Run it after committing content
# changes (the date comes from the last COMMIT touching the file, so uncommitted edits
# will not show up until they land).
#
#   ./scripts/gen-sitemap.sh
#
# Pages and their priorities are listed below — add new pages here when they are created.

set -euo pipefail
cd "$(dirname "$0")/.."

BASE="https://vishnujan.dev"

# "<file>|<url-path>|<priority>"
PAGES=(
  "index.html|/|1.0"
  "projects/market-data-pipeline/index.html|/projects/market-data-pipeline/|0.8"
  "projects/product-explorer/index.html|/projects/product-explorer/|0.8"
  "projects/fraud-detection/index.html|/projects/fraud-detection/|0.8"
  "projects/nse-stock-prediction/index.html|/projects/nse-stock-prediction/|0.8"
  "blog/index.html|/blog/|0.7"
  "blog/how-i-scraped-nse-insider-filings/index.html|/blog/how-i-scraped-nse-insider-filings/|0.8"
  "blog/building-resumable-etl-pipelines/index.html|/blog/building-resumable-etl-pipelines/|0.8"
  "blog/minute-level-stock-prediction/index.html|/blog/minute-level-stock-prediction/|0.8"
)

{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for entry in "${PAGES[@]}"; do
    IFS='|' read -r file path priority <<< "$entry"
    [ -f "$file" ] || { echo "warning: missing $file, skipping" >&2; continue; }
    lastmod="$(git log -1 --format=%cs -- "$file")"
    [ -n "$lastmod" ] || lastmod="$(date +%F)"
    printf '  <url>\n    <loc>%s%s</loc>\n    <lastmod>%s</lastmod>\n    <priority>%s</priority>\n  </url>\n' \
      "$BASE" "$path" "$lastmod" "$priority"
  done
  echo '</urlset>'
} > sitemap.xml

echo "sitemap.xml regenerated ($(grep -c '<url>' sitemap.xml) URLs)"
