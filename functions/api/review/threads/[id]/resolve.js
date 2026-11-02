// POST /api/review/threads/:id/resolve {status: "resolved" | "open"} · owner only
import { json, threadsWhere } from '../../../../../lib/review.js';

export const onRequestPost = async ({ request, env, data, params }) => {
  if (data.reviewer.role !== 'owner') return json({ error: 'Only the site owner can resolve threads.' }, 403);
  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: 'Bad request.' }, 400);
  const body = await request.json().catch(() => null);
  const status = body?.status === 'open' ? 'open' : 'resolved';
  await env.REVIEW_DB.prepare('UPDATE threads SET status = ? WHERE id = ?').bind(status, id).run();
  const [thread] = await threadsWhere(env, 'WHERE t.id = ?', [id]);
  return thread ? json({ thread }) : json({ error: 'That thread no longer exists.' }, 404);
};
