# YMT ymt.org — Iteration 3: impeccable × ponytail (v2)

Dispatch with `/dev-teams` or `/ponytail` exactly as before, or run `bash tools/dispatch-iteration-3.sh`. Every agent gets everything below the line.
This version replaces `impeccable-iteration-3.md` and `ponytail-comment-system.md`.

---

You are one engineer in a team of Claude agents rebuilding ymt.org for the Youth Ministry Team (YMT), Diocese of Hexham and Newcastle. Every agent receives this same prompt. The iteration-1 protocol governs:
1. Claim a workstream.
2. Post your plan.
3. Build on your own branch.
4. Get a review from a **different** agent.
5. Merge.

The impeccable skill is installed in this repo (`.claude/skills/impeccable`), with its agents and design-check hooks. **Impeccable is the design authority:** every visual change goes through its references and passes `impeccable detect` before review.

**The goal:** a cool, clear experience. That means:
- photos that wake up when you touch them
- a tactile surface
- a kids' page built for kids
- real forms that reach the right people
- a comment system Mary can use without a Claude account

## 0. Ground rules
- **Branches:** cut `review/iteration-3` from `main`. Each workstream branches from it and merges back after peer review. `main` changes only through the §6 deploy step.
- **No build step:** keep the site as plain HTML, CSS and JS. Hosting moves to **Cloudflare Pages**, because forms and comments need Pages Functions. Server code lives in `functions/`, and the database is Cloudflare D1.
- **Deadline:** the client review is **Monday 9 November**. Order of priority:
  1. G, the comment system, so Mary can review before the meeting
  2. B, the forms
  3. C, D and E, the design work
  4. F, content, which runs alongside the others throughout
- **Scripts for Eva:** no command-line arguments; settings go in a config block at the top of each file. In Python, no module docstrings or headers, no one-letter variable names, and no single-use helper functions.
- **Secrets:** API keys and account IDs are never committed. Use `.dev.vars` (git-ignored) locally, and Cloudflare environment variables in production. Until Eva supplies a key, code reads a clearly named `PLACEHOLDER_*` value and degrades gracefully.
- **Refinement, not redesign:** keep the information architecture, the hero (Eva calls it spot on), the `js/data.js` model and the route token system.

## 1. Inspiration: study before designing
The reference is **TinyWins**:
- https://www.tinywins.com/ for the overall feel
- https://www.tinywins.com/approach for the type pairing behind ours
- https://www.tinywins.com/news for the "Latest Wins" stack our Latest panel copies
- their careers page, for the video-call collage scroll our TikTok section copies

Workstream A opens these in a real browser and writes `docs/inspo-tinywins.md`, covering spacing rhythm, type scale, motion staging, and how they use glass and texture. Take principles only, never their assets, copy or brand. Everyone reads that note before starting.

## 2. Visual direction (pinned: the brief wins over detector taste)
- **Fonts:** keep Archivo Black (display), Inter Tight (UI and headlines), Newsreader (reading text) and DM Mono (labels). Eva chose these from TinyWins. Run `/impeccable typeset` to tune the scale only, and waive "overused font" warnings once in the summary.
- **Colours:** keep `body[data-aud]` tokens and fix any pair that fails WCAG AA.
- **Texture:** a fine grain across the site, including the **"Come away feeling…" carousel, which must not stay plain white.** Use one small tiled noise asset or an SVG `feTurbulence` filter, at under 3% visual weight and never over running text. Replace the hero's repeating-gradient "grain", which the detector flags.
- **Glass:** frosted panels for the nav, the Latest panel, the mobile sheet, photo captions, the hero sub-nav and the info cards.
  - Build it from tokens: `--glass-fill`, `--glass-blur`, `--glass-edge`, `--glass-highlight`.
  - Glass sits only over imagery or colour, never glass on glass.
  - Add an `@supports not (backdrop-filter…)` solid fallback.
  - Text on glass must pass AA.
- **Photo treatment (all photographs: galleries, the carousel, story frames, route-hero photos):**
  - *At rest:* greyscale, with **one colour family popping out**. Pick it per photo, and match it to the route accent where the photo allows: the red of a festival wristband, the gold of candlelight, a blue hoodie. Pre-render it with `tools/colour_pop.py` (Python, Pillow plus numpy, with a config block listing each photo and its pop hue range), making HSV masks with feathered edges. Export to `assets/web/pop/<name>.webp`. Don't use CSS filters for the pop.
  - *Clicked or tapped (also Enter or Space):* the photo eases to **full colour** and lifts slightly. Its **edges go soft with blur**: a blurred copy sits behind, and a radial `mask-image` keeps the centre sharp. A second tap, Escape or tapping another photo returns it to rest. Use one shared `js/photos.js`.
  - Photos are buttons, with `aria-pressed` and a visible focus state. Under reduced motion, the change is a crossfade with no lift.
  - The halftone dot art on the route cards stays; Eva asked for it.
- **Kids' route (`primary.html`):** confetti. One orchestrated burst when the hero enters view, and a small one on main buttons. Draw it on canvas with Memphis shapes in the route palette and real physics. Write it as dependency-free `js/confetti.js` under 4KB. It's off under reduced motion and never blocks a tap.
- **Other routes and shared pages:**
  - *Topography:* generative contour lines behind page heroes, like an OS map of the Derwent Valley. Use a seeded noise field and marching squares on canvas, with a faint, slow drift that stops under reduced motion.
  - *Strata:* layered, slightly irregular bands as section transitions, in two or three tints of the route colour.
  - Put both in one `js/terrain.js` with a config per route:
    - `secondary.html`: denser contours
    - `volunteer.html`: deeper strata
    - `everyone.html`, `about.html` and the programme pages: the lightest touch
    - home: faint contours under "Who is it for?" only
- **Detector fixes:**
  - side-tab stripes in `css/site.css`: around line 468, `.tag--volunteer`, and the volunteer `.phero__kicker`
  - the bounce easing around line 484; switch to an ease-out curve

## 3. Constraints (updated by Eva, 2 November)
1. **Forms are now in scope** (see workstream B). Every form goes to a real destination: an inbox, Stripe or JustGiving. None collects more than it needs.
2. **No card data ever touches the site.** Payments go through hosted pages only: Stripe Checkout or Payment Links, and JustGiving.
3. **No YouTube or Vimeo embeds,** because schools block them. Self-hosted video only.
4. **Safeguarding.**
   - No pupil logins. Children never fill in forms; teachers, parents and carers, and adults do. A 16–17-year-old volunteer's form copies in a parent or carer.
   - No full names next to children's faces, and no new identifiable photos without recorded consent.
5. **Content is the client's.** Never invent real-world facts such as events, dates, prices or quotes. Anything written as a stand-in is marked placeholder (see workstream F).
6. **CMS-ready markup:** repeated blocks stay as consistent components.

## 4. Workstreams

### A · Design lead (owns approval of C, D and E)
1. `/impeccable init` writes PRODUCT.md. Use Persuade mode for home and the routes, Read mode for `learn-*`, resources and safeguarding, and Playful-Read for `primary.html`.
2. Write `docs/inspo-tinywins.md`.
3. `/impeccable document` writes DESIGN.md, then update it with the §2 rules.
4. `/impeccable critique` on home and the four routes, and `/impeccable audit` site-wide. Put the ordered fix list in `docs/iteration-3-review.md`.
5. To finish, run the `impeccable-finish-reviewer` agent and `/impeccable polish` on home and the routes.

### B · Forms: bookings, enquiries and payments to the right places
1. **Write the routing table first,** in `docs/forms-routing.md`, and get Eva's OK on it before building.

   | Form | Destination |
   |---|---|
   | School retreat booking (teacher) | bookings@ |
   | Village group stay | bookings@ |
   | Event sign-up (adult, or 16–17 with a carer copied in) | the event's inbox |
   | Volunteering and Internship enquiry | admin@ |
   | Lourdes youth helper | admin@ |
   | General enquiry | admin@ |
   | Safeguarding concern | not a form: show the diocesan safeguarding contact prominently |
   | Donations | JustGiving or Stripe donation link |
   | Event fees and booking deposits, where YMT charges | Stripe Payment Links, one per priced item, held in `config.js` as `PLACEHOLDER_STRIPE_*` |

2. **Build the forms** as accessible HTML with labels, inline validation, error summaries and 44px targets, styled from the design system. They should work without JavaScript, posting normally, and be enhanced when it's available.
3. **The handler:** `functions/api/forms/[form].js` checks:
   - Cloudflare Turnstile (`PLACEHOLDER_TURNSTILE_*`)
   - a honeypot field
   - rate limiting
   - field limits

   It then sends a formatted email through Resend (`PLACEHOLDER_RESEND_KEY`) to the routed inbox, with a `[YMT] <Form> – <name>` subject and the sender as reply-to. It also sends a plain confirmation to the sender. **Store nothing:** form data lives only in the inbox.
4. **Payments:** after a booking form succeeds, show a "Pay deposit" step linking to the item's Stripe Payment Link, with the booking reference passed as `client_reference_id`. Show donations on `donate.html` as hosted JustGiving or Stripe links. No webhooks in this iteration.
5. **Privacy:** add `privacy.html`, covering what's collected, why, where it goes, how long YMT keeps it, and who to contact. Link it under every form. Also write a one-page DPIA note, `docs/forms-dpia.md`, for Eva.
6. **Hand-over:** list the accounts YMT must own (Resend, Stripe, JustGiving, Turnstile) in `docs/forms-setup.md`, with the steps.

### C · Surface system
- glass tokens and texture, including the carousel grain
- `js/terrain.js` and `js/confetti.js`
- the detector fixes
- `/impeccable animate`, then `/impeccable adapt` at 360, 390, 768, 1024 and 1440 px: no horizontal scroll, 44px targets
- Canvases pause off-screen, device pixel ratio is capped at 2, and there are no scroll frame drops on a mid-range phone.

### D · Photos, carousel and TikToks
1. **Better photos.** Gather the best available originals from YMT's own public channels: the ymt.org media library, Instagram, Facebook and TikTok frames.
   - Choose at the highest resolution, and prefer sharp, well-lit, candid frames with movement and light.
   - For children, prefer wide shots, backs, hands and silhouettes.
   - Log every photo's source and consent status in `assets/PHOTOS.md`.
   - If a site blocks downloading, list the posts you want and ask Eva to drop the originals into `assets/incoming/`.
   - Never use stock photos or AI-generated people presented as YMT.
2. **The carousel** ("Come away feeling…"): replace its photos with the best twelve, each matched to its word, and apply the §2 photo treatment and grain.
3. **The TikToks:**
   - Higher-quality clips from YMT's TikTok account, re-encoded H.264 at `-preset veryfast` and 720×1280, at 1.5MB or less each. Use consistent 9:16 crops and hand-picked poster frames.
   - Show a caption overlay with the title and date on glass, and a "watch on TikTok" link out.
   - Clips autoplay muted only while in view, and only one plays at a time. Tap to unmute, with a visible sound toggle.
   - Lazy-load them. Give each a text alternative. Keep the TinyWins collage scroll on desktop and a swipe row on phones.
4. Run `tools/colour_pop.py` over every photo, and tune the pop hue per image.

### E · Kids' page (`primary.html`)
- **Remove the planning information:**
  - "Book a retreat" and its timeline
  - staff and planning downloads such as `staff-briefing`, `prepare-your-class` and `parent-letter`

  Move all of it to a "For teachers" section on `retreats.html`. Primary keeps one small link: "Teachers: plan a visit →".
- **Make it for children aged 4–11:**
  - short words, at a reading age of about 7–9
  - big, friendly type and chunky rounded shapes
  - photos from their visits with first names only
  - "What we talked about" topic cards
  - a "Things to do at home" resources grid
  - confetti
  - tap targets of at least 56px
- **Resources:** colouring sheets, a prayer card to cut out, a word search, a "my retreat" memory page, and a simple Bible-story activity. Workstream F produces them; E designs the grid and cards.
- Get it approved by A, then `/impeccable delight` on this page only.

### F · Content and placeholder materials (two agents: writer and producer)
- **Writer:**
  - Drafts the copy for the kids' page, the teacher section, the forms and confirmation emails, the privacy page and the TikTok captions.
  - Writes in YMT's voice: "we" talking to "you", warm and plain.
  - Scripture comes from public-domain translations only (World English Bible, Douay-Rheims), never NRSV, NIV or other copyrighted text, and no song lyrics.
  - Every invented line goes in `docs/content-draft.md` for Mary's approval.
- **Producer:**
  - Builds the printable PDFs for workstream E's resources and refreshes the teacher packs.
  - Uses Python with reportlab or weasyprint, with a config block and one shared template in the site's fonts and route colours. Produce A4 portrait.
  - Every PDF carries a footer: "Placeholder – for YMT to review."
  - Replace the matching files in `resources/` and update `js/data.js` entries, marking new ones `sample: true`.

### G · Comment system for Mary (no Claude account needed). Start this first.
Mary can't use the claude.ai artifact. Build our own review layer on the Cloudflare staging site, reusable for future client sites.
1. **Access:**
   - Invite links with a per-person token, created by `tools/review_invite.py` (config block: name, email and role, which is client, team or owner). The link sets an HttpOnly cookie.
   - No passwords, and no accounts beyond that.
   - Eva's owner token can resolve threads and delete spam.
   - It's only active on staging hosts (`*.pages.dev`, localhost). Production ymt.org never loads it.
2. **The overlay,** `review/review.js`, replacing the artifact version:
   - a floating glass "Comment" button; tap it, then tap any element
   - a composer pinned beside that element; numbered pins on the page; thread cards with replies; open and resolved filters; a "Comments on this page (n)" drawer
   - It works on phones, is keyboard accessible, and has a reduced-motion mode.
   - Each comment records the page path, a CSS-path anchor and the element's text snippet, the viewport width, the author from the token, the time, its text, and its status.
   - Comment text is untrusted: escape it everywhere, never render HTML, and cap it at 2,000 characters.
3. **The server:**
   - `functions/api/review/*` on D1, with a schema in `review/schema.sql`: threads, comments and reviewers.
   - Endpoints: list (per page), create, reply, resolve (owner only), and export (JSON, for the board).
   - Rate limiting, plus Turnstile on first use.
   - An optional email to Eva when a new thread opens (Resend).
4. **The review board:**
   - `review/board.mjs` (Node and Playwright, config block, no command-line arguments) pulls `/api/review/export`, screenshots each commented page at 1440 px and 390 px, and resolves anchors so pins land exactly.
   - It builds an **animated, Figma-style board:**
     - `review/out/board.html`, a dotted canvas with page frames, glass callouts and numbered pins
     - the camera glides page to page, pins pop in, and text types in
     - pause and step controls, and a static view under reduced motion
   - It also records `board.mp4`: 30–45 s, H.264 `-preset veryfast`.
   - Through Figma MCP (load `/figma-use` before `use_figma`), it creates "YMT review – <date>": one section per page with desktop and mobile frames, pins, sticky-note callouts with connectors, and a to-do cover frame.
   - `review/run.sh` runs all of it.
   - The board and the MP4 are served at `/review/board` on staging behind the owner token, so Eva can forward them.
5. **Closing the loop:** when a fix lands, reply in the thread with one line saying what changed, then resolve it.
6. Remove every claude.ai artifact reference from the repo and the prompts.

## 5. Accounts Eva sets up (agents: ask once, use placeholders meanwhile)
- **Cloudflare:** create a Pages project connected to `Eva-Cameron/youth-ministry-team-demo`, with production branch `main` and preview deployments on, plus a D1 database `ymt-review` bound as `REVIEW_DB`, plus Turnstile keys.
- **Resend:** an API key, and the ymt.org domain verified at launch. On staging, use Resend's test sender.
- **Stripe and JustGiving:** YMT's own accounts, and links from Mary. Until then, everything is a placeholder.

## 6. Deploy: links to send Mary and the team
When B and G are merged into `review/iteration-3` and peer-reviewed, and again when everything is done:
1. Push `review/iteration-3`. The Cloudflare preview URL (`review-iteration-3.<project>.pages.dev`) becomes the review link.
2. When Eva approves, fast-forward `main`: `git merge --ff-only`. Never force-push.
3. GitHub Pages keeps serving `main` as a view-only mirror. Its "Leave feedback" pill now links to the Cloudflare staging URL; set that in `review/review.js` config.
4. Run `python3 tools/review_invite.py` for Mary and each team member, and give Eva the invite links.
5. Every page keeps `noindex` and the review script tag, both marked "staging only: remove at launch".

## 7. Done means
- `impeccable detect` shows zero failures, apart from the font waiver, and the finish reviewer has signed off.
- Every form reaches its destination in a test run, against a test inbox and Stripe test mode.
- Mary can open an invite link on her phone, comment on an element, and see her pin.
- `review/run.sh` produces the board, the MP4 and the Figma file from real comments.
- All pages are checked at mobile and desktop widths, in reduced-motion mode, and with glass fallbacks. No broken links.
- Eva gets a summary: the links, what changed, the commits, anything waived, and the open questions (charity number, giving and Stripe links, destination inboxes, which `sample: true` items are real, photo consent).
