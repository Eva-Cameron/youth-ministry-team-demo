const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* arm the page-load orchestration (CSS keys off html.anim) */
if(!reduce) document.documentElement.classList.add('anim');

/* mobile nav — full-screen overlay */
const toggle = document.querySelector('.navtoggle');
const menu = document.getElementById('mobilemenu');
if(toggle && menu){
  toggle.addEventListener('click', ()=>{
    const open = menu.classList.toggle('open');
    document.body.classList.toggle('menuopen', open);
    toggle.setAttribute('aria-expanded', open ? 'true':'false');
  });
}

/* nav dropdowns — click toggles, Escape/outside closes, hover opens on desktop */
const drops = document.querySelectorAll('.navdrop');
drops.forEach(d=>{
  const btn = d.querySelector('.drop-btn');
  if(!btn) return;
  btn.addEventListener('click', e=>{
    e.stopPropagation();
    const open = d.classList.toggle('open');
    drops.forEach(o=>{ if(o!==d){ o.classList.remove('open'); o.querySelector('.drop-btn')?.setAttribute('aria-expanded','false'); }});
    btn.setAttribute('aria-expanded', open ? 'true':'false');
  });
  if(window.matchMedia('(hover: hover)').matches){
    d.addEventListener('mouseenter', ()=>{ d.classList.add('open'); btn.setAttribute('aria-expanded','true'); });
    d.addEventListener('mouseleave', ()=>{ d.classList.remove('open'); btn.setAttribute('aria-expanded','false'); });
  }
});
document.addEventListener('click', ()=>drops.forEach(d=>{ d.classList.remove('open'); d.querySelector('.drop-btn')?.setAttribute('aria-expanded','false'); }));
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    drops.forEach(d=>{ d.classList.remove('open'); d.querySelector('.drop-btn')?.setAttribute('aria-expanded','false'); });
    if(menu && menu.classList.contains('open')){ menu.classList.remove('open'); document.body.classList.remove('menuopen'); toggle?.setAttribute('aria-expanded','false'); }
  }
});

/* hero video mute/unmute toggle */
const heroVid = document.getElementById('heroVideo');
const muteBtn = document.getElementById('heroMute');
if(heroVid && muteBtn){
  muteBtn.addEventListener('click', ()=>{
    heroVid.muted = !heroVid.muted;
    muteBtn.textContent = heroVid.muted ? '🔇' : '🔊';
    if(!heroVid.muted) heroVid.play().catch(()=>{});
  });
}

/* marquee ticker — duplicate the run so the loop is seamless */
document.querySelectorAll('.ticker-track').forEach(t=>{
  t.innerHTML += t.innerHTML;
});

/* scroll reveals (staggered) */
const revs = document.querySelectorAll('.reveal, .rv-l, .rv-r, .rv-pop');
if('IntersectionObserver' in window && !reduce){
  const io = new IntersectionObserver((es)=>{
    es.forEach((e,i)=>{ if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('in'), (i%6)*70); io.unobserve(e.target);} });
  },{threshold:0.12, rootMargin:'0px 0px -6% 0px'});
  revs.forEach(el=>io.observe(el));
}else{ revs.forEach(el=>el.classList.add('in')); }

/* rotating pull-quotes */
const qEl = document.getElementById('rotQuote');
if(qEl && !reduce){
  let quotes;
  try{ quotes = JSON.parse(qEl.getAttribute('data-quotes')||'[]'); }catch(e){ quotes = []; }
  if(quotes.length > 1){
    let i = 0;
    const q = qEl.querySelector('.q'), by = qEl.querySelector('.qby');
    setInterval(()=>{
      i = (i+1) % quotes.length;
      qEl.style.opacity = 0;
      setTimeout(()=>{ q.textContent = '“'+quotes[i][0]+'”'; by.textContent = quotes[i][1]; qEl.style.opacity = 1; }, 350);
    }, 5500);
    qEl.style.transition = 'opacity .35s ease';
  }
}

/* form fake-submit (static site) */
document.querySelectorAll('form[data-demo]').forEach(f=>{
  f.addEventListener('submit', e=>{
    e.preventDefault();
    const note = f.querySelector('.form-result') || (()=>{ const n=document.createElement('p'); n.className='formnote form-result'; f.appendChild(n); return n; })();
    note.textContent = '✦ Thanks! This is a demo form — connect it to Tally, Netlify Forms or admin@ymt.org to go live.';
    note.style.color = 'var(--pink-deep)';
    note.style.fontWeight = '700';
    f.reset();
  });
});
