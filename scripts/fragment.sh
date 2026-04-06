#!/bin/bash
# Extract UI element fragments from a screenshot using a UI dump.
# Usage: ./scripts/fragment.sh <screenshot.png> <uidump.xml> [output_dir]
#
# Crops each labeled element from the screenshot into individual PNGs.

set -e

SCREENSHOT="$1"
UIDUMP="$2"
OUT_DIR="${3:-$(dirname "$SCREENSHOT")/fragments_$(basename "$SCREENSHOT" .png)}"

if [ -z "$SCREENSHOT" ] || [ -z "$UIDUMP" ]; then
  echo "Usage: ./scripts/fragment.sh <screenshot.png> <uidump.xml> [output_dir]"
  exit 1
fi

mkdir -p "$OUT_DIR"

python3 - "$SCREENSHOT" "$UIDUMP" "$OUT_DIR" << 'PYEOF'
import sys
import xml.etree.ElementTree as ET
import re
import subprocess
import os

bounds_re = re.compile(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]')

screenshot = sys.argv[1]
uidump = sys.argv[2]
out_dir = sys.argv[3]

def parse_bounds(s):
    m = bounds_re.match(s)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))

def get_label(node):
    return node.get('text', '') or node.get('content-desc', '')

def sanitize(s):
    return re.sub(r'[^\w\-]', '_', s)[:80]

def walk(node, results):
    label = get_label(node)
    bounds = parse_bounds(node.get('bounds', ''))
    if label and bounds:
        l, t, r, b = bounds
        w, h = r - l, b - t
        if w > 0 and h > 0:
            results.append({'label': label, 'l': l, 't': t, 'w': w, 'h': h})
    for child in node:
        walk(child, results)

tree = ET.parse(uidump)
results = []
for child in tree.getroot():
    walk(child, results)

count = 0
seen = set()
for r in results:
    name = sanitize(r['label'])
    if name in seen:
        name = f"{name}_{count}"
    seen.add(name)

    out_path = os.path.join(out_dir, f"{name}.png")
    crop = f"{r['w']}x{r['h']}+{r['l']}+{r['t']}"

    try:
        subprocess.run(
            ['magick', screenshot, '-crop', crop, '+repage', out_path],
            check=True, capture_output=True
        )
        count += 1
    except subprocess.CalledProcessError:
        pass

print(f"Extracted {count} fragments to {out_dir}")
PYEOF
