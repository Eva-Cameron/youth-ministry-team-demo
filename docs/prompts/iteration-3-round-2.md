# YMT ymt.org — Iteration 3, round 2

Run it with `bash tools/dispatch-iteration-3.sh`, or paste everything below the line into the lead session on `review/iteration-3`.
**Read `docs/prompts/iteration-3-decisions.md` first.** Its "Round 2" section (2 November, afternoon) is Eva's latest word and overrides anything older, including parts of `iteration-3-team.md`.

---

You are the lead of a team of Claude agents continuing iteration 3 of ymt.org for the Youth Ministry Team (YMT), Diocese of Hexham and Newcastle. `/dev-teams` and `/ponytail` aren't available in this environment. So **you split the work below into subagents**, each on its own branch cut from the current head of `review/iteration-3` (don't recut it). A **different** agent reviews each branch before it merges back.

The impeccable skill (`.claude/skills/impeccable`) is the design authority. Every visual change goes through its references and passes `impeccable detect` before review. Use the `impeccable-finish-reviewer` agent at the end.

**What's already done on the branch (keep it, build on it):**
- PRODUCT.md and DESIGN.md
- the TinyWins notes (`docs/inspo-tinywins.md`)
- the critique and audit (`docs/iteration-3-review.md`)
- the Syne, Satoshi and Space Mono type
- the photo-tuned route palette
- the textured, accent-lit page ground and the static contour SVG
- softer shapes
- better photos from YMT's socials (`docs/photo-shortlist.md`)
- the gift picker on donate
- the review board in `review/`: capture, fill, record and `run.sh`

## Ground rules
- **No build step:** keep the site as plain HTML, CSS and JS. Server code goes in `functions/` (Cloudflare Pages Functions), with Cloudflare D1 for storage.
- **Scripts for Eva:** no command-line arguments, so settings live in a config block at the top. In Python, no module docstrings or headers, no one-letter variable names, and no single-use helper functions.
- **Secrets are never committed.** Use `.dev.vars` (git-ignored) locally and Cloudflare environment variables in production. Until Eva supplies a key, use a named `PLACEHOLDER_*` value that degrades gracefully.
- **Never invent real-world facts** such as events, dates, prices or quotes. Mark stand-in copy and materials as placeholders.
- **Safeguarding:**
  - no pupil logins
  - children never fill in forms
  - first names only next to children's faces
  - every photo's source and consent logged in `assets/PHOTOS.md`
- **Deadline:** the client review is Monday 9 November. Order of work:
  1. **G**, the comment system, because Mary needs it before the meeting
  2. **B**, forms
  3. **D** and **E**, photos, TikToks and the kids' page
  4. **F**, content, which runs alongside the others throughout

## Workstreams

### G · Comment system without Claude (start first)
Mary can't open Eva's claude.ai artifacts, so comments move onto our own staging site.
- **Access:** invite links with a per-person token, created by `tools/review_invite.py` (config block: name, email, and role, which is client, team or owner). The link sets an HttpOnly cookie. No passwords. Eva's owner token can resolve threads and remove spam.
- **Overlay:** rewrite `review/review.js` to talk to our API. Keep today's look: the glass Comment button, then tap an element. Add:
  - a composer pinned beside the element
  - numbered pins on the page
  - thread cards with replies
  - a "Comments on this page (n)" drawer with open and resolved filters
  - phone and keyboard support, and reduced motion
- **What gets stored:** each comment records the page path, a CSS-path anchor and the element's text snippet, the viewport width, the author (from the token), the time, the text and the status. Comment text is untrusted: escape it, never render HTML, and cap it at 2,000 characters.
- **Server:** `functions/api/review/*` on D1, with the schema in `review/schema.sql`. Endpoints: list by page, create, reply, resolve (owner only), and export (JSON). Add rate limiting, Turnstile on first use, and an optional email to Eva when a new thread opens (Resend).
- **Where it runs:** staging hosts only (`*.pages.dev`, localhost). It never loads on ymt.org. On the GitHub Pages mirror, the button links to the Cloudflare staging URL; set it in the config block.
- **Board:** `review/run.sh` now reads `/api/review/export` instead of the artifact. Rewrite `collect.md` to match. Keep the capture, fill and record steps.
  - Serve the board and MP4 at `/review/board` on staging, behind the owner token, instead of publishing an artifact.
  - The Figma copy stays optional (`review/figma.md`).
- **Clean-up:** remove every claude.ai artifact URL from the repo: `review/review.js`, `collect.md`, `run.sh`, the README, `closing.md` and `out/*-link.txt`.

### B · Forms: bookings, enquiries and payments to the right places
This replaces the email-links-only approach the team built earlier.
1. **Routing table first.** Write `docs/forms-routing.md` and get Eva's OK before building.

   | Form | Destination |
   |---|---|
   | School retreat booking (teacher) | bookings@ |
   | Village group stay | bookings@ |
   | Event sign-up (an adult, or a 16–17-year-old with a parent or carer copied in) | the event's inbox |
   | Volunteering and Internship | admin@ |
   | Lourdes youth helper | admin@ |
   | General enquiry | admin@ |
   | Safeguarding concern | no form: show the diocesan safeguarding contact prominently |
   | Donations | the existing gift picker, then hosted JustGiving or a Stripe donation link |
   | Event fees and booking deposits, where YMT charges | Stripe Payment Links, one per priced item, as `PLACEHOLDER_STRIPE_*` in `config.js` |

2. **The forms:** accessible HTML with labels, inline validation, an error summary and 44px targets, in the design system. Each must work without JavaScript and be enhanced when it's available. Keep the selectable email addresses and copy buttons as a fallback under each form.
3. **The handler,** `functions/api/forms/[form].js`:
   - checks Turnstile, a honeypot, a rate limit and field limits
   - sends a formatted email through Resend to the routed inbox, with the subject `[YMT] <Form> – <name>` and the sender as reply-to
   - sends the sender a plain confirmation
   - **stores nothing**
4. **Payments:** after a booking succeeds, show a "Pay deposit" step that links to the item's Stripe Payment Link, with the booking reference as `client_reference_id`. Card data never touches the site, and there are no webhooks this round.
5. **Documents:**
   - `privacy.html`, linked under every form
   - `docs/forms-dpia.md`, a one-page DPIA note for Eva
   - `docs/forms-setup.md`, the accounts YMT must own (Resend, Stripe, JustGiving, Turnstile) and the steps to set them up

### D · Photos, carousel and TikToks
- **The photo treatment, which replaces the route duotone on photographs:**
  - **At rest:** greyscale, with one colour family popping out. Pick it per photo, and match it to the route accent where the photo allows: a red wristband, candle gold, a blue hoodie.
    - Pre-render the pops with `tools/colour_pop.py`: Python with Pillow and numpy, a config block listing each photo and its hue range, and feathered HSV masks.
    - Output goes to `assets/web/pop/<name>.webp`. Don't use CSS filters for the pop.
  - **When clicked or tapped,** or on Enter or Space:
    - The photo eases to **full colour** and lifts slightly.
    - Its edges go soft with blur: a blurred copy behind it, and a radial `mask-image` that keeps the centre sharp.
    - A second tap, Escape, or tapping another photo puts it back.
  - **Implementation:** one shared `js/photos.js`. Photos act as buttons with `aria-pressed` and a visible focus ring. Under reduced motion, the change is a crossfade with no lift.
  - **Scope:** galleries, the carousel, story frames and route-hero photos.
- **The "Come away feeling…" carousel** must not be plain white. Give it the site grain at under 3% visual weight, never over running text. Refresh its twelve photos from `docs/photo-shortlist.md`, choosing the best match for each word.
- **Better photos:** go further through YMT's own channels: the ymt.org media library, Instagram, Facebook and TikTok frames.
  - Take the highest resolution available. Choose sharp, well-lit, candid frames. For children, prefer wide shots, backs, hands and silhouettes.
  - If a site blocks downloading, list the posts you want and ask Eva to drop the originals into `assets/incoming/`.
  - No stock photos, and no AI-generated people presented as YMT.
- **Better TikToks:**
  - Use the best clips from YMT's TikTok, re-encoded as H.264 with `-preset veryfast` at 720×1280, 1.5MB or less each.
  - Use consistent 9:16 crops and hand-picked poster frames.
  - Show the title and date on a glass caption, with a "watch on TikTok" link out.
  - Clips autoplay muted only while in view, and only one plays at a time. Tap to unmute, with a visible sound toggle.
  - Lazy-load the clips and give each a text alternative.
  - Keep the collage scroll on desktop and the swipe row on phones.

### E · Kids' page (`primary.html`)
- **Remove the planning information:**
  - "Book a retreat" and its timeline
  - the staff and planning downloads (`staff-briefing`, `prepare-your-class`, `parent-letter`)

  Move all of it to a "For teachers" section on `retreats.html`, which is also where the teacher booking form lives. Leave one small link on Primary: "Teachers: plan a visit →".
- **Make it slightly more child-friendly** for ages 4–11:
  - short words, at a reading age of about 7–9
  - big, friendly Syne headings and rounded shapes
  - photos from their visits, with first names only
  - "What we talked about" topic cards
  - a "Things to do at home" grid
  - confetti: dependency-free `js/confetti.js` under 4KB, in Memphis shapes and the route palette, with one burst when the hero enters view, off under reduced motion, and never blocking a tap
  - tap targets of at least 56px
- **Resources** (made by F, designed here): colouring sheets, a prayer card to cut out, a word search, a "my retreat" memory page, and a Bible-story activity.
- Once the design lead approves, run `/impeccable delight` on this page only.

### F · Content and placeholder materials (split into two subagents)
- **Writer:**
  - Drafts the copy for the kids' page, the teacher section, the forms and confirmation emails, `privacy.html`, and the TikTok captions.
  - Writes in YMT's voice: "we" talking to "you", warm and plain.
  - Uses scripture from public-domain translations only (World English Bible, Douay-Rheims). No NRSV, no NIV, and no song lyrics.
  - Logs every invented line in `docs/content-draft.md` for Mary to approve.
- **Producer:**
  - Builds the printable PDFs for E's resources, and refreshes the teacher packs. Use Python with reportlab or weasyprint, a config block, and one shared A4 template in the site's fonts and route colours.
  - Every PDF has the footer "Placeholder – for YMT to review."
  - Replaces the matching files in `resources/`, and adds new `js/data.js` entries marked `sample: true`.

## Accounts Eva sets up (ask once; use placeholders until then)
- **Cloudflare:**
  - a Pages project connected to `Eva-Cameron/youth-ministry-team-demo`, with production branch `main` and preview deployments on
  - a D1 database `ymt-review`, bound as `REVIEW_DB`
  - Turnstile keys
- **Resend:** an API key. On staging, use the test sender; verify the ymt.org domain at launch.
- **Stripe and JustGiving:** YMT's own accounts, and the links from Mary.

## Deploy: links to send Mary and the team
1. Push `review/iteration-3` after G and B merge. Its Cloudflare preview URL, `review-iteration-3.<project>.pages.dev`, is the review link.
2. Run `python3 tools/review_invite.py` for Mary and each team member, and give Eva the invite links.
3. When Eva approves, merge `review/iteration-3` into `main` and push. GitHub Pages keeps serving `main` as a view-only mirror. Never force-push.
4. Every page keeps its `noindex` tag and the review script tag, both marked "staging only: remove at launch".

## Done means
- Mary can open her invite link on a phone, comment on an element, and see her pin.
- `review/run.sh` builds the board and MP4 from real comments via the API.
- Every form reaches its destination in a test run: a test inbox, and Stripe in test mode.
- `impeccable detect` is clean, the finish reviewer has signed off, and there are no broken links.
- Everything has been checked at 360, 390, 768, 1024 and 1440 px, with reduced motion, and with the glass fallbacks.
- Eva gets a summary covering:
  - the links
  - what changed, with the commits
  - anything waived
  - the open questions: charity number, giving and Stripe links, which inbox each form goes to, which `sample: true` items are real, and photo consent
