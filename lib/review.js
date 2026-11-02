// Shared server code for the staging review layer (Cloudflare Pages Functions + D1).
// No secrets live here: keys come from environment variables, with PLACEHOLDER_* meaning "not set yet".

export const COOKIE = 'ymt_review';
export const MAX_TEXT = 2000;

// Only staging hosts run the review layer; production ymt.org never answers.
export const isStaging = (url) => {
  const host = new URL(url).hostname;
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.pages.dev');
};

export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

export const configured = (value) => !!value && !String(value).startsWith('PLACEHOLDER');
// Turnstile is on only when both keys exist, so the widget and the check always agree.
export const turnstileOn = (env) => configured(env.TURNSTILE_SECRET) && configured(env.TURNSTILE_SITE_KEY);

export const sha256 = async (text) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const tokenFrom = (request) => {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.split(/;\s*/).find((part) => part.startsWith(COOKIE + '='));
  // Tokens are base64url, so they are used as written; anything else counts as no token.
  const token = match ? match.slice(COOKIE.length + 1) : '';
  return /^[A-Za-z0-9_-]{32,64}$/.test(token) ? token : '';
};

export const reviewerFor = async (env, request) => {
  const token = tokenFrom(request);
  if (!token) return null;
  return env.REVIEW_DB.prepare('SELECT id, name, role, verified FROM reviewers WHERE token_hash = ?').bind(await sha256(token)).first();
};

// Viewer text is untrusted: strip control characters, trim and cap. It is only ever rendered as text.
export const clean = (value, max) => String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);

// Fixed one-minute windows per reviewer.
export const rateLimited = async (env, reviewerId, limit = 30) => {
  const window = new Date().toISOString().slice(0, 16);
  const row = await env.REVIEW_DB.prepare(
    'INSERT INTO hits (reviewer_id, window, count) VALUES (?, ?, 1) ON CONFLICT(reviewer_id, window) DO UPDATE SET count = count + 1 RETURNING count',
  ).bind(reviewerId, window).first();
  // Now and then, clear windows older than an hour.
  if (Math.random() < .02) await env.REVIEW_DB.prepare('DELETE FROM hits WHERE window < ?').bind(new Date(Date.now() - 3600e3).toISOString().slice(0, 16)).run();
  return (row?.count || 0) > limit;
};

// Turnstile on a reviewer's first write. Until Eva adds keys it is skipped.
export const turnstileOk = async (env, token, ip) => {
  if (!turnstileOn(env)) return true;
  if (!token) return false;
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body }).then((r) => r.json()).catch(() => ({}));
  return !!result.success;
};

// Threads with their comments, in the shape review/board.mjs reads (review/comments.json).
export const threadsWhere = async (env, where, binds) => {
  const threads = (await env.REVIEW_DB.prepare(
    `SELECT t.id, t.page, t.anchor, t.location, t.quote, t.viewport, t.status, t.created_at, r.name AS author, r.role
       FROM threads t JOIN reviewers r ON r.id = t.author_id ${where} ORDER BY t.id`,
  ).bind(...binds).all()).results;
  if (!threads.length) return [];
  const ids = threads.map((t) => t.id);
  const comments = (await env.REVIEW_DB.prepare(
    `SELECT c.id, c.thread_id, c.text, c.created_at, r.name AS author, r.role
       FROM comments c JOIN reviewers r ON r.id = c.author_id WHERE c.thread_id IN (${ids.map(() => '?').join(',')}) ORDER BY c.id`,
  ).bind(...ids).all()).results;
  return threads.map((t) => ({
    id: 't' + t.id,
    page: t.page,
    anchor: t.anchor,
    location: t.location,
    quote: t.quote,
    viewport: t.viewport,
    status: t.status,
    sentToClaude: false,
    comments: comments.filter((c) => c.thread_id === t.id).map((c) => ({ id: c.id, author: c.author, role: c.role, date: c.created_at.slice(0, 10), time: c.created_at, text: c.text })),
  }));
};

// Optional heads-up to Eva when a thread opens (Resend). Skipped until keys exist.
export const notify = async (env, subject, text) => {
  if (!configured(env.RESEND_KEY) || !configured(env.REVIEW_NOTIFY_TO)) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: 'YMT review <onboarding@resend.dev>', to: [env.REVIEW_NOTIFY_TO], subject, text }),
  }).catch(() => {});
};
