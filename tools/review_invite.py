# Make an invite link for one reviewer. Edit the settings, then run: python3 tools/review_invite.py
# The link sets a private cookie in their browser; no password or account is needed.

# ---- Settings -------------------------------------------------------------
NAME = "Mary"
EMAIL = "mary@example.org"
ROLE = "client"  # client, team or owner (owner can resolve threads and delete spam)
BASE_URL = "http://127.0.0.1:8790"  # the staging site (local: wrangler pages dev . --port 8790), e.g. https://review-iteration-3.<project>.pages.dev
DATABASE = "ymt-review"
WHERE = "local"  # local (wrangler pages dev) or remote (the Cloudflare D1 database)
WRANGLER = ["npx", "--yes", "wrangler@3.99.0"]
# ---------------------------------------------------------------------------

import hashlib
import pathlib
import secrets
import subprocess
import sys

if ROLE not in ("client", "team", "owner"):
    sys.exit(f"ROLE must be client, team or owner, not {ROLE!r}")

repo = pathlib.Path(__file__).resolve().parent.parent
flag = "--local" if WHERE == "local" else "--remote"
token = secrets.token_urlsafe(32)
token_hash = hashlib.sha256(token.encode()).hexdigest()

schema_lines = (repo / "review" / "schema.sql").read_text().splitlines()
schema = " ".join(line for line in schema_lines if line.strip() and not line.lstrip().startswith("--"))
subprocess.run([*WRANGLER, "d1", "execute", DATABASE, flag, "--command", schema], cwd=repo, check=True, capture_output=True)
name_sql = NAME.replace("'", "''")
email_sql = EMAIL.replace("'", "''")
insert = f"INSERT INTO reviewers (name, email, role, token_hash) VALUES ('{name_sql}', '{email_sql}', '{ROLE}', '{token_hash}');"
subprocess.run([*WRANGLER, "d1", "execute", DATABASE, flag, "--command", insert], cwd=repo, check=True, capture_output=True)

print(f"Invite for {NAME} ({ROLE}):")
print(f"{BASE_URL.rstrip('/')}/review/invite/{token}")
print("Send it privately. Anyone with the link comments as this person.")
