// Pages serves the repository root, so everything that isn't the website is hidden here: tools, docs,
// server code, review data and local state. Only review/review.js (the overlay) is public in review/.
const HIDDEN = /^\/(\.|tools\/|docs\/|lib\/|functions\/|node_modules\/|wrangler\.toml|package(-lock)?\.json|review\/(?!review\.js$))/;

export const onRequest = (context) => {
  const path = new URL(context.request.url).pathname;
  if (HIDDEN.test(path) && !path.startsWith('/review/invite/')) return new Response('Not found', { status: 404 });
  return context.next();
};
