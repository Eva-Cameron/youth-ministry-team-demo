// GET /api/review/export · every thread, in the review/comments.json shape the board reads · owner only
import { json, threadsWhere } from '../../../lib/review.js';

export const onRequestGet = async ({ env, data }) => {
  if (data.reviewer.role !== 'owner') return json({ error: 'Only the site owner can export.' }, 403);
  return json({ exported: new Date().toISOString(), source: 'staging review database', threads: await threadsWhere(env, '', []) });
};
