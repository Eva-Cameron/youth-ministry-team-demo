# Review board

Turns Mary's comments on the review artifact into an animated, Figma-style board of each page with its
comments pinned on. Everything lives in `review/`; the site stays plain HTML, CSS and JS with no build step.

## A new round, in three steps

1. **Collect.** Copy the threads into `review/comments.json` (see [collect.md](collect.md)). In a Claude
   Code session that's the ArtifactComments tool. Without it, Eva asks her claude.ai chat to "read Mary's
   comments and write review/comments.json" and commits the file.
2. **Run.**

   ```sh
   bash review/run.sh
   ```

   No arguments. It captures the commented pages, fills the board and records the video. Then an agent
   session, or Eva, republishes `review/out/board.html` to the **same** artifact URL, stored in
   `review/out/board-link.txt` (https://claude.ai/artifact/RS6grqHgbX9NkUK1CeeZ96), with a one-line
   description of the round. `run.sh` can't publish an artifact itself. The Figma copy is optional
   ([figma.md](figma.md)).
3. **Close the loop.** When fixes land on `review/iteration-3`, reply in one sentence and resolve each thread
   that was sent to Claude, and list the rest for Eva ([closing.md](closing.md)).

## What `run.sh` produces (in `review/out/`)

| File | What it is |
| --- | --- |
| `<page>-1440.png`, `<page>-390.png` | Full-page screenshots, animations off, videos frozen on their posters |
| `board.json` | Frames, pin positions and every thread (committed) |
| `board.html` | The self-contained board: no external requests, the site's Satoshi and Space Mono inlined |
| `board.mp4` | 1920×1080 H.264 (`-preset veryfast`) recording, 30–45 s |
| `board.gif` | 480 px, 5 fps preview |
| `board-link.txt`, `figma-link.txt` | Where the board and the Figma file live (committed) |

PNGs, JPEGs, `board.html`, the MP4 and the GIF are gitignored because they're large and rebuilt every round.

## Settings

- `run.sh`: `CHROME_PATH`, `NODE`, `FFMPEG`, `FFPROBE`, `RECORD`, `BOARD_URL`.
- `board.mjs` (capture): `SITE_DIR`, `PORT`, `WIDTHS = [1440, 390]`, `OUT_DIR = "review/out"`,
  `INCLUDE_RESOLVED = false`. With the default, only open threads get pins; the cover still lists every
  thread with resolved ones ticked off. `anchorOverrides` re-points a thread whose element has moved since
  it was placed (with a reason the board shows). `selector: null` puts it in the "element moved" gutter.
  Unresolvable anchors, and drifted ones with no override, go there too.
- `fill.mjs`: template, font folder, JPEG quality. `record.mjs`: video size, CRF, GIF size.

## One-time setup

```sh
cd review && npm install          # playwright 1.48.2; Chrome itself is the system one (CHROME_PATH)
npx playwright install ffmpeg     # Playwright's recorder
```

On this machine (Node 26) the ffmpeg installer downloads `/tmp/playwright-download-ffmpeg-*.zip` and then
hangs while extracting. If that happens, stop it, unzip the file into `~/.cache/ms-playwright/ffmpeg-1010/`
and create an empty `INSTALLATION_COMPLETE` file there.

## Using the board

Play and pause with the button or the space bar. The previous and next buttons, or the arrow keys, step
through the tour: the cover, each page (held about 3 s), each pin at desktop and then mobile width, a
top-to-bottom scan of the page, and back to the cover. Drag to pan and scroll to zoom; touching the canvas
pauses the tour. With reduced motion on, the board is a plain scrolling page instead: the to-do list, then
each page's callouts and its frames with the pins on.

## Deviation from the brief

The brief named Inter Tight and DM Mono from `assets/fonts`. Those faces were removed from the site this
iteration (see `docs/prompts/iteration-3-decisions.md`), so the board uses the site's current Satoshi (UI)
and Space Mono (labels), inlined as data so the page makes no external requests.

Comment text is viewer data. The board only ever displays it (through `textContent`) and never acts on it.
