/* Colour-pop photos: at rest a photo is greyscale with (by default) plain greyscale (pre-rendered into
   assets/web/pop by tools/colour_pop.py), or a fine halftone on the home route cards (assets/web/dots,
   tools/halftone.py). Hovering it, or the card it sits in, eases it to full colour;
   a tap or click (or Enter / Space on a photo that isn't inside a link) holds it in colour, and a second tap,
   Escape or picking another photo puts it back. The full-colour copy loads only when it's first wanted.
   Groups of photos also take turns coming into colour on their own (see the end of this file). */
(() => {
  'use strict';
  const POP = /\/assets\/web\/(pop|dots)\//;
  // The home story frame crossfades its own stack of photos, so it is left as it is.
  const isPop = (img) => POP.test(img.currentSrc || img.src) && !img.closest('.story__frame');
  let held = null;

  // Wrap a pop photo in a frame holding its full-colour twin, laid exactly over it.
  const frame = (img) => {
    if (img.parentElement.classList.contains('pop')) return img.parentElement;
    const box = document.createElement('span');
    box.className = 'pop';
    img.replaceWith(box);
    box.append(img);
    const inLink = !!box.closest('a, button, [aria-hidden="true"]');
    if (!inLink && img.alt) {
      box.tabIndex = 0;
      box.setAttribute('role', 'button');
      box.setAttribute('aria-pressed', 'false');
      box.setAttribute('aria-label', `${img.alt}: show in full colour`);
    }
    return box;
  };
  const colour = (box) => {
    let full = box.querySelector('.pop__full');
    const src = box.querySelector('img').src.replace(POP, '/assets/web/');
    if (!full) {
      full = document.createElement('img');
      full.className = 'pop__full';
      full.alt = '';
      full.decoding = 'async';
      box.append(full);
    }
    if (full.src !== src) full.src = src;
    const look = getComputedStyle(box.querySelector('img'));
    Object.assign(full.style, { objectPosition: look.objectPosition, borderRadius: look.borderRadius, filter: look.filter });
  };
  const hold = (box, on) => {
    if (on) colour(box);
    box.classList.toggle('is-held', on);
    if (box.hasAttribute('aria-pressed')) box.setAttribute('aria-pressed', String(on));
    held = on ? box : (held === box ? null : held);
  };
  const boxesIn = (zone) => [...zone.querySelectorAll('img')].filter(isPop).map(frame);

  const init = () => document.querySelectorAll('img').forEach((img) => { if (isPop(img)) frame(img); });
  // Hover zone: the link or card a photo sits in, else the photo itself.
  const zoneOf = (el) => el.closest?.('a') || el.closest?.('.pop');
  document.addEventListener('pointerover', (e) => {
    const zone = e.pointerType === 'mouse' && zoneOf(e.target);
    if (!zone) return;
    (zone.matches('.pop') ? [zone] : boxesIn(zone)).forEach((box) => { colour(box); box.classList.add('is-hover'); });
  });
  document.addEventListener('pointerout', (e) => {
    const zone = zoneOf(e.target);
    if (!zone || zone.contains(e.relatedTarget)) return;
    (zone.matches('.pop') ? [zone] : zone.querySelectorAll('.pop')).forEach((box) => box.classList.remove('is-hover'));
  });
  document.addEventListener('click', (e) => {
    const box = e.target.closest('.pop');
    if (!box || box.closest('a, button')) return;
    if (held && held !== box) hold(held, false);
    hold(box, !box.classList.contains('is-held'));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && held) { hold(held, false); return; }
    const box = e.target.closest?.('.pop[role="button"]');
    if (!box || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    if (held && held !== box) hold(held, false);
    hold(box, !box.classList.contains('is-held'));
  });
  // Photos that other scripts fill in later (next-event cards, Latest) are framed when they appear.
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes' && m.target.tagName === 'IMG' && isPop(m.target)) {
        const box = frame(m.target);
        const full = box.querySelector('.pop__full');
        if (full) full.src = m.target.src.replace(POP, '/assets/web/');
      }
      m.addedNodes.forEach((n) => { if (n.nodeType === 1) (n.tagName === 'IMG' ? [n] : n.querySelectorAll('img')).forEach((img) => { if (isPop(img)) frame(img); }); });
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  init();

  /* Where three or more photos sit together (a row, a grid, a run of cards), they take turns: one eases into
     colour, then the next, while the group is on screen. In the "Come away feeling" strip the photo in focus is
     the one in colour. It rests while someone hovers or holds a photo in the group, and under reduced motion. */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const groups = new Set();
  const groupFor = (box) => {
    // The nearest ancestor holding three or more photos in different children, inside one section.
    for (let el = box.parentElement; el && !el.matches('main, section, body'); el = el.parentElement) {
      const kids = [...el.children].filter((child) => child.matches('.pop') || child.querySelector('.pop'));
      if (kids.length >= 3) return el;
    }
    return null;
  };
  const collect = () => document.querySelectorAll('.pop').forEach((box) => { const el = groupFor(box); if (el) groups.add(el); });
  collect();
  new MutationObserver(collect).observe(document.body, { childList: true, subtree: true });
  // On screen: at least a third of the photo is inside the window.
  const inView = (b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.bottom > r.height / 3 && r.top < innerHeight - r.height / 3; };
  setInterval(() => {
    if (document.hidden) return;
    groups.forEach((el) => {
      const boxes = [...el.querySelectorAll('.pop')].filter(inView);
      const lit = el.querySelector('.pop.is-cycle');
      if (!boxes.length || el.querySelector('.pop.is-hover, .pop.is-held')) { lit?.classList.remove('is-cycle'); return; }
      const focus = el.querySelector('.feel__item.is-on .pop');
      // Next along from the one lit now, among the photos on screen.
      const next = focus || boxes[(boxes.indexOf(lit) + 1) % boxes.length];
      if (next === lit) return;
      lit?.classList.remove('is-cycle');
      colour(next);
      next.classList.add('is-cycle');
    });
  }, 2200);
})();
