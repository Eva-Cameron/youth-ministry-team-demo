/* Terrain: the "layers of a journey" texture for the route and shared pages.
   - Strata lines: fine, near-straight horizontal lines on a canvas behind each page hero (and faintly under
     "Who is it for?" on home). Each line is y = base + a seeded noise wobble, so lines undulate gently and can
     never close into contour loops. On the pages whose moment this is they drift very slowly.
   - Strata bands: wavy sediment bands in two or three tints of the route colour, drawn into the top padding of
     each section that follows another, with the grain showing through. Static SVG, no running cost.
   Off-screen canvases stop drawing (IntersectionObserver), the pixel ratio is capped at 2, and under
   prefers-reduced-motion everything is drawn once and stays still. Without script the page keeps its grain. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const css = getComputedStyle(document.body);
  const tok = (name) => css.getPropertyValue(name).trim() || '#ffffff';

  // Lines: gap between lines (px), wobble amplitude (px), colour token, alpha, drift (on/off).
  // Bands: [colour token, alpha] from the top band down; depth is how far down the padding they reach (0–1).
  const LIGHT = { lines: { gap: 40, amp: 16, color: '--acc-ink', alpha: .09 }, bands: { depth: .62, layers: [['--acc-on-dark', .1], ['--acc-on-dark', .05]] } };
  const ROUTES = {
    index: { who: { gap: 44, amp: 16, color: '--white', alpha: .07 } },
    primary: { lines: { gap: 36, amp: 16, color: '--acc-ink', alpha: .1 }, bands: { depth: .7, layers: [['--acc-on-dark', .22], ['--lilac', .2], ['--acc-on-dark', .08]] } },
    secondary: { lines: { gap: 17, amp: 20, color: '--sky', alpha: .24, drift: true }, bands: { depth: .72, layers: [['--blue-light', .2], ['--blue', .32], ['--blue-light', .07]] } },
    volunteer: { lines: { gap: 24, amp: 20, color: '--plum', alpha: .24, drift: true }, bands: { depth: .9, layers: [['--purple-text', .3], ['--purple', .42], ['--purple-text', .14], ['--plum', .9]] } },
    everyone: { lines: { gap: 40, amp: 16, color: '--acc-ink', alpha: .1, drift: true }, bands: { depth: .6, layers: [['--acc-on-dark', .1], ['--stone', .05]] } },
  };
  const conf = ROUTES[page] || LIGHT;

  /* Seeded gradient noise (2D Perlin), so every visit draws the same land. */
  const rng = ((a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; })([...page].reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
  const perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
    const l1 = grad(perm[a], x, y) + u * (grad(perm[b], x - 1, y) - grad(perm[a], x, y));
    const l2 = grad(perm[a + 1], x, y - 1) + u * (grad(perm[b + 1], x - 1, y - 1) - grad(perm[a + 1], x, y - 1));
    return l1 + v * (l2 - l1);
  };
  // A line's wobble: one slow swell and a smaller ripple, so it reads as sediment, not a sine wave.
  const wobble = (x, row, t) => noise(x / 520 + t, row * .37) + .35 * noise(x / 170 - t * .6, row * .37 + 40);

  /* Strata lines on canvas */
  const lines = (host, o) => {
    const cv = document.createElement('canvas');
    cv.className = 'terrain';
    cv.setAttribute('aria-hidden', 'true');
    host.prepend(cv);
    const g = cv.getContext('2d');
    const color = tok(o.color);
    let w = 0, h = 0, t = 0, raf = 0, last = 0, visible = false;
    const draw = () => {
      g.clearRect(0, 0, w, h);
      g.strokeStyle = color;
      const rows = Math.ceil(h / o.gap) + 2;
      for (let r = -1; r < rows; r++) {
        // Every fifth line is a touch heavier, like the index lines on an OS map.
        const index = (r + 100) % 5 === 0;
        g.globalAlpha = o.alpha * (index ? 1.7 : 1);
        g.lineWidth = index ? 1.2 : .7;
        const base = r * o.gap + o.gap * .45 * noise(r * .61, 7.3);
        g.beginPath();
        for (let x = -8; x <= w + 8; x += 8) {
          const y = base + o.amp * wobble(x, r, t);
          if (x < 0) g.moveTo(x, y); else g.lineTo(x, y);
        }
        g.stroke();
      }
    };
    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = Math.round(r.width); h = Math.round(r.height);
      if (!w || !h) return;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    // Drift: about 30 frames a second, a few pixels a minute. Stops off-screen, in a hidden tab and under reduced motion.
    const tick = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last > 33) { t += (now - last || 33) / 1000 * .004; last = now; draw(); }
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (o.drift && !reduce && visible && !document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    new ResizeObserver(size).observe(cv);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(host);
    document.addEventListener('visibilitychange', run);
  };

  /* Strata bands as SVG: drawn once in a 1440 × 100 box and stretched to fit, so resizing costs nothing. */
  const NS = 'http://www.w3.org/2000/svg';
  const curve = (depth, row, amp) => {
    const pts = [];
    for (let x = 0; x <= 1440; x += 12) pts.push(`${x} ${(depth + amp * wobble(x * 1.4, row, 0)).toFixed(2)}`);
    return pts;
  };
  const bands = (section, o, fromHero) => {
    const box = document.createElement('div');
    box.className = 'strata';
    box.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1440 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    const layers = fromHero ? [['--acc', 1], ...o.layers] : o.layers;
    const n = layers.length;
    const seed = section.offsetTop * .01;
    // Band k lies between edge k and edge k + 1. After a hero the top edge is the hero's own flat foot,
    // so the hero colour settles into the bands; elsewhere every edge undulates.
    const top = fromHero ? 0 : 6;
    const edges = Array.from({ length: n + 1 }, (_, k) => (k === 0 && fromHero ? curve(0, 0, 0) : curve(top + (o.depth * 100 - top) * (k / n), seed + k * 3.1, k === 0 ? 6 : 11)));
    layers.forEach(([c, a], k) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${edges[k].join('L')}L${[...edges[k + 1]].reverse().join('L')}Z`);
      path.setAttribute('fill', tok(c));
      path.setAttribute('fill-opacity', String(a));
      svg.append(path);
    });
    box.append(svg);
    section.prepend(box);
  };

  if (conf.who) { const who = document.querySelector('.who'); if (who) lines(who, conf.who); }
  const hero = document.querySelector('.phero');
  if (hero && conf.lines) lines(hero, hero.classList.contains('phero--photo') ? { ...conf.lines, color: '--white', alpha: .12, drift: false } : conf.lines);
  if (conf.bands) {
    document.querySelectorAll('main > :is(.section, .tiktok, .globe-sec)').forEach((s) => {
      const prev = s.previousElementSibling;
      if (!prev || s.matches('.section--tight') || parseFloat(getComputedStyle(s).paddingTop) < 40) return;
      bands(s, conf.bands, prev.matches('.phero:not(.phero--photo)'));
    });
  }
})();
