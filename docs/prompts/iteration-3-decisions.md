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
