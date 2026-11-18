# The legal and compliance bot: photo descriptions, photo consent, names beside young people's faces,
# honest wording, and axe on every page this change touches.
# Run it on the branch you're on: python3 bots/legal_bot.py
# For the axe part, install the checker first: cd bots && npm ci && npx playwright install chromium

import os

# ---- Settings -------------------------------------------------------------
# A photo the studio has marked. Pages carry these markers; the studio writes them from its Media library.
CONSENT_ATTRIBUTE = "data-consent"            # "recorded", "needed" or "expired"
CONSENT_BLOCKS = ("needed", "expired", "none")
YOUNG_PEOPLE_ATTRIBUTE = "data-young-people"  # set on a photo that shows young people
CONSENT_FILE = "bots/photo-consent.json"      # photos that may not be published yet
# A full name is two capitalised words in a row. These words are places, feasts and the team's own
# words, so a pair made of them isn't somebody's name.
NOT_NAMES = (
    "Youth", "Ministry", "Team", "Village", "Emmaus", "Council", "Diocese", "Hexham", "Newcastle",
    "Lourdes", "Flame", "Source", "Wembley", "Consett", "Primary", "Secondary", "Retreat", "Retreats",
    "Festival", "Adoration", "Mass", "Holy", "Spirit", "Jesus", "Christ", "God", "Our", "Lady", "The",
    "Year", "Years", "Day", "Days", "Night", "Nights", "Week", "Weekend", "Summer", "Autumn", "Winter",
    "Spring", "January", "February", "March", "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
    "Saturday", "Sunday", "North", "South", "East", "West", "England", "Scotland", "Wales", "Ireland",
    "Catholic", "Church", "School", "Schools", "College", "Sixth", "Form", "Confirmation", "Sacraments",
    "Reserve", "Book", "Find", "See", "Read", "Join", "Come", "Watch", "Sign", "Email", "Call",
)
# Wording that tells a visitor something has happened. A page can't make any of it true on its own.
FALSE_CONFIRMATIONS = (
    "your message has been sent", "your message was sent", "we have emailed you", "we've emailed you",
    "your place is booked", "your place has been booked", "you are booked", "payment received",
    "your payment has gone through", "you have been added", "you've been added", "you are subscribed",
    "you're subscribed", "we have received your form", "we've received your form", "saved successfully",
    "your details have been saved", "your request has been sent", "we have your details",
)
AXE_PAGES_LIMIT = 8   # how many changed pages axe runs over
AXE_REQUIRED = os.environ.get("BOT_AXE_REQUIRED", "0") == "1"  # the workflow turns this on
NODE = os.environ.get("BOT_NODE", "node")
# ---------------------------------------------------------------------------

import json
import re
import subprocess
import sys

import common

NAME = "Legal and compliance bot"


def review(changes, axe_result):
    looked = []
    problems = []
    pages = [(change, common.read_page(change["after"])) for change in changes
             if change["path"].endswith(".html") and change["after"] is not None]
    without_consent = []
    consent_note = ""
    manifest = common.file_at(common.HEAD_REF, CONSENT_FILE)
    if manifest:
        record = json.loads(manifest)
        without_consent = [path.lower() for path in record.get("photos_without_consent", [])]
        consent_note = record.get("note", "")

    missing_alt = []
    for change, page in pages:
        for image in page.images:
            if not image["has_alt"]:
                missing_alt.append((change["path"], image["line"], image["attributes"].get("src", "a photo")))
    photos = sum(len(page.images) for _, page in pages)
    looked.append(f"all {photos} photo{'' if photos == 1 else 's'} on the {len(pages)} changed page{'' if len(pages) == 1 else 's'}, "
                  "for a description a screen reader can read — "
                  + ("every one has one" if not missing_alt else f"{len(missing_alt)} without one"))
    if missing_alt:
        count = len(missing_alt)
        problems.append((", ".join(sorted({f"{path} line {line}" for path, line, _ in missing_alt})),
                         f"{count} photo{'' if count == 1 else 's'} need{'s' if count == 1 else ''} a description before this can go live",
                         "Open the page in the studio, click each photo and write a line saying what it shows. "
                         "If a photo is only decoration, mark it as decorative and the description can be empty."))

    blocked_photos = []
    marked = 0
    for change, page in pages:
        for image in page.images:
            state = image["attributes"].get(CONSENT_ATTRIBUTE, "")
            source = image["attributes"].get("src", "")
            if state:
                marked += 1
            if state.lower() in CONSENT_BLOCKS or (source and source.lower() in without_consent):
                blocked_photos.append((change["path"], source or f"line {image['line']}"))
    looked.append(f"every photo this change uses against the consent list ({len(without_consent)} photo"
                  f"{'' if len(without_consent) == 1 else 's'} not cleared, {marked} photo"
                  f"{'' if marked == 1 else 's'} marked on the page) — "
                  + ("none of them need consent first" if not blocked_photos else f"{len(blocked_photos)} do"))
    if consent_note:
        looked.append(f"the consent list itself — {consent_note}")
    if blocked_photos:
        problems.append((", ".join(sorted({f"{path}: {source}" for path, source in blocked_photos})),
                         f"{len(blocked_photos)} photo{'' if len(blocked_photos) == 1 else 's'} can't go on the site until consent is recorded",
                         "Use a different photo, or record the consent in the studio's Media library first. "
                         "If the consent has run out, ask again before using the photo."))

    named = []
    young = 0
    for change, page in pages:
        for image in page.images:
            if YOUNG_PEOPLE_ATTRIBUTE not in image["attributes"]:
                continue
            young += 1
            for pair in re.findall(r"\b([A-Z][a-z]{1,15})\s+([A-Z][a-z]{1,15})\b", image["nearby"]):
                if pair[0] not in NOT_NAMES and pair[1] not in NOT_NAMES:
                    named.append((change["path"], image["line"], " ".join(pair)))
    looked.append(f"the words beside the {young} photo{'' if young == 1 else 's'} marked as showing young people, "
                  "for anyone's full name — "
                  + ("none found" if not named else f"{len(named)} found"))
    if named:
        problems.append((", ".join(sorted({f"{path} line {line}" for path, line, _ in named})),
                         f"a full name ({named[0][2]}) sits next to a photo of young people",
                         "Use a first name only, or move the name away from the photo. A face and a full name "
                         "together identify a child, which is what the safeguarding policy rules out."))

    claims = []
    for change in changes:
        if change["after"] is None or not (change["path"].endswith(".html") or change["path"].endswith(".json")):
            continue
        before = common.main_region(change["before"]) if change["path"].endswith(".html") else change["before"]
        after = common.main_region(change["after"]) if change["path"].endswith(".html") else change["after"]
        for number, text in common.added_lines(before, after):
            words = re.sub(r"<[^>]+>", " ", text).lower()
            for phrase in FALSE_CONFIRMATIONS:
                if phrase in words:
                    claims.append((change["path"], number, phrase))
    looked.append("the wording this change adds, for anything telling a visitor something has happened — "
                  + ("nothing that isn't true" if not claims else f"{len(claims)} to look at"))
    if claims:
        problems.append((", ".join(sorted({f"{path} line {number}" for path, number, _ in claims})),
                         f"the new wording says “{claims[0][2]}”, which the page can't make true",
                         "Say what will happen instead of saying it has happened — “we'll email you back” rather than "
                         "“we have emailed you”. Only the form's own reply may confirm something was sent."))

    looked.append(axe_result["looked"])
    problems.extend(axe_result["problems"])
    return looked, problems


def run_axe(pages):
    if not pages:
        return {"looked": "axe, the accessibility checker — no pages changed, so there was nothing to check", "problems": []}
    done = subprocess.run([NODE, str(common.REPO / "bots" / "axe_pages.mjs")], cwd=common.REPO,
                          capture_output=True, text=True, env={**os.environ, "BOT_AXE_PAGES": ",".join(pages)})
    result = None
    for line in done.stdout.splitlines():
        if line.startswith("{"):
            result = json.loads(line)
    if result is None:
        trouble = (done.stderr or done.stdout or "no output").strip().splitlines()[-1:]
        if AXE_REQUIRED:
            return {"looked": "axe, the accessibility checker — it couldn't run, so these pages weren't checked",
                    "problems": [("the checks themselves", "the accessibility checker didn't run, so I can't say these pages pass",
                                  "This is for Eva, not for the person who made the change: "
                                  f"the checker stopped with “{' '.join(trouble)}”.")]}
        return {"looked": "axe, the accessibility checker — it didn't run here. Install it first: "
                          "cd bots && npm ci && npx playwright install chromium (the checks on GitHub always run it)",
                "problems": []}
    faults = []
    for page in result["pages"]:
        for violation in page["violations"]:
            faults.append((page["page"], violation["id"], violation["help"], violation["nodes"]))
    looked = (f"axe, the accessibility checker, on {len(result['pages'])} changed page"
              f"{'' if len(result['pages']) == 1 else 's'} in a desktop-width browser — "
              + ("no faults" if not faults else f"{len(faults)} kind{'' if len(faults) == 1 else 's'} of fault"))
    problems = []
    if faults:
        spots = sum(fault[3] for fault in faults)
        problems.append((", ".join(sorted({fault[0] for fault in faults})),
                         f"the accessibility checker found {spots} thing{'' if spots == 1 else 's'} to fix, starting with: {faults[0][2].lower()}",
                         "Each one is something a screen reader or keyboard user can't get past. The full list, with "
                         "the part of the page it's on, is in this check's output above."))
    return {"looked": looked, "problems": problems}


if __name__ == "__main__":
    changes = common.changed_files()
    changed_pages = [change["path"] for change in changes if change["path"].endswith(".html") and change["after"] is not None]
    looked, problems = review(changes, run_axe(changed_pages[:AXE_PAGES_LIMIT]))
    headline = f"{len(changed_pages)} page{'' if len(changed_pages) == 1 else 's'} changed"
    sys.exit(common.report(NAME, headline, looked, problems))
