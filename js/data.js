/* Events and downloads live in data/events.json and data/resources.json, which the editor at /admin
   fills in. The Latest panel, timelines and download lists read them from here, so each item is entered
   once. sample: true marks entries still to be confirmed by the team.
   site.js waits for window.YMT_READY before it draws anything from the data. */
(() => {
  const audiences = {
    primary: { name: 'Primary', page: 'primary.html' },
    secondary: { name: 'Secondary', page: 'secondary.html' },
    volunteer: { name: '16+ and volunteers', page: 'volunteer.html' },
    everyone: { name: 'Everyone else', page: 'everyone.html' },
    school: { name: 'Schools', page: 'retreats.html' },
  };
  window.YMT = { audiences, events: [], resources: [] };
  // Found from this script's own address, so the 404 page works at any depth.
  const base = new URL('../data/', document.currentScript.src);
  // no-cache asks the server whether the file changed, so an edit shows on the next visit.
  const load = (name) => fetch(new URL(name + '.json', base), { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(name + '.json: ' + r.status))));
  window.YMT_READY = Promise.all([load('events'), load('resources')])
    .then(([e, r]) => { window.YMT.events = e.events || []; window.YMT.resources = r.resources || []; })
    .catch((err) => console.warn('YMT data did not load:', err));
})();
