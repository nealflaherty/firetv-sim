#!/usr/bin/env python3
"""Extract fragments from all screenshot + uidump pairs in capture/.

Usage: python3 scripts/extract-all-fragments.py
"""

import os, re, subprocess

CAPTURE_DIR = os.path.join(os.path.dirname(__file__), '..', 'capture')
CAPTURE_DIR = os.path.abspath(CAPTURE_DIR)

ts_re = re.compile(r'(\d{8}_\d{6})')
screenshots = {}
dumps = {}

for f in os.listdir(CAPTURE_DIR):
    m = ts_re.search(f)
    if not m:
        continue
    ts = m.group(1)
    if f.startswith('screenshot_') and f.endswith('.png'):
        screenshots[ts] = os.path.join(CAPTURE_DIR, f)
    elif f.startswith('uidump_') and f.endswith('.xml'):
        dumps[ts] = os.path.join(CAPTURE_DIR, f)

pairs = sorted(set(screenshots) & set(dumps))
if not pairs:
    print('No matching pairs found.')
    raise SystemExit(1)

script = os.path.join(os.path.dirname(__file__), 'extract-fragments.py')
for ts in pairs:
    print(f'\n=== {ts} ===')
    subprocess.run(['python3', script, screenshots[ts], dumps[ts]], check=True)

print(f'\nProcessed {len(pairs)} pair(s).')
