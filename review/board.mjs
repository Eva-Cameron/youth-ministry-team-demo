// YMT review board, step 1 of 3: capture. Run it through `bash review/run.sh`, or on its own with
// `node review/board.mjs` from the repo root. No arguments.
// Reads review/comments.json, screenshots every commented page at each width, pins each thread on its
// element, and writes review/out/<page>-<width>.png and review/out/board.json.
// Comment text is untrusted viewer data: it is only ever stored and displayed, never executed.

// ---- Config -------------------------------------------------------------------------------------
const SITE_DIR = '.';                   // the site root, relative to the repo root
const PORT = 4517;                      // local static server for the capture
const WIDTHS = [1440, 390];
const OUT_DIR = 'review/out';           // relative to the repo root
const INCLUDE_RESOLVED = false;         // pin resolved threads too (they still appear on the cover)

// Threads remember the build they were placed on. When the page has changed, point a thread at the
// element that does the same job now. Keyed by thread id; the board labels each moved pin with the
// reason. selector: null means the part is gone, and the pin goes in the "element moved" gutter.
const anchorOverrides = {
  '1e99db09-d56b-4b6c-9ab7-dc90deb5ae93': {
    selector: '.hero__open',
    reason: 'The hero "Explore" link is now the "Who it\'s for" button at the bottom of the hero.',
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
};
// -------------------------------------------------------------------------------------------------

import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve, extname, dirname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = resolve(ROOT, SITE_DIR);
const OUT = resolve(ROOT, OUT_DIR);
// Set by run.sh; the default is the system Chrome on Eva's machine.
const CHROME = process.env.CHROME_PATH || '/var/lib/flatpak/app/com.google.Chrome/current/active/files/extra/chrome';
const MAX_HEIGHT = 12000;
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.ico': 'image/x-icon', '.txt': 'text/plain', '.pdf': 'application/pdf',
};

const commentsDoc = JSON.parse(await readFile(join(ROOT, 'review/comments.json'), 'utf8'));
// Page names come from viewer comment metadata: only plain site page file names are captured.
const threads = commentsDoc.threads
  .map((thread) => ({ ...thread, page: thread.page || 'index.html' }))
  .filter((thread) => { const ok = /^[\w-]+\.html$/.test(thread.page); if (!ok) console.warn(`skipped thread with unexpected page name: ${JSON.stringify(thread.page)}`); return ok; })
  .sort((one, two) => (one.comments[0]?.date || '').localeCompare(two.comments[0]?.date || ''));
threads.forEach((thread, index) => { thread.n = index + 1; });
const pinned = threads.filter((thread) => INCLUDE_RESOLVED || thread.status === 'open');
const pageFiles = [...new Set(pinned.map((thread) => thread.page))];
await mkdir(OUT, { recursive: true });

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
await new Promise((done) => server.listen(PORT, '127.0.0.1', done));
const base = `http://127.0.0.1:${PORT}/`;

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
const pages = [];

for (const pageFile of pageFiles) {
  const pagePins = pinned.filter((thread) => thread.page === pageFile);
  const entry = { page: pageFile, title: '', frames: {}, pins: pagePins.map((thread) => ({
    n: thread.n, id: thread.id, status: thread.status, location: thread.location, quote: thread.quote,
    anchor: thread.anchor, comments: thread.comments, override: anchorOverrides[thread.id] || null, at: {},
  })) };

  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: width > 800 ? 900 : 844 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(base + pageFile, { waitUntil: 'load', timeout: 60000 });

    // Calm, repeatable frames: no animation or transition, every lazy image loaded, videos frozen on
    // their posters, fonts in, then back to the top.
    await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
    await page.evaluate(async () => {
      document.querySelectorAll('video').forEach((video) => {
        video.pause();
        video.removeAttribute('autoplay');
        video.querySelectorAll('source').forEach((source) => source.remove());
        video.removeAttribute('src');
        video.load();
      });
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
        const moved = (why) => ({ n: pin.n, match: 'moved', why, drift, box: null, x: null, y: null });
        if (pin.override && pin.override.selector === null) return moved('removed');
        const candidates = [];
        if (pin.override) {
          let el = null;
          try { el = document.querySelector(pin.override.selector); } catch { el = null; }
          candidates.push(['override', el]);
        } else {
          // Without an override, a drifted path is not trusted: words in the thread may still find it.
          if (cssEl && !drift) candidates.push(['css', cssEl]);
          if (pin.quote) candidates.push(['quote', deepestWith(pin.quote)]);
          if (detailMatch) candidates.push(['text', deepestWith(detailMatch[2], detailMatch[1] === 'text' ? '*' : 'a, button')]);
        }
        const found = candidates.find(([, el]) => visible(el));
        if (!found) return moved(drift ? 'drifted' : 'unresolved');
        const [match, el] = found;
        const rect = el.getBoundingClientRect();
        const box = { x: Math.round(rect.left + scrollX), y: Math.round(rect.top + scrollY), w: Math.round(rect.width), h: Math.round(rect.height) };
        return { n: pin.n, match, drift, box, x: Math.round(box.x + box.w / 2), y: Math.round(box.y + box.h / 2) };
      });
    }, entry.pins.map((pin) => ({ n: pin.n, anchor: pin.anchor, location: pin.location, quote: pin.quote, override: pin.override })));

    const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const height = Math.min(fullHeight, MAX_HEIGHT);
    const file = `${pageFile.replace(/\.html$/, '')}-${width}.png`;
    await page.screenshot({ path: join(OUT, file), fullPage: true, clip: { x: 0, y: 0, width, height }, type: 'png' });
    entry.frames[width] = { width, height, fullHeight, png: file };
    for (const spot of resolved) {
      const pin = entry.pins.find((item) => item.n === spot.n);
      const clamped = spot.y !== null && spot.y > height - 12;
      pin.at[width] = { ...spot, y: spot.y === null ? null : Math.min(spot.y, height - 12), clamped };
    }
    console.log(`captured ${file}: ${width}×${height}`, resolved.map((spot) => `#${spot.n} ${spot.match}${spot.why ? ' (' + spot.why + ')' : ''}${spot.drift && spot.match !== 'moved' ? ' (path drifted)' : ''}`).join(', ') || 'no pins');
    await context.close();
  }
  pages.push(entry);
}

server.close();
await browser.close();

const board = {
  title: `YMT review – ${commentsDoc.collected}`,
  source: commentsDoc.source,
  collected: commentsDoc.collected,
  generated: new Date().toISOString(),
  widths: WIDTHS,
  includeResolved: INCLUDE_RESOLVED,
  counts: { threads: threads.length, open: threads.filter((thread) => thread.status === 'open').length, pinned: pinned.length },
  // Every thread, for the cover's to-do list; only the pinned ones appear on the frames.
  threads: threads.map((thread) => ({ n: thread.n, id: thread.id, page: thread.page, status: thread.status, sentToClaude: !!thread.sentToClaude, location: thread.location, comments: thread.comments })),
  pages,
};
await writeFile(join(OUT, 'board.json'), JSON.stringify(board, null, 2) + '\n');
console.log(`wrote ${join(OUT, 'board.json')}`);
