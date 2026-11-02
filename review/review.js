/* Review layer for staging (staging only: remove at launch). Invited reviewers tap Comment, point at
   any element (an inspector labels it), and leave a thread pinned to it. Threads are shared through
   /api/review/* (Cloudflare Pages Functions + D1). Production ymt.org never shows it. */
(async () => {
  // ---- Settings ----
  // The Cloudflare staging site where comments live. The GitHub Pages mirror links here.
  const STAGING_URL = 'PLACEHOLDER_STAGING_URL';
  const API = '/api/review';
  // -------------------

  const host = location.hostname;
  const isStagingHost = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.pages.dev');
  const isMirror = host.endsWith('github.io');
  if (!isStagingHost && !isMirror) return;
  // Cloudflare Pages serves /primary.html as /primary, so page names are normalised to the file.
  const last = location.pathname.split('/').pop();
  const here = !last ? 'index.html' : last.endsWith('.html') ? last : last + '.html';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const style = document.createElement('style');
  style.textContent = `
    .rv { position: fixed; z-index: 2147483000; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: grid; justify-items: end; gap: 10px; font: 500 14px/1.35 var(--sans, system-ui, sans-serif); color: var(--ink, #100c15); }
    .rv__bar { display: flex; gap: 8px; }
    .rv__btn { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: rgba(255, 255, 255, .86); color: var(--ink, #100c15); font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; box-shadow: 0 6px 24px rgba(16, 12, 21, .35), inset 0 0 0 1px rgba(255, 255, 255, .7); backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%); }
    @supports not (backdrop-filter: blur(1px)) { .rv__btn { background: #fff; } }
    .rv__btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
    .rv__btn[aria-pressed="true"] { background: var(--gold, #f2c24a); }
    .rv :focus-visible { outline: 3px solid var(--gold, #f2c24a); outline-offset: 3px; }
    .rv__card { width: min(380px, calc(100vw - 32px)); max-height: min(64vh, 560px); overflow: auto; padding: 16px; border-radius: 16px; background: var(--ink, #100c15); color: #fff; box-shadow: 0 10px 40px rgba(16, 12, 21, .45), 0 0 0 1px rgba(255, 255, 255, .14); }
    .rv__card h2 { margin: 0 0 8px; font: 700 16px/1.2 var(--sans, system-ui, sans-serif); }
    .rv__card p { margin: 0 0 10px; color: rgba(255, 255, 255, .82); }
    .rv__row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .rv__ghost, .rv__solid { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 999px; font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
    .rv__ghost { border: 1px solid rgba(255, 255, 255, .5); background: transparent; color: inherit; }
    .rv__ghost[aria-pressed="true"] { background: #fff; color: #100c15; }
    .rv__solid { border: 0; background: #fff; color: #100c15; }
    .rv__where { display: block; margin-bottom: 6px; font: 400 11px/1.3 var(--mono, ui-monospace, monospace); text-transform: uppercase; color: rgba(255, 255, 255, .62); }
    .rv__list { display: grid; gap: 10px; margin: 8px 0 0; padding: 0; list-style: none; }
    .rv__list > li { display: grid; grid-template-columns: 30px 1fr; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, .14); }
    .rv__list > li.is-done { opacity: .6; }
    .rv__msg { margin: 0 0 8px; }
    .rv__msg b { font-weight: 700; }
    .rv__msg small { color: rgba(255, 255, 255, .6); }
    .rv__msg div, .rv__text { white-space: pre-wrap; overflow-wrap: anywhere; }
    .rv__num, .rv-pin { display: inline-grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; background: var(--gold, #f2c24a); color: #100c15; font: 700 13px/1 var(--mono, ui-monospace, monospace); }
    .rv textarea { box-sizing: border-box; width: 100%; min-height: 96px; margin: 6px 0 0; padding: 10px 12px; border: 0; border-radius: 10px; background: #fff; color: #100c15; font: 400 15px/1.4 var(--sans, system-ui, sans-serif); resize: vertical; }
    .rv label { display: block; font-weight: 600; }
    .rv__err { color: #ffb4ab; }
    html.rv-picking, html.rv-picking * { cursor: crosshair !important; }
    .rv-box { position: fixed; z-index: 2147482990; pointer-events: none; border: 2px solid var(--gold, #f2c24a); border-radius: 4px; background: rgba(242, 194, 74, .14); }
    .rv-chip { position: fixed; z-index: 2147482995; pointer-events: none; max-width: min(440px, calc(100vw - 16px)); padding: 5px 9px; border-radius: 6px; background: #100c15; color: #fff; font: 500 12px/1.3 var(--mono, ui-monospace, monospace); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 4px 16px rgba(0, 0, 0, .35); }
    .rv-chip i { font-style: normal; color: var(--gold, #f2c24a); }
    .rv-pin { position: absolute; z-index: 2147482980; transform: translate(-50%, -50%); border: 0; box-shadow: 0 2px 10px rgba(16, 12, 21, .4), 0 0 0 2px #fff; cursor: pointer; animation: rv-pop .3s cubic-bezier(.16, 1, .3, 1) both; }
    .rv-pin.is-done { background: #c9c3cf; }
    .rv-flash { outline: 3px solid var(--gold, #f2c24a) !important; outline-offset: 3px !important; }
    @keyframes rv-pop { from { transform: translate(-50%, -50%) scale(.4); opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .rv-pin { animation: none; } }
  `;
  document.head.appendChild(style);

  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>';
  const box = make('div', 'rv');
  box.setAttribute('data-uncommentable', '');
  document.body.appendChild(box);

  // On phones the home film's own controls sit in this corner, so the bar waits until it scrolls away.
  const film = document.querySelector('.hero');
  let pickingNow = false;
  if (film && 'IntersectionObserver' in window && matchMedia('(max-width: 700px)').matches) {
    new IntersectionObserver(([entry]) => { box.hidden = entry.intersectionRatio > 0.3 && !pickingNow; }, { threshold: [0, 0.3, 1] }).observe(film);
  }

  /* ---------- GitHub Pages mirror: point to the staging site ---------- */
  if (isMirror) {
    if (STAGING_URL.startsWith('PLACEHOLDER')) return;
    const link = make('a', 'rv__btn');
    link.href = STAGING_URL.replace(/\/$/, '') + '/' + here;
    link.innerHTML = icon + '<span>Leave feedback</span>';
    box.appendChild(link);
    return;
  }

  /* ---------- Who is reviewing ---------- */
  const call = async (path, options = {}) => {
    const res = await fetch(API + path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', 'x-review': '1', ...(options.headers || {}) } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { status: res.status });
    return data;
  };
  // Only invited browsers (they carry the ymt_review_on flag) talk to the API, so ordinary visitors
  // make no requests and see nothing.
  const invited = document.cookie.split(/;\s*/).includes('ymt_review_on=1');
  let me = null;
  if (invited) { try { me = await call('/me'); } catch { me = null; } }
  if (!me) {
    // Staging without an invite cookie: say how to get in, and nothing else.
    if (!new URLSearchParams(location.search).has('review')) return;
    const note = make('div', 'rv__card');
    note.append(make('h2', '', 'Comments'), make('p', '', 'Open the invite link Eva sent you to leave comments on this site.'));
    box.appendChild(note);
    return;
  }

  /* ---------- Inspector ---------- */
  const PICKABLE = 'h1, h2, h3, h4, p, li, figure, img, video, blockquote, a, button, address, dl, .who__card, .info__card, .shot, .bite, .tl__item, .news-card, .feel__line, .phero__photo, section';
  const own = (node) => node instanceof Element && !!node.closest('.rv, .rv-pin, .rv-box, .rv-chip');
  const targetFor = (node) => (!(node instanceof Element) || own(node) ? null : node.closest(PICKABLE) || node);
  const kindOf = (el) => {
    const kinds = [['.who__card', 'Route card'], ['.bite', 'Download'], ['.tl__item', 'Event'], ['.news-card', 'Latest card'], ['.info__card', 'Info card'], ['h1, h2, h3, h4', 'Heading'], ['img, figure, .shot, .phero__photo', 'Photo'], ['video', 'Video'], ['a.btn, button, a[data-mail]', 'Button'], ['a', 'Link'], ['blockquote', 'Quote'], ['li', 'List item'], ['section', 'Section']];
    return (kinds.find(([sel]) => el.matches(sel)) || [0, 'Text'])[1];
  };
  const labelOf = (el) => {
    const img = el.matches('img') ? el : el.querySelector('img');
    const text = (el.getAttribute('aria-label') || (el.matches('img, figure, .shot, .phero__photo') && img?.alt) || el.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 60 ? text.slice(0, 57) + '…' : text;
  };
  const cssPath = (el) => {
    const parts = [];
    for (let node = el; node && node !== document.body && parts.length < 8; node = node.parentElement) {
      if (node.id) { parts.unshift('#' + CSS.escape(node.id)); break; }
      const cls = [...node.classList].filter((c) => !c.startsWith('rv') && !['in', 'rise', 'words', 'is-on', 'is-open', 'is-pressed'].includes(c))[0];
      const same = node.parentElement ? [...node.parentElement.children].filter((s) => s.tagName === node.tagName) : [];
      parts.unshift(node.tagName.toLowerCase() + (cls ? '.' + CSS.escape(cls) : '') + (same.length > 1 ? `:nth-of-type(${same.indexOf(node) + 1})` : ''));
    }
    return parts.join(' > ');
  };
  const hoverBox = make('div', 'rv-box'); hoverBox.hidden = true;
  const chip = make('div', 'rv-chip'); chip.hidden = true;
  document.body.append(hoverBox, chip);
  let hovered = null;
  const showHover = (el) => {
    hovered = el;
    if (!el) { hoverBox.hidden = true; chip.hidden = true; return; }
    const r = el.getBoundingClientRect();
    Object.assign(hoverBox.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const text = labelOf(el);
    chip.replaceChildren(make('i', '', kindOf(el)), document.createTextNode(`${text ? ' · ' + text : ''} · ${Math.round(r.width)}×${Math.round(r.height)}`));
    chip.style.left = Math.max(8, Math.min(r.left, innerWidth - 300)) + 'px';
    chip.style.top = (r.top > 34 ? r.top - 30 : r.bottom + 6) + 'px';
    hoverBox.hidden = false; chip.hidden = false;
  };

  /* ---------- Bar, card and drawer ---------- */
  const bar = make('div', 'rv__bar');
  const drawerBtn = make('button', 'rv__btn'); drawerBtn.type = 'button'; drawerBtn.setAttribute('aria-expanded', 'false');
  const pickBtn = make('button', 'rv__btn'); pickBtn.type = 'button'; pickBtn.setAttribute('aria-pressed', 'false');
  pickBtn.innerHTML = icon; const pickLabel = make('span', '', 'Comment'); pickBtn.append(pickLabel);
  bar.append(drawerBtn, pickBtn);
  const card = make('div', 'rv__card'); card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Comments');
  box.append(card, bar);
  const showCard = (...children) => { card.replaceChildren(...children); card.hidden = false; };
  const hideCard = () => { card.hidden = true; card.replaceChildren(); drawerBtn.setAttribute('aria-expanded', 'false'); };
  const error = (err) => make('p', 'rv__err', err.message || String(err));

  let threads = [];
  let filter = 'open';
  const pins = [];
  const anchorEl = (t) => { try { return document.querySelector(t.anchor); } catch { return null; } };
  const render = () => {
    pins.splice(0).forEach((p) => p.remove());
    const open = threads.filter((t) => t.status === 'open').length;
    drawerBtn.textContent = `Comments on this page (${open})`;
    threads.forEach((t, i) => {
      const el = anchorEl(t);
      if (!el || (filter !== 'all' && t.status !== filter)) return;
      const r = el.getBoundingClientRect();
      const pin = make('button', 'rv-pin' + (t.status === 'resolved' ? ' is-done' : ''), String(i + 1));
      pin.type = 'button';
      pin.setAttribute('aria-label', `Comment ${i + 1} by ${t.comments[0]?.author || 'a reviewer'}: ${(t.comments[0]?.text || '').slice(0, 80)}`);
      pin.style.left = (r.left + scrollX + Math.min(r.width / 2, 20)) + 'px';
      pin.style.top = (r.top + scrollY + Math.min(r.height / 2, 20)) + 'px';
      pin.addEventListener('click', () => openThread(t.id));
      document.body.appendChild(pin);
      pins.push(pin);
    });
  };
  const refresh = async () => {
    try { threads = (await call(`/threads?page=${encodeURIComponent(here)}`)).threads; } catch { threads = []; }
    render();
  };
  const message = (c) => {
    const m = make('div', 'rv__msg');
    const who = make('div'); who.append(make('b', '', c.author), make('small', '', ` · ${c.role} · ${c.date}`));
    m.append(who, make('div', '', c.text));
    return m;
  };

  const openThread = (id) => {
    const t = threads.find((x) => x.id === id);
    if (!t) return;
    const n = threads.indexOf(t) + 1;
    const el = anchorEl(t);
    if (el) { el.classList.add('rv-flash'); setTimeout(() => el.classList.remove('rv-flash'), 1600); }
    const head = make('span', 'rv__where', `#${n} · ${t.location || t.anchor}${t.status === 'resolved' ? ' · resolved' : ''}`);
    const msgs = t.comments.map(message);
    const label = make('label', '', 'Your reply'); const area = make('textarea'); area.id = 'rv-reply'; area.maxLength = 2000; label.htmlFor = 'rv-reply';
    const send = make('button', 'rv__solid', 'Reply'); send.type = 'button';
    const close = make('button', 'rv__ghost', 'Close'); close.type = 'button'; close.addEventListener('click', () => { hideCard(); pickBtn.focus(); });
    const row = make('div', 'rv__row'); row.append(send);
    if (me.role === 'owner') {
      const toggle = make('button', 'rv__ghost', t.status === 'resolved' ? 'Reopen' : 'Resolve'); toggle.type = 'button';
      toggle.addEventListener('click', async () => { try { await call(`/threads/${t.id.slice(1)}/resolve`, { method: 'POST', body: JSON.stringify({ status: t.status === 'resolved' ? 'open' : 'resolved' }) }); await refresh(); openThread(id); } catch (err) { card.append(error(err)); } });
      const del = make('button', 'rv__ghost', 'Delete as spam'); del.type = 'button';
      del.addEventListener('click', async () => { if (!confirm('Delete this thread for everyone?')) return; try { await call(`/threads/${t.id.slice(1)}`, { method: 'DELETE' }); await refresh(); hideCard(); } catch (err) { card.append(error(err)); } });
      row.append(toggle, del);
    }
    row.append(close);
    send.addEventListener('click', async () => {
      const text = area.value.trim(); if (!text) { area.focus(); return; }
      send.disabled = true;
      try { await call(`/threads/${t.id.slice(1)}/replies`, { method: 'POST', body: JSON.stringify({ text }) }); await refresh(); openThread(id); } catch (err) { send.disabled = false; card.append(error(err)); }
    });
    showCard(head, ...msgs, label, area, row);
  };

  const openDrawer = () => {
    const tabs = make('div', 'rv__row');
    [['open', 'Open'], ['resolved', 'Resolved'], ['all', 'All']].forEach(([value, text]) => {
      const b = make('button', 'rv__ghost', text); b.type = 'button'; b.setAttribute('aria-pressed', String(filter === value));
      b.addEventListener('click', () => { filter = value; render(); openDrawer(); });
      tabs.append(b);
    });
    const list = make('ol', 'rv__list');
    threads.forEach((t, i) => {
      if (filter !== 'all' && t.status !== filter) return;
      const li = make('li', t.status === 'resolved' ? 'is-done' : '');
      const body = make('div');
      body.append(make('span', 'rv__where', t.location || t.anchor), make('div', 'rv__text', `${t.comments[0]?.author}: ${t.comments[0]?.text || ''}`));
      const view = make('button', 'rv__ghost', `Open (${t.comments.length})`); view.type = 'button';
      view.addEventListener('click', () => { anchorEl(t)?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); openThread(t.id); });
      const r = make('div', 'rv__row'); r.append(view); body.append(r);
      li.append(make('span', 'rv__num', String(i + 1)), body);
      list.append(li);
    });
    const empty = list.children.length ? [] : [make('p', '', filter === 'open' ? 'No open comments on this page. Tap Comment to add one.' : 'Nothing here yet.')];
    const close = make('button', 'rv__ghost', 'Close'); close.type = 'button'; close.addEventListener('click', hideCard);
    const foot = make('div', 'rv__row'); foot.append(close);
    showCard(make('h2', '', `Comments on this page (${threads.length})`), make('p', '', `Signed in as ${me.name} (${me.role}).`), tabs, ...empty, list, foot);
    drawerBtn.setAttribute('aria-expanded', 'true');
  };
  drawerBtn.addEventListener('click', () => (drawerBtn.getAttribute('aria-expanded') === 'true' ? hideCard() : openDrawer()));

  // Turnstile, only on a reviewer's first comment and only once Eva has added keys.
  const turnstile = async (into) => {
    if (!me.turnstile) return null;
    if (!window.turnstile) {
      await new Promise((resolve, reject) => { const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.onload = resolve; s.onerror = reject; document.head.appendChild(s); });
    }
    return new Promise((resolve) => { const slot = make('div'); into.append(slot); window.turnstile.render(slot, { sitekey: me.turnstile, callback: resolve, 'error-callback': () => resolve(null), 'expired-callback': () => resolve(null) }); });
  };

  const compose = async (el) => {
    const where = `${kindOf(el)}${labelOf(el) ? ' · ' + labelOf(el) : ''}`;
    const label = make('label', '', 'What would you like changed?');
    const area = make('textarea'); area.id = 'rv-text'; area.maxLength = 2000; label.htmlFor = 'rv-text';
    const post = make('button', 'rv__solid', 'Post comment'); post.type = 'button';
    const cancel = make('button', 'rv__ghost', 'Cancel'); cancel.type = 'button';
    const row = make('div', 'rv__row'); row.append(post, cancel);
    showCard(make('span', 'rv__where', where), label, area, row);
    el.classList.add('rv-flash');
    area.focus();
    const finish = () => { el.classList.remove('rv-flash'); hideCard(); pickBtn.focus(); };
    cancel.addEventListener('click', finish);
    const check = turnstile(card).catch(() => null);
    post.addEventListener('click', async () => {
      const text = area.value.trim(); if (!text) { area.focus(); return; }
      post.disabled = true;
      try {
        const body = { page: here, anchor: cssPath(el), location: where, quote: labelOf(el), viewport: innerWidth, text, turnstile: await check };
        await call('/threads', { method: 'POST', body: JSON.stringify(body) });
        me.turnstile = null; // checked once
        await refresh();
        finish();
      } catch (err) { post.disabled = false; card.append(error(err)); }
    });
  };

  /* ---------- Picking ---------- */
  const setPicking = (on) => {
    pickingNow = on;
    document.documentElement.classList.toggle('rv-picking', on);
    pickBtn.setAttribute('aria-pressed', String(on));
    pickLabel.textContent = on ? 'Tap what to change · Esc to stop' : 'Comment';
    if (!on) showHover(null);
  };
  pickBtn.addEventListener('click', () => { hideCard(); setPicking(!pickingNow); });
  document.addEventListener('pointermove', (event) => { if (pickingNow) { const t = targetFor(event.target); if (t !== hovered) showHover(t); } }, true);
  addEventListener('scroll', () => { if (pickingNow && hovered) showHover(hovered); }, { passive: true });
  document.addEventListener('click', (event) => {
    if (!pickingNow || own(event.target)) return;
    const target = targetFor(event.target);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    setPicking(false);
    compose(target);
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (pickingNow) setPicking(false);
    else if (!card.hidden && box.contains(document.activeElement)) { hideCard(); pickBtn.focus(); }
  });

  await refresh();
  addEventListener('load', render);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 150); });
  setTimeout(render, 1500); // reveals move things after load
})();
