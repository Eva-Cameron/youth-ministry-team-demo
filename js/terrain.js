/* Terrain: the "layers of a journey" texture for the route and shared pages.
   - Contours: an OS-map style contour drawing (marching squares over a seeded noise field) on a canvas behind
     each page hero, and faintly under "Who is it for?" on home. The land is drawn at the size of its frame from
     very slow noise, so the hills are big and nothing tiles or repeats (Eva, 2 Nov). Where it drifts it slides
     a few pixels a second.
   - Memphis confetti (Primary only): grainy circles, half-moons, triangles and pills crowding the top and
     bottom of the hero, bobbing and turning slowly.
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

  // Lines (contours): scale is the width of one hill in px (bigger = broader land), step the height between
  // contour lines, then colour token, alpha and drift (on/off).
  // Memphis: one piece per `per` px² (at most `most`), edge bias, smallest and biggest radius, colours.
  // Bands: [colour token, alpha] from the top band down; depth is how far down the padding they reach (0–1).
  const LIGHT = { lines: { scale: 1100, step: .034, color: '--acc-ink', alpha: .1 }, bands: { depth: .62, layers: [['--acc-on-dark', .1], ['--acc-on-dark', .05]] } };
  const ROUTES = {
    index: { who: { scale: 1200, step: .036, color: '--white', alpha: .08 } },
    // Primary has Memphis shapes instead of contours (Eva, 2 Nov): tints of the hero pink, so they sit in the ground
    // rather than on it, crowding the top and bottom edges.
    primary: { memphis: { per: 15000, most: 90, bias: 2.2, small: 6, big: 22, alpha: .55, colours: ['#e48aa6', '#d9768f', '#ffd3a8', '#ddb5fa', '#fff1f4'] }, bands: { depth: .7, layers: [['--acc-on-dark', .22], ['--lilac', .2], ['--acc-on-dark', .08]] } },
    secondary: { lines: { scale: 900, step: .026, color: '--sky', alpha: .26, drift: true }, bands: { depth: .72, layers: [['--blue-light', .2], ['--blue', .32], ['--blue-light', .07]] } },
    volunteer: { lines: { scale: 1000, step: .03, color: '--plum', alpha: .26, drift: true }, bands: { depth: .9, layers: [['--purple-text', .3], ['--purple', .42], ['--purple-text', .14], ['--plum', .9]] } },
    everyone: { lines: { scale: 1100, step: .034, color: '--acc-ink', alpha: .12, drift: true }, bands: { depth: .6, layers: [['--acc-on-dark', .1], ['--stone', .05]] } },
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

  // The land: one broad swell and a smaller rise on top, so hills have shoulders rather than rings.
  const land = (x, y, sc) => noise(x / sc + 3.7, y / sc + 1.3) + .38 * noise(x / (sc * .42) - 9.1, y / (sc * .42) + 4.2);

  /* Contours: painted once on a canvas, shown as an image (cached like any photo, so scrolling stays cheap).
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
      g.lineJoin = g.lineCap = 'round';
      // Marching squares on a 6px grid: sample the land at every corner, then for each contour level find where
      // it crosses each cell's edges and join those points. Every fifth level is heavier, like an OS map.
      const C = 6, cols = Math.ceil(w / C) + 1, rows = Math.ceil(h / C) + 1;
      const v = new Float32Array(cols * rows);
      let lo = Infinity, hi = -Infinity;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const n = land(i * C, j * C, o.scale); v[j * cols + i] = n; if (n < lo) lo = n; if (n > hi) hi = n; }
      const thin = new Path2D(), thick = new Path2D();
      for (let k = Math.ceil(lo / o.step); k * o.step <= hi; k++) {
        const L = k * o.step, path = ((k % 5) + 5) % 5 === 0 ? thick : thin;
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
          const pts = [];
          const x0 = i * C, y0 = j * C;
          if ((a < L) !== (b < L)) pts.push(x0 + C * (L - a) / (b - a), y0);
          if ((b < L) !== (c < L)) pts.push(x0 + C, y0 + C * (L - b) / (c - b));
          if ((c < L) !== (d < L)) pts.push(x0 + C * (L - d) / (c - d), y0 + C);
          if ((d < L) !== (a < L)) pts.push(x0, y0 + C * (L - a) / (d - a));
          for (let q = 0; q + 3 < pts.length; q += 4) { path.moveTo(pts[q], pts[q + 1]); path.lineTo(pts[q + 2], pts[q + 3]); }
        }
      }
      g.globalAlpha = o.alpha; g.lineWidth = 1.5; g.stroke(thin);
      g.globalAlpha = Math.min(1, o.alpha * 1.6); g.lineWidth = 2.4; g.stroke(thick);
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
    // After a hero the bands step down in solid tints from the hero colour to the section's ground, so the hero
    // settles cleanly into the page instead of fading through translucent grey.
    const ground = getComputedStyle(section).backgroundColor;
    const base = ground && ground !== 'rgba(0, 0, 0, 0)' ? ground : tok('--ink');
    const layers = fromHero ? [['--acc', 1], [`color-mix(in oklab, ${tok('--acc')} 62%, ${base})`, 1], [`color-mix(in oklab, ${tok('--acc')} 28%, ${base})`, 1]] : o.layers;
    const n = layers.length;
    const seed = section.offsetTop * .01;
    // Band k lies between edge k and edge k + 1. After a hero the top edge is the hero's own flat foot,
    // so the hero colour settles into the bands; elsewhere every edge undulates.
    const top = fromHero ? 0 : 6;
    const edges = Array.from({ length: n + 1 }, (_, k) => (k === 0 && fromHero ? curve(0, 0, 0) : curve(top + (o.depth * 100 - top) * (k / n), seed + k * 3.1, k === 0 ? 6 : 11)));
    layers.forEach(([c, a], k) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${edges[k].join('L')}L${[...edges[k + 1]].reverse().join('L')}Z`);
      if (c.startsWith('--')) path.setAttribute('fill', tok(c)); else path.style.fill = c;
      path.setAttribute('fill-opacity', String(a));
      svg.append(path);
    });
    box.append(svg);
    section.prepend(box);
  };

  // Memphis confetti: grainy circles, half-moons, triangles and pills that crowd the top and bottom edges and
  // thin out towards the middle, where the words are. Each piece is painted once (with its speckle) to a little
  // sprite; frames only place and turn the sprites (30fps, only on screen). Under reduced motion: drawn once.
  const SHAPES = ['circle', 'half', 'tri', 'pill'];
  const sprite = (shape, r, colour, dpr) => {
    const s = Math.ceil(r * 2 + 4), cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(s * dpr);
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, s / 2 * dpr, s / 2 * dpr);
    g.fillStyle = colour;
    g.beginPath();
    if (shape === 'circle') g.arc(0, 0, r, 0, 6.283);
    else if (shape === 'half') g.arc(0, r * .3, r, Math.PI, 0);
    else if (shape === 'tri') { g.moveTo(0, -r); g.lineTo(r * .9, r * .65); g.lineTo(-r * .9, r * .65); g.closePath(); }
    else { const t = r * .36; g.moveTo(-r + t, -t); g.lineTo(r - t, -t); g.arc(r - t, 0, t, -1.571, 1.571); g.lineTo(-r + t, t); g.arc(-r + t, 0, t, 1.571, 4.712); }
    g.fill();
    // Speckle: light flecks inside the shape only, like risograph grain.
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#fff';
    for (let n = Math.round(r * r * .5); n > 0; n--) { g.globalAlpha = .18 + rng() * .3; g.fillRect((rng() - .5) * s, (rng() - .5) * s, .9, .9); }
    return cv;
  };
  const memphis = (host, o) => {
    const box = document.createElement('div');
    box.className = 'terrain terrain--memphis';
    box.setAttribute('aria-hidden', 'true');
    const cv = document.createElement('canvas');
    box.append(cv);
    host.prepend(box);
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, devicePixelRatio || 1);
    let w = 0, h = 0, bits = [], raf = 0, visible = true, last = 0;
    const seed = () => {
      bits = [];
      const count = Math.min(o.most, Math.round((w * h) / o.per));
      for (let i = 0; i < count; i++) {
        const edge = Math.pow(rng(), o.bias); // 0 at the edge, 1 towards the middle
        const y = rng() < .5 ? edge * h * .5 : h - edge * h * .5;
        // On a phone the hero is short and the words sit near the top, so the pieces shrink with the width.
        const big = Math.min(o.big, w / 32);
        const r = o.small + (big - o.small) * Math.pow(1 - edge, 1.6) * (.4 + rng() * .6);
        const img = sprite(SHAPES[(rng() * 4) | 0], r, o.colours[(rng() * o.colours.length) | 0], dpr);
        bits.push({ img, s: img.width / dpr, x: rng() * w, y, rot: rng() * 6.283, spin: (rng() - .5) * .3, ph: rng() * 6.283, sp: .3 + rng() * .5, amp: 3 + rng() * 6 });
      }
    };
    const draw = (t) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = o.alpha;
      const sec = t / 1000;
      for (const b of bits) {
        const k = sec * b.sp + b.ph;
        ctx.setTransform(dpr, 0, 0, dpr, (b.x + Math.cos(k * .6) * b.amp * .6) * dpr, (b.y + Math.sin(k) * b.amp) * dpr);
        ctx.rotate(b.rot + sec * b.spin);
        ctx.drawImage(b.img, -b.s / 2, -b.s / 2, b.s, b.s);
      }
    };
    const tick = (now) => {
      raf = 0;
      if (now - last > 33) { last = now; draw(now); }
      if (visible && !document.hidden && !reduce) raf = requestAnimationFrame(tick);
    };
    const run = () => { if (!reduce && visible && !document.hidden && !raf) raf = requestAnimationFrame(tick); };
    let lastW = 0;
    new ResizeObserver(([e]) => {
      w = Math.round(e.contentRect.width); h = Math.round(e.contentRect.height);
      cv.width = w * dpr; cv.height = h * dpr;
      if (w !== lastW) { lastW = w; seed(); }
      draw(performance.now()); run();
    }).observe(box);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; run(); }).observe(host);
    document.addEventListener('visibilitychange', run);
  };

  if (conf.who) { const who = document.querySelector('.who'); if (who) lines(who, conf.who); }
  const hero = document.querySelector('.phero');
  if (hero && conf.memphis) memphis(hero, conf.memphis);
  // No texture over photographs (Eva): photo heroes get no contours.
  if (hero && conf.lines && !hero.classList.contains('phero--photo')) lines(hero, conf.lines);
  if (conf.bands) {
    document.querySelectorAll('main > :is(.section, .tiktok, .globe-sec)').forEach((s) => {
      const prev = s.previousElementSibling;
      if (!prev || s.matches('.section--tight') || parseFloat(getComputedStyle(s).paddingTop) < 40) return;
      bands(s, conf.bands, prev.matches('.phero:not(.phero--photo)'));
    });
  }
})();
