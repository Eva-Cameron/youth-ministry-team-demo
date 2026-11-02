/* Volunteers globe: an orthographic dot globe on canvas. It turns slowly, can be dragged,
   and draws dashed great-circle routes from each country home to Consett. */
(() => {
  const root = document.querySelector('[data-globe]');
  if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const tagBox = root.querySelector('[data-globe-tags]');
  const chips = document.querySelector('[data-globe-chips]');
  const note = document.querySelector('[data-globe-note]');
  const tally = document.querySelector('[data-globe-tally]');
  const R = Math.PI / 180;

  const MASK = { step: 2, lat0: 80, cols: 180, rows: ["000000000000003ffffe0000000000000000000000000","00000000000000ffffff8000000000000000000000000","00000000000000ffffff800000000000007c000000000","000000000000003fffff0000000000000fffc00000000","0000001fffffe01fffff00000000001fffffffe000000","00000ffffffff007ffff00000f8001ffffffffffffc00","01fffffffffff807fff800003ff03ffffffffffffffff","03fffffffffffe03ffe1e000fffffffffffffffffffff","03ffffffffffff03ff03e001ffffffffffffffffffffe","01ffffffffffff83fc000007ffffffffffffffffffff8","01ffffffffffffc3e0000007fffffffffffffffffffe0","003c03ffffffffe000000183ffffffffffffffffffc00","000000fffffffff000000183ffffffffffffffffff800","0000007ffffffff8000006c3ffffffffffffffffff000","0000003ffffffffc000006effffffffffffffffffe000","0000001ffffffff80000003ffffffffffffffffff8000","0000000fffffffe0000000ffffffffffffffffffc0000","0000000fffffffc00000007fffffffffffffffff80000","0000000fffffff00000001ffffffffffffffffff80000","0000000ffffffe00000007e03fffffffffffffff80000","0000000ffffffc00000007c01fffffffffffffff80000","00000007fffff800000007c009ffffffffffffff00000","00000003fffff000000007fe007fffffffffff3300000","00000001ffffe000000003fe000fffffffffff0800000","00000000ffffc000000007ffc01ffffffffffe1000000","000000007fffc00000000ffffffffffffffffe0000000","000000003ff0400000001ffffffffffffffffe0000000","000000003f80400000001fffffeffffffffffe0000000","000000001f80000000003fffffe7e00ffffff80000000","000000000f81e00000003ffffff7f007ffffe00000000","0000000007e0000000007ffffff3f803f87f000000000","0000000000fc000000007ffffff9fc03f03f000000000","00000000003c000000007ffffffdf801e03e020000000","00000000000e000000007ffffffec001c01e030000000","000000000001000000003ffffffe00008016030000000","0000000000001ff000001fffffffe0008010030000000","0000000000007ff800001fffffffe0002018018000000","0000000000001ffc000007ffffffc0000008080000000","0000000000001fff00000003ffff80000008380000000","0000000000001fff80000003ffff00000020f80000000","0000000000003fffe0000003fffe00000010780000000","0000000000003ffff8000001fffc00000008780c00000","0000000000003ffffe000001fffc00000004000780000","0000000000007fffff000000fffc000000000003c0000","0000000000003fffff000000fffc000000006000f0000","0000000000001fffff000000fffc00000000000000000","0000000000001ffffe000000fffc00000000000380000","0000000000000ffffe000000fffc60000000003fc0000","00000000000007fffe000000fffce000000000ffc0000","00000000000001fffc000000fff8e000000001ffe0000","00000000000001fffc0000007ff8c000000007ffe0000","00000000000001fffc0000007ff0c00000001ffff0000","00000000000001fff00000007fe0c00000001ffff8000","00000000000001ffc00000003fe0000000001ffffc000","00000000000001ff800000003fc0000000001ffffc000","00000000000003ff800000001f80000000001ffffc000","00000000000003ff000000001f00000000001ffffc000","00000000000003fe000000000e0000000000000ff8000","00000000000003fc000000000000000000000003f0008","00000000000003f8000000000000000000000000e000e","00000000000007e00000000000000000000000000000c","000000000000078000000000000000000000000000018","000000000000078000000000000000000000000000030","000000000000078000000000000000000000000000060","000000000000070000000000000000000000000000000","000000000000070000000000000000000000000000000","000000000000030000000000000000000000000000000","000000000000000000000000000000000000000000000","000000000000000000000000000000000000000000000"] };
  // SAMPLE DATA: where interns came from. Replace with YMT's real list before launch.
  const PLACES = [
    { name: 'United States', code: 'USA', lon: -96, lat: 39, tz: 'America/Chicago' },
    { name: 'Mexico', code: 'MEX', lon: -102, lat: 23, tz: 'America/Mexico_City' },
    { name: 'Brazil', code: 'BRA', lon: -50, lat: -11, tz: 'America/Sao_Paulo' },
    { name: 'Ireland', code: 'IRL', lon: -8, lat: 53, tz: 'Europe/Dublin' },
    { name: 'Spain', code: 'ESP', lon: -4, lat: 40, tz: 'Europe/Madrid' },
    { name: 'Poland', code: 'POL', lon: 19, lat: 52, tz: 'Europe/Warsaw' },
    { name: 'Nigeria', code: 'NGA', lon: 8, lat: 9, tz: 'Africa/Lagos' },
    { name: 'Kenya', code: 'KEN', lon: 37, lat: 0, tz: 'Africa/Nairobi' },
    { name: 'India', code: 'IND', lon: 78, lat: 21, tz: 'Asia/Kolkata' },
    { name: 'Philippines', code: 'PHL', lon: 122, lat: 12, tz: 'Asia/Manila' },
    { name: 'Australia', code: 'AUS', lon: 134, lat: -25, tz: 'Australia/Sydney' },
  ];
  const HOME = { name: 'Consett', code: 'CONSETT', lon: -1.83, lat: 54.85 };

  /* Unit vectors for the land dots, built once from the mask. */
  const vec = (lon, lat) => [Math.cos(lat * R) * Math.sin(lon * R), Math.sin(lat * R), Math.cos(lat * R) * Math.cos(lon * R)];
  const land = [];
  MASK.rows.forEach((hex, i) => {
    const bits = BigInt('0x' + hex).toString(2).padStart(MASK.cols, '0');
    const lat = MASK.lat0 - i * MASK.step;
    for (let j = 0; j < MASK.cols; j++) if (bits[j] === '1') land.push(vec(-180 + MASK.step / 2 + j * MASK.step, lat));
  });

  /* Great-circle route, lifted off the surface in the middle. */
  const home = vec(HOME.lon, HOME.lat);
  const route = (a) => {
    const d = Math.acos(Math.min(1, a[0] * home[0] + a[1] * home[1] + a[2] * home[2]));
    const pts = [];
    for (let k = 0; k <= 48; k++) {
      const t = k / 48, s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
      const lift = 1 + Math.sin(t * Math.PI) * d * .12;
      pts.push([(a[0] * s1 + home[0] * s2) * lift, (a[1] * s1 + home[1] * s2) * lift, (a[2] * s1 + home[2] * s2) * lift]);
    }
    return pts;
  };

  const tagEl = (p, cls) => { const el = document.createElement('span'); el.className = 'globe__tag' + (cls ? ' ' + cls : ''); el.textContent = p.code; tagBox.append(el); return el; };
  const items = PLACES.map((p) => ({ p, v: vec(p.lon, p.lat), pts: null, tag: tagEl(p) }));
  items.forEach((it) => { it.pts = route(it.v); });
  const homeTag = tagEl(HOME, 'globe__tag--home');

  /* View: yaw spins around the poles, pitch tilts. Starts over the Atlantic so Consett is in view. */
  let yaw = 20, pitch = -22, vyaw = reduce ? 0 : -.06, target = null, selected = null, dash = 0;
  const rot = (v) => {
    const cy = Math.cos(yaw * R), sy = Math.sin(yaw * R), cp = Math.cos(pitch * R), sp = Math.sin(pitch * R);
    const x = v[0] * cy + v[2] * sy, z0 = -v[0] * sy + v[2] * cy;
    return [x, v[1] * cp - z0 * sp, v[1] * sp + z0 * cp];
  };

  let W = 0, H = 0, r = 0, cx = 0, cy = 0, dpr = 1;
  const size = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = root.clientWidth; H = root.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    r = Math.min(W, H) * .44; cx = W / 2; cy = H / 2;
  };

  const css = getComputedStyle(root);
  const col = (n, f) => css.getPropertyValue(n).trim() || f;
  const C = { land: col('--globe-land', '#fff'), sea: col('--globe-sea', 'rgba(255,255,255,.07)'), line: col('--globe-line', '#fff'), on: col('--globe-on', '#f2c24a') };

  const draw = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createRadialGradient(cx - r * .35, cy - r * .4, r * .1, cx, cy, r);
    g.addColorStop(0, 'rgba(255,255,255,.16)'); g.addColorStop(1, C.sea);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = C.land;
    const ds = Math.max(1.1, r / 150);
    for (let i = 0; i < land.length; i++) {
      const q = rot(land[i]);
      if (q[2] <= 0) continue;
      ctx.globalAlpha = .25 + q[2] * .75;
      ctx.fillRect(cx + q[0] * r - ds / 2, cy - q[1] * r - ds / 2, ds, ds);
    }
    ctx.globalAlpha = 1;

    ctx.setLineDash([4, 5]); ctx.lineDashOffset = -dash;
    items.forEach((it) => {
      const on = it === selected;
      ctx.strokeStyle = on ? C.on : C.line; ctx.lineWidth = on ? 2 : 1.1; ctx.globalAlpha = on || !selected ? .9 : .35;
      ctx.beginPath();
      let pen = false;
      it.pts.forEach((v) => {
        const q = rot(v), len = Math.hypot(q[0], q[1]);
        const hidden = q[2] < 0 && len < 1;
        if (hidden) { pen = false; return; }
        const x = cx + q[0] * r, y = cy - q[1] * r;
        if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
      });
      ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    const place = (el, v) => {
      const q = rot(v), show = q[2] > .05;
      el.style.transform = `translate(${(cx + q[0] * r).toFixed(1)}px, ${(cy - q[1] * r).toFixed(1)}px)`;
      el.style.opacity = show ? String(Math.min(1, q[2] * 3)) : '0';
    };
    items.forEach((it) => { place(it.tag, it.v); it.tag.classList.toggle('is-on', it === selected); });
    place(homeTag, home);
  };

  /* Turn towards a country: shortest way round, eased. */
  const focus = (it) => {
    selected = it;
    let ty = -it.p.lon;
    while (ty - yaw > 180) ty -= 360;
    while (ty - yaw < -180) ty += 360;
    target = { yaw: ty, pitch: Math.max(-35, Math.min(35, -(it.p.lat * .6 + HOME.lat * .4))) };
    const time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: it.p.tz }).format(new Date());
    note.textContent = `${it.p.name} → Consett · it's ${time.replace(' ', '')} there now`;
    $$chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.code === it.p.code)));
    if (reduce || !running) draw();
  };

  const $$chips = PLACES.map((p) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = p.name; b.dataset.code = p.code; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => focus(items.find((it) => it.p === p)));
    li.append(b); chips.append(li);
    return b;
  });

  /* Live tally, in the spirit of "who's awake": how many home countries are in daytime right now. */
  if (tally) {
    const hour = (tz) => +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }).format(new Date());
    const day = PLACES.filter((p) => { const h = hour(p.tz); return h >= 7 && h < 21; }).length;
    tally.innerHTML = `<span><b>${day}</b> countries awake</span><span><b>${PLACES.length - day}</b> asleep</span>`;
  }

  /* Drag to spin, with a little momentum. */
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; target = null; canvas.setPointerCapture(e.pointerId); root.classList.add('is-drag'); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, k = 90 / r;
    yaw += dx * k; pitch = Math.max(-60, Math.min(60, pitch - dy * k));
    vyaw = dx * k * .6;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!running) draw();
  });
  const up = () => { drag = null; root.classList.remove('is-drag'); };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  let running = false, raf = 0, last = 0;
  const tick = (now) => {
    const dt = Math.min(50, now - (last || now)); last = now;
    if (target) {
      yaw += (target.yaw - yaw) * .08; pitch += (target.pitch - pitch) * .08;
      if (Math.abs(target.yaw - yaw) < .05 && Math.abs(target.pitch - pitch) < .05) target = null;
    } else if (!drag) {
      vyaw += (-.06 - vyaw) * .02;
      yaw += vyaw * dt / 16;
    }
    dash += dt * .02;
    draw();
    if (running) raf = requestAnimationFrame(tick);
  };
  const start = () => { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(tick); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  size(); draw();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { size(); draw(); }, 120); });
  if ('IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop()))).observe(root);
  else start();
})();
