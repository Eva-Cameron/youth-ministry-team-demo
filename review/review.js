/* Review mode for the client preview on claude.ai. Not part of the live site:
   outside the claude.ai viewer the comments capability is absent and nothing renders. */
(async () => {
  const REVIEW_COPY_URL = 'https://claude.ai/artifact/6EH6MLrH7ecfBfVtt6vfw1';
  const STAGING_HOSTS = ['github.io', 'pages.dev', 'localhost', '127.0.0.1'];

  const style = document.createElement('style');
  style.textContent = `
    .rv { position: fixed; z-index: 2147483000; right: calc(16px + env(safe-area-inset-right, 0px)); bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: grid; justify-items: end; gap: 10px; font: 500 14px/1.3 var(--sans, system-ui, sans-serif); }
    .rv__btn { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: var(--white, #fff); color: var(--ink, #100c15); font: inherit; font-weight: 600; cursor: pointer; box-shadow: 0 6px 24px rgba(16, 12, 21, .35), 0 0 0 1px rgba(16, 12, 21, .12); }
    .rv__btn:focus-visible { outline: 3px solid var(--gold, #f2c24a); outline-offset: 3px; }
    .rv__btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; }
    .rv__btn[aria-pressed="true"] { background: var(--gold, #f2c24a); }
    .rv__tip { max-width: min(300px, calc(100vw - 32px)); padding: 14px 16px; border-radius: 14px; background: var(--ink, #100c15); color: var(--white, #fff); box-shadow: 0 6px 24px rgba(16, 12, 21, .4), 0 0 0 1px rgba(255, 255, 255, .14); }
    .rv__tip b { display: block; margin-bottom: 4px; }
    .rv__go { display: inline-flex; align-items: center; min-height: 44px; margin-top: 10px; padding: 0 16px; border-radius: 999px; background: var(--white, #fff); color: var(--ink, #100c15); font-weight: 600; text-decoration: none; }
    .rv__tip button { margin-top: 10px; padding: 6px 12px; border: 1px solid rgba(255, 255, 255, .5); border-radius: 999px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
    html.rv-picking, html.rv-picking * { cursor: crosshair !important; }
    .rv-hover { outline: 3px solid var(--gold, #f2c24a) !important; outline-offset: 3px !important; }
  `;
  document.head.appendChild(style);

  if (!window.claude || typeof window.claude.use !== 'function') {
    // Staging copy outside claude.ai: the same Comment button, which sends reviewers to the
    // commentable review copy (comments are saved there). Never shows on ymt.org.
    if (!STAGING_HOSTS.some((host) => location.hostname === host || location.hostname.endsWith('.' + host))) return;
    const stage = document.createElement('div');
    stage.className = 'rv';
    stage.innerHTML = `
      <div class="rv__tip" role="status" hidden>
        <b>Leave a comment</b>
        <span>Comments are saved on the review copy of this site. Open it, tap <em>Comment</em>, then tap anything you'd like changed.</span>
        <br><a class="rv__go" href="${REVIEW_COPY_URL}" target="_blank" rel="noopener">Open the review copy</a>
      </div>
      <button type="button" class="rv__btn" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>
        <span>Comment</span>
      </button>`;
    document.body.appendChild(stage);
    const stageBtn = stage.querySelector('.rv__btn');
    const stageTip = stage.querySelector('.rv__tip');
    stageBtn.addEventListener('click', () => { stageTip.hidden = !stageTip.hidden; stageBtn.setAttribute('aria-expanded', String(!stageTip.hidden)); });
    // The home film's own controls (pause, Who it's for) sit in this corner, so the button waits
    // until the film has scrolled mostly out of view.
    const film = document.querySelector('.hero');
    if (film && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { stage.hidden = entry.intersectionRatio > 0.3; }, { threshold: [0, 0.3, 1] }).observe(film);
    }
    return;
  }
  const comments = await window.claude.use('comments');
  if (!comments || typeof comments.openComposer !== 'function') return;


  const box = document.createElement('div');
  box.className = 'rv';
  box.setAttribute('data-uncommentable', '');
  box.innerHTML = `
    <div class="rv__tip" role="status" hidden>
      <b>Review mode</b>
      <span>Tap <em>Comment</em>, then tap anything on the page you'd like changed: a heading, a photo, a colour, a button. Write what you'd like instead and post it.</span>
      <br><button type="button" class="rv__ok">Got it</button>
    </div>
    <button type="button" class="rv__btn" aria-pressed="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>
      <span class="rv__label">Comment</span>
    </button>`;
  document.body.appendChild(box);

  const btn = box.querySelector('.rv__btn');
  const label = box.querySelector('.rv__label');
  const tip = box.querySelector('.rv__tip');
  const tipText = tip.querySelector('span');
  const defaultTip = tipText.innerHTML;
  let picking = false;
  let hovered = null;

  let seen = false;
  try { seen = localStorage.getItem('ymt-review-tip') === '1'; } catch (err) { seen = false; }
  if (!seen) tip.hidden = false;
  box.querySelector('.rv__ok').addEventListener('click', () => {
    tip.hidden = true;
    tipText.innerHTML = defaultTip;
    try { localStorage.setItem('ymt-review-tip', '1'); } catch (err) { /* private window: tip shows again next time */ }
  });

  const targetFor = (node) => {
    if (!(node instanceof Element) || box.contains(node)) return null;
    return node.closest('h1, h2, h3, h4, p, li, figure, img, video, blockquote, a, button, address, .who__card, .info__card, .shot, .label, .feel__line') || node;
  };

  const clearHover = () => { if (hovered) hovered.classList.remove('rv-hover'); hovered = null; };

  const setPicking = (on) => {
    picking = on;
    document.documentElement.classList.toggle('rv-picking', on);
    btn.setAttribute('aria-pressed', String(on));
    label.textContent = on ? 'Tap what to change · Cancel' : 'Comment';
    if (!on) clearHover();
  };

  btn.addEventListener('click', () => setPicking(!picking));

  document.addEventListener('pointerover', (event) => {
    if (!picking) return;
    const target = targetFor(event.target);
    if (target === hovered) return;
    clearHover();
    if (target) { hovered = target; hovered.classList.add('rv-hover'); }
  }, true);

  document.addEventListener('click', async (event) => {
    if (!picking) return;
    const target = targetFor(event.target);
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    setPicking(false);
    try {
      const result = await comments.openComposer({ element: target });
      if (!result.opened) {
        tipText.textContent = 'Finish or close the comment that is already open, then try again.';
        tip.hidden = false;
      }
    } catch (err) {
      if (err && (err.code === 'unavailable' || err.code === 'not_granted' || err.code === 'capability_disabled' || err.code === 'capability_removed')) {
        box.hidden = true;
      } else {
        tipText.textContent = 'That comment could not be opened. Please try again in a moment.';
        tip.hidden = false;
      }
    }
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && picking) setPicking(false);
  });
})();
