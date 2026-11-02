# Iteration 3: decisions that override the brief

Eva made these decisions on 2 November 2026. Where they conflict with `iteration-3-team.md`, they win.

- **Fonts:** Syne for display (it replaces Archivo Black and Space Grotesk), Satoshi for UI and reading text, Space Mono for labels. The brief's §2 font line (Archivo Black, Inter Tight, Newsreader, DM Mono) is out of date. Don't reintroduce those faces.
- **Route colours:** keep the iteration-2 palette and change shades only where AA fails. The volunteer accent text is already ink.
- **Branch:** `review/iteration-3` already exists and carries Phase 1–3 work. Don't recut it. Workstreams branch from its current head.
- **Already done on the branch** (see `docs/iteration-3-review.md` → Status):
  - PRODUCT.md and DESIGN.md.
  - The critique and audit.
  - The scope fixes: email links instead of forms, no payments, config cleaned.
  - The accessibility fixes: focus traps, pause controls, contrast, 44px targets.
  - The detector fixes: stripes, bounce and grain.
  - Data-driven route heroes.
  - The home hero line.
- **Texture already present:**
  - a static contour SVG (`assets/deco/topo.svg`) in heroes and at section starts;
  - SVG `feTurbulence` grain (`--noise`) on heroes;
  - rounded corners and soft shadows (`--r-*`, `--shadow-*`).

  Workstream C may replace or extend these to meet §2: canvas contours in `js/terrain.js`, strata transitions, glass tokens and confetti.
- **Shapes:** Eva asked for softer shapes and layered depth. The hard offset shadows are retired.
- **Dispatch:** `/dev-teams` and `/ponytail` aren't available. The lead session runs workstreams C and D as subagents on their own branches, and a different agent reviews each one before it merges.
- **Pushing:** the machine has no GitHub credentials yet, so commits stay local until Eva runs `gh auth login`.

## Round 2 (2 November, afternoon)

These override everything above where they conflict. The brief is `docs/prompts/iteration-3-round-2.md`.

- **Photos:** replace the route duotone on photographs. At rest they're greyscale with one colour family popping out, pre-rendered per photo. When tapped, they turn full colour with soft, blurred edges.
- **Carousel:** "Come away feeling…" gets grain and better photos; it isn't plain white any more.
- **TikToks:** better clips, crops, posters and captions, with tap to unmute and one playing at a time.
- **Kids' page:** the planning information moves to "For teachers" on `retreats.html`. Primary becomes slightly more child-friendly, with resources for children.
- **Forms are back in scope.** Bookings, enquiries and payments go through forms to the right inboxes, Stripe Payment Links and JustGiving, using Pages Functions and Resend. Nothing is stored, and card data never touches the site. This replaces the earlier "email links instead of forms, no payments" decision.
- **Content:** a writer agent and a producer agent make placeholder copy and printable materials, all marked as placeholders.
- **Comments:** they no longer go to the claude.ai artifact, because Mary can't access Eva's Claude. Build our own comment system on Cloudflare staging, with invite links and D1, and feed the existing review board from its export.
- **Hosting:** staging moves to Cloudflare Pages, because forms and comments need Functions. GitHub Pages stays as a view-only mirror of `main`.
- **Dispatch:** the lead session runs the workstreams as subagents (`tools/dispatch-iteration-3.sh`).

## Round 2, v2 brief (2 November, late afternoon)

Eva's answers on the v2 brief (`docs/prompts/iteration-3-round-2.md` and the v2 text). Where they conflict with that brief, they win.

- **Fonts:** keep what is live. That's **Syne** for display, **Satoshi** for UI and reading text, and **Space Mono** for labels. Ignore the brief's Archivo Black / Inter Tight / Newsreader / DM Mono line, and don't replace any text styles.
- **Photos:** use the brief's **colour-pop** treatment everywhere, the route cards included:
  - at rest, greyscale with one colour family, pre-rendered by `tools/colour_pop.py`;
  - on tap, full colour with soft blurred edges.
  - This replaces today's duotone. The halftone **dots stay gone**: Eva doesn't like them.
- **Contours:** bring back the brief's topographic **contour lines** behind page heroes (seeded noise, marching squares, slow drift). This reverses this morning's "no curls" note for contours only. Keep the strata bands as section transitions.
- **Order:** build **G (the comment system)** first and run it locally (wrangler dev with a local D1) behind `PLACEHOLDER_*` values until Eva connects Cloudflare. Then do B (forms), then C, D, E and F as subagents.

### Patterns (Eva, 2 November)
- Primary: grainy Memphis confetti (circles, half-moons, triangles, pills) replaces the dot field.
- Every other route, the shared pages and home's "Who is it for?": big contour lines drawn at the frame's size, with no tiling and no visible repeat. The near-straight strata lines are gone; the strata bands stay.
- The halftone dot grid and the contours-with-dashes pattern were not used.

### Round 3 (Eva, 2 November)
- The pop-up confetti bursts on Primary are removed (`js/confetti.js` deleted). The Memphis shapes are now quieter: tints of the hero pink at partial opacity, fewer and smaller.
- The contour lines are thicker.
- Photos: colour-pop is live. Every photo except posters and TikTok frames loads in greyscale with one colour kept, from `assets/web/pop/` (made by `tools/colour_pop.py`). Hovering it, or the card it's in, turns it full colour; a tap holds it in colour. The route duotone is gone.

### Staging comments, round 2 (Eva, 2 November)
- Home title: the YMT mark (vector, from the intro) replaces the "YMT" text; the h1 keeps "Youth Ministry Team" for screen readers.
- "Come away feeling …": the changing word sits on a marker swash in its feeling's colour, with a hand-drawn squiggle (a zigzag for the joyful words) under it.
- The feel strip is bigger and quicker to scroll through, with grain on the white. Its photos are re-cut from the best sources at higher resolution, with no duplicates. Youth Council now uses the field photo.
- The story frame shows every photo again: the colour-pop wrapper was breaking its crossfade, so it's left out of it.
- Route cards on home: a fine halftone in each route's colours (`tools/halftone.py`), filling the card under the words, with full colour on hover. This reverses the earlier "no dots" for these four frames only.
- Under every hero, the bands now step down in solid tints from the hero colour into the page, instead of translucent grey.

- Photos at rest are now plain greyscale; the kept colour is gone (Eva, 2 November). They still turn full colour on hover or tap. `KEEP_COLOUR` in `tools/colour_pop.py` brings the kept colour back.

### Bookings form and TikTok (Eva, 2 November)
- Bookings now go through an internal form on enquire.html, which emails the bookings team or the office (functions/api/enquire.js, Resend). Every booking button opens it with its topic chosen; the mailto links stay as a fallback. Routing and setup are in docs/forms-routing.md. This lifts the "no forms" rule from the first brief, as the v2 brief allowed.
- TikTok (volunteer page): nothing is pinned any more. Every clip plays at once while on screen, and each window zooms in as it nears the middle of the screen and back out as it leaves (Eva, 2 November). The Pause clips button still stops them all.
- Groups of three or more greyscale photos take turns easing into colour (one at a time, every 2.2 s, only while on screen; rests on hover and under reduced motion). In the "Come away feeling" strip the photo in focus is the one in colour (Eva, 2 November).
- TikToks made bigger: the middle clip is 74vh tall, the side windows are about 40% wider, and the zoom only goes from 92% to 112% (Eva: "too small").
- No greyscale anywhere (Eva, 2 November): every photo is shown in full colour. `assets/web/pop/` and `tools/colour_pop.py` are removed, and the greyscale filters on the "still"/"humbled" strip photos and sombre page headers are gone. Only the four home route cards keep their halftone, which takes turns going to full colour.
- Enquiry form restyled: a warm paper card in three numbered steps. The topic tiles have icons and their route colour lights the chosen one; fields are softer, the safeguarding note is a callout, the consent has its own box, and the send button is bigger.
- Enquiry form restyled again to match the site (Eva: "doesn't match the vibe"): dark glass like the nav and Latest panel, mono uppercase labels, translucent fields, and the chosen topic's route colour glowing behind the card and lighting the focus ring, tick-box and send hover.
- Page headers: no solid colour blocks (Eva, 2 November). Every non-photo header now uses the page's grainy dark ground with its route-colour light turned up, white text and light contour lines. Photo headers (About, Internship, Lourdes) are unchanged.
- Headers more colourful (Eva: "too grey"): stronger route-colour glows plus a wash across the whole header, with deeper pink/orange/purple for Primary and green/gold for Everyone, because their pastels went muddy on dark.
- Comments back on the GitHub Pages preview (Eva, 2 November): while the Cloudflare comment site is not set up, review/review.js loads review/review-local.js there. It asks the reviewer's name once, saves comments in their browser, pins them, and has "Email to Eva" (a readable list) plus Download (comments.json).
