#!/bin/bash
# Capture a screenshot + UI dump pair from a connected Fire TV device.
# Usage: ./scripts/capture.sh [output_dir]
#
# Creates timestamped files:
#   screenshot_YYYYMMDD_HHMMSS.png
#   uidump_YYYYMMDD_HHMMSS.xml

set -e

OUT_DIR="${1:-capture}"
mkdir -p "$OUT_DIR"

TS=$(date +%Y%m%d_%H%M%S)
SCREENSHOT="screenshot_${TS}.png"
UIDUMP="uidump_${TS}.xml"

echo "📸 Capturing screenshot..."
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png "$OUT_DIR/$SCREENSHOT" > /dev/null
adb shell rm /sdcard/screenshot.png

echo "🔍 Capturing UI dump..."
adb shell uiautomator dump /sdcard/uidump.xml 2>/dev/null
adb pull /sdcard/uidump.xml "$OUT_DIR/$UIDUMP" > /dev/null
adb shell rm /sdcard/uidump.xml

echo "✅ Captured:"
echo "   $OUT_DIR/$SCREENSHOT"
echo "   $OUT_DIR/$UIDUMP"
