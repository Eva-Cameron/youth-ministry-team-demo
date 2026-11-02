# Iteration 3 review: ordered fix list

Branch `review/iteration-3`, 2 November 2026. This list merges:

- the design critiques of `index.html` and the four route pages;
- the detector run with in-browser evidence (`impeccable detect` over every `*.html` and `css/*.css`, plus the overlay on home and the routes);
- the site-wide technical audit (12/20, "Acceptable": 0 P0, 9 P1, 13 P2, 7 P3; 1,021 local references checked, 0 broken).

**Decisions applied:**

- Fonts are the agreed set: Space Grotesk, Satoshi and Space Mono.
- Route colours stay as shipped in iteration 2.
- The detector's overused-font warnings are waived because the fonts are pinned by the client.

Fixes run top to bottom, one commit per item. Items marked **(recommend)** change the page structure or the client's content, so they wait for a yes from the client.

## Scores at the start

| Page | Heuristics |
|---|---|
| Home | 22 / 32 |
| Everyone else | 20 / 32 |
| Primary | 19 / 32 |
| Secondary | 18 / 32 |
| 16+ and volunteers | 17 / 32 |

Heuristics 7 (flexibility) and 10 (help) are n/a on these Persuade pages, so each page is scored out of 32.

---

## 1. Scope breaches (brief §2 constraints)

1. **Remove the enquiry form** in `enquire.html`. Replace it with one routed `mailto:` link per need: retreat booking, Village stay, event, volunteering, other. Each link has a pre-filled `[YMT] …` subject, and bookings go to `bookings@` with `admin@` copied. The existing `?topic=` deep links keep working by highlighting the matching link.
2. **Remove the 16+ "send me the details" form** on `secondary.html`. Replace it with a mailto (subject `[YMT] Event details`). Remove the "a parent or carer will be copied in" promise, because a mailto can't keep it.
3. **Remove the volunteer sign-up form** on `volunteer.html`. Each role row gets its own mailto (`[YMT] Volunteering · <role>`), and the under-18 and safeguarding rules move into visible text.
4. **Remove card payments and the bank panel** from `donate.html`. "Give" links out to `PLACEHOLDER_GIVING_URL`. The reference, Gift Aid and amount logic goes too. The Gift Aid line stays as client copy.
5. **Clean up `js/config.js`:**
   - Remove `formEndpoint`, `stripePaymentLink` and `bank`.
   - Add `givingUrl: 'PLACEHOLDER_GIVING_URL'`.
   - Remove the matching code paths and the now-unused form CSS from `js/site.js`.
6. **Point every call to action at email, not the form page.** "Booking enquiry", "Enquire for your school", "Request places", "Reserve a place" and "Register interest" currently go to `enquire.html`. Each becomes a direct mailto with the right subject (see 1.1). The home Contact card stops promising "the form".
7. **Mark unconfirmed events.** Entries with `sample: true` render a "Date to be confirmed" chip in the Latest panel, the timelines and the route heroes. Today five of the eight Latest cards are samples with no marker.

## 2. Accessibility

1. **Fix the volunteer accent pair.** White on Purple Text (#b77ad1) is 3.13:1 and fails AA. Set `--acc-ink: var(--ink)` on `body[data-aud="volunteer"]`, which gives 6.19:1. The purple stays.
2. **Fix the TikTok captions** (`.phone__cap`). They are 1.0–1.35:1 over bright frames. Add a solid dark backing.
3. **Fix the volunteer "Most recent" kicker** over the photo hero, about 2.4–3.2:1. Give it a solid fill and drop the stripe (see 4.1).
4. **Make every tap target at least 44px:**
   - home hero sub-links: 10.4px text, 16px tall;
   - `.bite__dl`: 42px;
   - footer links: 19px;
   - nav brand: 34px;
   - `.latest__close`: 40px.
5. **Show the current route in the nav.** Style `.nav__drop:has([aria-current])`, and add `aria-current` to the links in the mobile sheet.
6. **Add Safeguarding to the mobile menu sheet.** Parents can't reach it from the menu today.
7. **Fix the Latest cards' audience tags.** They show only the first audience (`aud[0]`), so Lent retreats reads as Primary only. Show every audience.
8. **Fix timeline "Details" buttons that go nowhere.** When an event has no link, the button points at `#`. Fall back to the route page or drop the button.
9. **Trap focus in the Latest dialog.** The close button sits outside `role=dialog`, the first Tab lands behind the veil, and `main` isn't inert. Move the close button inside the panel and make the rest of the page `inert` while the dialog is open.
10. **Trap focus in the mobile nav sheet** the same way. After the last link, Tab currently goes into hidden page content.
11. **Let visitors pause the home hero film** (WCAG 2.2.2). It autoplays a 37 s loop with no controls, and `home.js` restarts it within 800 ms of any pause. Add a visible pause/play button and stop the forced replay.
12. **Add one "Pause clips" toggle for the TikTok clips** on `volunteer.html` (WCAG 2.2.2).
13. **Make the focus ring visible on light surfaces.** The 3px white ring is 1.47:1 on Blossom Pink, 1.31:1 on Mint and about 1:1 on white cards. Add an ink outer ring.
14. **Fix the other failing text pairs:**
    - the feel-strip caption word: 3.63:1;
    - the globe tally number: 4.41:1;
    - the Latest panel's "Coming up" heading over the page: down to 2.94:1;
    - the home hero sub-links: down to 1.98:1;
    - the outlined "Most recent" kicker: 3.89:1.
15. **Return focus properly when Escape closes a menu.** Today focus goes to a nav button that is hidden off-screen. Bring the nav back first.
16. **Close the dropdown when focus leaves it.**
17. **Fix poster alt text.** Hero posters that carry dates and text have `alt=""`. On `festival.html`, two posters are both `alt="Behold"`.
18. **Remove `aria-label` from elements that have no role** (`div.hero__subnav`, `.filters`), or give them a role.
19. **Make the remaining tap targets at least 44px:** the burger (40px wide at 520px and below), the resource filters (40px), the globe chips (38px) and the learn-page aside links (19px).

## 3. Typography (`/impeccable typeset`)

1. Swap Archivo Black, Inter Tight, Newsreader, Instrument Serif and DM Mono for Space Grotesk, Satoshi and Space Mono, everywhere.
2. Self-host the new faces in `assets/fonts`:
   - Space Grotesk (variable) and Space Mono (400 and 700) are subset to Latin, at 14–20 KB each.
   - Satoshi ships as the official, unmodified variable woff2, because its licence (ITF FFL §05) forbids derivative fonts.
3. Preload only the display face and the body face. Delete the five old faces.
4. Re-tune tracking and line height for Space Grotesk. The -0.06em that suited Archivo Black is too tight; DESIGN.md sets the floor at -0.045em.
5. Balance the stragglers and uneven headings the overlay found on home and the routes.

## 4. Detector findings

1. **Remove the one-sided stripes:**
   - `.prose blockquote` border-left (site.css:468);
   - `.tag--volunteer` inset stripe (site.css:224);
   - volunteer `.phero__kicker` (site.css:262);
   - the home volunteer card `::before` bar (home.css:106);
   - `.globe-sec__chips` selected state (site.css:406).

   Use full fills or hairlines instead. The detector misses stripes drawn with box-shadow or a pseudo-element, so these were confirmed in the browser.
2. **Replace the bounce easing** with ease-out:
   - `data-feel="joy"` pop (site.css:484);
   - the gentle and joy moods (home.css:24, 26);
   - the endless `f-bob` on the primary card art (home.css:103).
3. **Remove the repeating-gradient grain** on the home hero (hero.css:49).
4. **False positives, leaving as is:**
   - *flat-type-hierarchy:* the h1 renders at 97–146px. The CLI doesn't resolve `clamp()`.
   - *cramped-padding:* on `.phero`, the ethos `li` and `.feel__stick`.
   - *buried-raster:* the story frames are an intended crossfade.
   - *tight-leading:* the flagged attribution is a single line.
   - *design-system-color:* the black behind the video.

## 5. Responsive (`/impeccable adapt`)

1. Check at 360, 390, 768, 1024 and 1440px: there must be no horizontal scroll at any width. The 360 and 1024 detector runs found none.
2. Check the nav sheet, the Latest panel and the "Who is it for?" stack at each width.
3. On phones, the home story text scrolls under a sticky photo 44% of the screen tall. Below 900px, make the photo static.

## 6. Visual quality and polish (`/impeccable polish`)

1. **Route heroes go stale.** All four heroes are hand-typed and show past events; Primary still says "BOOKING IS OPEN" for June. Drive each hero from `js/data.js` so it shows the next event for that audience, or a standing fallback for the route. This also makes the hero a single CMS slot.
2. **Give the volunteer page dates.** It has none today. Add the existing timeline component (`data-timeline="aud:volunteer"`) after the roles.
3. **Give the home hero a sentence.** Add the client's existing one-line description (from the page's meta description), and point "Explore" at `#ways-in` rather than the ethos.
4. **Tidy repeated markup before it becomes CMS slots:**
   - section numbers that jump 02 → 04 on the volunteer page;
   - the volunteer-only CSS override;
   - per-page captions;
   - the positional `phone--1…6` classes, which are noted but left alone.
5. **Fix the date format** "1 DEC TUE – 18 DEC" (site.js:149) so it reads in one order.

## 6b. Performance (`/impeccable optimize`, Phase 4 bonus unless noted)

1. **Stop the hero film loading before anyone asks for it** (Phase 3). It is 1.69 MB with `preload="auto"` on every device, including under reduced motion. Change it to `preload="metadata"` and skip it entirely under reduced motion.
2. **Make the hero video lighter.** Use a shorter loop, separate mobile and desktop sources, and add a WebM/AV1 version. At 1440 the 854×480 video is upscaled 1.7×.
3. **Add `srcset`/`sizes` to all 110 images**, using the existing `-800`/`-1600` pairs. Add `width`/`height` to the 76 images that lack them.
4. **Load only the visible story frame up front.** The other three load on scroll.
5. **Note the intro card's cost.** It covers the home page for about 2 s on every visit, which belongs with the client recommendations in section 7.

## 7. Recommendations for the client (not changing without a yes)

- **Home:**
  - Move "Who is it for?" higher. It starts about 8 screens down a 13-screen page.
  - Cut the "Come away feeling" strip to 6–8 photos and about 200vh.
  - Swap out its weak frames: the empty room labelled "heard", and a screenshot with text burned in.
- **Primary:** move "Book a retreat" above the eight download cards. It is about 5,000px down on a phone.
- **Secondary:** split the timeline into "For you" and "With your school", using the existing `who` and `how` fields, so a 15-year-old finds The Source.
- **Captions:** the same photo is captioned differently on different routes (for example "Workshops" and "Significance June 2026"). The client should confirm each one.
- **Downloads:** 7 of Secondary's 9 downloads repeat Primary's, and the Primary set uses secondary-school words ("form time", "chaplaincy").
- **Volunteers:** shorten the 200vh TikTok stage on desktop. Volunteering's purple is used very little; the client could consider a stronger purple presence within the current palette.
- **Everyone else:** lead with Village stays rather than the festival, and lay out the Village facts with the existing `.facts` component.
- **Intro card:** show it once per visit, or remove it. It delays every home visit by about 2 s.
- **Endings and reassurance:** end each route with a closing email action, and put the client's "trained, DBS-checked" line near the decision points, not only in the footer.

## Status after Phase 3 (2 November 2026)

**Done:** sections 1–6, except the Phase 4 performance items in 6b and the recommendations in section 7.

| Commit | What |
|---|---|
| `efc49b8` | Scope: email links instead of forms, no payments, config cleaned, unconfirmed events marked |
| `79b61df` | Accessibility: focus traps in Latest and the menu, current route marked, Safeguarding in the menu, poster alt text |
| `347d4ce` | Accessibility: pause controls for the hero film and TikTok clips; the film no longer loads under reduced motion |
| `87e3602` | Accessibility: failing contrast pairs fixed, 44px tap targets |
| `ed1fed1` | Typography: Space Grotesk, Satoshi and Space Mono, self-hosted; five old faces removed |
| `c086e89` | Detector: stripes, bounce easing and grain removed |
| `8cffdfd` | Responsive: story chapters carry their own photo on phones |
| `e057e90` | Polish: route heroes show the route and its next event; the volunteer page gains dates |
| `34d21a5` | Polish: the home hero says what YMT is; timeline dates read in order |
| `fd7f632` | Clean-up: unused hero styles removed |

**Colour:** the client kept the iteration-2 route colours. Colour work was limited to AA fixes.

The only change to a token was the volunteer accent text, from white to ink. Solid backings were added where text sits over photos or video.

**Verification:**

- **File scan:** `impeccable detect` over every `*.html` and `css/*.css` exits 0.
- **Live scan:** the browser scan of nine pages at 1280×800 and 390×844 reports 0 findings.
- **Waived or ignored findings,** each recorded with its reason in `.impeccable/config.json`:
  - *overused-font (Space Grotesk):* the fonts are pinned by the client.
  - *cramped-padding and flat-type-hierarchy on `*.html`:* the file scan doesn't apply the CSS. The live scan raises neither.
  - *buried-raster on `index.html`:* the story crossfade is intended.
- **Links:** 1,032 local references checked, 0 broken.
- **Forbidden patterns:** `<form`, `stripe`, `youtube.com/embed` and `formEndpoint` have no matches.
- **Layout:** no horizontal scroll at 360 on all 22 pages, or at 390, 768 and 1440 on home, the routes, enquire and donate.
- **Console:** no errors on those pages.

**New copy, draft for the client to approve:**

- **`enquire.html`:** the five row descriptions, the lede and the note under the rows.
- **Email bodies:** the prompt lines in the pre-filled emails (for example "School:", "Year group(s):").
- **`donate.html`:**
  - "Gifts are made on our fundraising page, not on this site."
  - "Online giving opens soon…"
  - The sponsor line, adapted from the live ymt.org.
- **`secondary.html` and `volunteer.html`:** the reworded email ledes, and "Each date shows who it is for and how to take part."
- **The home Contact card line.**
- **The hero card labels:** "What's on next" and "Coming up".

## Open client questions

- **Giving URL:** there is no external giving page yet. The live ymt.org lists bank and cheque details, which the brief keeps off the site.
- **Charity number:** the Charity Commission lists the Youth Ministry Trust as no. 1146158. The client should confirm this is the right number.
- **Sample events:** which `sample: true` events are real (Youth Council 21 Nov, Advent and Lent retreats, and others)?
- **Photo consent:** confirm consent for the existing photos of identifiable young people, including the home hero film.
- **YouTube:** which channel is current? The build links `/channel/UCVlOo…` and the live site links `/user/life2dfull`.
- **Satoshi licence:** the repo is public on GitHub, and the Satoshi licence restricts redistribution through public repositories. Should the repo be made private, or should the font be kept out of git and added at deploy time?
