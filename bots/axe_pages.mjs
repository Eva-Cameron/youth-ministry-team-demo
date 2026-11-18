// The axe part of the legal and compliance bot: serve the site from this folder's repository, open each
// changed page in a headless browser and run axe over it. The last line printed is the result as JSON,
// which legal_bot.py reads. Settings come from the block below, not from the command line.
// Run: cd bots && npm ci && npx playwright install chromium, then: node bots/axe_pages.mjs

// ---- Settings -------------------------------------------------------------
const PAGES = (process.env.BOT_AXE_PAGES || 'index.html').split(',').map((page) => page.trim()).filter(Boolean);
const PORT = Number(process.env.BOT_AXE_PORT || 8745);
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const SETTLE_MS = 600; // long enough for the page's own scripts to lay it out
// One desktop-width browser. A phone width belongs here too, once the findings the studio review
// already lists are fixed, so a content change isn't stopped by something that was already there.
const VIEWPORT = { width: 1280, height: 900 };
// ---------------------------------------------------------------------------

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const types = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.pdf': 'application/pdf',
};

const server = createServer(async (request, response) => {
  const asked = decodeURIComponent(new URL(request.url, 'http://localhost').pathname).replace(/^\/+/, '');
  const file = join(root, asked || 'index.html');
  if (!file.startsWith(root)) { response.writeHead(403).end('no'); return; }
  try {
    const body = await readFile(file);
    response.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/html' }).end('<!doctype html><title>Not here</title>');
  }
});
await new Promise((ready) => server.listen(PORT, '127.0.0.1', ready));

const { chromium } = await import('playwright');
const axeSource = await readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: VIEWPORT });
const result = { pages: [] };

for (const name of PAGES) {
  const response = await page.goto(`http://127.0.0.1:${PORT}/${name}`, { waitUntil: 'load' });
  if (!response || !response.ok()) {
    result.pages.push({ page: name, violations: [{ id: 'page-missing', help: `${name} didn’t open in the browser`, nodes: 1 }] });
    continue;
  }
  await page.waitForTimeout(SETTLE_MS);
  await page.addScriptTag({ content: axeSource });
  const run = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
  const violations = run.violations.map((violation) => ({ id: violation.id, help: violation.help, nodes: violation.nodes.length }));
  result.pages.push({ page: name, violations });
  console.log(`${name}: ${violations.length ? violations.map((v) => `${v.help} (${v.nodes})`).join('; ') : 'axe found nothing to fix'}`);
}

await browser.close();
server.close();
console.log(JSON.stringify(result));
