#!/bin/bash
# Automated Fire TV explorer — navigates and captures screenshots.
# Usage: ./scripts/explore.sh [output_dir]
#
# Walks through the Fire TV interface by navigating in each direction
# and capturing at each step. Useful for scraping layouts and graphics.

set -e

SCRIPT_DIR="$(dirname "$0")"
OUT_DIR="${1:-capture/explore_$(date +%Y%m%d_%H%M%S)}"
mkdir -p "$OUT_DIR"

NAV="$SCRIPT_DIR/navigate.sh"
CAP="$SCRIPT_DIR/capture.sh"
PARSE="$SCRIPT_DIR/parse-ui.sh"

capture_state() {
  local label="$1"
  echo ""
  echo "=== $label ==="
  "$CAP" "$OUT_DIR"
  echo "--- UI Elements ---"
  # Parse the most recent dump
  LATEST_DUMP=$(ls -t "$OUT_DIR"/uidump_*.xml 2>/dev/null | head -1)
  if [ -n "$LATEST_DUMP" ]; then
    "$PARSE" "$LATEST_DUMP" 2>/dev/null | head -20
  fi
  echo ""
}

# Start from home
echo "🏠 Going home..."
"$NAV" home
sleep 2

capture_state "Home Screen"

# Navigate right through nav items
echo "➡️  Exploring nav items..."
for i in $(seq 1 13); do
  "$NAV" right
  sleep 0.5
  capture_state "Nav Right $i"
done

# Go back to home
echo "🏠 Returning home..."
"$NAV" home
sleep 2

# Navigate down into content
echo "⬇️  Exploring content rows..."
"$NAV" down
sleep 1
capture_state "Content Row 1"

"$NAV" down
sleep 1
capture_state "Content Row 2"

"$NAV" down
sleep 1
capture_state "Content Row 3"

# Navigate right through tiles
echo "➡️  Exploring tiles..."
for i in $(seq 1 4); do
  "$NAV" right
  sleep 0.5
  capture_state "Tile Right $i"
done

echo ""
echo "✅ Exploration complete. Captures saved to: $OUT_DIR"
echo "   $(ls "$OUT_DIR"/screenshot_*.png 2>/dev/null | wc -l | tr -d ' ') screenshots"
echo "   $(ls "$OUT_DIR"/uidump_*.xml 2>/dev/null | wc -l | tr -d ' ') UI dumps"
