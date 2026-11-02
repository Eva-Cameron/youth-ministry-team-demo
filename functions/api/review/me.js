// Who is commenting, and whether they still need the one-time Turnstile check.
import { json, turnstileOn } from '../../../lib/review.js';

export const onRequestGet = ({ data, env }) => json({
  name: data.reviewer.name,
  role: data.reviewer.role,
  turnstile: !data.reviewer.verified && turnstileOn(env) ? env.TURNSTILE_SITE_KEY : null,
});
