# YMT ymt.org — Iteration 3: impeccable pass

Paste everything below the line into Claude Code, opened at the root of
`Eva-Cameron/youth-ministry-team-demo` with the `review/iteration-2` branch checked out.
Fill in the three **DECIDE** lines first.

---

You are refining the Youth Ministry Team (YMT) website for the Diocese of Hexham and Newcastle. The impeccable skill is installed in this repo (`.claude/skills/impeccable`), with its agents and design-check hooks. Use it for every design step below. This is a **refinement, not a redesign**: keep the information architecture, the content, the copy and the behaviour that already work, and change what the brief and the review below say to change.

## 0. Before you start

- Cut a branch `review/iteration-3` from `review/iteration-2`. Commit in small, labelled steps and push the branch when each phase is done. Never touch `main`.
- The site is plain HTML, CSS and JS with no build step. Keep it that way. It will be hosted on Cloudflare Pages, with video on Cloudflare R2.
- Hard deadline: the client review is **Monday 9 November**. Phases 1 to 3 must be finished for it. Phase 4 is a bonus.
- **DECIDE (fonts):** `agreed` = Space Grotesk (display), Satoshi (body), Space Mono (labels), as signed off with the client; or `current` = keep Archivo Black, Inter Tight and DM Mono. Default: `agreed`.
- **DECIDE (route colours):** `agreed` = the palette in §2; or `current` = keep what's in `css/site.css`. Default: `agreed`.
- **DECIDE (detector font warnings):** impeccable's detector flags Inter and Space Grotesk as overused. The brief wins: if fonts are pinned above, ignore those warnings and say so once in the summary.

## 1. What already exists (do not rebuild)

The current build lives on `review/iteration-2`. It was built route-first, then styled:

- **Home (`index.html`)** is the general front door: a full-bleed hero video with the YMT wordmark, the ethos (the road to Emmaus, with four pillars: Encounter, Belong, Grow, Serve), a "come away feeling…" photo strip, the story since 1994, the "Who is it for?" picker into the four routes, and info cards (find us, contact, safeguarding).
- **Four audience routes**, each set by `body[data-aud]`, which switches the accent tokens:
  - `primary.html` for ages 4–11: Behold Year 6 Festival, photos, downloads, book a retreat.
  - `secondary.html` for ages 11–18: Behold Secondary, photos, events timeline, downloads.
  - `volunteer.html` for 16+: festival crew, Lourdes, retreat teams, the Internship.
  - `everyone.html` for parishes, families and groups: Significance, Village stays, downloads.
- **Shared pages:** about, resources, enquire, donate, safeguarding, internship, festival, lourdes, retreats, the-source, youth-council, youth-village, four `learn-*` explainers, and 404.
- **Data-driven parts:** `js/data.js` holds every event and download once. The Latest panel, per-route timelines (`data-timeline="aud:…"`) and download grids (`data-resources="aud:…"`) all render from it. Entries marked `sample: true` are still unconfirmed by the client.
- **Settings:** `js/config.js` holds the enquiry and bookings addresses.
- **Media:** self-hosted WebP images in `assets/web`, self-hosted MP4 clips, and resource PDFs in `resources/`.

## 2. The brief (pinned: honour it even against detector taste)

**Audience and tone.** Young people, their teachers, parents and parishes in a Catholic diocese. Warm, honest, joyful and rooted. Never corporate, never preachy. The voice is "we" (the team) talking to "you".

**Route colours** (when DECIDE = `agreed`):

| Route | Colours |
|---|---|
| Primary | magenta, with light orange and light blue (bright and daytime) |
| Secondary | dark grey, with a deep neon blue and red (stage lights) |
| 16+ and volunteers | purple and dark grey |
| Everyone else / general | black, white and green (the clean, trustworthy front door) |

Sample exact shades from the real YMT photos in `assets/web` (worship nights, retreat rooms) rather than inventing them. Every text and background pair must pass WCAG AA.

**Non-negotiable constraints:**
1. **No web forms.** Bookings and enquiries are email only. Replace the form in `enquire.html` with clear routed `mailto:` links. Pre-fill the subject line (keep the `[YMT] …` subject logic as link-building), and give one link per need: retreat booking, Village stay, event, volunteering, other. Remove the 16+ "send me the details" form on `secondary.html` and replace it with a mailto link. Remove `formEndpoint` from `config.js`. Don't collect anyone's details on the site.
2. **No payments on the site.** Remove the `stripePaymentLink` and `bank` settings, and any card or bank-transfer panels in `donate.html`. Giving links out to an external fundraising page; put the URL in `config.js` as a loud `PLACEHOLDER_GIVING_URL`.
3. **No YouTube or Vimeo embeds.** Schools block them. All video stays self-hosted. A plain link to YMT's YouTube channel in the footer is fine.
4. **Safeguarding.** No logins of any kind. No child's full name next to their face; use first names or nothing in captions. Don't add new photos of identifiable young people. Keep the existing safeguarding page and its links.
5. **Content is the client's.** Don't invent events, dates, quotes or claims. Keep `sample: true` data marked, and flag new copy you write as draft in the summary.
6. **CMS-ready markup.** Phase 2 adds editable templates with text and image slots. Keep repeated blocks (cards, shots, timeline items, downloads) as clean, consistent components so they can become slots later. Don't hand-tune one-off markup.

## 3. Phases

### Phase 1: context (no UI edits yet)
1. Run `/impeccable init`. Answer the interview from §1 and §2 rather than asking Eva anything that's written here; only ask what's genuinely missing. It writes `PRODUCT.md`. The mode is **Persuade** for home and the route pages, and **Read** for the `learn-*`, safeguarding and resources pages.
2. Run `/impeccable document` to write `DESIGN.md` from the shipped code. Then update it to the DECIDE choices (fonts, route colours), so the doc describes the target, not the drift.
3. Commit: `docs: PRODUCT.md and DESIGN.md for iteration 3`.

### Phase 2: review
1. Run `/impeccable critique` on `index.html` and on each of the four route pages, and `/impeccable audit` across the site (accessibility, performance, responsive, anti-patterns).
2. Run `.claude/skills/impeccable/scripts/impeccable detect` on every `*.html` and `css/*.css`. Known findings from a first run to fold in:
   - one-sided "side-tab" stripes in `css/site.css`: line ~468 (`border-left`), `.tag--volunteer` (inset stripe) and the volunteer `.phero__kicker`
   - bounce easing at line ~484 (`cubic-bezier(.3, 1.5, .5, 1)`); switch to an ease-out curve
   - repeating-gradient stripe decoration on the home hero grain
   - overused fonts: these resolve through the font DECIDE line
3. Merge everything into one ordered fix list in `docs/iteration-3-review.md`: scope breaches first (§2 constraints), then accessibility, then visual quality. Commit it before fixing anything.

### Phase 3: fix (must be done by 9 November)
Work down the list in this order, one commit per item:
1. **Scope:** constraints 1–3 above (forms out, payments out, config cleaned).
2. **Typography:** `/impeccable typeset`, applying the font choice site-wide. Self-host the woff2 files in `assets/fonts`, subset them, preload only the two critical faces, and delete unused faces.
3. **Colour:** `/impeccable colorize` on the four routes, applying the route palettes through the existing `body[data-aud]` tokens, not per-page overrides. Check AA contrast for every pair.
4. **Detector findings** from Phase 2.
5. **Responsive:** `/impeccable adapt`. Check at 360, 390, 768, 1024 and 1440 px, with no horizontal scroll and tap targets of at least 44px. Check the nav sheet, the Latest panel and the "Who is it for?" stack.
6. **Polish:** `/impeccable polish` on home and the four routes.

### Phase 4: bonus, only if Phase 3 is done
- `/impeccable delight` on the home "feel" strip and the route heroes. Keep it in the brief's world (warmth, light, community), and respect `prefers-reduced-motion`.
- `/impeccable optimize`: hero video weight, image `srcset`, lazy loading.

## 4. Verify before calling it done
- Serve the site (`npx serve .`) and look at every page at mobile and desktop widths. Fix what one look shows before looking again.
- Re-run `impeccable detect`. It should report zero failures, apart from any font warning waived by the DECIDE line.
- Run a link check: no broken local `href`/`src` (template strings in `js/site.js` excepted).
- Confirm with grep that there is no `<form`, no `stripe`, no `youtube.com/embed` and no `formEndpoint` left in the site.
- Finish with a short summary for Eva: what changed, the commits, anything waived and why, and the client questions still open (charity number, giving URL, which `sample: true` events are real, photo consent).
