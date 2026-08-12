(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Brief logo introduction. It never blocks the page if load events are delayed. */
  const intro = document.querySelector('.intro');
  const loaderCount = document.querySelector('[data-loader-count]');
  let introFinished = false;

  const finishIntro = () => {
    if (introFinished) return;
    introFinished = true;
    if (loaderCount) loaderCount.textContent = '100';
    root.classList.add('page-ready');

    if (!intro || reduceMotion) {
      intro?.remove();
      return;
    }

    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 1050);
  };

  if (reduceMotion) {
    finishIntro();
  } else {
    const start = performance.now();
    const countUp = (now) => {
      if (introFinished) return;
      const progress = Math.min((now - start) / 1150, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      if (loaderCount) loaderCount.textContent = String(Math.round(eased * 99)).padStart(2, '0');
      if (progress < 1) requestAnimationFrame(countUp);
    };
    requestAnimationFrame(countUp);

    const onReady = () => window.setTimeout(finishIntro, 850);
    if (document.readyState === 'complete') onReady();
    else window.addEventListener('load', onReady, { once: true });
    window.setTimeout(finishIntro, 2200);
  }

  /* Compact menu with focus management and Escape support. */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menuPanel = document.querySelector('[data-menu-panel]');
  const menuLabel = document.querySelector('[data-menu-label]');
  const main = document.querySelector('main');
  const footer = document.querySelector('footer');
  let returnFocus = null;

  const menuFocusables = () => {
    if (!menuPanel || !menuToggle) return [];
    return [menuToggle, ...menuPanel.querySelectorAll('a[href], button:not([disabled])')];
  };

  const setMenu = (open) => {
    if (!menuPanel || !menuToggle) return;
    body.classList.toggle('menu-open', open);
    menuPanel.classList.toggle('is-open', open);
    menuPanel.setAttribute('aria-hidden', String(!open));
    menuToggle.setAttribute('aria-expanded', String(open));
    if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';

    if ('inert' in HTMLElement.prototype) {
      if (main) main.inert = open;
      if (footer) footer.inert = open;
    }

    if (open) {
      returnFocus = document.activeElement;
      window.setTimeout(() => menuPanel.querySelector('nav a')?.focus(), 180);
    } else if (returnFocus instanceof HTMLElement) {
      returnFocus.focus();
    }
  };

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  menuPanel?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (!body.classList.contains('menu-open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setMenu(false);
      return;
    }
    if (event.key !== 'Tab') return;

    const items = menuFocusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* Hero scene index and film controls. */
  const hero = document.querySelector('.hero');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const sceneButtons = [...document.querySelectorAll('[data-scene-button]')];
  const sceneCount = document.querySelector('[data-scene-count]');
  const sceneTitle = document.querySelector('[data-scene-title]');
  const sceneCopy = document.querySelector('[data-scene-copy]');
  const scenePrev = document.querySelector('[data-scene-prev]');
  const sceneNext = document.querySelector('[data-scene-next]');
  const heroVideo = document.querySelector('.hero video');
  const videoToggle = document.querySelector('[data-video-toggle]');
  let activeScene = 0;
  let videoPaused = reduceMotion;

  if (reduceMotion && heroVideo) {
    heroVideo.removeAttribute('autoplay');
    heroVideo.pause();
  }

  const setVideoButton = () => {
    if (!videoToggle) return;
    const disabled = activeScene !== 0;
    videoToggle.disabled = disabled;
    videoToggle.classList.toggle('is-disabled', disabled);
    videoToggle.classList.toggle('is-paused', videoPaused);
    videoToggle.setAttribute('aria-label', videoPaused ? 'Play background film' : 'Pause background film');
  };

  const activateScene = (index) => {
    if (!scenes.length) return;
    activeScene = (index + scenes.length) % scenes.length;

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle('is-active', sceneIndex === activeScene);
    });

    sceneButtons.forEach((button, buttonIndex) => {
      const active = buttonIndex === activeScene;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    const source = sceneButtons[activeScene];
    if (sceneCount) {
      sceneCount.textContent = String(activeScene + 1).padStart(2, '0') + ' / ' + String(scenes.length).padStart(2, '0');
    }
    if (sceneTitle && source?.dataset.title) sceneTitle.textContent = source.dataset.title;
    if (sceneCopy && source?.dataset.copy) sceneCopy.textContent = source.dataset.copy;

    if (heroVideo) {
      if (activeScene === 0 && !videoPaused && !reduceMotion) {
        heroVideo.play().catch(() => {
          videoPaused = true;
          setVideoButton();
        });
      } else {
        heroVideo.pause();
      }
    }
    setVideoButton();
  };

  sceneButtons.forEach((button) => {
    button.addEventListener('click', () => activateScene(Number(button.dataset.sceneButton)));
  });
  scenePrev?.addEventListener('click', () => activateScene(activeScene - 1));
  sceneNext?.addEventListener('click', () => activateScene(activeScene + 1));

  videoToggle?.addEventListener('click', () => {
    if (!heroVideo || activeScene !== 0) return;
    videoPaused = !videoPaused;
    if (videoPaused) heroVideo.pause();
    else heroVideo.play().catch(() => { videoPaused = true; });
    setVideoButton();
  });
  setVideoButton();

  if (hero && finePointer && !reduceMotion) {
    let heroFrame = 0;
    hero.addEventListener('pointermove', (event) => {
      if (heroFrame) cancelAnimationFrame(heroFrame);
      heroFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - .5) * -14;
        const y = (event.clientY / window.innerHeight - .5) * -10;
        hero.style.setProperty('--hero-x', x.toFixed(2) + 'px');
        hero.style.setProperty('--hero-y', y.toFixed(2) + 'px');
      });
    });
    hero.addEventListener('pointerleave', () => {
      hero.style.setProperty('--hero-x', '0px');
      hero.style.setProperty('--hero-y', '0px');
    });
  }

  /* Reveal content only once it is close to the viewport. */
  const revealItems = [...document.querySelectorAll('.reveal')];
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .14, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* Shared scroll work: header state and restrained image parallax. */
  const siteHeader = document.querySelector('[data-header]');
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  let scrollFrame = 0;

  const updateOnScroll = () => {
    scrollFrame = 0;
    siteHeader?.classList.toggle('is-scrolled', window.scrollY > 36);
    if (reduceMotion) return;

    const viewportHeight = window.innerHeight;
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > viewportHeight + 100) return;
      const centreOffset = (rect.top + rect.height / 2 - viewportHeight / 2) / viewportHeight;
      const shift = Math.max(-24, Math.min(24, centreOffset * -34));
      item.style.setProperty('--parallax', shift.toFixed(2) + 'px');
    });
  };

  const requestScrollUpdate = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateOnScroll);
  };
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate);
  updateOnScroll();

  /* Keyboard-friendly horizontal photo strip. */
  const galleryTrack = document.querySelector('[data-gallery-track]');
  const galleryPrev = document.querySelector('[data-gallery-prev]');
  const galleryNext = document.querySelector('[data-gallery-next]');

  const scrollGallery = (direction) => {
    if (!galleryTrack) return;
    galleryTrack.scrollBy({
      left: direction * Math.max(280, galleryTrack.clientWidth * .72),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  };
  galleryPrev?.addEventListener('click', () => scrollGallery(-1));
  galleryNext?.addEventListener('click', () => scrollGallery(1));

  /* Static prototype form: validate honestly without pretending data was sent. */
  const demoForm = document.querySelector('[data-demo-form]');
  demoForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!demoForm.reportValidity()) return;
    const status = demoForm.querySelector('[data-form-status]');
    if (status) {
      status.textContent = 'Form complete — this prototype is ready to connect to YMT’s form provider before launch.';
      status.setAttribute('role', 'status');
    }
  });

  /* Small magnetic response on primary pill controls. */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * .08;
        const y = (event.clientY - rect.top - rect.height / 2) * .12;
        element.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
      });
      element.addEventListener('pointerleave', () => {
        element.style.transform = '';
      });
    });
  }

  /* Subtle cursor echo: the normal pointer stays intact. */
  const cursor = document.querySelector('.cursor');
  if (cursor && finePointer && !reduceMotion) {
    body.classList.add('cursor-enabled');
    let cursorX = -100;
    let cursorY = -100;
    let cursorFrame = 0;
    const renderCursor = () => {
      cursorFrame = 0;
      cursor.style.transform = 'translate3d(' + (cursorX - cursor.offsetWidth / 2) + 'px,' + (cursorY - cursor.offsetHeight / 2) + 'px,0)';
    };
    document.addEventListener('pointermove', (event) => {
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursor.classList.add('is-visible');
      if (!cursorFrame) cursorFrame = requestAnimationFrame(renderCursor);
    });
    document.addEventListener('pointerover', (event) => {
      cursor.classList.toggle('is-active', Boolean(event.target.closest('a, button, input, select, textarea')));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
