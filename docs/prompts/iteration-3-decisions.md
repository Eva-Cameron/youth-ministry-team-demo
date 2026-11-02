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
