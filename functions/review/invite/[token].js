// /review/invite/<token> · sets the reviewer's HttpOnly cookie, then opens the site in review mode.
import { isStaging, sha256, COOKIE } from '../../../lib/review.js';

export const onRequestGet = async ({ request, env, params }) => {
  if (!isStaging(request.url) || !env.REVIEW_DB) return new Response('Not found', { status: 404 });
  const token = String(params.token || '');
  const ok = /^[A-Za-z0-9_-]{32,64}$/.test(token)
    && await env.REVIEW_DB.prepare('SELECT id FROM reviewers WHERE token_hash = ?').bind(await sha256(token)).first();
  if (!ok) return new Response('This invite link is not valid. Ask Eva for a new one.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  const url = new URL(request.url);
  const secure = url.protocol === 'https:' ? '; Secure' : '';
  return new Response(null, {
    status: 302,
    headers: {
      location: '/?review=1',
      'set-cookie': `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 90}${secure}`,
      'cache-control': 'no-store',
    },
  });
};
