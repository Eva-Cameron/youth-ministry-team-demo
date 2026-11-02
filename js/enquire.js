/* The enquiry form on enquire.html. It sends to /api/enquire (functions/api/enquire.js), which emails the
   bookings team or the office. Booking buttons around the site land here with ?topic= (and ?about=) set.
   If the server can't take it (a static preview host, or the email keys aren't set yet), the visitor's answers
   are kept and offered as a ready-written email instead, so nothing they typed is lost. */
(() => {
  'use strict';
  const form = document.querySelector('[data-enquiry]');
  if (!form) return;
  const C = window.YMT_CONFIG || {};
  const $ = (s) => form.querySelector(s);
  const status = $('[data-status]');
  const send = $('[data-send]');
  const params = new URLSearchParams(location.search);

  const HINTS = {
    retreat: 'Tell us the school, year group, rough numbers and the dates you have in mind.',
    village: 'Tell us who is coming, roughly how many, and the dates you have in mind.',
    event: 'Which event, and roughly how many of you?',
    volunteer: 'What would you like to do? If you are under 18, a parent or carer will need to agree before you take part.',
    other: 'How can we help?',
  };
  const TEAM = { retreat: 'bookings', village: 'bookings', event: 'office', volunteer: 'office', other: 'office' };
  const LABELS = { name: 'Name', email: 'Email', phone: 'Phone', group: 'School, parish or group', numbers: 'Roughly how many', dates: 'Preferred dates' };

  const topicNow = () => form.elements.topic.value || 'other';
  const showFields = () => {
    const topic = topicNow();
    form.querySelectorAll('[data-for]').forEach((p) => { p.hidden = !p.dataset.for.split(' ').includes(topic); });
    $('[data-hint]').textContent = HINTS[topic];
  };

  // Arriving from a booking button: pick its topic and remember what it was about.
  const asked = { details: 'event' }[params.get('topic')] || params.get('topic');
  const radio = asked && form.querySelector(`input[name="topic"][value="${CSS.escape(asked)}"]`);
  if (radio) radio.checked = true;
  const about = (params.get('about') || '').slice(0, 120);
  if (about) {
    $('[data-about]').value = about;
    const line = document.createElement('p');
    line.className = 'note note--ink';
    line.textContent = `About: ${about}`;
    form.querySelector('.enquiry__topics').append(line);
  }
  showFields();
  form.addEventListener('change', (e) => { if (e.target.name === 'topic') showFields(); });
  // An error clears as soon as the field is put right.
  form.addEventListener('input', (e) => { if (MESSAGES[e.target.name] && e.target.closest('.field, .check')?.querySelector('.field__error, .check__error') && (e.target.type === 'checkbox' ? e.target.checked : e.target.value.trim())) errorFor(e.target.name, ''); });
  $('[data-started]').value = String(Date.now());
  if (radio || about) requestAnimationFrame(() => form.scrollIntoView({ block: 'start' }));

  const done = (name, team) => {
    const box = document.createElement('div');
    box.className = 'enquiry__done';
    box.setAttribute('tabindex', '-1');
    const h = document.createElement('h2');
    h.textContent = name ? `Thanks, ${name}.` : 'Thanks, it’s sent.';
    const p = document.createElement('p');
    p.textContent = `Your enquiry has gone to the ${team || 'YMT'} team. They’ll reply by email, usually within a few working days.`;
    box.append(h, p);
    form.replaceChildren(box);
    box.focus();
  };
  // A plain form post (script was off when it was sent) comes back to ?sent=1 or ?error=.
  if (params.get('sent')) done('', '');
  else if (params.get('error')) status.textContent = 'Something was missing or went wrong. Please check the form and try again.';

  const errorFor = (field, text) => {
    const el = form.elements[field];
    const holder = field === 'consent' ? $('.check') : el.closest('.field');
    holder.querySelector('.field__error, .check__error')?.remove();
    if (field !== 'consent') el.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (!text) return;
    const msg = document.createElement('small');
    msg.className = field === 'consent' ? 'check__error' : 'field__error';
    msg.id = `err-${field}`;
    msg.textContent = text;
    holder.append(msg);
    el.setAttribute('aria-describedby', msg.id);
  };
  const MESSAGES = { name: 'Please add your name.', email: 'Please add an email address we can reply to.', message: 'Please write a short message.', consent: 'Please tick this box to send.' };
  const check = () => {
    const bad = [];
    ['name', 'email', 'message'].forEach((f) => { if (!form.elements[f].value.trim()) bad.push(f); });
    if (form.elements.email.value.trim() && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(form.elements.email.value.trim())) bad.push('email');
    if (!form.elements.consent.checked) bad.push('consent');
    ['name', 'email', 'message', 'consent'].forEach((f) => errorFor(f, bad.includes(f) ? (f === 'email' && form.elements.email.value.trim() ? 'That email address doesn’t look right.' : MESSAGES[f]) : ''));
    return bad;
  };

  // The fallback: the same answers, written into an email to the right address.
  const mailto = (data) => {
    const topic = data.topic;
    const to = TEAM[topic] === 'bookings' ? C.bookingsTo : C.enquiryTo;
    const subject = `[YMT] ${{ retreat: 'Booking enquiry · Retreat', village: 'Booking enquiry · Village stay', event: 'Event enquiry', volunteer: 'Volunteering', other: 'General enquiry' }[topic]}${data.about ? ' · ' + data.about : ''}`;
    const body = [...Object.entries(LABELS).filter(([k]) => data[k]).map(([k, l]) => `${l}: ${data[k]}`), '', data.message].join('\n');
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bad = check();
    if (bad.length) { status.textContent = 'Please check the highlighted fields.'; (bad[0] === 'consent' ? form.elements.consent : form.elements[bad[0]]).focus(); return; }
    const data = Object.fromEntries(new FormData(form));
    send.disabled = true;
    status.textContent = 'Sending…';
    let result = null;
    try {
      const res = await fetch(form.action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      result = await res.json().catch(() => null);
      if (res.ok && result?.ok) { done(data.name.trim(), TEAM[data.topic]); return; }
      if (res.status === 400 && result?.fields) { result.fields.forEach((f) => errorFor(f, MESSAGES[f])); status.textContent = 'Please check the highlighted fields.'; send.disabled = false; return; }
    } catch { /* offline, or a host without the server part: fall through to email */ }
    send.disabled = false;
    status.replaceChildren('We couldn’t send this from the website just now. ');
    const a = document.createElement('a');
    a.href = mailto(data);
    a.textContent = 'Send it by email instead';
    status.append(a, ' (your answers are already filled in).');
  });
})();
