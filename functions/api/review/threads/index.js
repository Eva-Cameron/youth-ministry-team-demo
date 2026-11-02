// GET  /api/review/threads?page=primary.html  · threads on a page, with replies
// POST /api/review/threads                     · start a thread on an element
import { json, clean, threadsWhere, turnstileOk, turnstileOn, notify, MAX_TEXT } from '../../../../lib/review.js';

const PAGE = /^[\w-]+\.html$/;

export const onRequestGet = async ({ request, env }) => {
  const page = new URL(request.url).searchParams.get('page') || 'index.html';
  if (!PAGE.test(page)) return json({ error: 'Unknown page.' }, 400);
  return json({ threads: await threadsWhere(env, 'WHERE t.page = ?', [page]) });
};

export const onRequestPost = async ({ request, env, data, waitUntil }) => {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Bad request.' }, 400);
  const page = clean(body.page, 80);
  const anchor = clean(body.anchor, 600);
  const text = clean(body.text, MAX_TEXT);
  if (!PAGE.test(page) || !anchor) return json({ error: 'Pick an element on a site page first.' }, 400);
  if (!text) return json({ error: 'Write a comment first.' }, 400);
  const reviewer = data.reviewer;
  if (!reviewer.verified && turnstileOn(env)) {
    if (!(await turnstileOk(env, body.turnstile, request.headers.get('cf-connecting-ip')))) return json({ error: 'Please complete the check, then post again.' }, 403);
    await env.REVIEW_DB.prepare('UPDATE reviewers SET verified = 1 WHERE id = ?').bind(reviewer.id).run();
  }
  const thread = await env.REVIEW_DB.prepare(
    'INSERT INTO threads (page, anchor, location, quote, viewport, author_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
  ).bind(page, anchor, clean(body.location, 200), clean(body.quote, 200), Math.max(0, Math.min(4000, Number(body.viewport) || 0)), reviewer.id).first();
  await env.REVIEW_DB.prepare('INSERT INTO comments (thread_id, author_id, text) VALUES (?, ?, ?)').bind(thread.id, reviewer.id, text).run();
  waitUntil(notify(env, `[YMT review] New comment on ${page}`, `${reviewer.name} (${reviewer.role}) on ${page}\n${clean(body.location, 200)}\n\n${text}`));
  const [created] = await threadsWhere(env, 'WHERE t.id = ?', [thread.id]);
  return json({ thread: created }, 201);
};
