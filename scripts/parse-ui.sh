#!/bin/bash
# Parse a UI automator dump and print interactive elements.
# Usage: ./scripts/parse-ui.sh [xml_file]
#
# If no file given, captures a fresh dump from the device.
# Output: tab-separated list of clickable/focusable elements with:
#   label, bounds, center_x, center_y, clickable, focused, selected

set -e

XML_FILE="$1"

if [ -z "$XML_FILE" ]; then
  echo "📱 Capturing fresh UI dump..." >&2
  adb shell uiautomator dump /sdcard/uidump.xml 2>/dev/null
  XML_FILE=$(mktemp /tmp/uidump_XXXXXX.xml)
  adb pull /sdcard/uidump.xml "$XML_FILE" > /dev/null
  adb shell rm /sdcard/uidump.xml
  CLEANUP=1
fi

python3 - "$XML_FILE" << 'PYEOF'
import sys
import xml.etree.ElementTree as ET
import re

bounds_re = re.compile(r'\[(\d+),(\d+)\]\[(\d+),(\d+)\]')

def parse_bounds(s):
    m = bounds_re.match(s)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2)), int(m.group(3)), int(m.group(4))

def get_label(node):
    text = node.get('text', '')
    desc = node.get('content-desc', '')
    return text or desc

def walk(node, results):
    label = get_label(node)
    bounds_str = node.get('bounds', '')
    bounds = parse_bounds(bounds_str)
    clickable = node.get('clickable') == 'true'
    focusable = node.get('focusable') == 'true'
    focused = node.get('focused') == 'true'
    selected = node.get('selected') == 'true'

    if bounds and (label or clickable or focusable):
        l, t, r, b = bounds
        w = r - l
        h = b - t
        cx = l + w // 2
        cy = t + h // 2
        flags = []
        if clickable: flags.append('click')
        if focusable: flags.append('focus')
        if focused: flags.append('FOCUSED')
        if selected: flags.append('SELECTED')
        flag_str = ','.join(flags) if flags else '-'

        if label and w > 0 and h > 0:
            results.append({
                'label': label,
                'bounds': f'[{l},{t}][{r},{b}]',
                'cx': cx,
                'cy': cy,
                'w': w,
                'h': h,
                'flags': flag_str,
            })

    for child in node:
        walk(child, results)

tree = ET.parse(sys.argv[1])
root = tree.getroot()

results = []
for child in root:
    walk(child, results)

# Print header
print(f'{"LABEL":<50} {"BOUNDS":<25} {"CENTER":>12} {"SIZE":>10} {"FLAGS"}')
print('-' * 110)

for r in results:
    print(f'{r["label"][:49]:<50} {r["bounds"]:<25} {r["cx"]:>5},{r["cy"]:<6} {r["w"]:>4}x{r["h"]:<5} {r["flags"]}')

print(f'\n{len(results)} elements found')
PYEOF

if [ "${CLEANUP:-0}" = "1" ]; then
  rm -f "$XML_FILE"
fi
