// YMT review board, step 3 of 3: record. Run through `bash review/run.sh`. No arguments.
// Plays review/out/board.html in Chrome with Playwright video, then encodes review/out/board.mp4
// (H.264, -preset veryfast) and a light review/out/board.gif.

// ---- Config -------------------------------------------------------------------------------------
const OUT_DIR = 'review/out';     // relative to the repo root
const WIDTH = 1920;
const HEIGHT = 1080;
const CRF = 22;                   // H.264 quality: lower is better and bigger
const GIF_WIDTH = 480;            // the GIF is at most 800 wide
const GIF_FPS = 5;
const GIF_COLOURS = 48;
// -------------------------------------------------------------------------------------------------

import { readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, OUT_DIR);
const CHROME = process.env.CHROME_PATH || '/var/lib/flatpak/app/com.google.Chrome/current/active/files/extra/chrome';
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';

const videoDir = join(OUT, 'video-tmp');
await rm(videoDir, { recursive: true, force: true });
// The published page gets its document skeleton from the host; locally the recording adds one.
const html = await readFile(join(OUT, 'board.html'), 'utf8');
const page = join(OUT, 'board-record.html');
await writeFile(page, `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>[hidden]{display:none!important}</style></head><body style="margin:0">${html}</body></html>`);

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const context = await browser.newContext({
  viewport: { width: WIDTH, height: HEIGHT },
  recordVideo: { dir: videoDir, size: { width: WIDTH, height: HEIGHT } },
  colorScheme: 'light',
});
const started = Date.now();
const tab = await context.newPage();
const errors = [];
tab.on('pageerror', (error) => errors.push(String(error)));
tab.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
await tab.goto(pathToFileURL(page).href + '#record');
await tab.waitForFunction(() => window.boardReady === true);
await tab.waitForTimeout(500);
const leadIn = (Date.now() - started) / 1000;
await tab.evaluate(() => window.boardPlay());
await tab.waitForFunction(() => window.boardDone === true, null, { timeout: 180000, polling: 250 });
await tab.waitForTimeout(800);
await context.close();
await browser.close();
if (errors.length) console.log('console errors while recording:', errors);

const [webm] = (await readdir(videoDir)).filter((name) => name.endsWith('.webm'));
const mp4 = join(OUT, 'board.mp4');
const gif = join(OUT, 'board.gif');
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', leadIn.toFixed(2), '-i', join(videoDir, webm),
  '-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mp4, '-vf',
  `fps=${GIF_FPS},scale=${GIF_WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${GIF_COLOURS}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`, gif]);
await rm(videoDir, { recursive: true, force: true });
await rm(page, { force: true });
const seconds = Number(execFileSync(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString());
console.log(`wrote ${mp4} (${seconds.toFixed(1)} s, ${WIDTH}×${HEIGHT}) and ${gif}`);
