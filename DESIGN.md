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
    letterSpacing: "0.02em"
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
  tag:
    backgroundColor: "{colors.white}"
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
---

# Design System: Youth Ministry Team

## Overview

**Creative North Star: "Real photos, clear routes, one team"**

A dark, photo-led site. Real YMT photography carries the feeling: worship nights, retreat rooms, festival crowds and the Village. The interface stays out of the way: a near-black ground, frosted glass for anything that floats, big tight display type for headings, and small mono labels that number and file each section. Colour belongs to the routes. Each audience has its own accent, set once on `body[data-aud]` and reused by heroes, buttons, tick marks and nav underlines, so the visitor always knows whose page they are on.

Density is generous. Sections breathe (`--section` padding), and lists are ruled with hairlines rather than boxed. Interaction is bold and tactile: pill buttons lift on hover, and download cards jump to a hard offset shadow in the route colour. Motion is reveal-once: content is visible at rest and moves only the first time it scrolls into view, and never when reduced motion is requested.

Programme pages may take a register (`data-feel`): Lourdes and adoration are slow, still and gold; The Source is quick and bright. Registers change accent and pace, not structure.

**Key Characteristics:**
- Near-black ground (`#100c15`), with white text and hairline rules at 26% white.
- One accent per audience route, applied only through tokens.
- Space Grotesk for display, Satoshi for reading, Space Mono for labels and metadata.
- Square-cornered surfaces; only buttons and the Latest dot are rounded.
- Frosted glass for the nav, panels and overlays; hard offset shadows only on hover.
- Real YMT photography. No stock images, no illustrations of people.

## Colors

A dark, warm-black neutral with pastel and saturated route accents. Shades are kept as shipped in iteration 2 (client decision, 2 Nov 2026).

### Route accents (set by `body[data-aud]`)
- **Primary, Blossom Pink** (#f8c8da) with **Butter** (#fde8a3) as the second accent. Ink text sits on top.
- **Secondary, Signal Blue** (#2f5bff) with **Stage Red** (#d42f28). White text sits on top. `data-tone="red"` swaps the pair.
- **16+ and volunteers, Purple Text** (#b77ad1) on the dark ground, with **Purple Thread** (#a35bc0) for lines and dots and **Mass Purple** (#642678) for filled tags. **Candle Gold** (#f2c24a) is the second accent.
- **Everyone else, Mint** (#c4ead6) with **Sky** (#c3e2f7). Ink text sits on top.

### Neutral
- **Ink** (#100c15): page ground, text on light surfaces.
- **Ink Raised** (#1c1622) and **Ink Sunk** (#2a2232): menus and image placeholders.
- **Night** (#120c1c): photo heroes and the grave register.
- **White** (#ffffff): body text on the dark ground, light cards, the primary button.
- **Text 2** (white at 72%): secondary text on the dark ground.
- **Line** (white at 26%): hairline rules and section labels.

### Download card types
**Lilac** (#d9cdf6) for prayer, **Butter** for activities, **Sky** for guides and forms, **Blossom Pink** for packs, **Mint** for formation, peach (#ffd2b3) for lessons and lime (#d6f28a) for sessions. Ink text sits on all of them.

### Named Rules
**The Route Owns the Colour Rule.** Accents change only through `--acc`, `--acc-ink` and `--acc-2` on `body[data-aud]` or `body[data-feel]`. Never colour one page by hand.

**The AA Rule.** Every text and background pair passes WCAG AA (4.5:1 for body text, 3:1 for large text and UI). White never sits on Blossom Pink, Mint, Butter or Sky, and ink never sits on Signal Blue or Stage Red.

## Typography

**Display Font:** Space Grotesk (with Arial)
**Body Font:** Satoshi (with Helvetica Neue, Arial)
**Label/Mono Font:** Space Mono (with Courier New)

**Character:** Space Grotesk's squared, slightly quirky geometry gives the headings energy without shouting. Satoshi is warm and clear for long reading, even for younger readers. Space Mono files everything: dates, section numbers, tags.

All three faces are self-hosted woff2, subset to Latin, in `assets/fonts`. Only the display face and the regular body face are preloaded.

### Hierarchy
- **Display** (700, clamp(48px, 7.6vw, 132px), 0.9): page `h1`s and the YMT wordmark.
- **Headline** (700, clamp(38px, 5vw, 80px), 0.95): section `h2`s, timeline dates.
- **Title** (500 Satoshi, clamp(22px, 1.9vw, 28px), 1.15): card titles, row titles, info cards.
- **Lede** (400 Satoshi, clamp(18px, 1.3vw, 21px), 1.5, max 44ch): the paragraph under a heading.
- **Body** (400 Satoshi, 17px, 1.55, max 62ch): prose and descriptions.
- **Label** (400 Space Mono, 12px, uppercase): section labels, kickers, tags, metadata.

### Named Rules
**The Three Faces Rule.** Space Grotesk, Satoshi and Space Mono only. Registers change weight, size and pace, never the family.

## Layout

A 1440px max container with fluid gutters (`clamp(20px, 3vw, 48px)`) and safe-area padding. Each section opens with a ruled mono label row (number · name · note) and then a `section-head`: a two-column grid of heading and lede that collapses to one column below 900px. Content patterns are the `split` (sticky aside and content), mixed-width photo rows (`work__row--a/b/c`), ruled `rows`, the `bite-grid` (auto-fill, min 280px) and timelines. Breakpoints: 520px (compact nav), 680px, 760px, 900px (single column), 980px (burger nav). Spacing follows a 4px-based scale (4, 8, 12, 16, 24, 32, 48, 64, 96).

## Elevation & Depth

Depth comes mostly from translucency, not shadow. Floating layers (nav, menus, the Latest panel, the mobile sheet, panels on photos) are frosted glass: a translucent fill, a 1px inset hairline and `backdrop-filter: blur(18px) saturate(150%)`. Shadows are structural and appear on interaction.

### Shadow Vocabulary
- **Hairline** (`box-shadow: inset 0 0 0 1px rgba(255,255,255,.22)`): edges glass surfaces and ghost buttons.
- **Hard offset** (`box-shadow: 0 0 0 2px #100c15, 6px 6px 0 var(--acc)`): download cards on hover, together with `translate(-4px, -4px)`.
- **Menu drop** (`0 30px 60px rgba(0,0,0,.35)`): the nav dropdown only.

### Named Rules
**The Flat at Rest Rule.** Surfaces are flat at rest. Lifts and offset shadows answer hover and focus, never decorate.

## Shapes

Square corners everywhere: photos, cards, panels, the nav bar, tags and fields. The only round forms are pill buttons (999px), audience dots and the Latest notification dot. Photos keep honest crops: 4:5 for posters, 4:3 or 3:2 for rows and 9:16 for clips. Hairline rules (1px, white at 26%) divide lists and sections. Never use a one-sided stripe as decoration.

## Components

### Buttons
Bold and tactile.
- **Shape:** pill (999px), 48px tall, 0 24px padding, 600-weight Satoshi at 16px, optional 18px stroke icon.
- **Primary:** white on ink. **Route:** `--acc` on `--acc-ink`. **Glass:** a translucent fill with a hairline, for photo and dark grounds. **Line:** transparent with a currentColor hairline.
- **Hover / Focus:** lift by 2px (`transform`, 200ms ease-out) and press to scale(.97). Focus shows a 3px white outline at a 3px offset.

### Tags and chips
- **Style:** Space Mono, 11px, uppercase, square, 3px 6px. Each route has its own fill: pink, blue, purple or mint.
- **Timeline chip:** white on ink, 600 Satoshi at 13px.

### Cards
- **Download card (`bite`):** a white body, a coloured top band by type, an ink 2px outline and an ink pill download button. On hover it lifts and shows the hard offset shadow in the route colour.
- **News card:** a translucent white card with an 88px square thumbnail, used in the Latest panel.
- **Info card:** a glass panel with a title, a body and a single button.
- **Who card:** a full-width sticky stacked card in its route register with dot-screen art. Home only.

### Navigation
A fixed glass bar inset 10px from the edges. It holds the brand, the "Who it's for" dropdown (dot, route name and one-line description), About and Resources, plus Latest (a white pill with a red dot) and Donate. It hides on scroll down and returns on scroll up. Below 980px a burger opens a full-screen glass sheet. The Latest panel is a separate dialog from the right that blurs the page.

### Mailto actions
Every call to action that books or asks something is an `<a href="mailto:…">` with a `[YMT] …` subject, styled as a button. There are no forms on the site.

## Do's and Don'ts

### Do:
- **Do** set route colour only through `--acc` / `--acc-ink` / `--acc-2` on `body[data-aud]`.
- **Do** use real YMT photos with first-name or event captions only.
- **Do** keep tap targets at least 44px and text pairs at AA.
- **Do** use `cubic-bezier(.16, 1, .3, 1)` (ease-out) for entrances and lifts.
- **Do** keep repeated blocks (shot, bite, tl__item, news-card, info__card) as identical components so they can become CMS slots.

### Don't:
- **Don't** add forms, payment widgets, logins or YouTube/Vimeo embeds.
- **Don't** use one-sided border or inset stripes as accents.
- **Don't** use overshooting or bounce easing.
- **Don't** add decorative repeating-gradient textures.
- **Don't** introduce a fourth typeface.
