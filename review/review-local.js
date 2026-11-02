/* Comments on the GitHub Pages preview (loaded by review/review.js while the Cloudflare comment site isn't set
   up). Reviewers tap Comment, point at anything (an inspector labels it) and write what they'd like changed.
   Comments are saved in the reviewer's own browser and pinned on the page; "Email to Eva" sends them as a
   readable list, and Download gives the review/comments.json format. Not part of the live site. */
(async () => {
  const STORE = 'ymt-review-comments';
  const NAME = 'ymt-review-name';
  if (!location.hostname.endsWith('github.io')) return;
  const inClaude = false;
  const composer = null;

  const style = document.createElement('style');
  style.textContent = `
    .rv { position: fixed; z-index: 2147483000; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: grid; justify-items: end; gap: 10px; font: 500 14px/1.3 var(--sans, system-ui, sans-serif); color: var(--ink, #100c15); }
    .rv__bar { display: flex; gap: 8px; }
    .rv__btn { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: var(--white, #fff); color: var(--ink, #100c15); font: inherit; font-weight: 600; cursor: pointer; box-shadow: 0 6px 24px rgba(16, 12, 21, .35), 0 0 0 1px rgba(16, 12, 21, .12); }
    .rv__btn:focus-visible, .rv button:focus-visible, .rv a:focus-visible, .rv textarea:focus-visible { outline: 3px solid var(--gold, #f2c24a); outline-offset: 3px; }
    .rv__btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
    .rv__btn[aria-pressed="true"] { background: var(--gold, #f2c24a); }
    .rv__btn--count { padding: 0 16px; }
    .rv__card { width: min(360px, calc(100vw - 32px)); max-height: min(60vh, 520px); overflow: auto; padding: 16px; border-radius: 16px; background: var(--ink, #100c15); color: var(--white, #fff); box-shadow: 0 10px 40px rgba(16, 12, 21, .45), 0 0 0 1px rgba(255, 255, 255, .14); }
    .rv__card b { display: block; margin-bottom: 6px; }
    .rv__card p { margin: 0 0 10px; color: rgba(255, 255, 255, .8); }
    .rv__row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .rv__ghost, .rv__solid { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border-radius: 999px; font: inherit; font-weight: 600; text-decoration: none; cursor: pointer; }
    .rv__ghost { border: 1px solid rgba(255, 255, 255, .5); background: transparent; color: inherit; }
    .rv__solid { border: 0; background: var(--white, #fff); color: var(--ink, #100c15); }
    .rv__list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
    .rv__list li { display: grid; grid-template-columns: 28px 1fr; gap: 10px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, .14); }
    .rv__list li.is-done { opacity: .55; }
    .rv__num, .rv-pin { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--gold, #f2c24a); color: var(--ink, #100c15); font: 700 13px/1 var(--mono, ui-monospace, monospace); }
    .rv__where { display: block; margin-bottom: 2px; font: 400 11px/1.3 var(--mono, ui-monospace, monospace); text-transform: uppercase; color: rgba(255, 255, 255, .6); }
    .rv__text { white-space: pre-wrap; overflow-wrap: anywhere; }
    .rv textarea { width: 100%; min-height: 96px; margin: 6px 0 0; padding: 10px 12px; border: 0; border-radius: 10px; background: #fff; color: #100c15; font: 400 15px/1.4 var(--sans, system-ui, sans-serif); resize: vertical; }
    .rv label { display: block; font-weight: 600; }
    html.rv-picking, html.rv-picking * { cursor: crosshair !important; }
    .rv-box { position: fixed; z-index: 2147482990; pointer-events: none; border: 2px solid var(--gold, #f2c24a); border-radius: 4px; background: rgba(242, 194, 74, .14); box-shadow: 0 0 0 9999px rgba(16, 12, 21, .12); transition: all .08s linear; }
    .rv-chip { position: fixed; z-index: 2147482995; pointer-events: none; max-width: min(420px, calc(100vw - 16px)); padding: 5px 9px; border-radius: 6px; background: var(--ink, #100c15); color: #fff; font: 500 12px/1.3 var(--mono, ui-monospace, monospace); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: 0 4px 16px rgba(0, 0, 0, .35); }
    .rv-chip i { font-style: normal; color: var(--gold, #f2c24a); }
    .rv-pin { position: absolute; z-index: 2147482980; transform: translate(-50%, -50%); border: 0; box-shadow: 0 2px 10px rgba(16, 12, 21, .4), 0 0 0 2px #fff; cursor: pointer; }
    .rv-pin.is-done { background: #c9c3cf; }
    .rv-flash { outline: 3px solid var(--gold, #f2c24a) !important; outline-offset: 3px !important; }
    @media (prefers-reduced-motion: reduce) { .rv-box { transition: none; } }
  `;
  document.head.appendChild(style);

  /* ---------- Inspector: what you are pointing at, labelled like devtools ---------- */
  const PICKABLE = 'h1, h2, h3, h4, p, li, figure, img, video, blockquote, a, button, address, dl, .who__card, .info__card, .shot, .bite, .tl__item, .news-card, .label, .feel__line, .phero__photo, section';
  const own = (node) => node instanceof Element && !!node.closest('.rv, .rv-pin, .rv-box, .rv-chip');
  const targetFor = (node) => {
    if (!(node instanceof Element) || own(node)) return null;
    return node.closest(PICKABLE) || node;
  };
  const kindOf = (el) => {
    if (el.matches('.who__card')) return 'Route card';
    if (el.matches('.bite')) return 'Download';
    if (el.matches('.tl__item')) return 'Event';
    if (el.matches('.news-card')) return 'Latest card';
    if (el.matches('.info__card')) return 'Info card';
    if (el.matches('.label')) return 'Section label';
    if (el.matches('h1, h2, h3, h4')) return 'Heading';
    if (el.matches('img, figure, .shot, .phero__photo')) return 'Photo';
    if (el.matches('video')) return 'Video';
    if (el.matches('a.btn, button, a[data-mail]')) return 'Button';
    if (el.matches('a')) return 'Link';
    if (el.matches('blockquote')) return 'Quote';
    if (el.matches('li')) return 'List item';
    if (el.matches('section')) return 'Section';
    return 'Text';
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
      const tag = node.tagName.toLowerCase();
      const cls = [...node.classList].filter((c) => !c.startsWith('rv') && !['in', 'rise', 'words', 'is-on', 'is-open'].includes(c))[0];
      const siblings = node.parentElement ? [...node.parentElement.children].filter((s) => s.tagName === node.tagName) : [];
      const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : '';
      parts.unshift(tag + (cls ? '.' + CSS.escape(cls) : '') + nth);
    }
    return parts.join(' > ');
  };

  const hoverBox = document.createElement('div'); hoverBox.className = 'rv-box'; hoverBox.hidden = true;
  const chip = document.createElement('div'); chip.className = 'rv-chip'; chip.hidden = true;
  document.body.append(hoverBox, chip);
  let picking = false;
  let hovered = null;
  const showHover = (el) => {
    hovered = el;
    if (!el) { hoverBox.hidden = true; chip.hidden = true; return; }
    const r = el.getBoundingClientRect();
    Object.assign(hoverBox.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    chip.textContent = '';
    const kind = document.createElement('i'); kind.textContent = kindOf(el);
    const text = labelOf(el);
    chip.append(kind, document.createTextNode(`${text ? ' · ' + text : ''} · ${Math.round(r.width)}×${Math.round(r.height)}`));
    chip.style.left = Math.max(8, Math.min(r.left, innerWidth - 300)) + 'px';
    chip.style.top = (r.top > 34 ? r.top - 30 : r.bottom + 6) + 'px';
    hoverBox.hidden = false; chip.hidden = false;
  };

  /* ---------- Panel ---------- */
  const box = document.createElement('div');
  box.className = 'rv';
  box.setAttribute('data-uncommentable', '');
  box.innerHTML = `
    <div class="rv__card" data-rv-card hidden></div>
    <div class="rv__bar">
      ${inClaude ? '' : '<button type="button" class="rv__btn rv__btn--count" aria-expanded="false" data-rv-list>Comments <span data-rv-count>0</span></button>'}
      <button type="button" class="rv__btn" aria-pressed="false" data-rv-pick>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>
        <span data-rv-label>Comment</span>
      </button>
    </div>`;
  document.body.appendChild(box);
  const pickBtn = box.querySelector('[data-rv-pick]');
  const pickLabel = box.querySelector('[data-rv-label]');
  const card = box.querySelector('[data-rv-card]');
  const listBtn = box.querySelector('[data-rv-list]');

  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const showCard = (...children) => { card.replaceChildren(...children); card.hidden = false; };
  const hideCard = () => { card.hidden = true; card.replaceChildren(); listBtn?.setAttribute('aria-expanded', 'false'); };

  const setPicking = (on) => {
    picking = on;
    document.documentElement.classList.toggle('rv-picking', on);
    pickBtn.setAttribute('aria-pressed', String(on));
    pickLabel.textContent = on ? 'Pick what to change · Esc to stop' : 'Comment';
    if (!on) showHover(null);
  };

  // First time Comment is pressed: say how it works (never on page load, so it covers nothing).
  const firstTip = () => {
    let seen = false;
    try { seen = localStorage.getItem('ymt-review-tip') === '1'; } catch { seen = false; }
    if (seen) return;
    try { localStorage.setItem('ymt-review-tip', '1'); } catch {}
    showCard(make('b', '', 'Review mode'), make('p', '', 'Point at anything (a heading, a photo, a button) and click it, then write what you would like changed. Esc stops.'));
    setTimeout(() => { if (card.querySelector('b')?.textContent === 'Review mode') hideCard(); }, 4500);
  };

  /* ---------- Local comments (staging) ---------- */
  const load = () => { try { return JSON.parse(localStorage.getItem(STORE) || '[]'); } catch { return []; } };
  const save = (all) => { try { localStorage.setItem(STORE, JSON.stringify(all)); } catch {} };
  const here = location.pathname.split('/').pop() || 'index.html';
  // Who is commenting: asked once, so Eva knows whose comments she's reading.
  const nameOf = () => { try { return localStorage.getItem(NAME) || ''; } catch { return ''; } };
  const pinLayer = [];

  const renderPins = () => {
    pinLayer.splice(0).forEach((p) => p.remove());
    if (inClaude) return;
    const all = load();
    if (listBtn) listBtn.querySelector('[data-rv-count]').textContent = String(all.filter((t) => t.status === 'open').length);
    all.forEach((t, i) => {
      if (t.page !== here) return;
      let el = null;
      try { el = t.anchor ? document.querySelector(t.anchor) : null; } catch { el = null; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pin = make('button', 'rv-pin' + (t.status === 'resolved' ? ' is-done' : ''), String(i + 1));
      pin.type = 'button';
      pin.setAttribute('aria-label', `Comment ${i + 1}: ${t.comments[0].text.slice(0, 80)}`);
      pin.style.left = (r.left + scrollX + Math.min(r.width - 14, 18)) + 'px';
      pin.style.top = (r.top + scrollY + Math.min(r.height - 14, 18)) + 'px';
      pin.addEventListener('click', () => openList(t.id));
      document.body.appendChild(pin);
      pinLayer.push(pin);
    });
  };

  const exportDoc = () => ({ source: `staging browser comments from ${location.origin}`, exported: new Date().toISOString(), threads: load() });
  const openList = (focusId) => {
    const all = load();
    const list = make('ol', 'rv__list');
    all.forEach((t, i) => {
      const li = make('li', t.status === 'resolved' ? 'is-done' : '');
      const body = make('div');
      body.append(make('span', 'rv__where', `${t.page} · ${t.location}`), make('div', 'rv__text', t.comments[0].text));
      const row = make('div', 'rv__row');
      const go = make('a', 'rv__ghost', 'Show');
      go.href = t.page === here ? '#' : `${t.page}#rv-${t.id}`;
      go.addEventListener('click', (e) => {
        if (t.page !== here) return;
        e.preventDefault();
        let el = null; try { el = document.querySelector(t.anchor); } catch { el = null; }
        if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('rv-flash'); setTimeout(() => el.classList.remove('rv-flash'), 1600); }
      });
      const done = make('button', 'rv__ghost', t.status === 'resolved' ? 'Reopen' : 'Done'); done.type = 'button';
      done.addEventListener('click', () => { const next = load(); next[i].status = next[i].status === 'resolved' ? 'open' : 'resolved'; save(next); renderPins(); openList(); });
      const del = make('button', 'rv__ghost', 'Delete'); del.type = 'button';
      del.addEventListener('click', () => { const next = load(); next.splice(i, 1); save(next); renderPins(); openList(); });
      row.append(go, done, del);
      body.append(row);
      li.append(make('span', 'rv__num', String(i + 1)), body);
      if (t.id === focusId) li.style.outline = '2px solid var(--gold, #f2c24a)';
      list.append(li);
    });
    const actions = make('div', 'rv__row');
    const copy = make('button', 'rv__solid', 'Copy as JSON'); copy.type = 'button';
    copy.addEventListener('click', () => navigator.clipboard?.writeText(JSON.stringify(exportDoc(), null, 2)).then(() => { copy.textContent = 'Copied'; }, () => { copy.textContent = 'Copy blocked: use Download'; }));
    const dl = make('a', 'rv__ghost', 'Download'); dl.download = 'comments.json';
    dl.href = URL.createObjectURL(new Blob([JSON.stringify(exportDoc(), null, 2)], { type: 'application/json' }));
    // Email: the comments written out as a list, in the reviewer's own email app.
    const mail = make('a', 'rv__solid', 'Email to Eva');
    const lines = all.map((t, n) => `${n + 1}. ${t.page.replace(/\.html$/, '')} · ${t.location}${t.status === 'resolved' ? ' (done)' : ''}\n   ${t.comments.map((c) => c.text).join('\n   ')}`);
    mail.href = `mailto:?subject=${encodeURIComponent(`YMT website comments${nameOf() ? ' from ' + nameOf() : ''}`)}&body=${encodeURIComponent(`Hi Eva,\n\nHere are my comments on the website preview:\n\n${lines.join('\n\n')}\n`)}`;
    const close = make('button', 'rv__ghost', 'Close'); close.type = 'button'; close.addEventListener('click', hideCard);
    actions.append(mail, copy, dl, close);
    copy.className = 'rv__ghost';
    const intro = make('p', '', all.length ? 'Saved in this browser. When you\'re done, press Email to Eva (add her address), or Download and attach the file.' : 'No comments yet. Tap Comment and click anything on the page.');
    showCard(make('b', '', `Comments (${all.length})`), intro, list, actions);
    listBtn?.setAttribute('aria-expanded', 'true');
  };
  listBtn?.addEventListener('click', () => (card.hidden || !card.querySelector('.rv__list') ? openList() : hideCard()));

  const compose = (el) => {
    const where = `${kindOf(el)}${labelOf(el) ? ' · ' + labelOf(el) : ''}`;
    const label = make('label', '', 'What would you like changed?');
    const area = make('textarea'); area.maxLength = 2000; area.id = 'rv-text'; label.htmlFor = 'rv-text';
    // First comment only: their name.
    const nameLabel = make('label', '', 'Your name');
    const name = make('input'); name.id = 'rv-name'; name.maxLength = 60; name.autocomplete = 'name'; nameLabel.htmlFor = 'rv-name';
    name.style.cssText = 'width:100%;min-height:40px;margin:4px 0 10px;padding:8px 10px;border:0;border-radius:10px;font:inherit';
    const askName = !nameOf();
    const ok = make('button', 'rv__solid', 'Save comment'); ok.type = 'button';
    const cancel = make('button', 'rv__ghost', 'Cancel'); cancel.type = 'button';
    const row = make('div', 'rv__row'); row.append(ok, cancel);
    showCard(make('span', 'rv__where', where), ...(askName ? [nameLabel, name] : []), label, area, row);
    el.classList.add('rv-flash');
    area.focus();
    const finish = () => { el.classList.remove('rv-flash'); hideCard(); pickBtn.focus(); };
    cancel.addEventListener('click', finish);
    ok.addEventListener('click', () => {
      const text = area.value.trim();
      if (!text) { area.focus(); return; }
      if (askName) { if (!name.value.trim()) { name.focus(); return; } try { localStorage.setItem(NAME, name.value.trim()); } catch {} }
      const all = load();
      all.push({ id: 'local-' + Date.now().toString(36), page: here, anchor: cssPath(el), location: where, quote: labelOf(el), status: 'open', sentToClaude: false, comments: [{ author: nameOf(), role: 'reviewer', date: new Date().toISOString().slice(0, 10), text }] });
      save(all);
      renderPins();
      finish();
    });
  };

  /* ---------- Picking ---------- */
  pickBtn.addEventListener('click', () => { hideCard(); setPicking(!picking); if (picking) firstTip(); });
  document.addEventListener('pointermove', (event) => {
    if (!picking) return;
    const target = targetFor(event.target);
    if (target !== hovered) showHover(target);
  }, true);
  addEventListener('scroll', () => { if (picking && hovered) showHover(hovered); }, { passive: true });
  document.addEventListener('click', async (event) => {
    if (!picking || own(event.target)) return;
    const target = targetFor(event.target);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    setPicking(false);
    if (!inClaude) { compose(target); return; }
    try {
      const result = await composer.openComposer({ element: target });
      if (!result.opened) showCard(make('p', '', 'Finish or close the comment that is already open, then try again.'));
    } catch (err) {
      if (err && ['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].includes(err.code)) box.hidden = true;
      else showCard(make('p', '', 'That comment could not be opened. Please try again in a moment.'));
    }
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    // Only when the review tool is in use, so Escape still closes the site's own panels normally.
    if (picking) setPicking(false);
    else if (!card.hidden && box.contains(document.activeElement)) { hideCard(); pickBtn.focus(); }
  });

  renderPins();
  addEventListener('load', renderPins);
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderPins, 150); });
  // Reveal animations move things after load; settle the pins once they have played.
  setTimeout(renderPins, 1500);

  // On phones the home film's own controls (pause, Who it's for) sit in this corner, so the bar waits
  // until the film has scrolled mostly out of view.
  const film = document.querySelector('.hero');
  if (film && 'IntersectionObserver' in window && matchMedia('(max-width: 700px)').matches) {
    new IntersectionObserver(([entry]) => { box.hidden = entry.intersectionRatio > 0.3 && !picking; }, { threshold: [0, 0.3, 1] }).observe(film);
  }
})();
