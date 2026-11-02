// The enquiry form (enquire.html) posts here; each enquiry is emailed to the right team through Resend.
// Keys and addresses come from environment variables (see .dev.vars.example); PLACEHOLDER_* means "not set yet".
// It accepts JSON from the page's script, or a plain form post when script is off (answered with a redirect).
import { clean, configured, json, turnstileOk } from '../../lib/review.js';

// Topic: who it goes to, and the subject line.
const TOPICS = {
  retreat: { to: 'bookings', subject: 'Booking enquiry · Retreat' },
  village: { to: 'bookings', subject: 'Booking enquiry · Village stay' },
  event: { to: 'admin', subject: 'Event enquiry' },
  volunteer: { to: 'admin', subject: 'Volunteering' },
  other: { to: 'admin', subject: 'General enquiry' },
};
const FIELDS = [
  ['name', 'Name', 120],
  ['email', 'Email', 200],
  ['phone', 'Phone', 40],
  ['group', 'School, parish or group', 160],
  ['about', 'About', 120],
  ['numbers', 'Roughly how many', 60],
  ['dates', 'Preferred dates', 120],
  ['message', 'Message', 4000],
];
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

const reply = (wantsJson, status, data) => {
  if (wantsJson) return json(data, status);
  const to = data.ok ? '/enquire.html?sent=1#enquiry' : `/enquire.html?error=${encodeURIComponent(data.error)}#enquiry`;
  return new Response(null, { status: 303, headers: { location: to, 'cache-control': 'no-store' } });
};

export const onRequestPost = async ({ request, env }) => {
  const wantsJson = (request.headers.get('content-type') || '').includes('application/json');
  let input;
  try {
    input = wantsJson ? await request.json() : Object.fromEntries(await request.formData());
  } catch {
    return reply(wantsJson, 400, { ok: false, error: 'unreadable' });
  }

  // Bots: the hidden "website" field is filled, or the form came back faster than a person could type.
  // They get a quiet success so they learn nothing.
  const started = Number(input.started) || 0;
  if (clean(input.website, 200) || (started && Date.now() - started < 2500)) return reply(wantsJson, 200, { ok: true });

  const topic = TOPICS[input.topic] ? input.topic : 'other';
  const form = Object.fromEntries(FIELDS.map(([key, , max]) => [key, clean(input[key], max)]));
  const missing = ['name', 'email', 'message'].filter((key) => !form[key]);
  if (form.email && !EMAIL.test(form.email)) missing.push('email');
  if (!input.consent) missing.push('consent');
  if (missing.length) return reply(wantsJson, 400, { ok: false, error: 'missing', fields: [...new Set(missing)] });

  if (!(await turnstileOk(env, input['cf-turnstile-response'], request.headers.get('cf-connecting-ip')))) {
    return reply(wantsJson, 400, { ok: false, error: 'check' });
  }

  const route = TOPICS[topic];
  // One address for everything (handy while testing) wins over the per-team ones.
  const to = [env.FORM_TO_ALL, route.to === 'bookings' ? env.FORM_TO_BOOKINGS : env.FORM_TO_ADMIN].find(configured);
  const oneLine = (text) => text.replace(/[\r\n]+/g, ' ');
  const subject = `[YMT] ${route.subject}${form.about ? ' · ' + oneLine(form.about) : ''} · ${oneLine(form.name)}`;
  const text = [
    `New enquiry from the website (${route.subject}).`,
    '',
    ...FIELDS.filter(([key]) => form[key] && key !== 'message').map(([key, label]) => `${label}: ${form[key]}`),
    '',
    form.message,
    '',
    `Reply to this email to answer ${form.name} directly.`,
  ].join('\n');

  if (!configured(env.RESEND_KEY) || !to) {
    // Local testing without keys: set FORM_DEV_LOG=1 in .dev.vars to print the email instead of sending it.
    if (env.FORM_DEV_LOG === '1') {
      console.log(`--- enquiry email to ${to || '(no address set)'} ---\nSubject: ${subject}\nReply-To: ${form.email}\n\n${text}`);
      return reply(wantsJson, 200, { ok: true, dev: true, team: route.to });
    }
    return reply(wantsJson, 503, { ok: false, error: 'not-set-up' });
  }

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: configured(env.FORM_FROM) ? env.FORM_FROM : 'YMT website <onboarding@resend.dev>',
      to: [to],
      reply_to: form.email,
      subject,
      text,
    }),
  }).then((r) => r.ok).catch(() => false);
  return sent ? reply(wantsJson, 200, { ok: true, team: route.to }) : reply(wantsJson, 502, { ok: false, error: 'send-failed' });
};

export const onRequest = () => json({ ok: false, error: 'post-only' }, 405);
