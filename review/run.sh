#!/usr/bin/env bash
# YMT review board: one entry point, no arguments.  bash review/run.sh
# Pull the latest threads (if EXPORT_URL is set in board.mjs), capture the commented pages, fill the board,
# record the video. Outputs land in review/out/.

# ---- Config -------------------------------------------------------------------------------------
CHROME_PATH="/var/lib/flatpak/app/com.google.Chrome/current/active/files/extra/chrome"
NODE="node"
FFMPEG="ffmpeg"
FFPROBE="ffprobe"
RECORD="yes"            # "no" skips the MP4 and GIF
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

echo
echo "Done. Send Eva review/out/board.html and review/out/board.mp4."
