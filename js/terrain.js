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
    // Primary has a confetti field instead of lines (Eva, 2 Nov): dots crowd the top and bottom edges.
    primary: { dots: { per: 1500, most: 560, bias: 2.4, small: 2, big: 15, colours: ['#ef6f6c', '#1aa6a6', '#f6b93b', '#8fd0ee', '#ffffff', '#e8577a'] }, bands: { depth: .7, layers: [['--acc-on-dark', .22], ['--lilac', .2], ['--acc-on-dark', .08]] } },
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

  /* Strata lines: painted once on a canvas, shown as an image (cached like any photo, so scrolling stays cheap).
     Where they drift, the image is a little wider than its frame and slides sideways a few pixels a second, a
     transform the compositor handles without repainting. It stops off-screen, in a hidden tab, while the page is
     scrolling and under reduced motion. */
  const PAD = 72;
  let scrolled = 0;
  addEventListener('scroll', () => { scrolled = performance.now(); }, { passive: true });
  const lines = (host, o) => {
    const drift = o.drift && !reduce;
    const box = document.createElement('div');
    box.className = 'terrain';
    box.setAttribute('aria-hidden', 'true');
    const img = document.createElement('img');
    img.alt = '';
    box.append(img);
    host.prepend(box);
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d');
    const color = tok(o.color);
    const paint = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(2, devicePixelRatio || 1);
      const w = Math.round(r.width) + (drift ? PAD : 0), h = Math.round(r.height);
      if (!w || !h) return;
      img.style.width = w + 'px';
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.strokeStyle = color;
      const rows = Math.ceil(h / o.gap) + 2;
      for (let row = -1; row < rows; row++) {
        // Every fifth line is a touch heavier, like the index lines on an OS map.
        const index = (row + 100) % 5 === 0;
        g.globalAlpha = o.alpha * (index ? 1.7 : 1);
        g.lineWidth = index ? 1.2 : .7;
        const base = row * o.gap + o.gap * .45 * noise(row * .61, 7.3);
        g.beginPath();
        for (let x = -12; x <= w + 12; x += 12) g[x < 0 ? 'moveTo' : 'lineTo'](x, base + o.amp * wobble(x, row, 0));
        g.stroke();
      }
      cv.toBlob((b) => { if (img.src) URL.revokeObjectURL(img.src); img.src = URL.createObjectURL(b); });
    };
    let lastW = 0;
    new ResizeObserver(([e]) => { const w = Math.round(e.contentRect.width); if (w !== lastW || !img.src) { lastW = w; paint(); } }).observe(box);
    if (!drift) return;
    let raf = 0, visible = false, x = 0, last = 0;
    const tick = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      // Only while nothing glass sits over it: the frame starts below the nav, and a scrolled page brings the nav
      // over the moving layer, which would make its backdrop blur repaint every frame.
      if (now - scrolled > 200 && box.getBoundingClientRect().top >= 76) {
        x += Math.min(now - last, 100) / 1000 * 2.4;
        // Slides across the spare width and back on a cosine, so it slows to rest at each turn (at most 1.2px a second).
        img.style.transform = `translate3d(${(-PAD / 2 * (1 - Math.cos(x / PAD))).toFixed(2)}px, 0, 0)`;
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    const run = () => { if (visible && !document.hidden && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
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

  // Confetti field: dots crowd the top and bottom edges and thin out towards the middle, where the words
  // are. They bob and twinkle slowly (30fps, only on screen); under reduced motion they are drawn once.
  const dotfield = (host, o) => {
    const box = document.createElement('div');
    box.className = 'terrain terrain--dots';
    box.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas');
    box.append(cv);
    host.prepend(box);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = 0, h = 0, dots = [], raf = 0, visible = true, last = 0;
    const seed = () => {
      dots = [];
      const count = Math.min(o.most, Math.round((w * h) / o.per));
      for (let i = 0; i < count; i++) {
        const edge = Math.pow(rng(), o.bias); // 0 at the edge, 1 towards the middle
        const y = rng() < .5 ? edge * h * .5 : h - edge * h * .5;
        const near = 1 - edge;
        dots.push({ x: rng() * w, y, r: o.small + (o.big - o.small) * Math.pow(near, 2.2) * (.35 + rng() * .65), c: o.colours[(rng() * o.colours.length) | 0], a: .5 + rng() * .5, ph: rng() * 6.283, sp: .35 + rng() * .7, amp: 2 + rng() * 6 });
      }
    };
    const draw = (t) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const k = t / 1000 * d.sp + d.ph;
        ctx.globalAlpha = d.a * (.82 + .18 * Math.sin(k * 1.7));
        ctx.fillStyle = d.c;
        ctx.beginPath();
        ctx.arc(d.x + Math.cos(k * .6) * d.amp * .5, d.y + Math.sin(k) * d.amp, d.r, 0, 6.283);
        ctx.fill();
      }
    };
    const tick = (now) => {
      raf = 0;
      if (now - last > 33) { last = now; draw(now); }
      if (visible && !document.hidden && !reduce) raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!reduce && visible && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
    new ResizeObserver(([e]) => {
      w = Math.round(e.contentRect.width); h = Math.round(e.contentRect.height);
      cv.width = w * dpr; cv.height = h * dpr;
      seed(); draw(performance.now()); run();
    }).observe(box);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(host);
    document.addEventListener('visibilitychange', run);
  };

  if (conf.who) { const who = document.querySelector('.who'); if (who) lines(who, conf.who); }
  const hero = document.querySelector('.phero');
  if (hero && conf.dots) dotfield(hero, conf.dots);
  // No texture over photographs (Eva): photo heroes get no lines.
  if (hero && conf.lines && !hero.classList.contains('phero--photo')) lines(hero, conf.lines);
  if (conf.bands) {
    document.querySelectorAll('main > :is(.section, .tiktok, .globe-sec)').forEach((s) => {
      const prev = s.previousElementSibling;
      if (!prev || s.matches('.section--tight') || parseFloat(getComputedStyle(s).paddingTop) < 40) return;
      bands(s, conf.bands, prev.matches('.phero:not(.phero--photo)'));
    });
  }
})();
