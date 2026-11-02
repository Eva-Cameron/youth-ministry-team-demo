#!/usr/bin/env bash
# Starts Claude Code with the ponytail team on YMT iteration 3 (design, forms, content, comment system).
# Run from anywhere: bash tools/dispatch-iteration-3.sh

# ---- config ---------------------------------------------------------------
REPO_DIR="$HOME/code/youth-ministry-team-demo"   # your local clone
REPO_URL="https://github.com/Eva-Cameron/youth-ministry-team-demo"
BASE_BRANCHES="main"                                  # iteration 3 is cut from main
WORK_BRANCH="review/iteration-3"
PROMPT_FILE="docs/prompts/iteration-3-impeccable-ponytail.md"
DISPATCH_COMMAND="/ponytail"                       # or /dev-teams
CLAUDE_BIN="claude"
# ---------------------------------------------------------------------------

set -euo pipefail

command -v "$CLAUDE_BIN" >/dev/null || { echo "Claude Code ('$CLAUDE_BIN') isn't installed or isn't on PATH."; exit 1; }

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Cloning $REPO_URL into $REPO_DIR"
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "You have uncommitted changes in $REPO_DIR. Commit or stash them, then run this again."
  exit 1
fi

git fetch --quiet origin

base=""
for candidate in $BASE_BRANCHES; do
  if git ls-remote --exit-code --heads origin "$candidate" >/dev/null 2>&1; then base="$candidate"; break; fi
done
[ -n "$base" ] || { echo "None of these branches exist on GitHub: $BASE_BRANCHES"; exit 1; }

if git ls-remote --exit-code --heads origin "$WORK_BRANCH" >/dev/null 2>&1; then
  echo "Continuing existing $WORK_BRANCH"
  git checkout --quiet "$WORK_BRANCH" 2>/dev/null || git checkout --quiet -b "$WORK_BRANCH" "origin/$WORK_BRANCH"
  git pull --quiet --ff-only origin "$WORK_BRANCH"
else
  echo "Creating $WORK_BRANCH from $base"
  git checkout --quiet -B "$WORK_BRANCH" "origin/$base"
  git push --quiet -u origin "$WORK_BRANCH"
fi

[ -f "$PROMPT_FILE" ] || { echo "Prompt not found: $PROMPT_FILE (is $base up to date?)"; exit 1; }

if [ ! -f node_modules/playwright/package.json ]; then
  echo "Installing Playwright (review board) and Wrangler (Cloudflare Pages Functions)"
  [ -f package.json ] || npm init -y >/dev/null
  npm install --save-dev --silent playwright wrangler
  npx --yes playwright install chromium
fi
python3 -c "import PIL, numpy" 2>/dev/null || echo "Note: the photo colour-pop tool needs Pillow and numpy (pip install pillow numpy)."
command -v ffmpeg >/dev/null || echo "Note: ffmpeg isn't installed; the agents will need it for the MP4 (sudo dnf install ffmpeg / brew install ffmpeg)."

echo "Starting Claude Code with $DISPATCH_COMMAND on $WORK_BRANCH"
exec "$CLAUDE_BIN" "$DISPATCH_COMMAND $(cat "$PROMPT_FILE")"
