// YMT review board. Run from anywhere with:  node review/board.mjs
// Reads review/comments.json, screenshots every commented page, pins each thread on its element,
// then writes review/out/board.json, the PNGs, board.html, and (optionally) board.mp4 and board.gif.
// Comment text is untrusted viewer data: it is only ever stored and displayed, never executed.

// ---- Config -------------------------------------------------------------------------------------
const CONFIG = {
  boardTitle: 'YMT review – 2026-11-02',
  commentsFile: 'comments.json',        // relative to this folder
  siteDir: '..',                        // the site root, relative to this folder
  outDir: 'out',                        // relative to this folder
  port: 4517,                           // local static server for the capture
  chromePath: '/var/lib/flatpak/app/com.google.Chrome/current/active/files/extra/chrome',
  chromeArgs: ['--no-sandbox'],
  viewports: [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 },
  ],
  reducedMotion: true,                  // capture the calm, static layout (no intro, no scroll-scrub)
  maxPageHeight: 12000,                 // full-page screenshots are cut at this height (px)
  embedJpegQuality: 72,                 // the board embeds JPEG copies so it stays self-contained
  // The review threads were placed on an older build, so some CSS paths no longer exist. Here the
  // lead points a thread at the element that does the same job now. Keyed by thread id; the board
  // labels every moved pin with its reason. selector: null means the part is gone from the page,
  // and the thread goes in the frame's "not on this page" tray. Delete entries once they're stale.
  anchorOverrides: {
    '1e99db09-d56b-4b6c-9ab7-dc90deb5ae93': {
      selector: '.hero__open',
      reason: 'The hero "Explore" link is now the "Who it\'s for" link at the bottom of the hero.',
    },
    'ffd606c1-028b-4a43-a191-c1ca2427d297': {
      selector: '.feel',
      reason: 'Placed on the whole page; the reply in the thread names the "Come away feeling…" frame.',
    },
    'df4ab96c-364a-4ba6-b1ef-da59fe3b7535': {
      selector: '.nav__latest',
      reason: 'What\'s on moved into the header "Latest" button and panel.',
    },
    'b06629e7-8b13-4ced-997a-b75f0fd31832': {
      selector: '.who__card[href="primary.html"] .who__art',
      reason: 'The Year 6 card is now the Primary card under "Who is it for?"; this is its picture.',
    },
    '02ef61df-3c78-41e6-bf9e-4ed3b426f9ce': {
      selector: '.who__card[href="primary.html"] .who__body',
      reason: 'The Year 6 card is now the Primary card under "Who is it for?"; this is its text.',
    },
    '4df5641c-0e4c-406e-ad4e-7e5ec128deaa': {
      selector: null,
      reason: 'The "Watch us on TikTok" section is no longer on the home page.',
    },
  },
  record: true,                         // also record board.mp4 and board.gif
  video: { width: 1280, height: 720, crf: 22, preset: 'veryfast' },
  gif: { width: 480, fps: 6, colors: 64 },
  ffmpegPath: 'ffmpeg',
};
// -------------------------------------------------------------------------------------------------

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { join, resolve, extname, dirname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, CONFIG.siteDir);
const OUT = resolve(HERE, CONFIG.outDir);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.pdf': 'application/pdf',
};

const commentsDoc = JSON.parse(await readFile(join(HERE, CONFIG.commentsFile), 'utf8'));
const threads = [...commentsDoc.threads].sort((one, two) =>
  (one.comments[0]?.date || '').localeCompare(two.comments[0]?.date || ''));
threads.forEach((thread, index) => { thread.n = index + 1; });
const pageFiles = [...new Set(threads.map((thread) => thread.page))];
await mkdir(OUT, { recursive: true });

// A tiny static server, so the pages load their CSS, JS, fonts and data exactly as they would online.
const server = createServer(async (request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  const filePath = normalize(join(SITE, urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath));
  if (!filePath.startsWith(SITE + sep) && filePath !== SITE) { response.writeHead(403).end(); return; }
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});
await new Promise((done) => server.listen(CONFIG.port, '127.0.0.1', done));
const base = `http://127.0.0.1:${CONFIG.port}/`;

const browser = await chromium.launch({ executablePath: CONFIG.chromePath, args: CONFIG.chromeArgs });
const pages = [];

for (const pageFile of pageFiles) {
  const pageThreads = threads.filter((thread) => thread.page === pageFile);
  const entry = { page: pageFile, title: '', frames: {}, pins: pageThreads.map((thread) => ({
    n: thread.n, id: thread.id, status: thread.status, location: thread.location, quote: thread.quote,
    anchor: thread.anchor, comments: thread.comments, override: CONFIG.anchorOverrides[thread.id] || null,
    at: {},
  })) };

  for (const viewport of CONFIG.viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: CONFIG.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await context.newPage();
    await page.goto(base + pageFile, { waitUntil: 'load', timeout: 60000 });

    // Load every lazy image and let reveal-on-scroll content settle, then go back to the top.
    await page.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach((img) => { img.loading = 'eager'; });
      const step = innerHeight * 0.8;
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y);
        await new Promise((done) => setTimeout(done, 60));
      }
      scrollTo(0, 0);
      await document.fonts.ready;
      await Promise.all([...document.images].filter((img) => !img.complete)
        .map((img) => new Promise((done) => { img.onload = img.onerror = done; setTimeout(done, 4000); })));
    });
    await page.waitForTimeout(400);
    entry.title = entry.title || await page.title();

    const resolved = await page.evaluate((input) => {
      const norm = (text) => (text || '').replace(/[\s ]+/g, ' ').replace(/…$/, '').trim().toLowerCase();
      const visible = (el) => {
        if (!el) return false;
        const box = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return box.width > 0 && box.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
      };
      const deepestWith = (needle, selector) => {
        const want = norm(needle);
        if (!want) return null;
        const hits = [...document.body.querySelectorAll(selector || '*')].filter((el) =>
          !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName)
          && !el.closest('[aria-hidden="true"]') && visible(el) && norm(el.textContent).includes(want));
        return hits.filter((el) => !hits.some((other) => other !== el && el.contains(other)))[0] || null;
      };
      const boxOf = (el) => {
        const box = el.getBoundingClientRect();
        return { x: Math.round(box.left + scrollX), y: Math.round(box.top + scrollY), w: Math.round(box.width), h: Math.round(box.height) };
      };
      return input.map((pin) => {
        const parts = (pin.location || '').split(' › ');
        const heading = parts[0] || '';
        const detail = parts[1] || '';
        const detailMatch = detail.match(/^(text|link|button) "(.*)"$/);
        let cssEl = null;
        try { cssEl = pin.anchor ? document.querySelector(pin.anchor) : null; } catch { cssEl = null; }
        // A path recorded on an older build can now point somewhere else: check it against the location.
        let drift = !!pin.anchor && !visible(cssEl);
        if (cssEl && visible(cssEl) && pin.location) {
          const around = norm((cssEl.closest('section, article, header, footer, aside') || cssEl).textContent);
          drift = !around.includes(norm(heading)) && !(detailMatch && around.includes(norm(detailMatch[2])));
        }
        const candidates = [];
        if (pin.override && pin.override.selector === null) {
          return { n: pin.n, match: 'removed', drift, box: null, x: null, y: null };
        }
        if (pin.override) {
          let el = null;
          try { el = document.querySelector(pin.override.selector); } catch { el = null; }
          candidates.push(['override', el]);
        }
        if (cssEl && !drift) candidates.push(['css', cssEl]);
        if (pin.quote) candidates.push(['quote', deepestWith(pin.quote)]);
        if (detailMatch) candidates.push(['text', deepestWith(detailMatch[2], detailMatch[1] === 'text' ? '*' : 'a, button')]);
        if (heading) {
          const headingEl = deepestWith(heading, 'h1, h2, h3, h4, h5, h6') || deepestWith(heading);
          const image = detail === 'image' && headingEl ? (headingEl.closest('article, figure, li, section') || headingEl).querySelector('img') : null;
          candidates.push(['heading', image && visible(image) ? image : headingEl]);
        }
        if (cssEl) candidates.push(['css-drift', cssEl]);
        const found = candidates.find(([, el]) => visible(el));
        if (!found) return { n: pin.n, match: 'missing', drift, box: null, x: null, y: null };
        const [match, el] = found;
        const box = boxOf(el);
        return {
          n: pin.n, match, drift, box,
          x: Math.round(box.x + Math.min(box.w / 2, 28)),
          y: Math.round(box.y + Math.min(box.h / 2, 28)),
        };
      });
    }, entry.pins.map((pin) => ({ n: pin.n, anchor: pin.anchor, location: pin.location, quote: pin.quote, override: pin.override })));

    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.min(fullHeight, CONFIG.maxPageHeight);
    const stem = `${pageFile.replace(/\.html$/, '')}-${viewport.name}`;
    const clip = { x: 0, y: 0, width: viewport.width, height };
    // One capture only: a second full-page screenshot can see a re-laid-out page (vh units), so
    // the JPEG the board embeds is converted from this PNG and always matches the pins.
    const png = await page.screenshot({ fullPage: true, clip, type: 'png' });
    await writeFile(join(OUT, `${stem}.png`), png);
    const jpegQ = String(Math.round(2 + (100 - CONFIG.embedJpegQuality) / 10));
    execFileSync(CONFIG.ffmpegPath, ['-y', '-loglevel', 'error', '-i', join(OUT, `${stem}.png`), '-q:v', jpegQ, join(OUT, `${stem}.jpg`)]);
    entry.frames[viewport.name] = { width: viewport.width, height, fullHeight, png: `${stem}.png`, jpg: `${stem}.jpg` };
    for (const spot of resolved) {
      const pin = entry.pins.find((item) => item.n === spot.n);
      const clamped = spot.y !== null && spot.y > height - 12;
      pin.at[viewport.name] = { ...spot, y: spot.y === null ? null : Math.min(spot.y, height - 12), clamped };
    }
    console.log(`captured ${stem}: ${viewport.width}×${height}`, resolved.map((spot) => `#${spot.n} ${spot.match}${spot.drift ? ' (drift)' : ''}`).join(', '));
    await context.close();
  }
  pages.push(entry);
}

server.close();

const board = {
  title: CONFIG.boardTitle,
  source: commentsDoc.source,
  collected: commentsDoc.collected,
  generated: new Date().toISOString(),
  counts: { threads: threads.length, open: threads.filter((thread) => thread.status === 'open').length },
  pages,
};
await writeFile(join(OUT, 'board.json'), JSON.stringify(board, null, 2));
console.log(`wrote ${join(OUT, 'board.json')}`);

// ---- board.html: the template plus the data, fonts and screenshots inlined -----------------------
const template = await readFile(join(HERE, 'board-template.html'), 'utf8');
const fontData = async (file) => (await readFile(join(SITE, 'assets/fonts', file))).toString('base64');
const embedded = structuredClone(board);
for (const entry of embedded.pages) {
  for (const frame of Object.values(entry.frames)) {
    frame.src = 'data:image/jpeg;base64,' + (await readFile(join(OUT, frame.jpg))).toString('base64');
  }
}
// "<" is escaped so no comment text can close the script element it sits in.
const dataScript = JSON.stringify(embedded).replace(/</g, '\\u003c');
const html = template
  .replace('/*FONT_SYNE*/', await fontData('syne.woff2'))
  .replace('/*FONT_SATOSHI*/', await fontData('satoshi.woff2'))
  .replace('/*FONT_MONO*/', await fontData('space-mono.woff2'))
  .replace('/*BOARD_DATA*/null', () => dataScript);
await writeFile(join(OUT, 'board.html'), html);
console.log(`wrote ${join(OUT, 'board.html')} (${Math.round(html.length / 1024)} KB)`);

// ---- Record: Playwright video of the board, then H.264 MP4 and a light GIF -----------------------
if (CONFIG.record) {
  const videoDir = join(OUT, 'video-tmp');
  await rm(videoDir, { recursive: true, force: true });
  // The published page gets its document skeleton from the host; locally we add one for the recording.
  const wrapped = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0">${html}</body></html>`;
  await writeFile(join(OUT, 'board-record.html'), wrapped);
  const context = await browser.newContext({
    viewport: { width: CONFIG.video.width, height: CONFIG.video.height },
    recordVideo: { dir: videoDir, size: { width: CONFIG.video.width, height: CONFIG.video.height } },
  });
  const started = Date.now();
  const page = await context.newPage();
  await page.goto('file://' + join(OUT, 'board-record.html') + '#record');
  await page.waitForFunction(() => window.boardReady === true);
  const leadIn = (Date.now() - started) / 1000;
  await page.evaluate(() => window.boardPlay());
  await page.waitForFunction(() => window.boardDone === true, null, { timeout: 120000 });
  await page.waitForTimeout(1500);
  await context.close();
  const [webm] = (await readdir(videoDir)).filter((name) => name.endsWith('.webm'));
  const source = join(videoDir, webm);
  const mp4 = join(OUT, 'board.mp4');
  const gif = join(OUT, 'board.gif');
  execFileSync(CONFIG.ffmpegPath, ['-y', '-loglevel', 'error', '-ss', leadIn.toFixed(2), '-i', source,
    '-c:v', 'libx264', '-preset', CONFIG.video.preset, '-crf', String(CONFIG.video.crf), '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', mp4]);
  execFileSync(CONFIG.ffmpegPath, ['-y', '-loglevel', 'error', '-i', mp4, '-vf',
    `fps=${CONFIG.gif.fps},scale=${CONFIG.gif.width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=${CONFIG.gif.colors}:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
    gif]);
  await rm(videoDir, { recursive: true, force: true });
  await rm(join(OUT, 'board-record.html'), { force: true });
  const seconds = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString().trim();
  console.log(`wrote ${mp4} (${Number(seconds).toFixed(1)} s) and ${gif}`);
}

await browser.close();
