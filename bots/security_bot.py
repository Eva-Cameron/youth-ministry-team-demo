# The security bot: nothing secret, nothing that can run, and no site code in a content change.
# Run it on the branch you're on: python3 bots/security_bot.py

import os

# ---- Settings -------------------------------------------------------------
# What a secret looks like. Each line this change adds is read once against all of these.
SECRET_PATTERNS = {
    "a GitHub token": r"gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}",
    "a private key": r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY",
    "an Amazon access key": r"AKIA[0-9A-Z]{16}",
    "a Resend key": r"\bre_[A-Za-z0-9]{16,}",
    "a Stripe key": r"\bsk_(?:live|test)_[A-Za-z0-9]{16,}",
    "a Slack token": r"xox[abprs]-[A-Za-z0-9-]{10,}",
    "a Google key": r"AIza[0-9A-Za-z_-]{35}",
    "a signed token": r"eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}",
    "a key or password written straight into the file": r"(?i)\b(?:api[_-]?key|secret|password|passwd|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*[\"'][^\"'\s]{12,}[\"']",
}
# Words that mean it's a stand-in, not a real key.
PLACEHOLDER_WORDS = ("example", "your-", "your_", "changeme", "placeholder", "xxxx", "redacted", "dummy", "sample")
# Anything that could run in a visitor's browser has no place in page content.
RUNNABLE_PATTERNS = {
    "a script": r"<\s*script\b",
    "a click or load handler": r"\son(?:click|load|error|mouse[a-z]+|key[a-z]+|focus|blur|submit|change|input|toggle|animation[a-z]+|transition[a-z]+)\s*=",
    "a javascript: link": r"javascript\s*:",
    "a data: link": r"(?:src|href|srcset|poster|action)\s*=\s*[\"']?\s*data:",
}
# A content change may not touch the site's own code, its Pages functions or these checks.
PROTECTED_PATHS = ("functions/", ".github/", "bots/")
# How we know a change came from the studio rather than from Eva working in the repo.
CONTENT_BRANCH_PREFIX = "studio/"
CONTENT_LABEL = "studio"
HEAD_BRANCH = os.environ.get("BOT_HEAD_BRANCH", "")
PR_LABELS = os.environ.get("BOT_PR_LABELS", "")
# ---------------------------------------------------------------------------

import re
import sys

import common

NAME = "Security bot"


def review(changes, from_studio):
    looked = []
    problems = []

    found = []
    lines = 0
    for change in changes:
        if change["after"] is None:
            continue
        for number, text in common.added_lines(change["before"], change["after"]):
            lines += 1
            for what, pattern in SECRET_PATTERNS.items():
                hit = re.search(pattern, text)
                if not hit:
                    continue
                if any(word in hit.group(0).lower() for word in PLACEHOLDER_WORDS):
                    continue
                found.append((change["path"], number, what))
                break
    looked.append(f"the {lines} line{'' if lines == 1 else 's'} this change adds, for keys, passwords and tokens — "
                  + ("nothing that looks like one" if not found else f"{len(found)} that look like one"))
    if found:
        where = ", ".join(sorted({f"{path} line {number}" for path, number, _ in found}))
        what = f"{len(found)} line{'' if len(found) == 1 else 's'} look like {found[0][2]}"
        problems.append((where, what,
                         "Take it out of the page. If it's a real key, change the key itself straight away as well — "
                         "anything that reaches this repository has to be treated as public."))

    runnable = []
    pages = [change for change in changes if change["path"].endswith(".html") and change["after"] is not None]
    for change in pages:
        added = common.added_lines(common.main_region(change["before"]), common.main_region(change["after"]))
        for number, text in added:
            for what, pattern in RUNNABLE_PATTERNS.items():
                if re.search(pattern, text):
                    runnable.append((change["path"], what))
                    break
    looked.append(f"the page content in {len(pages)} changed page{'' if len(pages) == 1 else 's'}, for scripts, "
                  "click handlers and javascript: or data: links — "
                  + ("none added" if not runnable else f"{len(runnable)} added"))
    if runnable:
        kinds = ", ".join(sorted({what for _, what in runnable}))
        problems.append((", ".join(sorted({path for path, _ in runnable})),
                         f"page content now has {kinds} in it",
                         "Page content is words and pictures only. Take it out — if the page really needs something "
                         "to run, it belongs in the site's own code, which Eva changes in the repository."))

    touched = sorted({change["path"] for change in changes if change["path"].startswith(PROTECTED_PATHS)})
    if from_studio:
        looked.append("the site's code, its Pages functions and these checks — "
                      + ("untouched" if not touched else f"{len(touched)} changed"))
        if touched:
            problems.append((", ".join(touched),
                             f"a change made in the studio also changes {len(touched)} file{'' if len(touched) == 1 else 's'} outside page content",
                             "Nothing from the studio should reach the site's code or these checks. Open those changes "
                             "separately in the repository, so they get read on their own."))
    else:
        looked.append("the site's code and these checks — not checked, because this change didn't come from the studio "
                      f"(branch {HEAD_BRANCH or 'unknown'}), so Eva is working in the repository as usual")
    return looked, problems


if __name__ == "__main__":
    changes = common.changed_files()
    from_studio = HEAD_BRANCH.startswith(CONTENT_BRANCH_PREFIX) or CONTENT_LABEL in [label.strip() for label in PR_LABELS.split(",")]
    looked, problems = review(changes, from_studio)
    headline = f"{len(changes)} file{'' if len(changes) == 1 else 's'} changed"
    sys.exit(common.report(NAME, headline, looked, problems))
