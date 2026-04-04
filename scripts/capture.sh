#!/usr/bin/env bash
set -euo pipefail

CAPTURE_DIR="$(dirname "$0")/../capture"
mkdir -p "$CAPTURE_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SCREENSHOT="screenshot_${TIMESTAMP}.png"
UI_DUMP="uidump_${TIMESTAMP}.xml"

echo "Capturing screen and UI hierarchy..."
adb shell screencap -p "/sdcard/${SCREENSHOT}"
adb shell uiautomator dump "/sdcard/${UI_DUMP}"

adb pull "/sdcard/${SCREENSHOT}" "${CAPTURE_DIR}/${SCREENSHOT}"
adb pull "/sdcard/${UI_DUMP}" "${CAPTURE_DIR}/${UI_DUMP}"

adb shell rm "/sdcard/${SCREENSHOT}" "/sdcard/${UI_DUMP}"

echo "Saved to capture/${SCREENSHOT}"
echo "Saved to capture/${UI_DUMP}"
