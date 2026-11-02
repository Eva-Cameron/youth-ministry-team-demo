// DELETE /api/review/threads/:id · owner only, for spam
import { json } from '../../../../../lib/review.js';

export const onRequestDelete = async ({ env, data, params }) => {
  if (data.reviewer.role !== 'owner') return json({ error: 'Only the site owner can delete threads.' }, 403);
  const id = Number(params.id);
  if (!Number.isInteger(id)) return json({ error: 'Bad request.' }, 400);
  await env.REVIEW_DB.batch([
    env.REVIEW_DB.prepare('DELETE FROM comments WHERE thread_id = ?').bind(id),
    env.REVIEW_DB.prepare('DELETE FROM threads WHERE id = ?').bind(id),
  ]);
  return json({ deleted: id });
};
