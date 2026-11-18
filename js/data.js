/* Audiences, events and downloads. The Latest panel, timelines and download lists read from here, so
   each item is entered once.

   Events and downloads live in content/events.json and content/resources.json, so they can be changed
   without anyone editing JavaScript. This file reads those two files and puts them on window.YMT in the
   same shape as before. site.js waits for window.YMT.ready before it draws anything from them.

   Record shape, kept the same in the JSON files:
     events:    id, prog, title, date, end, time, place, aud[], who[], how, status, img, link, sample
     resources: id, prog, title, type, level, aud, time, event, summary, img, article, sample
   sample: true marks entries still to be confirmed by the team, and the site says so wherever they show.

   The audiences below are the site's own routes (each one is a page), so they stay here with the code. */
window.YMT = {
  audiences: {
    primary: { name: 'Primary', page: 'primary.html' },
    secondary: { name: 'Secondary', page: 'secondary.html' },
    volunteer: { name: '16+ and volunteers', page: 'volunteer.html' },
    everyone: { name: 'Everyone else', page: 'everyone.html' },
    school: { name: 'Schools', page: 'retreats.html' },
  },

  events: [],
  resources: [],
  // false until both content files have been read. site.js shows a short line instead of an empty list
  // if they can't be read, rather than saying nothing is on.
  loaded: false,
};

window.YMT.ready = (() => {
  const read = (name) => fetch(new URL('content/' + name + '.json', document.baseURI).href, { credentials: 'same-origin' })
    .then((response) => {
      if (!response.ok) throw new Error(name + '.json: ' + response.status);
      return response.json();
    })
    .then((list) => {
      if (!Array.isArray(list)) throw new Error(name + '.json is not a list');
      return list;
    });
  return Promise.all([read('events'), read('resources')]).then(([events, resources]) => {
    window.YMT.events = events;
    window.YMT.resources = resources;
    window.YMT.loaded = true;
    return window.YMT;
  }).catch((error) => {
    // Opened straight from the file system, or the files are missing: say so in the console, and leave
    // the lists empty so nothing on the page claims to know what is on.
    console.warn('YMT: couldn’t read the events and downloads.', error);
    return window.YMT;
  });
})();
