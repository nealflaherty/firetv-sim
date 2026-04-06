#!/bin/bash
# Send navigation commands to a connected Fire TV device.
# Usage: ./scripts/navigate.sh <command> [args]
#
# Commands:
#   up, down, left, right  - D-pad navigation
#   select, enter          - Select/OK button
#   back                   - Back button
#   home                   - Home button
#   menu                   - Menu button
#   play, pause            - Media controls
#   tap <x> <y>            - Tap at coordinates
#   text <string>          - Type text
#   wait <seconds>         - Sleep (for scripting)
#   key <keycode>          - Send raw keycode

set -e

CMD="${1:-help}"
shift 2>/dev/null || true

case "$CMD" in
  up)       adb shell input keyevent KEYCODE_DPAD_UP ;;
  down)     adb shell input keyevent KEYCODE_DPAD_DOWN ;;
  left)     adb shell input keyevent KEYCODE_DPAD_LEFT ;;
  right)    adb shell input keyevent KEYCODE_DPAD_RIGHT ;;
  select|enter|ok)
            adb shell input keyevent KEYCODE_DPAD_CENTER ;;
  back)     adb shell input keyevent KEYCODE_BACK ;;
  home)     adb shell input keyevent KEYCODE_HOME ;;
  menu)     adb shell input keyevent KEYCODE_MENU ;;
  play)     adb shell input keyevent KEYCODE_MEDIA_PLAY ;;
  pause)    adb shell input keyevent KEYCODE_MEDIA_PAUSE ;;
  playpause)adb shell input keyevent KEYCODE_MEDIA_PLAY_PAUSE ;;
  tap)
    X="$1"; Y="$2"
    if [ -z "$X" ] || [ -z "$Y" ]; then
      echo "Usage: navigate.sh tap <x> <y>"
      exit 1
    fi
    adb shell input tap "$X" "$Y"
    ;;
  text)
    TEXT="$*"
    if [ -z "$TEXT" ]; then
      echo "Usage: navigate.sh text <string>"
      exit 1
    fi
    adb shell input text "$TEXT"
    ;;
  wait)
    SECS="${1:-1}"
    sleep "$SECS"
    ;;
  key)
    KEYCODE="$1"
    if [ -z "$KEYCODE" ]; then
      echo "Usage: navigate.sh key <keycode>"
      exit 1
    fi
    adb shell input keyevent "$KEYCODE"
    ;;
  help|*)
    echo "Fire TV Navigation"
    echo "Usage: ./scripts/navigate.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  up, down, left, right  - D-pad"
    echo "  select, enter, ok      - Select button"
    echo "  back                   - Back button"
    echo "  home                   - Home button"
    echo "  menu                   - Menu button"
    echo "  play, pause, playpause - Media"
    echo "  tap <x> <y>            - Tap coordinates"
    echo "  text <string>          - Type text"
    echo "  wait <seconds>         - Sleep"
    echo "  key <keycode>          - Raw keycode"
    ;;
esac
