/* Shared behaviour: nav, Latest panel, data-driven lists, forms, donations and motion.
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
  // Clean user input: drop control characters and angle brackets, collapse spaces, cap the length.
  const clean = (v, max = 200, multiline = false) => {
    let s = String(v ?? '').normalize('NFC');
    s = multiline ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '') : s.replace(/[\u0000-\u001F\u007F]/g, ' ');
    s = s.replace(/[<>]/g, '');
    s = multiline ? s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n') : s.replace(/\s+/g, ' ');
    return s.trim().slice(0, max);
  };
  const EMAIL = /^[A-Za-z0-9._%+'-]{1,64}@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;
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

  let toastTimer;
  const toast = (msg) => {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 4200);
  };

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
  const tag = (a) => `<i class="tag tag--${esc(a)}">${esc(D.audiences[a]?.name || a)}</i>`;
  const newsCard = (e) => {
    const href = e.link || D.audiences[e.aud[0]]?.page || '#';
    return `<a class="news-card" href="${esc(href)}"${extLink(href)}><img src="${esc(img(e.img))}" alt="" width="88" height="88" loading="lazy" decoding="async"><span><b>${esc(e.title)}</b><small>${tag(e.aud[0])}${esc(when(e))}</small></span></a>`;
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
        <div class="tl__go"><span class="tl__status">${esc(e.status || '')}</span><a class="btn btn--glass" href="${esc(href)}"${extLink(href)}>Details</a></div>
      </li>`;
    }).join('') || '<li class="tl__month">Nothing is booked yet. New dates appear here first.</li>';
  });

  $$('select[data-events]').forEach((sel) => {
    pick(sel.dataset.events, upcoming()).forEach((e) => sel.add(new Option(`${e.title} · ${when(e)}`, e.title)));
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

  /* ---------- Forms ---------- */
  // Validation uses the fields' own attributes (required, type, minlength, maxlength, pattern)
  // and writes the message next to the field.
  const messages = {
    valueMissing: 'Please fill this in.',
    typeMismatch: 'Please enter a valid email address.',
    tooShort: (el) => `Please use at least ${el.minLength} characters.`,
    tooLong: (el) => `Please keep this under ${el.maxLength} characters.`,
    patternMismatch: (el) => el.dataset.hint || 'Please check the format.',
    rangeUnderflow: (el) => `The minimum is ${el.min}.`,
    rangeOverflow: (el) => `The maximum is ${el.max}.`,
  };
  const errorFor = (el) => {
    const host = el.closest('.field') || el.closest('.check');
    if (!host) return null;
    let err = $('.field__error', host);
    if (!err) {
      err = document.createElement('span');
      err.className = 'field__error';
      err.id = `${el.name || 'f'}-err-${Math.random().toString(36).slice(2, 7)}`;
      host.append(err);
      el.setAttribute('aria-describedby', [el.getAttribute('aria-describedby'), err.id].filter(Boolean).join(' '));
    }
    return err;
  };
  const checkField = (el) => {
    if (el.type === 'email' && el.value && !EMAIL.test(el.value.trim())) el.setCustomValidity('email');
    else el.setCustomValidity('');
    const v = el.validity;
    const err = errorFor(el);
    const key = Object.keys(messages).find((k) => v[k]) || (v.customError ? 'typeMismatch' : null);
    const msg = key ? (typeof messages[key] === 'function' ? messages[key](el) : messages[key]) : '';
    if (el.type === 'radio' || el.type === 'checkbox') {
      const group = el.closest('fieldset') || el.closest('.check');
      const gErr = group && (($('.field__error', group)) || errorFor(el));
      if (gErr) gErr.textContent = msg;
    } else if (err) err.textContent = msg;
    el.setAttribute('aria-invalid', String(!!msg));
    return !msg;
  };
  const validate = (form) => {
    const fields = $$('input, select, textarea', form).filter((el) => !el.closest('[hidden]') && !el.closest('.hp') && el.willValidate);
    const seen = new Set();
    let first = null;
    fields.forEach((el) => {
      if (el.type === 'radio') { if (seen.has(el.name)) return; seen.add(el.name); }
      if (!checkField(el) && !first) first = el;
    });
    if (first) first.focus();
    return !first;
  };
  $$('form[novalidate]').forEach((f) => f.addEventListener('change', (e) => { if (e.target.matches('[aria-invalid="true"]') || e.target.type === 'radio') checkField(e.target); }));

  const val = (f, n, max, multi) => clean(f.elements[n]?.value, max, multi);
  const checked = (f, n) => $$(`[name="${n}"]:checked`, f).map((i) => clean(i.value, 80));
  const isBot = (f) => !!(f.elements.website && f.elements.website.value);
  const cool = (btn) => { btn.disabled = true; setTimeout(() => { btn.disabled = false; }, 6000); };

  // Delivery: a configured HTTPS endpoint if there is one, otherwise the visitor's email app.
  const deliver = async ({ to, subject, fields }) => {
    const endpoint = C.formEndpoint && safeUrl(C.formEndpoint);
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, subject, fields }),
      });
      if (!res.ok) throw new Error('send failed');
      return 'sent';
    }
    const body = Object.entries(fields).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n');
    location.href = `mailto:${encodeURIComponent(to).replace(/%2C/g, ',').replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nSent from ymt.org')}`;
    return 'mail';
  };
  const finish = (form, status, sentMsg, mailMsg) => {
    const out = $('.form__done', form);
    if (out) { out.textContent = status === 'sent' ? sentMsg : mailMsg; out.hidden = false; }
  };
  const fail = (form) => {
    const out = $('.form__done', form);
    if (out) { out.textContent = `That didn't send. Please email ${C.enquiryTo} directly.`; out.hidden = false; }
  };

  // Enquiry: the subject is set from the email address and the choices.
  const enquiry = $('[data-enquiry]');
  if (enquiry) {
    const q = new URLSearchParams(location.search);
    const pre = { role: { school: 'School staff', parent: 'A parent or carer', young: 'A young person', group: 'Parish or group leader' }, topic: { retreat: 'A retreat', village: 'Staying at the Village', event: 'An event', volunteer: 'Volunteering' } };
    ['role', 'topic'].forEach((k) => {
      const v = pre[k][q.get(k)];
      const r = v && $$(`[name="${k}"]`, enquiry).find((x) => x.value === v);
      if (r) r.checked = true;
    });
    const out = $('[data-subject]', enquiry);
    const schoolLike = (d) => /(\.sch\.uk|\.ac\.uk|school|academy|college)/i.test(d);
    const subjectFor = () => {
      const email = val(enquiry, 'email', 254).toLowerCase();
      const domain = email.split('@')[1] || '';
      const role = checked(enquiry, 'role')[0] || '';
      const topic = checked(enquiry, 'topic')[0] || '';
      const isSchool = role === 'School staff' || schoolLike(domain);
      const known = (C.knownSchoolDomains || []).includes(domain);
      let type = 'General Enquiry';
      if (topic === 'A retreat' || topic === 'Staying at the Village') type = 'Booking Enquiry';
      else if (isSchool) type = known ? 'School Enquiry' : 'New School Enquiry';
      const extra = type === 'Booking Enquiry' ? [topic, isSchool ? (known ? 'School' : 'New school') : ''] : [];
      const who = val(enquiry, 'org', 120) || val(enquiry, 'name', 80);
      return { type, isSchool, known, role, topic, subject: ['[YMT] ' + type, ...extra.filter(Boolean), who].filter(Boolean).join(' · ') };
    };
    const show = () => {
      const s = subjectFor();
      out.textContent = s.subject;
      $('[data-school-row]', enquiry).hidden = !s.isSchool && s.role !== 'Parish or group leader';
    };
    enquiry.addEventListener('input', show);
    enquiry.addEventListener('change', show);
    show();
    enquiry.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isBot(enquiry) || !validate(enquiry)) return;
      const s = subjectFor();
      const btn = $('button[type="submit"]', enquiry); cool(btn);
      try {
        const status = await deliver({
          to: s.type === 'Booking Enquiry' ? `${C.bookingsTo},${C.enquiryTo}` : C.enquiryTo,
          subject: s.subject,
          fields: {
            Type: s.type, Name: val(enquiry, 'name', 80), Email: val(enquiry, 'email', 254), Phone: val(enquiry, 'phone', 30),
            'I am': s.role, About: s.topic, 'School / parish / group': val(enquiry, 'org', 120), 'Known school': s.isSchool ? (s.known ? 'Yes' : 'No') : '',
            'Group size': val(enquiry, 'size', 6), 'Preferred dates': val(enquiry, 'when', 120), Message: val(enquiry, 'message', 2000, true),
          },
        });
        finish(enquiry, status, 'Thanks. Your enquiry has been sent and the team will reply by email.', `Your email app should now be open with the subject "${s.subject}". Press send to finish.`);
      } catch { fail(enquiry); }
    });
  }

  // Event updates (16+) and volunteer sign-up.
  $$('[data-signup]').forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isBot(f) || !validate(f)) return;
    const kind = f.dataset.signup;
    const event = val(f, 'event', 160);
    const roles = checked(f, 'roles');
    const subject = kind === 'updates' ? `[YMT] Event updates · ${event}` : `[YMT] Volunteer sign-up · ${roles.join(', ') || 'Any role'} · ${event || 'Any event'}`;
    const btn = $('button[type="submit"]', f); cool(btn);
    try {
      const status = await deliver({
        to: C.enquiryTo, subject,
        fields: { Name: val(f, 'name', 80), Email: val(f, 'email', 254), Age: val(f, 'age', 10), 'School / parish': val(f, 'parish', 120), Event: event, Roles: roles.join(', '), Message: val(f, 'message', 2000, true) },
      });
      const sentMsg = kind === 'updates' ? 'Thanks. We will email you the times and kit list for your event.' : 'Thanks. The team will be in touch about next steps and safeguarding checks.';
      finish(f, status, sentMsg, 'Your email app should now be open. Press send to finish.');
    } catch { fail(f); }
  }));

  // Donations: a reference built from the gift, passed to Stripe and shown for bank transfers.
  const give = $('[data-donate]');
  if (give) {
    const stripe = C.stripePaymentLink && safeUrl(C.stripePaymentLink, ['buy.stripe.com', 'donate.stripe.com']);
    const card = $('[data-card]', give);
    if (!stripe && card) { card.hidden = true; $('[data-card-off]', give).hidden = false; }
    const bankBox = $('[data-bank]');
    if (bankBox) {
      if (C.bank && C.bank.sortCode) {
        [['name', C.bank.name], ['sort', C.bank.sortCode], ['account', C.bank.account]].forEach(([k, v]) => { $(`[data-bank-${k}]`, bankBox).textContent = clean(v, 60); });
        bankBox.hidden = false;
      } else bankBox.hidden = true;
    }
    const codes = { 'Where it is needed most': 'GEN', 'Lourdes bursaries': 'LDS', 'The Village': 'VIL', 'The Internship': 'INT' };
    const rand = Array.from(crypto.getRandomValues(new Uint8Array(3)), (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 4).toUpperCase();
    const stamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const amount = () => {
      const other = parseFloat(val(give, 'other', 8));
      const a = Number.isFinite(other) && other > 0 ? other : parseFloat(checked(give, 'amount')[0] || '0');
      return Math.min(Math.max(a, 0), 100000);
    };
    const monthly = () => checked(give, 'freq')[0] === 'Monthly';
    const ref = () => `YMT-${codes[val(give, 'fund', 40)] || 'GEN'}${monthly() ? 'M' : ''}-${stamp}-${rand}`;
    const show = () => {
      $$('[data-ref]').forEach((o) => { o.textContent = ref(); });
      const a = amount();
      const giftAid = give.elements.giftaid.checked;
      $('[data-total]', give).textContent = a ? `£${a.toFixed(a % 1 ? 2 : 0)}${monthly() ? ' a month' : ''}${giftAid ? ` · £${(a * 1.25).toFixed(2)} with Gift Aid` : ''}` : 'Choose an amount';
    };
    give.addEventListener('input', (e) => { if (e.target.name === 'other' && e.target.value) $$('[name="amount"]', give).forEach((r) => { r.checked = false; }); show(); });
    give.addEventListener('change', (e) => { if (e.target.name === 'amount') give.elements.other.value = ''; show(); });
    show();
    give.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!amount()) { toast('Please choose an amount.'); return; }
      if (!validate(give) || !stripe) return;
      const u = new URL(stripe.href);
      u.searchParams.set('client_reference_id', ref());
      const email = val(give, 'email', 254);
      if (EMAIL.test(email)) u.searchParams.set('prefilled_email', email);
      location.assign(u.href);
    });
    $$('[data-copy]').forEach((b) => b.addEventListener('click', () => {
      navigator.clipboard?.writeText(ref()).then(() => toast('Reference copied: ' + ref()), () => toast(ref()));
    }));
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
