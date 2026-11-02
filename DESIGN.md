---
name: Youth Ministry Team
description: The front door to youth ministry in the Diocese of Hexham and Newcastle, with four audience routes from one dark, photo-led site.
colors:
  ink: "#100c15"
  ink-raised: "#1c1622"
  ink-sunk: "#2a2232"
  night: "#120c1c"
  white: "#ffffff"
  blossom-pink: "#f8c8da"
  butter: "#fde8a3"
  signal-blue: "#2f5bff"
  stage-red: "#d42f28"
  mass-purple: "#642678"
  purple-thread: "#a35bc0"
  purple-text: "#b77ad1"
  candle-gold: "#f2c24a"
  mint: "#c4ead6"
  sky: "#c3e2f7"
  lilac: "#d9cdf6"
typography:
  display:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "clamp(48px, 7.6vw, 132px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.045em"
  display-grave:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "clamp(48px, 7.6vw, 132px)"
    fontWeight: 300
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Space Grotesk, Arial, sans-serif"
    fontSize: "clamp(38px, 5vw, 80px)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Satoshi, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(22px, 1.9vw, 28px)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Satoshi, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(18px, 1.3vw, 21px)"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Satoshi, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Space Mono, Courier New, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0em"
rounded:
  none: "0px"
  pill: "999px"
  dot: "50%"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
  "8": "64px"
  "9": "96px"
  section: "clamp(72px, 9vw, 144px)"
  gutter: "clamp(20px, 3vw, 48px)"
components:
  button-primary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-route:
    backgroundColor: "{colors.blossom-pink}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-glass:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  button-line:
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "48px"
  tag:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 6px"
  tag-tbc:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "3px 6px"
  download-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  news-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "10px"
  route-hero-next:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 16px"
  mail-row:
    textColor: "{colors.white}"
    typography: "{typography.title}"
    rounded: "{rounded.none}"
    padding: "24px 0"
  pause-control:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  nav:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    height: "60px"
---

# Design System: Youth Ministry Team

## Overview

**Creative North Star: "Real photos, clear routes, one team"**

A dark, photo-led site. Real YMT photography carries the feeling: worship nights, retreat rooms, festival crowds and the Village. The interface stays out of the way: a near-black ground, frosted glass for anything that floats, big tight display type for headings, and small mono labels that number and file each section. Colour belongs to the routes. Each audience has its own accent, set once on `body[data-aud]` and reused by heroes, buttons, tick marks and nav underlines, so the visitor always knows whose page they are on.

Density is generous. Sections breathe (`--section` padding), and lists are ruled with hairlines rather than boxed. Interaction is bold and tactile: pill buttons lift on hover, and download cards jump to a hard offset shadow in the route colour. Motion is reveal-once: content is visible at rest and moves only the first time it scrolls into view, and never when reduced motion is requested. Entrances, lifts and reveals ease out; nothing bounces and no CSS animation loops forever. The two moving-image surfaces, the home film and the TikTok clips, each carry a pause control.

Programme pages may take a register (`data-feel`): Lourdes and adoration are slow, still and gold, with light 300-weight headings; The Source is quick and bright. Registers change accent, weight and pace, not structure.

**Key Characteristics:**
- Near-black ground (`#100c15`), with white text and hairline rules at 26% white.
- One accent per audience route, applied only through tokens.
- Space Grotesk for display, Satoshi for reading and quotes, Space Mono for labels and metadata.
- Square-cornered surfaces; only buttons, pause controls and dots are rounded.
- Frosted glass for the nav, panels and overlays; the hard offset shadow belongs to download cards on hover.
- Real YMT photography. No stock images, no illustrations of people.
- Every tap target is at least 44px; the focus ring follows the ground.

## Colors

A dark, warm-black neutral with pastel and saturated route accents. Shades are kept as shipped in iteration 2 (client decision, 2 Nov 2026).

### Route accents (set by `body[data-aud]`)
- **Primary, Blossom Pink** (#f8c8da) with **Butter** (#fde8a3) as the second accent. Ink text sits on top.
- **Secondary, Signal Blue** (#2f5bff) with **Stage Red** (#d42f28). White text sits on top. `data-tone="red"` swaps the pair.
- **16+ and volunteers, Purple Text** (#b77ad1) as the route fill, with ink text on top (`--acc-ink` is ink). **Purple Thread** (#a35bc0) draws lines and dots, **Mass Purple** (#642678) fills tags, and **Candle Gold** (#f2c24a) is the second accent.
- **Everyone else, Mint** (#c4ead6) with **Sky** (#c3e2f7). Ink text sits on top.
- **Grave register** (`data-feel="grave"`): **Candle Gold** with **Night** text.

### Neutral
- **Ink** (#100c15): page ground, text on light surfaces, and the focus ring on light surfaces.
- **Ink Raised** (#1c1622) and **Ink Sunk** (#2a2232): menus and image placeholders.
- **Night** (#120c1c): photo heroes and the grave register.
- **White** (#ffffff): body text on the dark ground, light cards, the primary button, and the focus ring on the dark ground.
- **Text 2** (white at 72%): secondary text on the dark ground.
- **Line** (white at 26%): hairline rules and section labels.

### Download card types
**Lilac** (#d9cdf6) for prayer, **Butter** for activities, **Sky** for guides and forms, **Blossom Pink** for packs, **Mint** for formation, peach (#ffd2b3) for lessons and lime (#d6f28a) for sessions. Ink text sits on all of them.

### Named Rules
**The Route Owns the Colour Rule.** Accents change only through `--acc`, `--acc-ink` and `--acc-2` on `body[data-aud]` or `body[data-feel]`. Never colour one page by hand.

**The AA Rule.** Every text and background pair passes WCAG AA (4.5:1 for body text, 3:1 for large text and UI). White never sits on Blossom Pink, Mint, Butter, Sky or Purple Text, and ink never sits on Signal Blue or Stage Red.

**The Focus Follows the Ground Rule.** The focus ring is a 3px outline in `--focus` at a 3px offset. It is white on the dark ground; light surfaces (light glass, download cards, the white photo band) set it to ink, and route heroes set it to `--acc-ink`.

## Typography

**Display Font:** Space Grotesk (with Arial), 700; 300 in the grave register
**Body Font:** Satoshi (with Helvetica Neue, Arial), roman and italic
**Label/Mono Font:** Space Mono (with Courier New)

**Character:** Space Grotesk's squared, slightly quirky geometry gives the headings energy without shouting. Satoshi is warm and clear for long reading, even for younger readers, and its italic carries quotes and statement lines, the roles a serif once held. Space Mono files everything: dates, section numbers, tags.

All three faces are self-hosted woff2 in `assets/fonts`. Space Grotesk and Space Mono are subset to Latin; Satoshi ships unmodified, as its licence requires. Only the display face and the regular body face are preloaded.

### Hierarchy
- **Display** (700, clamp(48px, 7.6vw, 132px), 0.9, -0.045em): page `h1`s.
- **Grave display** (300, same size, 0.95, -0.03em): page `h1`s in the grave register only.
- **Wordmark** (700 Space Grotesk, uppercase, -0.05em in the home hero; -0.07em for the footer name): the YMT wordmark.
- **Headline** (700, clamp(38px, 5vw, 80px), 0.95, -0.04em): section `h2`s and timeline dates.
- **Title** (500 Satoshi, clamp(22px, 1.9vw, 28px), 1.15, -0.02em): card titles, row titles, info cards.
- **Lede** (400 Satoshi, clamp(18px, 1.3vw, 21px), 1.5, max 44ch): the paragraph under a heading.
- **Body** (400 Satoshi, 17px, 1.55, max 62ch): prose and descriptions.
- **Quote** (400 Satoshi italic, clamp(22px, 1.9vw, 28px), 1.3): testimonials and pull quotes.
- **Label** (400 Space Mono, 12px, no tracking, uppercase; 11px in tags and captions): section labels, tags, dates, metadata. The home hero controls use it in lowercase.

### Named Rules
**The Three Faces Rule.** Space Grotesk, Satoshi and Space Mono only. Registers change weight, size and pace, never the family.

## Layout

A 1440px max container with fluid gutters (`clamp(20px, 3vw, 48px)`) and safe-area padding. Each section opens with a ruled mono label row (number · name · note) and then a `section-head`: a two-column grid of heading and lede that collapses to one column below 900px. Content patterns are the `split` (sticky aside and content), mixed-width photo rows (`work__row--a/b/c`), ruled `rows`, the `bite-grid` (auto-fill, min 280px) and timelines. Breakpoints: 520px (compact nav), 680px, 760px, 900px (single column), 960px (article aside), 980px (burger nav), 1050px (home hero and the pinned TikTok layout). Spacing follows a 4px-based scale (4, 8, 12, 16, 24, 32, 48, 64, 96).

Every interactive target is at least 44px in both directions: nav links and pills, footer and aside links, filter and globe chips, pause controls and the Latest close button. Small inline tag links keep their look and get the 44px hit area from an invisible overlay.

## Elevation & Depth

Depth comes mostly from translucency, not shadow. Floating layers (nav, menus, the Latest panel, the mobile sheet, panels on photos) are frosted glass: a translucent fill, a 1px inset hairline and `backdrop-filter: blur(18px) saturate(150%)`. Light glass (white at 78%, ink text) holds the route hero's next-event card. Shadows are structural and appear on interaction.

### Shadow Vocabulary
- **Hairline** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.22)`): edges glass surfaces, ghost buttons and pause controls.
- **Hard offset** (`box-shadow: 0 0 0 2px #100c15, 6px 6px 0 var(--acc)`): download cards on hover, together with `translate(-4px, -4px)`.
- **Menu drop** (`0 30px 60px rgba(0,0,0,.35)`): the nav dropdown only.

### Named Rules
**The Flat at Rest Rule.** Surfaces are flat at rest. Lifts and offset shadows answer hover and focus, never decorate.

## Shapes

Square corners everywhere: photos, cards, panels, the nav bar, tags and rows. The only round forms are pill buttons (999px), the home hero pills and pause controls, audience dots and the Latest notification dot. Photos keep honest crops: 4:5 for posters, 4:3 or 3:2 for rows and 9:16 for clips. Hairline rules (1px, white at 26%) divide lists and sections. Never put a coloured stripe on one side of a card, row or callout as decoration; the only one-sided lines are hairline dividers between items and the 2px current-page underline in the nav.

## Components

### Buttons
Bold and tactile.
- **Shape:** pill (999px), 48px tall, 0 24px padding, 600-weight Satoshi at 16px, optional 18px stroke icon.
- **Primary:** white on ink. **Route:** `--acc` on `--acc-ink`. **Hero main:** the inverse, `--acc-ink` on `--acc`, inside a route hero (white on ink over a photo hero). **Glass:** a translucent fill with a hairline, for photo and dark grounds. **Line:** transparent with a currentColor hairline.
- **Pairs:** two buttons sit together in a wrapping row with an 8px gap: a filled action first, then a Line button.
- **Hover / Focus:** lift by 2px (`transform`, 200ms ease-out) and press to scale(.97). Focus follows the Focus Follows the Ground Rule.

### Tags and chips
- **Style:** Space Mono, 11px, uppercase, square, 3px 6px. Each route has its own fill: pink, blue, purple or mint.
- **To be confirmed:** a transparent tag with a currentColor hairline, reading "To be confirmed", on any event whose details are still provisional.
- **Timeline chip:** white on ink, 600 Satoshi at 13px.

### Cards
- **Download card (`bite`):** a white body, a coloured top band by type, an ink 2px outline and an ink pill download button. On hover it lifts and shows the hard offset shadow in the route colour.
- **News card:** a translucent white card with an 88px square thumbnail, a title and a mono meta line of route tags, date and the to-be-confirmed tag, used in the Latest panel. On hover it lifts 3px.
- **Info card:** a glass panel with a title, a body and a single button.
- **Who card:** a full-width sticky stacked card in its route register with dot-screen art. Home only.

### Route hero
Every audience and programme page opens on its route colour (`--acc` fill, `--acc-ink` text) or, in the photo variant, a full-bleed photo under a dark scrim. The left column holds the route name as the Display `h1` (max 12ch), a one-paragraph intro (Satoshi, max 42ch) and a button pair. The right column is a 4:5 photo with a light-glass card pinned to its foot. That card is filled from `js/data.js` with the next event for the route: a mono "Next" label (plus "to be confirmed" for provisional events), the event title in 600 Satoshi at 15px, and the date and place. The photo swaps to the event's image, so a hero never advertises an event that has passed. Below 900px the photo drops under the text at up to 420px wide.

### Navigation
A fixed glass bar inset 10px from the edges. It holds the brand, the "Who it's for" dropdown (dot, route name and one-line description), About and Resources, plus Latest (a white pill with a red dot) and Donate. Every item is at least 44px tall, and the current page carries a 2px `--acc` underline. It hides on scroll down and returns on scroll up. Below 980px a burger opens a full-screen glass sheet. The Latest panel is a separate dialog from the right that blurs the page.

### Email actions
There are no forms on the site. Every call to action that books or asks something is a button-styled `<a href="mailto:…">` carrying `data-mail` (retreat, village, event, details, volunteer, other) and optionally `data-mail-about`. Script rebuilds the address, cc and a `[YMT] …` subject from `js/config.js`, with prompt lines in the body; the plain mailto href works without script.
- **Mail rows:** the enquiry page lists each reason as a ruled row: a Title, a muted description and one button. A row reached from an old `?topic=` link is picked out with a glass fill and hairline.
- **Note:** a 14px muted line under the actions explains that the button opens the visitor's email app and gives the plain addresses as white inline links.

### Pause controls
Moving images always carry a visible control. The home film has a pill in the hero's bottom corner (44px, ink glass, Space Mono 12px lowercase, "Pause film" / "Play film"). The TikTok section has a Line button, "Pause clips" / "Play clips", paired with the follow button; it stops every clip at once. Both use `aria-pressed`, and under reduced motion the film and clips stay on their posters.

## Do's and Don'ts

### Do:
- **Do** set route colour only through `--acc` / `--acc-ink` / `--acc-2` on `body[data-aud]`.
- **Do** use real YMT photos with first-name or event captions only.
- **Do** keep tap targets at least 44px and text pairs at AA.
- **Do** set `--focus` to ink on any new light surface.
- **Do** use `cubic-bezier(.16, 1, .3, 1)` (ease-out) for entrances, lifts and reveals.
- **Do** give any looping video a visible pause control.
- **Do** keep repeated blocks (shot, bite, tl__item, news-card, info__card, mail row) as identical components so they can become CMS slots.

### Don't:
- **Don't** add forms, payment widgets, logins or YouTube/Vimeo embeds.
- **Don't** put a coloured one-sided border or inset stripe on a card, row or callout.
- **Don't** use overshooting or bounce easing.
- **Don't** run a CSS animation on an endless loop.
- **Don't** add decorative repeating-gradient or grain textures.
- **Don't** introduce a fourth typeface.
