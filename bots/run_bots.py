# All three bots on the change you're working on, the way the checks on GitHub run them.
# Run: python3 bots/run_bots.py
# To compare against something other than origin/main, set BOT_BASE_REF in the environment.

# ---- Settings -------------------------------------------------------------
BOTS = ("security_bot.py", "legal_bot.py", "cyber_bot.py")
# ---------------------------------------------------------------------------

import pathlib
import subprocess
import sys

here = pathlib.Path(__file__).resolve().parent
verdicts = []

for bot in BOTS:
    print("=" * 78)
    done = subprocess.run([sys.executable, str(here / bot)], cwd=here.parent)
    verdicts.append((bot, done.returncode))
    print()

print("=" * 78)
for bot, code in verdicts:
    print(f"{'passed ' if code == 0 else 'stopped'}  {bot}")
if any(code for _, code in verdicts):
    print("\nSomething here has to be sorted before this change can go live.")
else:
    print("\nAll three are happy: nothing here stops this going live.")
sys.exit(1 if any(code for _, code in verdicts) else 0)
