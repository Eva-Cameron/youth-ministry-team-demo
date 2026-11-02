# The Figma board

Current file: see `review/out/figma-link.txt` (https://www.figma.com/design/ZPqrxvpPjzkH9jiENl2hXP,
"YMT review – 2026-11-02", in Eva's team drafts).

`run.sh` can't drive Figma. A Claude Code session with the Figma connector rebuilds the file from
`review/out/board.json` and the PNGs after each capture.

## What's in the file

Page **Review board**:

- **Cover · to-do list**: every thread as a row. Open threads have an empty yellow box; resolved ones are
  ticked, grey and struck through.
- **Section `<page> · <title>`**, one per commented page, holding:
  - `Label · Desktop` / `Label · Mobile`
  - `<page> · desktop 1440` and `<page> · mobile 390` frames. Each holds `Screenshot` (tiles named
    `Screenshot tile n of m`, because Figma downsamples images taller than 4096px) and `Pins`
    (`Pin #n · desktop` / `Pin #n · mobile`).
  - `Callouts`: one sticky-note frame per thread, `Callout #n · open|resolved`, with `Status`, `Comment`,
    `Author and date`, `Reply` and `Pin note` layers. Threads whose element is gone are marked
    `element moved` and drawn with a dashed edge.
  - `Connectors`: `Connector #n`, a curve from each callout to its desktop pin. Solid yellow for open,
    dashed grey for resolved.

Design files can't hold FigJam stickies or connectors, so callouts are styled frames and connectors are
vector curves. The Figma file pins every thread, resolved ones in grey, so it's a full record of the round.
The animated board follows `INCLUDE_RESOLVED` in `board.mjs`.

## Steps for a new round

1. `bash review/run.sh` (capture, fill, record).
2. In a Claude Code session with the Figma connector:
   1. Load the `figma-use` skill (or read `skill://figma/figma-use/SKILL.md`) before any `use_figma` call.
   2. Create a new file "YMT review – <date>" with `create_new_file`, or reuse this one, then call
      `create_session`.
   3. Split each PNG into tiles of at most 4,000 px high (ffmpeg `crop`).
   4. With one `use_figma` call, build the cover, the sections, frames, `Screenshot` tile rectangles, pins,
      callouts and connectors from `board.json`, naming every layer as above. Return the tile IDs.
   5. Call `upload_assets` with those tile IDs as `nodeIds` and POST each tile as raw `image/jpeg` bytes.
      A multipart upload would rename the layer after the file.
   6. Take one screenshot to check the pins sit on their elements.
3. Write the file's URL to `review/out/figma-link.txt` and commit it.
