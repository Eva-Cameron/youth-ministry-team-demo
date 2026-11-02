/* Shared behaviour: nav, Latest panel, data-driven lists, email links, giving and motion.
   Reads window.YMT (js/data.js) and window.YMT_CONFIG (js/config.js). */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = window.YMT || { events: [], resources: [], audiences: {} };
  const C = window.YMT_CONFIG || {};

  /* ---------- Safety helpers ---------- */
  // Escape text before it goes into markup built from data.
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Only allow HTTPS URLs, optionally on a fixed set of hosts.
  const safeUrl = (u, hosts) => {
    try {
      const url = new URL(u);
      if (url.protocol !== 'https:') return null;
      if (hosts && !hosts.includes(url.hostname)) return null;
      return url;
    } catch { return null; }
  };
  const extLink = (href) => /^https?:/.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
  $$('a[target="_blank"]').forEach((a) => { a.rel = 'noopener noreferrer'; });

  /* ---------- Dates ---------- */
  const day = (iso) => new Date(iso + 'T12:00:00');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const fmt = (iso, o) => day(iso).toLocaleDateString('en-GB', o);
  const when = (e) => e.end
    ? `${fmt(e.date, { day: 'numeric', month: 'short' })}–${fmt(e.end, { day: 'numeric', month: 'short' })}`
    : fmt(e.date, { weekday: 'short', day: 'numeric', month: 'short' }) + (e.time ? ' · ' + e.time : '');
  const upcoming = () => D.events.filter((e) => day(e.end || e.date) >= today).sort((a, b) => day(a.date) - day(b.date));
  const img = (name) => `assets/web/${name}${name.startsWith('tt-') ? '' : '-800'}.webp`;
  const staggered = (els, step = 50) => els.forEach((el, i) => el.style.setProperty('--delay', i * step + 'ms'));

  /* ---------- Nav ---------- */
  const nav = $('.nav');
  if (nav) {
    let lastY = scrollY;
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      const open = nav.querySelector('[aria-expanded="true"]');
      if (!open && y > 480 && y > lastY + 4) nav.classList.add('is-hidden');
      if (y < lastY - 4) nav.classList.remove('is-hidden');
      lastY = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const dropBtn = $('.nav__drop > button', nav);
    const menu = $('.nav__menu', nav);
    const setDrop = (open) => { dropBtn.setAttribute('aria-expanded', String(open)); menu.classList.toggle('is-open', open); };
    if (dropBtn) {
      dropBtn.addEventListener('click', () => setDrop(dropBtn.getAttribute('aria-expanded') !== 'true'));
      document.addEventListener('click', (e) => { if (!e.target.closest('.nav__drop')) setDrop(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && dropBtn.getAttribute('aria-expanded') === 'true') { setDrop(false); dropBtn.focus(); } });
    }

    const burger = $('.nav__burger', nav);
    const sheet = $('.sheet');
    if (burger && sheet) {
      staggered($$('a', sheet), 35);
      const setSheet = (open) => {
        burger.setAttribute('aria-expanded', String(open));
        sheet.classList.toggle('is-open', open);
        sheet.inert = !open;
        document.body.style.overflow = open ? 'hidden' : '';
      };
      sheet.inert = true;
      burger.addEventListener('click', () => setSheet(burger.getAttribute('aria-expanded') !== 'true'));
      $$('a', sheet).forEach((a) => a.addEventListener('click', () => setSheet(false)));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('is-open')) { setSheet(false); burger.focus(); } });
    }
  }

  /* ---------- Latest panel ---------- */
  // Events marked sample: true are not yet confirmed by the team, so they say so wherever they show.
  const tbc = (e) => (e.sample ? '<i class="tag tag--tbc">To be confirmed</i>' : '');
  const tag = (a) => `<i class="tag tag--${esc(a)}">${esc(D.audiences[a]?.name || a)}</i>`;
  const newsCard = (e) => {
    const href = e.link || D.audiences[e.aud[0]]?.page || '#';
    return `<a class="news-card" href="${esc(href)}"${extLink(href)}><img src="${esc(img(e.img))}" alt="" width="88" height="88" loading="lazy" decoding="async"><span><b>${esc(e.title)}</b><small>${tag(e.aud[0])}${esc(when(e))}${tbc(e)}</small></span></a>`;
  };
  const latest = $('[data-latest]');
  const latestBtn = $('[data-latest-open]');
  if (latest && latestBtn) {
    const list = $('.latest__list', latest);
    list.innerHTML = upcoming().slice(0, 8).map((e) => `<li>${newsCard(e)}</li>`).join('');
    staggered($$('li', list), 55);
    let back = null;
    const setLatest = (open) => {
      latestBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        back = document.activeElement;
        latest.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => requestAnimationFrame(() => latest.classList.add('is-open')));
        setTimeout(() => $('.latest__close', latest).focus(), 60);
      } else {
        latest.classList.remove('is-open');
        document.body.style.overflow = '';
        setTimeout(() => { if (!latest.classList.contains('is-open')) latest.hidden = true; }, reduce ? 0 : 380);
        if (back instanceof HTMLElement) back.focus();
      }
    };
    latestBtn.addEventListener('click', () => setLatest(latest.hidden));
    $$('[data-latest-close]', latest).forEach((el) => el.addEventListener('click', () => setLatest(false)));
    list.addEventListener('click', (e) => { if (e.target.closest('a')) setLatest(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !latest.hidden) setLatest(false); });
  }

  /* ---------- Data-driven lists ---------- */
  // "aud:secondary" or "prog:retreats"
  const pick = (spec, list) => {
    const [k, v] = spec.split(':');
    const vals = v.split(',');
    return list.filter((x) => (k === 'prog' ? vals.includes(x.prog) : vals.some((a) => (Array.isArray(x.aud) ? x.aud : [x.aud]).includes(a))));
  };

  // Timelines show only what is still to come, grouped by month; who can go comes first.
  $$('[data-timeline]').forEach((box) => {
    const items = pick(box.dataset.timeline, upcoming());
    let month = '';
    box.innerHTML = items.map((e, i) => {
      const m = fmt(e.date, { month: 'long', year: 'numeric' });
      const head = m !== month ? `<li class="tl__month">${m}</li>` : '';
      month = m;
      const href = e.link || '#';
      return `${head}<li class="tl__item rise${i === 0 ? ' is-next' : ''}">
        <p class="tl__date">${fmt(e.date, { day: 'numeric' })}<small>${fmt(e.date, { weekday: 'short', month: 'short' })}${e.end ? ' – ' + fmt(e.end, { day: 'numeric', month: 'short' }) : ''}</small></p>
        <p class="tl__title"><b>${esc(e.title)}</b><span>${esc(e.place)}${e.time ? ' · ' + esc(e.time) : ''}</span></p>
        <div class="tl__who"><div>${(e.who || []).map((w) => `<span class="chip">${esc(w)}</span>`).join('')}</div><p>${esc(e.how || '')}</p></div>
        <div class="tl__go"><span class="tl__status">${e.sample ? 'Date to be confirmed' : esc(e.status || '')}</span><a class="btn btn--glass" href="${esc(href)}"${extLink(href)}>Details</a></div>
      </li>`;
    }).join('') || '<li class="tl__month">Nothing is booked yet. New dates appear here first.</li>';
  });


  // Downloads, Bitesize style.
  const icons = {
    Prayer: '<path d="M12 3v18M7 8h10"/>', Activity: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', Guide: '<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5"/>',
    Form: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>', Pack: '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
    Formation: '<path d="M4 19V6a2 2 0 0 1 2-2h12v15H6a2 2 0 0 0-2 2"/>', Lesson: '<path d="M3 8l9-4 9 4-9 4z"/><path d="M7 10v5c3 2 7 2 10 0v-5"/>', Session: '<path d="M8 5v14l11-7z"/>',
  };
  const eventById = (id) => D.events.find((e) => e.id === id);
  const bite = (r) => {
    const from = r.event && eventById(r.event);
    const read = r.article ? `<a class="bite__dl" href="${esc(r.article)}">Read</a>` : '';
    return `<article class="bite rise" data-type="${esc(r.type)}" data-aud="${esc(r.aud)}">
      <div class="bite__top"><span class="bite__type"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[r.type] || ''}</svg>${esc(r.type)}</span><span class="bite__level">${esc(r.level)}</span></div>
      <div class="bite__body">${from ? `<span class="bite__from">From ${esc(from.title)}</span>` : ''}<h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p></div>
      <div class="bite__foot"><span class="bite__time">${esc(r.time)}</span>${read || `<a class="bite__dl" href="resources/${esc(r.id)}.pdf" download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>PDF</a>`}</div>
    </article>`;
  };
  $$('[data-resources]').forEach((box) => { box.innerHTML = pick(box.dataset.resources, D.resources).map(bite).join(''); });
  // Download filter on the resources page.
  $$('[data-filter]').forEach((bar) => {
    const grid = bar.parentElement.querySelector('[data-filtered]');
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !grid) return;
      $$('button', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      $$('.bite', grid).forEach((card) => { card.hidden = b.dataset.value !== 'all' && card.dataset.aud !== b.dataset.value; });
    });
  });

  /* ---------- Email links ---------- */
  // No forms: every booking or question is a mailto link with a [YMT] subject, built here from the
  // addresses in config.js. Each link also carries a plain mailto href so it works without JS.
  // The body only holds prompts for the visitor to fill in their own email app.
  const MAIL = {
    retreat: { to: 'bookingsTo', cc: true, subject: 'Booking Enquiry · Retreat', body: ['School', 'Year group(s)', 'Roughly how many', 'Preferred dates'] },
    village: { to: 'bookingsTo', cc: true, subject: 'Booking Enquiry · Village stay', body: ['Parish, school or group', 'Roughly how many', 'Preferred dates'] },
    event: { to: 'enquiryTo', subject: 'Event Enquiry', body: ['Event', 'School, parish or group (if any)', 'Roughly how many'] },
    details: { to: 'enquiryTo', subject: 'Event details', body: ['The event you signed up for'] },
    volunteer: { to: 'enquiryTo', subject: 'Volunteering', body: ['What you would like to do', 'Your age', 'School or parish'] },
    other: { to: 'enquiryTo', subject: 'General Enquiry', body: [] },
  };
  const mailto = (kind, about) => {
    const m = MAIL[kind] || MAIL.other;
    const to = C[m.to] || C.enquiryTo;
    const q = [];
    if (m.cc && C.enquiryTo && C.enquiryTo !== to) q.push('cc=' + C.enquiryTo);
    q.push('subject=' + encodeURIComponent(['[YMT] ' + m.subject, about].filter(Boolean).join(' · ')));
    if (m.body.length) q.push('body=' + encodeURIComponent(m.body.map((l) => l + ': ').join('\n') + '\n\n'));
    return `mailto:${to}?${q.join('&')}`;
  };
  if (C.enquiryTo) $$('a[data-mail]').forEach((a) => { a.href = mailto(a.dataset.mail, a.dataset.mailAbout); });

  // Old ?topic= links to the enquire page land on the matching email.
  const topic = new URLSearchParams(location.search).get('topic');
  const picked = topic && $(`[data-mail-row="${CSS.escape(topic)}"]`);
  if (picked) { picked.classList.add('is-picked'); picked.scrollIntoView({ block: 'center' }); }

  // Giving happens off the site. The Give button appears once config.js has a real giving URL;
  // until then the page shows the email note instead.
  const givingUrl = C.givingUrl && safeUrl(C.givingUrl);
  if (givingUrl) {
    $$('[data-giving]').forEach((a) => { a.href = givingUrl.href; a.hidden = false; });
    $$('[data-giving-off]').forEach((n) => { n.hidden = true; });
  }

  /* ---------- Motion ---------- */
  // Headings split into masked words that slide up once on screen.
  $$('main .h2, main .h1[data-words]').forEach((h) => {
    if (h.children.length) return;
    const text = h.textContent.trim();
    h.setAttribute('aria-label', text);
    h.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true"><span>${esc(w)}</span></span>`).join(' ');
    staggered($$('.w > span', h), 55);
    h.classList.add('words');
  });
  const parts = $$('.rise, .words, .shot, [data-rise] > *');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.filter((x) => x.isIntersecting).forEach((x, i) => {
        if (!x.target.classList.contains('words')) x.target.style.setProperty('--delay', i * 70 + 'ms');
        x.target.classList.add('in');
        io.unobserve(x.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    parts.forEach((el) => { if (!el.matches('.words, .shot')) el.classList.add('rise'); io.observe(el); });
  } else parts.forEach((el) => el.classList.add('in'));

  // Videos load and play only while on screen.
  const vids = $$('video[data-src]');
  if (vids.length && 'IntersectionObserver' in window) {
    const vio = new IntersectionObserver((es) => es.forEach((x) => {
      const v = x.target;
      if (x.isIntersecting) { if (!v.src) { v.src = v.dataset.src; v.load(); } if (!reduce) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    }), { rootMargin: '200px 0px' });
    vids.forEach((v) => vio.observe(v));
  }

  // TikTok stage (wide screens): the side windows scroll past the pinned one at their own speeds.
  const stage = $('[data-phones]');
  if (stage && !reduce) {
    const wide = matchMedia('(min-width: 1051px)');
    const phones = $$('.phone[data-speed]', stage);
    let ticking = false;
    const move = () => {
      ticking = false;
      if (!wide.matches) return;
      const r = stage.getBoundingClientRect();
      const vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      const p = (vh - r.top) / (vh + r.height);
      phones.forEach((ph) => ph.style.setProperty('--py', ((.5 - p) * parseFloat(ph.dataset.speed) * vh * .9).toFixed(1) + 'px'));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
})();
