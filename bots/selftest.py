# The bots' own tests: each one is given a change that's fine and a change that isn't, and has to
# reach the right verdict on both. Run: python3 bots/selftest.py

import pathlib

# ---- Settings -------------------------------------------------------------
FIXTURES = pathlib.Path(__file__).resolve().parent / "fixtures"
# Key-shaped text is built here rather than written into any file in the repository.
FAKE_TOKEN = "ghp_" + "b3dXf7Kq" * 5
FAKE_VIDEO = "assets/web/hero-960.mp4"  # a real file, used only for its size in the weight test
# ---------------------------------------------------------------------------

import json
import os
import sys

import common
import cyber_bot
import legal_bot
import security_bot

GOOD_PAGE = (FIXTURES / "good-page.html").read_text(encoding="utf-8")
BAD_PAGE = (FIXTURES / "bad-page.html").read_text(encoding="utf-8")
NO_AXE = {"looked": "axe — not part of this self-test", "problems": []}
results = []


def expect(what, held, detail=""):
    results.append((what, held, detail))
    print(f"{'ok  ' if held else 'FAIL'}  {what}{'' if held else f'  — {detail}'}")


def change(path, before, after):
    return {"state": "M" if before else "A", "path": path, "before": before, "after": after}


def wording(problems):
    return " | ".join(f"{where}: {what}" for where, what, _ in problems)


# ---- the security bot -----------------------------------------------------
edited = GOOD_PAGE.replace("Sample content", "Sample content, edited")
looked, problems = security_bot.review([change("index.html", GOOD_PAGE, edited)], True)
expect("security bot: a plain content edit passes", not problems, wording(problems))
expect("security bot: it says what it looked at", len(looked) == 3, looked)

looked, problems = security_bot.review([change("index.html", GOOD_PAGE, BAD_PAGE)], True)
expect("security bot: a script, a click handler and a data: link in page content stop the change",
       any("page content now has" in what for _, what, _ in problems), wording(problems))

with_token = GOOD_PAGE.replace("</main>", f"<p>key: {FAKE_TOKEN}</p>\n</main>")
looked, problems = security_bot.review([change("index.html", GOOD_PAGE, with_token)], True)
expect("security bot: something key-shaped in the change stops it",
       any("GitHub token" in what for _, what, _ in problems), wording(problems))

placeholder = GOOD_PAGE.replace("</main>", '<p>api_key = "your-key-goes-here"</p>\n</main>')
looked, problems = security_bot.review([change("index.html", GOOD_PAGE, placeholder)], True)
expect("security bot: a stand-in, not a real key, is left alone", not problems, wording(problems))

code_change = [change("index.html", GOOD_PAGE, edited), change("functions/api/enquire.js", "a", "b")]
looked, problems = security_bot.review(code_change, True)
expect("security bot: a studio change that also touches the site's code is stopped",
       any("outside page content" in what for _, what, _ in problems), wording(problems))
looked, problems = security_bot.review(code_change, False)
expect("security bot: the same change from Eva's own branch is allowed", not problems, wording(problems))

# ---- the legal and compliance bot -----------------------------------------
looked, problems = legal_bot.review([change("index.html", GOOD_PAGE, edited)], NO_AXE)
expect("legal bot: a page with described photos and honest wording passes", not problems, wording(problems))

looked, problems = legal_bot.review([change("index.html", GOOD_PAGE, BAD_PAGE)], NO_AXE)
caught = wording(problems)
expect("legal bot: a photo with no description stops the change", "need a description" in caught or "needs a description" in caught, caught)
expect("legal bot: a photo without consent stops the change", "consent is recorded" in caught, caught)
expect("legal bot: a full name beside a photo of young people stops the change", "full name" in caught, caught)
expect("legal bot: wording that says something has happened stops the change", "can't make true" in caught, caught)

axe_faults = {"looked": "axe, the accessibility checker — 1 kind of fault", "problems": [
    ("index.html", "the accessibility checker found 2 things to fix, starting with: buttons must have a name",
     "sample advice for the self-test")]}
looked, problems = legal_bot.review([change("index.html", GOOD_PAGE, edited)], axe_faults)
expect("legal bot: a fault from the accessibility checker stops the change",
       any("accessibility checker" in what for _, what, _ in problems), wording(problems))

consent = json.loads((pathlib.Path(__file__).resolve().parent / "photo-consent.json").read_text(encoding="utf-8"))
expect("legal bot: the consent list is marked as a sample and claims nothing about a real photo",
       consent["sample"] is True and consent["photos_without_consent"] == [], consent)

listed = GOOD_PAGE.replace("bots/fixtures/sample-photo.svg", "assets/web/ph-sample-800.webp")
looked, problems = legal_bot.review([change("index.html", GOOD_PAGE, listed)], NO_AXE)
expect("legal bot: a photo the consent list doesn't name is fine", not problems, wording(problems))

if os.environ.get("BOT_SELFTEST_AXE") == "1":
    # The checker itself, on the two sample pages. Needs the browser: cd bots && npm ci && npx playwright install chromium
    faults = legal_bot.run_axe(["bots/fixtures/bad-page.html"])
    expect("legal bot: the accessibility checker itself finds the fault on the bad sample page",
           bool(faults["problems"]), faults["looked"])
    clear = legal_bot.run_axe(["bots/fixtures/good-page.html"])
    expect("legal bot: the accessibility checker itself passes the good sample page",
           not clear["problems"], clear["looked"])

# ---- the cyber and ops bot ------------------------------------------------
files = {"bots/fixtures/sample-photo.svg", "index.html", FAKE_VIDEO}
looked, problems = cyber_bot.review([change("index.html", GOOD_PAGE, edited)], files)
expect("cyber bot: a page that parses, with links that work, passes", not problems, wording(problems))

looked, problems = cyber_bot.review([change("index.html", GOOD_PAGE, BAD_PAGE)], files)
caught = wording(problems)
expect("cyber bot: a page left half-open is stopped", "doesn't hold together" in caught, caught)
expect("cyber bot: links and photos that go nowhere are stopped", "go nowhere" in caught, caught)

heavier = GOOD_PAGE.replace("</main>", f'<video src="{FAKE_VIDEO}" muted></video>\n</main>')
looked, problems = cyber_bot.review([change("index.html", GOOD_PAGE, heavier)], files)
expect("cyber bot: a page that suddenly weighs megabytes more is stopped",
       any("over the budget" in what for _, what, _ in problems), wording(problems))

# ---- how it went ----------------------------------------------------------
failed = [what for what, held, _ in results if not held]
print(f"\n{len(results) - len(failed)} of {len(results)} checks behaved as they should.")
if failed:
    print("These didn't:")
    for what in failed:
        print(f"  - {what}")
sys.exit(1 if failed else 0)
