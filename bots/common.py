# Shared ground for the three content bots: what a change touches, how a page reads, and how a bot
# says what it found. Run all three with: python3 bots/run_bots.py

import os

# ---- Settings -------------------------------------------------------------
BASE_REF = os.environ.get("BOT_BASE_REF", "origin/main")  # what the change is measured against
HEAD_REF = os.environ.get("BOT_HEAD_REF", "HEAD")         # the change itself
TEXT_SUFFIXES = (".html", ".json", ".css", ".js", ".mjs", ".md", ".txt", ".yml", ".yaml", ".svg", ".sql", ".py", ".sh", ".toml")
# The deliberately broken examples the bots test themselves against. They aren't part of the site, so
# nothing here reads them as a change to it.
IGNORE_PREFIXES = ("bots/fixtures/",)
NEARBY_CHARS = 160  # how far either side of a photo counts as "next to it"
# Tags that may be left unclosed in valid HTML, so an unclosed one isn't a mistake.
OPTIONAL_CLOSE = ("p", "li", "dt", "dd", "option", "thead", "tbody", "tfoot", "tr", "td", "th", "rt", "rp", "colgroup", "caption", "html", "head", "body")
VOID_TAGS = ("area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr")
# ---------------------------------------------------------------------------

import difflib
import html.parser
import pathlib
import re
import subprocess

REPO = pathlib.Path(__file__).resolve().parent.parent


def git(args):
    done = subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True, errors="replace")
    return None if done.returncode != 0 else done.stdout


def file_at(ref, path):
    return git(["show", f"{ref}:{path}"])


def size_at(ref, path):
    size = git(["cat-file", "-s", f"{ref}:{path}"])
    return None if size is None else int(size.strip())


def changed_files():
    listing = git(["diff", "--name-status", f"{BASE_REF}...{HEAD_REF}"])
    if listing is None:
        raise SystemExit(
            f"I can't compare {BASE_REF} with {HEAD_REF}, so I can't tell what changed.\n"
            f"What to do: fetch the branch this change is measured against first — git fetch origin main"
        )
    changes = []
    for line in listing.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        state, path = parts[0][0], parts[-1]
        if path.startswith(IGNORE_PREFIXES):
            continue
        text = path.endswith(TEXT_SUFFIXES)
        changes.append({
            "state": state,
            "path": path,
            "before": file_at(BASE_REF, path) if text and state != "A" else None,
            "after": file_at(HEAD_REF, path) if text and state != "D" else None,
        })
    return changes


def added_lines(before, after):
    old = (before or "").splitlines()
    new = (after or "").splitlines()
    added = []
    number = 0
    for line in difflib.unified_diff(old, new, n=0, lineterm=""):
        if line.startswith("@@"):
            found = re.search(r"\+(\d+)", line)
            number = int(found.group(1)) if found else 0
            continue
        if line.startswith("+") and not line.startswith("+++"):
            added.append((number, line[1:]))
            number += 1
    return added


def main_region(page_html):
    found = re.search(r"<main\b[^>]*>(.*?)</main>", page_html or "", re.I | re.S)
    return found.group(1) if found else (page_html or "")


# One pass over a page: its photos and the words next to them, its ids, everything it links to or
# loads, and whether the tags close. Both the legal bot and the cyber/ops bot read pages through this.
class PageReader(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.ids = []
        self.links = []
        self.unclosed = []
        self.stray = []
        self.duplicate_ids = []
        self.stack = []
        self.flow = []

    def handle_starttag(self, tag, attrs):
        attributes = {name: (value or "") for name, value in attrs}
        if "id" in attributes:
            if attributes["id"] in self.ids:
                self.duplicate_ids.append(attributes["id"])
            self.ids.append(attributes["id"])
        for name in ("href", "src", "poster", "data-src"):
            if attributes.get(name):
                self.links.append({"tag": tag, "attribute": name, "url": attributes[name], "line": self.getpos()[0]})
        for candidate in attributes.get("srcset", "").split(","):
            url = candidate.strip().split(" ")[0]
            if url:
                self.links.append({"tag": tag, "attribute": "srcset", "url": url, "line": self.getpos()[0]})
        if tag == "img":
            self.images.append({
                "attributes": attributes,
                "line": self.getpos()[0],
                "alt": attributes.get("alt"),
                "has_alt": "alt" in attributes,
                "nearby": "",
                "at": len(self.flow),
            })
            self.flow.append({"kind": "image", "index": len(self.images) - 1})
        if tag not in VOID_TAGS:
            self.stack.append({"tag": tag, "line": self.getpos()[0]})

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if self.stack and self.stack[-1]["tag"] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        for depth in range(len(self.stack) - 1, -1, -1):
            if self.stack[depth]["tag"] == tag:
                for frame in self.stack[depth + 1:]:
                    if frame["tag"] not in OPTIONAL_CLOSE:
                        self.unclosed.append(frame)
                del self.stack[depth:]
                return
        self.stray.append({"tag": tag, "line": self.getpos()[0]})

    def handle_data(self, data):
        if data.strip():
            self.flow.append({"kind": "text", "text": " ".join(data.split())})

    def close(self):
        super().close()
        for frame in self.stack:
            if frame["tag"] not in OPTIONAL_CLOSE:
                self.unclosed.append(frame)
        self.stack = []
        for image in self.images:
            before = ""
            after = ""
            for item in reversed(self.flow[:image["at"]]):
                if item["kind"] == "text" and len(before) < NEARBY_CHARS:
                    before = item["text"] + " " + before
            for item in self.flow[image["at"] + 1:]:
                if item["kind"] == "text" and len(after) < NEARBY_CHARS:
                    after = after + " " + item["text"]
            image["nearby"] = f"{before[-NEARBY_CHARS:]} {image['alt'] or ''} {after[:NEARBY_CHARS]}".strip()


def read_page(page_html):
    reader = PageReader()
    reader.feed(page_html or "")
    reader.close()
    return reader


# Everything a bot says, in the same shape: what it looked at, then anything that needs fixing.
# A problem is (where, what, what to do). Returns the exit code: 1 if the change can't go live.
def report(name, headline, looked, problems):
    print(f"{name}: {headline}\n")
    print("What I looked at")
    for line in looked:
        print(f"  - {line}")
    if problems:
        print("\nWhat needs fixing")
        for number, (where, what, todo) in enumerate(problems, 1):
            print(f"  {number}. {where}: {what}")
            print(f"     What to do: {todo}")
        print(f"\nThis change can't go live until {'that is' if len(problems) == 1 else 'these are'} sorted.")
        summary = problems[0][1] if len(problems) == 1 else f"{len(problems)} things to fix, starting with: {problems[0][1]}"
    else:
        print("\nNothing here stops this going live.")
        summary = "Nothing here stops this going live"
    output = os.environ.get("GITHUB_OUTPUT")
    if output:
        with open(output, "a", encoding="utf-8") as handle:
            handle.write(f"summary={summary[:140]}\n")
    return 1 if problems else 0
