// YMT review board, step 2 of 3: fill. Run through `bash review/run.sh`. No arguments.
// Pours review/out/board.json, the screenshots and the site's fonts into review/board-template.html and
// writes one self-contained review/out/board.html (no external requests).

// ---- Config -------------------------------------------------------------------------------------
const OUT_DIR = 'review/out';                    // relative to the repo root
const TEMPLATE = 'review/board-template.html';   // relative to the repo root
const FONT_DIR = 'assets/fonts';                 // the site's own Satoshi and Space Mono
const JPEG_QUALITY = 4;                          // ffmpeg -q:v, 2 (best) to 31; screenshots are embedded as JPEG
// -------------------------------------------------------------------------------------------------

import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, OUT_DIR);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

const board = JSON.parse(await readFile(join(OUT, 'board.json'), 'utf8'));
for (const page of board.pages) {
  for (const frame of Object.values(page.frames)) {
    const jpg = join(OUT, frame.png.replace(/\.png$/, '.jpg'));
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', join(OUT, frame.png), '-q:v', String(JPEG_QUALITY), jpg]);
    frame.src = 'data:image/jpeg;base64,' + (await readFile(jpg)).toString('base64');
  }
}
const font = async (file) => (await readFile(join(ROOT, FONT_DIR, file))).toString('base64');
// "<" is escaped so no comment text can close the script element it sits in.
const data = JSON.stringify(board).replace(/</g, '\\u003c');
const html = (await readFile(join(ROOT, TEMPLATE), 'utf8'))
  .replace('/*FONT_SATOSHI*/', await font('satoshi.woff2'))
  .replace('/*FONT_MONO*/', await font('space-mono.woff2'))
  .replace('/*BOARD_DATA*/null', () => data);
await writeFile(join(OUT, 'board.html'), html);
console.log(`wrote ${join(OUT, 'board.html')} (${Math.round(html.length / 1024)} KB)`);
