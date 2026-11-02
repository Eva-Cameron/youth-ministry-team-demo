// Who is commenting, and whether they still need the one-time Turnstile check.
import { json, configured } from '../../../lib/review.js';

export const onRequestGet = ({ data, env }) => json({
  name: data.reviewer.name,
  role: data.reviewer.role,
  turnstile: !data.reviewer.verified && configured(env.TURNSTILE_SITE_KEY) ? env.TURNSTILE_SITE_KEY : null,
});
