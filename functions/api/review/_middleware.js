// Gate for every /api/review/* call: staging hosts only, an invited reviewer, CSRF header on writes,
// and a per-reviewer rate limit.
import { isStaging, json, reviewerFor, rateLimited } from '../../../lib/review.js';

export const onRequest = async (context) => {
  const { request, env } = context;
  if (!isStaging(request.url)) return new Response('Not found', { status: 404 });
  if (!env.REVIEW_DB) return json({ error: 'The review database is not connected yet.' }, 503);
  const reviewer = await reviewerFor(env, request);
  if (!reviewer) return json({ error: 'Open your invite link to comment.' }, 401);
  if (request.method !== 'GET') {
    // A custom header forces a CORS preflight, so other sites cannot post with the reviewer's cookie.
    if (request.headers.get('x-review') !== '1') return json({ error: 'Bad request.' }, 403);
    if (await rateLimited(env, reviewer.id)) return json({ error: 'Too many comments in a minute. Please wait a moment.' }, 429);
  }
  context.data.reviewer = reviewer;
  return context.next();
};
