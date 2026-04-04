#!/usr/bin/env bash
set -euo pipefail

CAPTURE_DIR="$(dirname "$0")/../capture"
mkdir -p "$CAPTURE_DIR"

DURATION="${1:-180}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="recording_${TIMESTAMP}.mp4"
DEVICE_PATH="/sdcard/${FILENAME}"

echo "Recording screen (max ${DURATION}s). Press Ctrl+C to stop early..."
trap 'echo "Stopping recording..."' INT

adb shell screenrecord --time-limit "$DURATION" "$DEVICE_PATH" || true

sleep 1
adb pull "$DEVICE_PATH" "${CAPTURE_DIR}/${FILENAME}"
adb shell rm "$DEVICE_PATH"

echo "Saved to capture/${FILENAME}"
