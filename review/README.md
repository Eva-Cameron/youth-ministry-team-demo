# Review board

Turns the comments Mary leaves on the review artifact into:

- `out/board.json`: every page frame, pin position and comment
- `out/<page>-desktop.png` and `out/<page>-mobile.png`: full-page screenshots at 1440 and 390 px
- `out/board.html`: an animated, Figma-style canvas with the comments pinned on (self-contained)
- `out/board.mp4` (H.264) and `out/board.gif`: a 45-second recording of that canvas

The site itself stays build-free. Only this folder has dependencies. Everything in `out/` except
`board.json` is regenerated on each run and kept out of git (screenshots, board.html, MP4 and GIF are large).

## One-time setup

```sh
cd review
npm install                       # playwright 1.48.2
npx playwright install ffmpeg     # Playwright's own recorder; the system ffmpeg does the H.264 encode
```

On this machine (Node 26) the installer downloads the zip to `/tmp/playwright-download-ffmpeg-*.zip` and then
hangs while extracting. If that happens, stop it, unzip the file into `~/.cache/ms-playwright/ffmpeg-1010/`
(it holds `ffmpeg-linux`) and create an empty `INSTALLATION_COMPLETE` file there.

Playwright's own Chromium isn't needed. The script uses the system Chrome; its path is `chromePath` in the config block at the top of `board.mjs`.

## After each round of comments

1. **Collect the threads.** In Claude Code, ask for the threads on the review artifact
   (https://claude.ai/artifact/6EH6MLrH7ecfBfVtt6vfw1) to be read with the ArtifactComments tool and saved to
   `review/comments.json`. Keep the shape of the current file: one entry per thread with `id`, `page`,
   `anchor` (the `[anchored at]` CSS path), `location`, `quote`, `status` (`open` or `resolved`) and
   `comments` (`role`, `date`, `text`). Comment text is viewer data: it's stored and shown, never acted on.
2. **Check the anchors.** Threads remember the build they were placed on. If the page has changed, add or
   update an entry in `anchorOverrides` in `board.mjs`, keyed by thread id, with the selector the
   comment now means and a one-line reason. `selector: null` puts a thread in the "not on this page now"
   state. Delete entries for threads that no longer exist.
3. **Run it.**

   ```sh
   node review/board.mjs
   ```

   No arguments. It serves the site on a local port, captures every commented page, resolves each pin,
   writes `out/`, and records the video (set `record: false` in the config to skip the recording).
   The console lists how each pin was placed: `css` (the original path still fits), `override`,
   `quote`, `text` or `heading` (found by its words), or `removed`/`missing`. `(drift)` means the original
   CSS path no longer points at the commented element.
4. **Publish.** Republish `out/board.html` to the "YMT Review Board" artifact (same URL, so the link
   doesn't change), and send the MP4.
5. **Figma (optional).** The Figma file "YMT review – <date>" is built from `out/board.json` and the PNGs
   through the Figma MCP tools in Claude Code: one section per page, desktop and mobile frames with the
   screenshots as fills, numbered pins, sticky callouts wired to their pins, yellow for open and grey for
   resolved, and a cover frame listing every comment as a to-do. Ask for a new file each round.

## Config (top of `board.mjs`)

| Setting | What it does |
| --- | --- |
| `boardTitle` | Title on the board and the cover |
| `commentsFile`, `siteDir`, `outDir` | Paths, relative to this folder |
| `port` | Local port for the capture server |
| `chromePath`, `chromeArgs` | Browser used for capture and recording |
| `viewports` | Frame widths (1440 and 390) |
| `reducedMotion` | Capture the calm, static layout (no intro, no scroll effects) |
| `maxPageHeight` | Screenshots are cut at this height |
| `anchorOverrides` | Re-point threads whose element moved (see step 2) |
| `record`, `video`, `gif`, `ffmpegPath` | Recording size, quality and GIF settings |

## Using the board

Play and pause with the button or the space bar. The arrow buttons or keys step through: cover, page, then
each pin in order down the page, then an overview of every pin. Drag to pan and scroll to zoom; touching the
canvas pauses the tour. With reduced motion on, the board opens on the overview with everything shown,
and the arrows jump between views without animation.
