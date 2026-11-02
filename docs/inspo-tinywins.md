# TinyWins: what makes it feel clear and expensive

**Source:** tinywins.com (home, /approach, /news, /careers), viewed at 1440×900 in Chrome on 2 November 2026. The type, glass and spacing values below were measured with `getComputedStyle`.

**Rule for using this:** take principles only. Use none of their assets, copy or brand.

## What it does

1. **One idea per screen.** Every viewport holds a single thing: a wordmark, a statement, one row of work, a globe. Everything else is empty white or black. The confidence comes from what's left out.

2. **Type does the work.** The pages run on two faces with a very wide gap in size between them:

   | Role | Face | Size | Line height | Tracking | Weight |
   |---|---|---|---|---|---|
   | Display (Suisse Intl) | grotesk | 124–210px | ~0.87–0.9 | about −0.04 to −0.05em | 600 |
   | Reading (Gramercy) | serif | 20–24px | 1.3–1.4 | about −0.02em | 400 |
   | Labels | mono, uppercase | small | – | – | – |

   Labels mark captions such as a client's name and feeling ("HALO INDUSTRIES BRIGHT"). There is almost nothing in between: no mid-size headings competing.

3. **Statements, then silence.** "Feelings drive actions" fills the screen, then gives way to a short serif paragraph centred in a black field with lots of air, then a single line drawing. Each beat gets its own viewport.

4. **Motion is staged, not scattered.** The wordmark scales into a framed reel. On "Make them feel ___", the word swaps as a row of photos slides under a fixed centre, with a tick ruler as the scrub indicator. The careers globe rotates with small labelled tags. Each section has one moving thing, and the rest stays still.

5. **Glass is small and functional.** The only frosted elements are:
   - the nav pill (`backdrop-filter: blur(42px)`, a 6–10% fill, 4px radius);
   - the "Latest Wins" button, with a red dot;
   - one control (blur 15px, 8px radius).

   It's never decorative, and there are no stacked glass cards.

6. **Colour arrives as whole fields.** Pages are white or black. Colour enters as full-bleed section grounds, like the soft yellow and peach behind the careers globe, and isn't sprinkled into accents.

7. **Texture is almost absent.** Depth comes from photography and scale, not grain or ornament. Line art appears once, as a single moment.

8. **Cards are plain.** The news grid is images with a small category label, a date and a two-line title, in mixed heights with no borders, shadows or boxes. The filter list is plain text in a left column.

## What YMT takes from it

- **Space:** one idea per viewport on home and the route heroes. Treat the section padding (`--section`) as a floor, not a target.
- **Type contrast:** big display set tight, then a calm reading size, with labels in mono. Our Syne, Satoshi and Space Mono keep the same three-role structure. Don't add mid-size headings that compete with the display size.
- **One moment per page:**
  - home: the feel strip;
  - primary: the confetti burst;
  - secondary, volunteer and everyone: the drifting contours.
  
  Everything else stays still.
- **Glass:**
  - only where content floats over imagery or colour: the nav, the Latest panel, the mobile sheet, captions on photos and the hero sub-nav;
  - one token set;
  - never glass on glass.
- **Colour:** route colours arrive as fields (hero grounds, strata bands), not confetti-like accents. The exception is confetti on primary itself.
- **Texture is where YMT differs, on purpose:**
  - YMT's world is the Derwent Valley and the road to Emmaus, so a fine contour map and sediment strata carry meaning that TinyWins' plain fields don't need.
  - Keep them low-contrast. They sit under the hero words and between sections, never over running text.
  - Grain stays below 3% visual weight.
- **Cards:** keep download and news cards quiet: soft radius, little or no border, depth from one soft shadow, and labels in mono.
- **Motion:** use ease-out only, with one staged entrance per section. Everything is still under reduced motion.
