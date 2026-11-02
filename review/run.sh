#!/usr/bin/env bash
# YMT review board: one entry point, no arguments.  bash review/run.sh
# Capture the commented pages, fill the board, record the video. Publishing the board artifact is a
# separate step done by an agent session or by Eva (see review/README.md): a shell script can't publish.

# ---- Config -------------------------------------------------------------------------------------
CHROME_PATH="/var/lib/flatpak/app/com.google.Chrome/current/active/files/extra/chrome"
NODE="node"
FFMPEG="ffmpeg"
FFPROBE="ffprobe"
RECORD="yes"            # "no" skips the MP4 and GIF
BOARD_URL="https://claude.ai/artifact/RS6grqHgbX9NkUK1CeeZ96"
# -------------------------------------------------------------------------------------------------

set -euo pipefail
cd "$(dirname "$0")/.."
export CHROME_PATH FFMPEG FFPROBE

if [ ! -d review/node_modules/playwright ]; then
  echo "Install the board's dependencies first: (cd review && npm install)"
  exit 1
fi

echo "1/3 capture"
"$NODE" review/board.mjs
echo "2/3 fill"
"$NODE" review/fill.mjs
if [ "$RECORD" = "yes" ]; then
  echo "3/3 record"
  "$NODE" review/record.mjs
else
  echo "3/3 record skipped"
fi
echo "$BOARD_URL" > review/out/board-link.txt

echo
echo "Done. Next: republish review/out/board.html to $BOARD_URL (same URL) and send review/out/board.mp4."
