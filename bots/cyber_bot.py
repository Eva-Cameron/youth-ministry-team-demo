# The cyber and ops bot: the changed pages still parse, everything they link to and load is really
# there, and no page has got much heavier.
# Run it on the branch you're on: python3 bots/cyber_bot.py

import os

# ---- Settings -------------------------------------------------------------
GROWTH_BUDGET_KB = 150   # how much heavier one page may get in a single change
PAGE_BUDGET_KB = 4500    # and the most a page new to the site may weigh, with everything it loads
INDEX_FILE = "index.html"  # what a link to a folder, such as href="./", really asks for
# Links nothing in this repository can answer for, so they aren't checked here.
SKIP_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "data:", "javascript:", "sms:")
# The attributes a page loads a file through, as opposed to linking to one. These count towards weight.
LOADING_ATTRIBUTES = ("src", "srcset", "poster", "data-src")
WEIGHT_LIMIT = int(os.environ.get("BOT_WEIGHT_PAGES", "12"))  # pages weighed in one run
# ---------------------------------------------------------------------------

import posixpath
import sys

import common

NAME = "Cyber and ops bot"


def weigh(ref, path, page_html):
    page = common.read_page(page_html)
    total = len(page_html.encode("utf-8"))
    counted = set()
    for link in page.links:
        if link["attribute"] not in LOADING_ATTRIBUTES and link["tag"] != "link":
            continue
        target = where(path, link["url"])
        if target is None or target in counted:
            continue
        counted.add(target)
        total += common.size_at(ref, target) or 0
    return total


def where(page_path, url):
    address = url.split("?")[0].split("#")[0].strip()
    if not address or address.startswith(SKIP_PREFIXES):
        return None
    folder = address.endswith("/")
    if address.startswith("/"):
        target = posixpath.normpath(address.lstrip("/"))
    else:
        target = posixpath.normpath(posixpath.join(posixpath.dirname(page_path), address))
    return INDEX_FILE if target == "." else posixpath.join(target, INDEX_FILE) if folder else target


def review(changes, files):
    looked = []
    problems = []
    pages = [(change, common.read_page(change["after"])) for change in changes
             if change["path"].endswith(".html") and change["after"] is not None]

    broken_tags = []
    for change, page in pages:
        for frame in page.unclosed:
            broken_tags.append((change["path"], frame["line"], f"<{frame['tag']}> is never closed"))
        for frame in page.stray:
            broken_tags.append((change["path"], frame["line"], f"</{frame['tag']}> closes something that was never opened"))
        for name in page.duplicate_ids:
            broken_tags.append((change["path"], 0, f"two parts of the page are both called “{name}”"))
    looked.append(f"the {len(pages)} changed page{'' if len(pages) == 1 else 's'}, to see they still read as a whole page — "
                  + ("all fine" if not broken_tags else f"{len(broken_tags)} problem{'' if len(broken_tags) == 1 else 's'}"))
    if broken_tags:
        problems.append((", ".join(sorted({f"{path} line {line}" for path, line, _ in broken_tags})),
                         f"the page doesn't hold together: {broken_tags[0][2]}",
                         "A browser will guess at the rest of the page, which usually means part of it disappears. "
                         "Undo the last edit to that part in the studio and make it again, or tell Eva."))

    missing = []
    checked_links = 0
    for change, page in pages:
        for link in page.links:
            address = link["url"].strip()
            if address.startswith("#"):
                checked_links += 1
                if len(address) > 1 and address[1:] not in page.ids:
                    missing.append((change["path"], link["line"], f"{address} goes to a part of the page that isn't there"))
                continue
            target = where(change["path"], address)
            if target is None:
                continue
            checked_links += 1
            spot = address.split("#")[1] if "#" in address else ""
            if target not in files:
                missing.append((change["path"], link["line"], f"{address} points at {target}, which isn't in the site"))
            elif spot and target.endswith(".html"):
                elsewhere = common.read_page(common.file_at(common.HEAD_REF, target) or "")
                if spot not in elsewhere.ids:
                    missing.append((change["path"], link["line"], f"{address} goes to a part of {target} that isn't there"))
    looked.append(f"all {checked_links} links, photos and files the changed pages point at — "
                  + ("every one is there" if not missing else f"{len(missing)} that aren't"))
    if missing:
        problems.append((", ".join(sorted({f"{path} line {line}" for path, line, _ in missing})),
                         f"{len(missing)} link{'' if len(missing) == 1 else 's'} or photo{'' if len(missing) == 1 else 's'} "
                         f"on the page go nowhere: {missing[0][2]}",
                         "A visitor clicking that gets a “page not found”, and a missing photo leaves a gap. "
                         "Pick the page or photo again in the studio so the right address goes in."))

    weights = []
    for change, _ in pages[:WEIGHT_LIMIT]:
        after = weigh(common.HEAD_REF, change["path"], change["after"])
        before = weigh(common.BASE_REF, change["path"], change["before"]) if change["before"] else 0
        weights.append((change["path"], before, after))
    heavy = [(path, before, after) for path, before, after in weights
             if (after - before > GROWTH_BUDGET_KB * 1024 if before else after > PAGE_BUDGET_KB * 1024)]
    if weights:
        shown = ", ".join(f"{path} {round(after / 1024)} KB"
                          + (f" (was {round(before / 1024)} KB)" if before and before != after else "")
                          for path, before, after in weights)
        looked.append(f"what each changed page weighs with everything it loads, against a budget of "
                      f"{GROWTH_BUDGET_KB} KB more in one change, or {PAGE_BUDGET_KB} KB in total for a page "
                      f"new to the site — {shown}")
    else:
        looked.append("what each changed page weighs — no pages changed, so there was nothing to weigh")
    if heavy:
        path, before, after = heavy[0]
        grew = round((after - before) / 1024)
        problems.append((", ".join(path for path, _, _ in heavy),
                         f"{path} now weighs {round(after / 1024)} KB"
                         + (f", {grew} KB more than before" if before else "")
                         + ", which is over the budget",
                         "That's a slow page on a phone in a church hall. Use a smaller photo or fewer of them — "
                         "the studio makes a web-sized copy when you upload, so pick that rather than the original."))
    return looked, problems


if __name__ == "__main__":
    changes = common.changed_files()
    listing = common.git(["ls-tree", "-r", common.HEAD_REF, "--name-only"]) or ""
    looked, problems = review(changes, set(listing.splitlines()))
    changed_pages = [change for change in changes if change["path"].endswith(".html") and change["after"] is not None]
    headline = f"{len(changed_pages)} page{'' if len(changed_pages) == 1 else 's'} changed"
    sys.exit(common.report(NAME, headline, looked, problems))
