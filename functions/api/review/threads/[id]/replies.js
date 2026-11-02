// POST /api/review/threads/:id/replies · reply in a thread
import { json, clean, threadsWhere, turnstileOn, MAX_TEXT } from '../../../../../lib/review.js';

export const onRequestPost = async ({ request, env, data, params }) => {
  const id = Number(params.id);
  const body = await request.json().catch(() => null);
  const text = clean(body?.text, MAX_TEXT);
  if (!Number.isInteger(id) || !text) return json({ error: 'Write a reply first.' }, 400);
  if (!data.reviewer.verified && turnstileOn(env)) return json({ error: 'Post your first comment on the page before replying.' }, 403);
  const exists = await env.REVIEW_DB.prepare('SELECT id FROM threads WHERE id = ?').bind(id).first();
  if (!exists) return json({ error: 'That thread no longer exists.' }, 404);
  await env.REVIEW_DB.prepare('INSERT INTO comments (thread_id, author_id, text) VALUES (?, ?, ?)').bind(id, data.reviewer.id, text).run();
  const [thread] = await threadsWhere(env, 'WHERE t.id = ?', [id]);
  return json({ thread });
};
