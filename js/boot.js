document.documentElement.classList.add('js');
// The home title card plays once per visit.
try { if (sessionStorage.getItem('ymt-intro')) document.documentElement.classList.add('intro-seen'); } catch {}
