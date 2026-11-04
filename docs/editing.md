# Editing events and downloads

Events and downloads are edited in forms at **`/admin`** on the site, for example
https://eva-cameron.github.io/youth-ministry-team-demo/admin/. Nobody needs to touch the code.

## What you can edit there

- **Events**: everything in Latest, the date timelines and the "Next" captions in the route heroes.
  Add one with **Add event**. It shows on the pages for the audiences and programme you pick.
  Past events hide themselves once their last day has gone, so they don't need deleting.
- **Downloads**: the cards on Resources and the route pages. Upload the PDF in the form.

New events start as **Not confirmed yet**, so they say "To be confirmed" on the site. Turn that off
once the team has confirmed the date.

Photos you upload are turned into WebP at most 1600px wide and saved in `assets/web`. Follow the
photo rules: first names only, and no new photos of identifiable young people without consent.

## Signing in

For now, sign in with a GitHub access token:

1. On GitHub, go to Settings → Developer settings → Personal access tokens → Fine-grained tokens →
   Generate new token.
2. Give it access to **only** `eva-cameron/youth-ministry-team-demo`, with **Contents: Read and write**.
3. Open `/admin`, choose **Sign In Using Access Token**, and paste it.

Each person who edits needs a GitHub account with write access to the repository, and their own token.
A "Sign in with GitHub" button needs a small sign-in worker on Cloudflare
([Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth)); that is a later step.

## What happens when you save

Each save is a commit to `main`. GitHub Pages republishes the mirror in a minute or two, and Cloudflare
Pages redeploys too once it is connected to the repository. The site reads `data/events.json` and
`data/resources.json` fresh on each visit, so changes show without anyone clearing a cache.

## For developers

- The forms are defined in `admin/config.yml`. Its field names are the ones `js/site.js` reads.
- `js/data.js` loads the two JSON files and sets `window.YMT_READY`; `js/site.js` waits for it.
- Photos are stored as paths (`/assets/web/….webp`). Bare names from before still work.
