#!/usr/bin/env python3
"""Extract UI element fragments from a screenshot + UI dump pair.

Usage: python3 scripts/extract-fragments.py <screenshot.png> <uidump.xml>

Outputs cropped images to capture/fragments/<timestamp>/ using
content-desc or text from the XML as filenames.
"""

import sys, os, re, subprocess
import xml.etree.ElementTree as ET

screenshot = sys.argv[1]
uidump = sys.argv[2]

ts = re.search(r'(\d{8}_\d{6})', os.path.basename(screenshot)).group(1)
outdir = os.path.join(os.path.dirname(screenshot), 'fragments', ts)
os.makedirs(outdir, exist_ok=True)

BOUNDS_RE = re.compile(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]')

fragments = []

def walk(el):
    m = BOUNDS_RE.match(el.get('bounds', ''))
    if m:
        l, t, r, b = int(m[1]), int(m[2]), int(m[3]), int(m[4])
        w, h = r - l, b - t
        label = el.get('content-desc', '') or el.get('text', '')
        if label and w >= 10 and h >= 10:
            safe = re.sub(r'[^a-zA-Z0-9_\-]+', '_', label)[:80].strip('_')
            fragments.append((l, t, w, h, safe))
    for child in el:
        walk(child)

tree = ET.parse(uidump)
for root_child in tree.getroot():
    walk(root_child)

# Deduplicate names
used = {}
for l, t, w, h, name in fragments:
    if name in used:
        used[name] += 1
        outname = f"{name}_{used[name]}"
    else:
        used[name] = 1
        outname = name

    outpath = os.path.join(outdir, f"{outname}.png")
    subprocess.run([
        'magick', screenshot,
        '-crop', f'{w}x{h}+{l}+{t}', '+repage',
        outpath
    ], check=True)
    print(f"  {outname}.png  ({w}x{h} @ {l},{t})")

print(f"\nDone. {len(fragments)} fragments saved to {outdir}")
