/* Primary confetti: hero burst, retreat-link burst, still pieces behind downloads. No taps taken; none under reduced motion. */
(() => {
const M = Math, R = M.random, PI = M.PI, up = -PI/2, D = document;
const st = getComputedStyle(D.body);
const COL = ['ink', 'butter', 'white', 'lilac', 'pink', 'blue-light'].map((t) => st.getPropertyValue('--' + t).trim());
const dpr = M.min(2, devicePixelRatio || 1);
const mk = (el) => { const c = D.createElement('canvas'); c.ariaHidden = 'true'; c.className = 'confetti'; el.append(c); return c; };
const fit = (c, w, h) => { c.width = w*dpr; c.height = h*dpr; const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g; };
const draw = (g, p) => {
  const s = p.s;
  g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.scale(1, M.cos(p.f));
  g.fillStyle = g.strokeStyle = p.c; g.lineWidth = s/3.2; g.lineCap = 'round'; g.beginPath();
  if (p.k == 0) g.arc(0, 0, s/2, 0, 7);
  else if (p.k == 1) { g.moveTo(0, -s/1.6); g.lineTo(s/1.8, s/2.4); g.lineTo(-s/1.8, s/2.4); }
  else if (p.k == 2) { g.moveTo(-s, 0); for (let i = 1; i < 5; i++) g.lineTo(-s+i*s/2, i % 2 ? -s/3 : s/3); }
  else for (let i = 0; i < 10; i++) { const a = i*PI/5+up, d = i % 2 ? s/4.5 : s/1.7; g.lineTo(M.cos(a)*d, M.sin(a)*d); }
  p.k == 2 ? g.stroke() : g.fill(); g.restore();
};
// Still pieces peeking from behind the cards.
const dl = D.querySelector('#downloads');
if (dl) {
  const c = mk(dl);
  new ResizeObserver(() => {
    const g = fit(c, dl.clientWidth, dl.clientHeight), o = dl.getBoundingClientRect(), cards = [...dl.querySelectorAll('.bite')];
    let sd = 7; const S = () => (sd = sd*16807 % 2147483647)/2147483647;
    g.globalAlpha = .7;
    for (let n = 0; n < 20 && cards.length; n++) {
      const b = cards[n % cards.length].getBoundingClientRect();
      draw(g, { x: b.left-o.left+(S() < .5 ? -6 : b.width+6), y: b.top-o.top+S()*b.height, s: 12+S()*10, k: n % 4, c: COL[1+n % 5], r: S()*6, f: 0 });
    }
  }).observe(dl);
}
if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
let c, g, live = [], last, raf = 0;
const tick = (now) => {
  const dt = M.min(.05, (now - last)/1e3); last = now;
  g.clearRect(0, 0, innerWidth, innerHeight);
  live = live.filter((p) => {
    const k = M.exp(-p.d*dt);
    p.t += dt; p.vy += 1100*dt; p.vx *= k; p.vy *= k;
    p.x += p.vx*dt; p.y += p.vy*dt; p.r += p.vr*dt; p.f += p.vf*dt;
    g.globalAlpha = M.max(0, M.min(1, (4.2 - p.t)/.6)); draw(g, p);
    return p.t < 4.2 && p.y < innerHeight+40;
  });
  raf = live.length ? requestAnimationFrame(tick) : 0;
};
const burst = (x, y, n, a, sp, pw) => {
  if (!c) c = mk(D.body);
  if (c.width != innerWidth*dpr || c.height != innerHeight*dpr) g = fit(c, innerWidth, innerHeight);
  while (n--) {
    const d = a+(R() - .5)*sp, v = pw*(.55+R()*.6);
    live.push({ x, y, s: 9+R()*9, k: R()*4 | 0, c: COL[R()*6 | 0], r: R()*6, f: R()*6, vx: M.cos(d)*v, vy: M.sin(d)*v, vr: (R() - .5)*14, vf: 3+R()*8, d: .7+R()*.6, t: 0 });
  }
  if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
};
// Hero: two corner cannons, then a pop over the heading.
const hero = D.querySelector('.phero');
if (hero) {
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const b = hero.getBoundingClientRect(), h = hero.querySelector('h1').getBoundingClientRect();
    const y = M.min(b.bottom, innerHeight) - 20, v = M.min(2100, innerHeight*2.4);
    setTimeout(() => burst(b.left+10, y, 46, up+.5, .55, v), 350);
    setTimeout(() => burst(b.right - 10, y, 46, up - .5, .55, v), 520);
    setTimeout(() => burst(h.left+h.width/2, h.top, 30, up, 1.6, v*.45), 760);
  }, { threshold: .4 });
  io.observe(hero);
}
D.querySelectorAll('a[data-mail="retreat"]').forEach((a) => a.addEventListener('click', () => {
  const r = a.getBoundingClientRect();
  burst(r.left+r.width/2, r.top+4, 26, up, 1.9, 800);
}));
})();
