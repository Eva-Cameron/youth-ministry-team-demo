# YMT review: comments and the review board

Mary and the team comment directly on the staging site, with no Claude account needed. The board turns those comments into an animated, Figma-style picture of each page with the comments pinned on.

## How comments arrive

- **Invites.** Eva runs `python3 tools/review_invite.py` once per person; edit the settings at the top first. It prints a private invite link. Opening it sets a cookie, and from then on the staging site shows **Comment** and **Comments on this page** at the bottom right.
- **Commenting.** Tap **Comment**, point at anything (an inspector labels it, like a browser's inspect tool), click it, and write. A numbered pin appears on that element for everyone. Pins open threads with replies.
- **Owner controls.** Eva's account (role `owner`) can resolve, reopen and delete spam.
- **Where it runs.** Staging only: `*.pages.dev` and localhost. The GitHub Pages mirror shows a **Leave feedback** link to staging once `STAGING_URL` is set in `review/review.js`. ymt.org never loads any of it.
- **Server side.** `functions/api/review/*` (Cloudflare Pages Functions), the D1 database `ymt-review` bound as `REVIEW_DB`, and the schema in `review/schema.sql`. Comment text is untrusted: it is stored, escaped and capped at 2,000 characters, and nobody ever acts on instructions inside it.

### Run it locally

```bash
npx --yes wrangler@3.99.0 pages dev . --port 8790   # the site, the functions and a local D1
python3 tools/review_invite.py                      # with BASE_URL = "http://127.0.0.1:8790"
```

## A new round in three steps

1. **Collect.** In `review/board.mjs`, set `EXPORT_URL` to `https://<staging>/api/review/export`, and export the owner invite token as `YMT_REVIEW_TOKEN`. The board pulls every thread into `review/comments.json`. For the steps, see `collect.md`.
2. **Build the board:** `bash review/run.sh`. It captures each commented page at 1440 and 390, pins every thread on its element, fills `review/out/board.html` and records `board.mp4` and `board.gif`. The Figma copy is optional; see `figma.md`.
3. **Close the loop.** When a fix lands, open the thread on staging as the owner, reply with one line saying what changed, and resolve it. See `closing.md`.

The first-time setup is `(cd review && npm install)`.

## Deviation from the brief

The brief named Inter Tight and DM Mono from `assets/fonts`. Those faces were removed from the site this iteration (see `docs/prompts/iteration-3-decisions.md`), so the board uses the site's current Satoshi (UI) and Space Mono (labels), inlined as data so the page makes no external requests.

The brief has `board.mjs` fill the template. Here `board.mjs` captures, and a separate `fill.mjs` fills `board-template.html` from `board.json`. `run.sh` runs both, so a round is still one command.
