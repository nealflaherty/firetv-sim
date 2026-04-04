#!/usr/bin/env bash
# Extract UI element fragments from a screenshot + UI dump pair.
# Usage: ./scripts/extract-fragments.sh <screenshot.png> <uidump.xml>
#
# Outputs cropped images to capture/fragments/<timestamp>/ using
# content-desc or text from the XML as filenames.

set -euo pipefail

SCREENSHOT="$1"
UIDUMP="$2"

# Extract timestamp from filename
TS=$(basename "$SCREENSHOT" | grep -oE '[0-9]{8}_[0-9]{6}')
OUTDIR="$(dirname "$SCREENSHOT")/fragments/${TS}"
mkdir -p "$OUTDIR"

# Parse bounds and labels from XML nodes, output: left,top,right,bottom|label
# Picks content-desc first, falls back to text
parse_nodes() {
  python3 -c "
import xml.etree.ElementTree as ET, sys, re

tree = ET.parse(sys.argv[1])

def walk(el):
    bounds = el.get('bounds', '')
    m = re.match(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]', bounds)
    if not m:
        for child in el:
            walk(child)
        return
    l, t, r, b = int(m[1]), int(m[2]), int(m[3]), int(m[4])
    w, h = r - l, b - t
    label = el.get('content-desc', '') or el.get('text', '')
    if label and w > 0 and h > 0:
        # sanitize label for filename
        safe = re.sub(r'[^a-zA-Z0-9_\-]+', '_', label)[:80].strip('_')
        print(f'{l},{t},{r},{b}|{safe}')
    for child in el:
        walk(child)

for root in tree.getroot():
    walk(root)
" "$1"
}

echo "Extracting fragments from $TS..."

# Track used names to avoid collisions
declare -A USED

parse_nodes "$UIDUMP" | while IFS='|' read -r coords name; do
  IFS=',' read -r left top right bottom <<< "$coords"
  w=$((right - left))
  h=$((bottom - top))

  # Skip tiny fragments
  if [ "$w" -lt 10 ] || [ "$h" -lt 10 ]; then
    continue
  fi

  # Handle duplicate names
  outname="$name"
  if [ -f "$OUTDIR/${outname}.png" ]; then
    n=2
    while [ -f "$OUTDIR/${outname}_${n}.png" ]; do
      n=$((n + 1))
    done
    outname="${outname}_${n}"
  fi

  convert "$SCREENSHOT" -crop "${w}x${h}+${left}+${top}" +repage "$OUTDIR/${outname}.png"
  echo "  ${outname}.png  (${w}x${h} @ ${left},${top})"
done

echo "Done. Fragments saved to $OUTDIR"
