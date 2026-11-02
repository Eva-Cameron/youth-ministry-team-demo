/* Home only: the title card, the hero film, the pinned "feel" row, the story frames and the
   entry cards. Nav, Latest, reveals and headlines come from site.js. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Title card: YMT rises, the count runs, the card lifts away. */
  const root = document.documentElement;
  const intro = $('.intro');
  const count = $('[data-loader-count]');
  let introDone = false;
  const finishIntro = () => {
    if (introDone) return;
    introDone = true;
    if (count) count.textContent = '100';
    root.classList.add('page-ready');
    if (!intro || reduce) { intro?.remove(); return; }
    intro.classList.add('is-leaving');
    setTimeout(() => intro.remove(), 1050);
  };
  if (reduce) finishIntro();
  else {
    const t0 = performance.now();
    const tick = (now) => {
      if (introDone) return;
      const p = Math.min((now - t0) / 1150, 1);
      if (count) count.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * 99)).padStart(2, '0');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    const onReady = () => setTimeout(finishIntro, 850);
    if (document.readyState === 'complete') onReady(); else addEventListener('load', onReady, { once: true });
    setTimeout(finishIntro, 2200);
  }

  /* The original hero: the film always plays, retries if autoplay is blocked, drifts with the mouse. */
  const hero = $('.hero');
  const heroFilm = $('.hero video');
  if (heroFilm && reduce) { heroFilm.removeAttribute('autoplay'); heroFilm.pause(); }
  else if (heroFilm) {
    heroFilm.muted = true; heroFilm.defaultMuted = true; heroFilm.controls = false;
    const playFilm = () => { if (!heroFilm.paused || document.hidden) return; heroFilm.play().catch(() => {}); };
    playFilm();
    heroFilm.addEventListener('canplay', playFilm);
    heroFilm.addEventListener('pause', () => setTimeout(playFilm, 250));
    document.addEventListener('visibilitychange', playFilm);
    ['pointerdown', 'touchstart', 'scroll', 'keydown'].forEach((t) => addEventListener(t, playFilm, { passive: true }));
  }
  if (hero && matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    let f = 0;
    hero.addEventListener('pointermove', (e) => {
      if (f) cancelAnimationFrame(f);
      f = requestAnimationFrame(() => {
        hero.style.setProperty('--hero-x', ((e.clientX / innerWidth - .5) * -14).toFixed(2) + 'px');
        hero.style.setProperty('--hero-y', ((e.clientY / innerHeight - .5) * -10).toFixed(2) + 'px');
      });
    });
    hero.addEventListener('pointerleave', () => { hero.style.setProperty('--hero-x', '0px'); hero.style.setProperty('--hero-y', '0px'); });
  }

  /* Ethos photos: scroll moves the row under a pinned white frame. Photos shrink and fade with
     distance from the middle; the word swaps to the centred photo; the ticks peak under it. */
  const feel = $('[data-feel]');
  const feelRow = $('[data-feel-row]');
  const feelItems = $$('.feel__item');
  const feelWord = $('[data-feel-word]');
  const feelStick = $('.feel__stick');
  const ticks = $('[data-feel-ticks]');
  const TICKS = 56;
  let feelOn = -1;
  if (ticks) ticks.innerHTML = '<i></i>'.repeat(TICKS);
  const tickEls = ticks ? [...ticks.children] : [];
  if (feel && reduce) feel.classList.add('feel--static');
  const setFeelWord = (i) => {
    if (i === feelOn) return;
    feelItems[feelOn]?.classList.remove('is-on');
    feelOn = i;
    feelItems[i].classList.add('is-on');
    feelStick.dataset.feel = feelItems[i].dataset.feel;
    feelWord.textContent = feelItems[i].dataset.word;
    feelWord.classList.remove('is-swap'); void feelWord.offsetWidth; feelWord.classList.add('is-swap');
  };
  const drawFeel = (vh) => {
    const r = feel.getBoundingClientRect();
    if (r.bottom < 0 || r.top > vh) return;
    const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
    const n = feelItems.length, a = p * (n - 1);
    const w = feelItems[0].offsetWidth, gap = Math.max(10, w * .05), vw = feelRow.clientWidth;
    const sc = feelItems.map((_, i) => Math.max(.22, 1 - Math.abs(i - a) * .24));
    const xs = []; let x = 0;
    sc.forEach((s) => { xs.push(x); x += w * s + gap; });
    const f = Math.floor(a), t = a - f;
    const ax = xs[f] + (f < n - 1 ? t * (xs[f + 1] - xs[f]) : 0) + w * (sc[f] * (1 - t) + (sc[f + 1] ?? sc[f]) * t) / 2;
    const off = vw / 2 - ax;
    feelItems.forEach((el, i) => {
      el.style.transform = `translate3d(${(xs[i] + off).toFixed(1)}px,-50%,0) scale(${sc[i].toFixed(3)})`;
      el.style.opacity = Math.max(.12, 1 - Math.abs(i - a) * .32).toFixed(2);
    });
    setFeelWord(Math.round(a));
    tickEls.forEach((el, i) => {
      const h = Math.max(0, 1 - Math.abs(i / (TICKS - 1) - p) * TICKS / 7);
      el.style.setProperty('--h', (4 + h * 26).toFixed(1) + 'px');
      el.style.setProperty('--o', (.35 + h * .65).toFixed(2));
    });
  };

  /* Our story: each chapter that crosses the middle of the screen brings its photo in. */
  const frames = $$('.story__frame img');
  const counter = $('[data-story-count]');
  const chapters = $$('.chapter');
  if (frames.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.frame;
      frames.forEach((f, k) => f.classList.toggle('is-on', k === i));
      if (counter) counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}`;
    }), { rootMargin: '-45% 0px -45% 0px' });
    chapters.forEach((c) => sio.observe(c));
  }

  /* The mission statement brightens word by word as you read down. */
  const scrub = $('[data-scrub] p');
  let words = [];
  if (scrub && !reduce) {
    const text = scrub.textContent.trim();
    scrub.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = text;
    scrub.append(sr);
    text.split(/\s+/).forEach((w, i) => {
      const s = document.createElement('span');
      s.className = 'sw';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = (i ? ' ' : '') + w;
      scrub.append(s);
    });
    words = $$('.sw', scrub);
  }

  /* Entry cards: each title enters in its own register once the card is on screen. */
  if (!reduce && 'IntersectionObserver' in window) {
    const wio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); wio.unobserve(e.target); } }), { threshold: .35 });
    $$('.who__card').forEach((c) => wio.observe(c));
  }

  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const vh = innerHeight;
    if (feel) drawFeel(vh);
    if (words.length) {
      const r = scrub.getBoundingClientRect();
      const lit = Math.min(1, Math.max(0, (vh * .8 - r.top) / (vh * .45))) * words.length;
      words.forEach((w, i) => w.style.setProperty('--so', (.5 + .5 * Math.min(1, Math.max(0, lit - i))).toFixed(2)));
    }
  };
  if (!reduce) {
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    addEventListener('resize', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } });
    onScroll();
  }
})();
