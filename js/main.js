/* ============================================================
   NORTHFIELD & CO — MAIN.JS
   Modular vanilla JS: each feature is an isolated init function.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initHeaderScroll();
  initMobileMenu();
  initActiveNav();
  initScrollReveal();
  initCounters();
  initProcessSteps();
  initTestimonialRotator();
  initPortfolioFilter();
  initContactForm();
  initPageTransitions();
  initHeroParallax();
  initHeroServicesTransition();
  initLogoReveal();
  initCardParallax();
  initFAQ();
  initServiceModal();
});

/* ---------------- Smooth scroll (Lenis) ----------------
   Buttery-smooth inertia scrolling for desktop mouse-wheel users.
   Deliberately OFF on touch devices: Lenis's syncTouch mode re-simulates
   scrolling by hand in JS on every touchmove, which feels noticeably
   heavier/laggier than the browser's native, GPU-composited touch
   scrolling — mobile is faster and smoother left alone. Also falls back
   silently to native scrolling if Lenis fails to load (e.g. offline /
   CDN blocked) or if the user has prefers-reduced-motion enabled. ---------------- */
function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (isTouch) return; // let mobile use native touch scrolling — it's faster
  if (typeof Lenis === 'undefined') return; // CDN not loaded — native scroll still works fine

  let lenis = null;
  let rafId = null;

  function raf(time) {
    lenis.raf(time);
    rafId = requestAnimationFrame(raf);
  }

  function create() {
    lenis = new Lenis({
      duration: 0.5,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    window.__lenis = lenis;
    rafId = requestAnimationFrame(raf);
  }

  create();

  // Lenis.stop() only pauses its scroll updates — it keeps its wheel
  // listener attached on the document and still intercepts/preventDefaults
  // wheel events, which is what made scrolling inside the modal feel
  // sluggish/slow-motion. Fully destroying it (and recreating it on close)
  // removes those listeners so the modal gets 100% native wheel scrolling.
  window.__lenisSuspend = () => {
    if (rafId) cancelAnimationFrame(rafId);
    if (lenis) { lenis.destroy(); lenis = null; window.__lenis = null; }
  };
  window.__lenisResume = () => {
    if (!lenis) create();
  };

  // Keep in-page anchor links (e.g. nav "#services") working smoothly
  // through Lenis instead of the browser's native jump/CSS smooth-scroll.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -84 }); // offset for fixed header height
    });
  });
}

/* ---------------- Service cards: subtle internal visual parallax ---------------- */
function initCardParallax() {
  const cards = document.querySelectorAll('.service-card');
  if (!cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (prefersReducedMotion || isTouch) return;

  const MAX_MOVE = 6; // px

  cards.forEach(card => {
    const visual = card.querySelector('[data-parallax-el]');
    if (!visual) return;

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      visual.style.transform = `translateX(${relX * MAX_MOVE * 2}px)`;
    });

    card.addEventListener('mouseleave', () => {
      visual.style.transform = '';
    });
  });
}

/* ---------------- Header scroll state ---------------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const setState = () => {
    if (window.scrollY > 12) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  setState();
  window.addEventListener('scroll', setState, { passive: true });
}

/* ---------------- Mobile nav panel ---------------- */
function initMobileMenu() {
  const btn = document.querySelector('.hamburger');
  const panel = document.querySelector('.mobile-panel');
  if (!btn || !panel) return;

  const open = () => {
    panel.classList.add('is-open');
    btn.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  };
  const close = () => {
    panel.classList.remove('is-open');
    btn.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  };

  btn.addEventListener('click', () => {
    panel.classList.contains('is-open') ? close() : open();
  });

  panel.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', close);
  });

  document.addEventListener('click', (e) => {
    if (panel.classList.contains('is-open') &&
        !panel.contains(e.target) &&
        !btn.contains(e.target)) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
  });
}

/* ---------------- Active nav highlighting ---------------- */
function initActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a, .mobile-panel nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

/* ---------------- Scroll reveal via IntersectionObserver ---------------- */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el, i) => {
    const group = el.closest('[data-stagger-group]');
    if (group) {
      const index = Array.from(group.querySelectorAll('.reveal')).indexOf(el);
      el.style.setProperty('--stagger-delay', `${index * 90}ms`);
    }
    observer.observe(el);
  });
}

/* ---------------- Animated counters ---------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animate = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    if (prefersReduced) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });

  counters.forEach(el => observer.observe(el));
}

/* ---------------- Process steps (click to pin active on touch) ---------------- */
function initProcessSteps() {
  const steps = document.querySelectorAll('.process-step');
  if (!steps.length) return;

  steps.forEach(step => {
    step.addEventListener('click', () => {
      steps.forEach(s => s.classList.remove('is-active'));
      step.classList.add('is-active');
    });
  });
}

/* ---------------- Testimonial rotator ---------------- */
function initTestimonialRotator() {
  const wrap = document.querySelector('[data-testimonial-rotator]');
  if (!wrap) return;

  const slides = JSON.parse(wrap.dataset.slides);
  const quoteEl = wrap.querySelector('.testimonial-quote');
  const nameEl = wrap.querySelector('.name');
  const roleEl = wrap.querySelector('.role');
  const avatarEl = wrap.querySelector('.avatar-mark');
  const dotsWrap = wrap.querySelector('.testimonial-nav');

  let current = 0;

  const render = (i) => {
    const s = slides[i];
    quoteEl.textContent = `"${s.quote}"`;
    nameEl.textContent = s.name;
    roleEl.textContent = `${s.role}, ${s.company}`;
    avatarEl.textContent = s.initials;
    dotsWrap.querySelectorAll('.testimonial-dot').forEach((d, idx) => {
      d.classList.toggle('is-active', idx === i);
    });
  };

  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'testimonial-dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Show testimonial ${i + 1}`);
    dot.addEventListener('click', () => {
      current = i;
      render(current);
    });
    dotsWrap.appendChild(dot);
  });

  render(0);

  let interval = setInterval(() => {
    current = (current + 1) % slides.length;
    render(current);
  }, 6000);

  wrap.addEventListener('mouseenter', () => clearInterval(interval));
  wrap.addEventListener('mouseleave', () => {
    interval = setInterval(() => {
      current = (current + 1) % slides.length;
      render(current);
    }, 6000);
  });
}

/* ---------------- Portfolio filtering ---------------- */
function initPortfolioFilter() {
  const bar = document.querySelector('.filter-bar');
  const items = document.querySelectorAll('.portfolio-item');
  if (!bar || !items.length) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');

    const filter = btn.dataset.filter;

    items.forEach(item => {
      const matches = filter === 'all' || item.dataset.category === filter;
      if (matches) {
        item.classList.remove('is-hidden');
      } else {
        item.classList.add('is-hidden');
      }
    });
  });
}

/* ---------------- Contact form validation ---------------- */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const success = document.querySelector('.form-success');

  // Preselect the service dropdown when arriving via ?service=slug
  // (e.g. from a service modal's "Let's Talk About This Service" CTA).
  const serviceField = form.querySelector('#service');
  if (serviceField) {
    const requestedService = new URLSearchParams(window.location.search).get('service');
    if (requestedService && [...serviceField.options].some(opt => opt.value === requestedService)) {
      serviceField.value = requestedService;
    }
  }

  const validators = {
    name: (v) => v.trim().length >= 2 || 'Please enter your full name.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
    service: (v) => v !== '' || 'Please select a service.',
    message: (v) => v.trim().length >= 20 || 'Tell us a bit more — at least 20 characters.'
  };

  const showError = (field, message) => {
    const wrap = field.closest('.field');
    wrap.classList.add('has-error');
    const errorEl = wrap.querySelector('.field-error');
    if (errorEl) errorEl.textContent = message;
  };

  const clearError = (field) => {
    const wrap = field.closest('.field');
    wrap.classList.remove('has-error');
  };

  const validateField = (field) => {
    const rule = validators[field.name];
    if (!rule) return true;
    const result = rule(field.value);
    if (result === true) {
      clearError(field);
      return true;
    }
    showError(field, result);
    return false;
  };

  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.closest('.field').classList.contains('has-error')) validateField(field);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = form.querySelectorAll('input[name], select[name], textarea[name]');
    let isValid = true;
    fields.forEach(field => {
      if (validators[field.name] && !validateField(field)) isValid = false;
    });

    if (!isValid) {
      form.querySelector('.has-error input, .has-error select, .has-error textarea')?.focus();
      return;
    }

    /* ---- FUTURE API INTEGRATION POINT ----
       This is a frontend-only demo: no request is sent anywhere.
       Replace this block with a real fetch() call to your backend
       or form service, e.g.:

       fetch('/api/contact', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(Object.fromEntries(new FormData(form)))
       })
       ------------------------------------- */

    form.classList.add('is-submitted');
    success.classList.add('is-visible');
    success.setAttribute('tabindex', '-1');
    success.focus();
  });
}

/* ---------------- Subtle page transition ---------------- */
function initPageTransitions() {
  const links = document.querySelectorAll('a[href$=".html"]:not([target="_blank"])');
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; background: var(--white, #fff);
    z-index: 9999; opacity: 0; pointer-events: none;
    transition: opacity 220ms ease;
  `;
  document.body.appendChild(overlay);

  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 280ms ease';
  requestAnimationFrame(() => { document.body.style.opacity = '1'; });

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const url = link.getAttribute('href');
      const isSamePage = url === window.location.pathname.split('/').pop();
      if (isSamePage || link.hasAttribute('download')) return;

      e.preventDefault();
      overlay.style.pointerEvents = 'auto';
      overlay.style.opacity = '1';
      setTimeout(() => { window.location.href = url; }, 120);
    });
  });
}

/* ---------------- Hero: subtle mouse parallax on ecosystem cards ---------------- */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const cards = document.querySelectorAll('.hero-ecosystem [data-parallax]');
  if (!hero || !cards.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (prefersReducedMotion || isTouch) return;

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;

    cards.forEach(card => {
      const strength = parseFloat(card.dataset.parallax) || 4;
      const x = relX * strength * 2;
      const y = relY * strength * 2;
      card.style.setProperty('--px', `${x}px`);
      card.style.setProperty('--py', `${y}px`);
    });
  });

  hero.addEventListener('mouseleave', () => {
    cards.forEach(card => {
      card.style.setProperty('--px', '0px');
      card.style.setProperty('--py', '0px');
    });
  });
}

/* ---------------- Hero → Services layered scroll transition ----------------
   Home page only. Drives a single CSS custom property, --hst-progress
   (0 → 1), on .hero-scroll-wrapper as the user scrolls through it. The
   Hero is sticky-pinned via CSS (see style.css) while the Services
   section — opaque white, higher z-index — translates up over it.
   CSS reads --hst-progress for the actual transform/opacity math, so
   this function only ever computes and writes one number per frame.

   Reuses window.__lenis (from initSmoothScroll) for scroll position
   when available so both systems stay in sync; falls back to native
   window.scrollY otherwise. No second scroll-smoothing system, no
   extra scroll listeners — position is sampled inside a single rAF
   loop that only runs while the wrapper is near the viewport. ---------------- */
function initHeroServicesTransition() {
  const wrapper = document.querySelector('.hero-scroll-wrapper');
  const hero = wrapper && wrapper.querySelector('.hero');
  const cover = wrapper && wrapper.querySelector('.hero-scroll-cover');
  if (!wrapper || !hero || !cover) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // CSS reduced-motion block also guards this, but skip the rAF loop entirely

  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  if (isMobile) return; // simplified, non-sticky mobile experience per spec — plain stacked sections

  wrapper.classList.add('hst-active');

  // Distance (px) over which the transition completes, measured from the
  // top of the wrapper. Tied to the Hero's own height so it scales with
  // viewport/content rather than a hardcoded pixel value, and capped so
  // it's never an unnecessarily long pinned section. Lowered from
  // hero-height*0.85 (max 900px) to hero-height*0.45 (max 500px) — the
  // longer distance meant the Hero stayed sticky-pinned (visually static
  // while only scaling/fading) for a large chunk of scroll input, which
  // read as the page "slowing down" compared to normal sections where
  // content displaces per scroll unit. Shorter distance = same wheel
  // input completes the transition sooner and normal scrolling resumes.
  let travelDistance = Math.min(hero.offsetHeight * 0.45, 500);
  let wrapperTop = 0;
  let running = false;
  let rafId = null;
  // displayedProgress lerps toward targetProgress every frame instead of
  // jumping straight to the raw scroll-derived value. Combined with the
  // short CSS transition on the transform itself, this removes the
  // step-y/jerky feel of the zoom on fast or trackpad scrolling, without
  // making the effect noticeably lag behind the actual scroll position.
  let displayedProgress = 0;
  let targetProgress = 0;

  function measure() {
    // getBoundingClientRect + scroll position combine to give an
    // absolute offset without depending on a specific scroll container.
    const rect = wrapper.getBoundingClientRect();
    wrapperTop = rect.top + (window.__lenis ? window.__lenis.scroll : window.scrollY);
    travelDistance = Math.min(hero.offsetHeight * 0.45, 500);
  }

  function currentScroll() {
    return window.__lenis ? window.__lenis.scroll : window.scrollY;
  }

  function computeTarget() {
    const y = currentScroll();
    const raw = (y - wrapperTop) / travelDistance;
    const clamped = Math.min(Math.max(raw, 0), 1);
    // Ease-out so the motion is brisk at first and settles gently into
    // place, rather than a mechanical linear rise.
    targetProgress = 1 - Math.pow(1 - clamped, 2);
  }

  function frame() {
    computeTarget();
    // Lerp toward the target each frame. The CSS transition on the
    // transform properties has been removed entirely — it was adding a
    // second layer of scroll-response delay on top of this lerp, which
    // is what made the Hero→Services zone feel slower than the rest of
    // the page even after the lerp factor was raised. This lerp alone
    // now does all the smoothing: fast enough (0.35) to track scroll
    // closely, still enough to erase raw per-frame jitter.
    displayedProgress += (targetProgress - displayedProgress) * 0.35;
    // Snap once close enough so the value settles exactly at 0/1 instead
    // of crawling asymptotically forever.
    if (Math.abs(targetProgress - displayedProgress) < 0.0005) {
      displayedProgress = targetProgress;
    }
    wrapper.style.setProperty('--hst-progress', displayedProgress.toFixed(4));

    // Once fully settled at either end (0 or 1), stop rAF entirely rather
    // than continuing to tick every frame while the user scrolls through
    // the sections below.
    const settled = displayedProgress === targetProgress && (displayedProgress === 0 || displayedProgress === 1);
    if (running && !settled) {
      rafId = requestAnimationFrame(frame);
    } else {
      rafId = null;
      // Drop will-change once settled (see .hst-transitioning in
      // style.css). Left on permanently, the browser keeps all 8
      // transformed Hero layers GPU-composited for the rest of the
      // page's life, which is the main remaining cost while scrolling
      // through Services/Why-Different/etc — this removes it as soon
      // as the transform value stops changing.
      wrapper.classList.remove('hst-transitioning');
    }
  }

  function start() {
    if (running) return;
    running = true;
    wrapper.classList.add('hst-transitioning');
    measure();
    computeTarget();
    displayedProgress = targetProgress;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    if (!running) return;
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    wrapper.classList.remove('hst-transitioning');
  }

  // Restart the settled loop on scroll if progress has room to change
  // again (e.g. user scrolled back up into range) but the IO hasn't
  // fired yet. Cheap: only does work when running and currently idle.
  function onScrollWhileSettled() {
    if (running && rafId === null) {
      wrapper.classList.add('hst-transitioning');
      rafId = requestAnimationFrame(frame);
    }
  }
  window.addEventListener('scroll', onScrollWhileSettled, { passive: true });

  // Only measure/listen while the wrapper is actually near the viewport —
  // avoids any scroll work for the rest of the page's lifetime. Bottom
  // margin kept small (not 200px) since frame() now self-stops once
  // settled anyway — this just avoids a big span where IO keeps the loop
  // technically "running" (even though frame() no longer ticks) for no
  // benefit while the user is well past Services.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) start();
      else stop();
    });
  }, { rootMargin: '200px 0px 0px 0px' });
  io.observe(wrapper);

  window.addEventListener('resize', () => {
    // If the viewport is resized down into the mobile breakpoint mid-session
    // (e.g. rotating a device or resizing a desktop window), drop back to
    // the plain stacked layout rather than leaving sticky positioning
    // active at a width it wasn't designed for.
    if (window.matchMedia('(max-width: 640px)').matches) {
      stop();
      wrapper.classList.remove('hst-active');
      wrapper.style.removeProperty('--hst-progress');
      return;
    }
    if (!wrapper.classList.contains('hst-active')) {
      wrapper.classList.add('hst-active');
    }
    if (running) measure();
  }, { passive: true });
}

/* ---------------- Nav logo: brand wordmark letter-reveal ----------------
   Splits "Scale To Sky" in the nav logo into individual character spans,
   staggers a rise-from-below-the-mask animation via CSS custom properties,
   and reveals a thin baseline rule alongside it. Falls back to the plain
   static text for reduced-motion users, and can never leave it invisible
   if the split fails for any reason. ---- */
function initLogoReveal() {
  const logoText = document.querySelector('[data-logo-reveal]');
  if (!logoText) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    logoText.classList.add('is-ready');
    return;
  }

  const REPEAT_MS = 15000; // repeat the reveal animation every 15 seconds
  let charSpans = null; // cached spans so we don't rebuild the DOM every cycle

  const buildChars = () => {
    const wordEls = logoText.querySelectorAll('[data-logo-chars]');
    if (!wordEls.length) return null;

    const STEP_MS = 28;
    const WORD_GAP_MS = 50;
    let globalIndex = 0;
    const spans = [];

    wordEls.forEach(wordEl => {
      const word = wordEl.textContent;
      wordEl.textContent = '';

      Array.from(word).forEach(letter => {
        if (letter === ' ') {
          const space = document.createElement('span');
          space.className = 'logo-space';
          space.textContent = '\u00A0';
          wordEl.appendChild(space);
          return;
        }
        const span = document.createElement('span');
        span.className = 'logo-char';
        span.style.setProperty('--char-delay', `${globalIndex * STEP_MS}ms`);
        span.textContent = letter;
        wordEl.appendChild(span);
        spans.push(span);
        globalIndex += 1;
      });

      globalIndex += Math.round(WORD_GAP_MS / STEP_MS);
    });

    return spans;
  };

  const revealFallback = () => logoText.classList.add('is-ready');
  const safetyTimer = setTimeout(revealFallback, 1500);

  try {
    charSpans = buildChars();
    if (!charSpans) { revealFallback(); return; }

    const playReveal = () => {
      // restart the CSS animation by removing then re-adding the class
      logoText.classList.remove('is-revealing');
      // force reflow so the browser registers the class removal
      void logoText.offsetWidth;
      logoText.classList.add('is-revealing');
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        playReveal();
        clearTimeout(safetyTimer);
        setInterval(playReveal, REPEAT_MS);
      });
    });
  } catch (err) {
    clearTimeout(safetyTimer);
    revealFallback();
  }
}

/* ---------------- FAQ accordion (Home page) ----------------
   Only one FAQ item open at a time. Works via click and
   keyboard (Enter/Space activate a <button> natively). ---------------- */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn = item.querySelector('.faq-question');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach(other => {
        if (other === item) return;
        other.classList.remove('is-open');
        const otherBtn = other.querySelector('.faq-question');
        if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* ---------------- Services page: service detail modal ----------------
   One reusable modal, populated from a centralized data object, driven
   by the URL hash so it works both from in-page card clicks and from
   direct/incoming links like services.html#meta-ads (e.g. from Home). */
const SERVICES_DATA = {
  'social-media-management': {
    number: '01',
    title: 'Social Media Management',
    intro: 'Your social media should feel active, consistent, and true to your brand. We help you plan and create content that gives your audience a reason to keep paying attention.',
    whatWeDo: 'We handle the day-to-day content side of your social presence so you can focus on your business.',
    included: ['Content planning', 'Post and reel ideas', 'Captions and creative direction', 'Posting and scheduling', 'Community engagement', 'Content consistency'],
    whoItsFor: 'Businesses that want to stay active on Instagram and other social platforms without having to manage the entire process themselves.',
    howItHelps: 'Consistent content keeps your brand visible, builds familiarity, and gives potential customers more reasons to trust you.'
  },
  'web-development': {
    number: '02',
    title: 'Web Development',
    intro: 'Your website is often the first serious interaction someone has with your business. We build websites that look professional, work smoothly, and make your business easy to understand.',
    whatWeDo: 'We design and develop responsive websites around your business, audience, and goals.',
    included: ['Website planning', 'UI design', 'Frontend development', 'Responsive design', 'Performance optimization', 'Basic SEO-friendly structure', 'Contact / inquiry flows'],
    whoItsFor: 'Businesses that need a professional website, want to improve an existing one, or need a stronger digital presence.',
    howItHelps: 'A clear and fast website helps visitors understand what you offer, build trust, and take the next step.'
  },
  'video-shoot-editing': {
    number: '03',
    title: 'Video Shoot & Editing',
    intro: 'Good video can show people what your brand feels like before they ever contact you. We create and edit content that is made to capture attention and communicate clearly.',
    whatWeDo: 'From shooting to final editing, we help turn your ideas, products, services, and spaces into useful brand content.',
    included: ['Video planning', 'Product / business shoots', 'Short-form video', 'Reel editing', 'Transitions and motion', 'Text and captions', 'Final content formatting'],
    whoItsFor: 'Restaurants, fashion brands, real estate businesses, local businesses, and brands that need better visual content.',
    howItHelps: 'Strong visual content helps people understand your business faster and gives your social media and marketing campaigns more to work with.'
  },
  'meta-ads': {
    number: '04',
    title: 'Meta Ads',
    intro: 'Getting your business in front of more people is not enough. We focus on reaching people who are more likely to care, enquire, or buy.',
    whatWeDo: 'We create and manage Facebook and Instagram ad campaigns around your business goals.',
    included: ['Campaign setup', 'Audience targeting', 'Ad creative direction', 'Campaign monitoring', 'Performance optimization', 'Retargeting where relevant', 'Performance tracking'],
    whoItsFor: 'Businesses looking to generate more enquiries, leads, bookings, customers, or product sales through Meta platforms.',
    howItHelps: 'Better targeting and ongoing optimization help your advertising budget work toward meaningful business outcomes instead of simply generating reach.'
  },
  'app-development': {
    number: '05',
    title: 'App Development',
    intro: 'If your business has an idea for an app, we help turn that idea into a practical product people can actually use.',
    whatWeDo: 'We work through the idea, user experience, development, and launch with the goal of keeping the product useful and easy to use.',
    included: ['Product planning', 'UI/UX design', 'App development', 'Responsive / adaptive experiences', 'Backend integration where required', 'Testing', 'Launch preparation'],
    whoItsFor: 'Businesses that want to build a customer-facing app, internal business tool, booking system, ordering system, or another custom digital product.',
    howItHelps: 'A well-planned app can make your service easier to access and give your business a digital product built around the way your customers work.'
  },
  'ugc-videos': {
    number: '06',
    title: 'UGC Videos',
    intro: 'People often connect better with content that feels natural. UGC-style videos bring a more personal and relatable voice to your brand.',
    whatWeDo: 'We create creator-style video content designed to feel native to the platform rather than like a traditional advertisement.',
    included: ['Video concepts', 'Script development', 'Creator coordination', 'Product/service presentation', 'Short-form editing', 'Multiple creative variations'],
    whoItsFor: 'Brands that want more relatable content for social media, paid ads, product promotion, or customer-focused campaigns.',
    howItHelps: 'Authentic-looking content can make your brand feel more approachable and gives you creative material that can be used across organic and paid campaigns.'
  }
};

function initServiceModal() {
  const modal = document.getElementById('serviceModal');
  const cards = document.querySelectorAll('.service-card[data-service]');
  if (!modal || !cards.length) return;

  const backdrop = modal.querySelector('.service-modal-backdrop');
  const panel = modal.querySelector('.service-modal-panel');
  const closeBtn = modal.querySelector('.service-modal-close');
  const numberEl = modal.querySelector('.service-modal-number');
  const titleEl = modal.querySelector('.service-modal-title');
  const introEl = modal.querySelector('.service-modal-intro');
  const whatEl = modal.querySelector('.service-modal-whatwedo');
  const includedEl = modal.querySelector('.service-modal-included');
  const whoEl = modal.querySelector('.service-modal-who');
  const howEl = modal.querySelector('.service-modal-how');
  const ctaEl = modal.querySelector('.service-modal-cta');
  const titleId = titleEl.id || 'serviceModalTitle';
  titleEl.id = titleId;
  modal.setAttribute('aria-labelledby', titleId);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let activeId = null;
  let lastFocusedCard = null;
  let closeTimer = null;

  const checkIcon = '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const render = (id) => {
    const data = SERVICES_DATA[id];
    if (!data) return false;

    numberEl.textContent = data.number;
    titleEl.textContent = data.title;
    introEl.textContent = data.intro;
    whatEl.textContent = data.whatWeDo;
    includedEl.innerHTML = data.included.map(item => `<li>${checkIcon}<span>${item}</span></li>`).join('');
    whoEl.textContent = data.whoItsFor;
    howEl.textContent = data.howItHelps;
    ctaEl.setAttribute('href', `contact.html?service=${id}`);

    return true;
  };

  const unlockScroll = () => {
    document.body.classList.remove('modal-open');
    if (window.__lenisResume) window.__lenisResume();
  };

  // Even with Lenis stopped, it can still swallow wheel/touch events that
  // bubble up from inside the modal (since it listens on the document).
  // Stop propagation right at the panel so native scrolling always wins.
  ['wheel', 'touchmove'].forEach((evt) => {
    panel.addEventListener(evt, (e) => { e.stopPropagation(); }, { passive: true });
  });

  const openModal = (id, opts = {}) => {
    if (activeId === id && !modal.hidden) return; // already open — avoid a redundant re-render/flicker
    if (!render(id)) return;
    activeId = id;

    if (opts.triggerEl) lastFocusedCard = opts.triggerEl;

    if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
    panel.scrollTop = 0;
    document.body.classList.add('modal-open'); // lock body scroll immediately, cheap
    modal.hidden = false;

    // Wait a frame before triggering the transition. render() just wrote a
    // fair amount of innerHTML (the "what's included" list, etc.) — starting
    // the transition in the very next line forces the browser to lay all of
    // that out synchronously *and* animate in the same frame, which is what
    // caused the stutter on open. rAF lets the layout from render() settle
    // on its own frame first; the second rAF (next frame) is when we flip
    // the class, so the transition starts from a clean, already-painted state.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
      });
    });

    // Destroying/creating the Lenis instance does real work (removes/attaches
    // DOM listeners). Doing it in the same frame as the open transition can
    // cause a dropped frame right as the modal appears, which reads as a
    // stutter/lag. Deferring it lets the CSS transition kick off smoothly first.
    requestAnimationFrame(() => {
      if (window.__lenisSuspend) window.__lenisSuspend();
    });

    if (!opts.skipFocus) {
      (prefersReducedMotion ? closeBtn.focus() : setTimeout(() => closeBtn.focus(), 60));
    }

    if (opts.updateHash !== false) {
      const newHash = `#${id}`;
      if (window.location.hash !== newHash) {
        history.pushState(null, '', newHash);
      }
    }
  };

  const closeModal = (opts = {}) => {
    if (!activeId) return;
    modal.classList.remove('is-open');
    unlockScroll();

    const finish = () => {
      modal.hidden = true;
      activeId = null;
    };
    if (prefersReducedMotion) {
      finish();
    } else {
      closeTimer = setTimeout(finish, 320);
    }

    if (opts.returnFocus !== false && lastFocusedCard) {
      lastFocusedCard.focus({ preventScroll: true });
    }

    if (opts.updateHash !== false && window.location.hash) {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Card clicks — open modal, update hash, remember trigger for focus return.
  cards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const id = card.dataset.service;
      openModal(id, { triggerEl: card });
    });
  });

  closeBtn.addEventListener('click', () => closeModal());

  backdrop.addEventListener('click', () => closeModal());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  // Basic focus trap while the modal is open.
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !modal.classList.contains('is-open')) return;
    const focusable = panel.querySelectorAll('a[href], button:not([disabled])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Hash-driven open/close: handles direct links (services.html#meta-ads),
  // in-page navigation via history, and the browser Back/Forward buttons.
  const syncWithHash = () => {
    const id = window.location.hash.replace('#', '');
    if (id && SERVICES_DATA[id]) {
      if (id !== activeId) {
        // Open the modal immediately — don't wait on a scroll animation first.
        openModal(id, { updateHash: false, skipFocus: false });
        const targetCard = document.querySelector(`.service-card[data-service="${id}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ block: 'center', behavior: 'auto' });
        }
      }
    } else if (!id && activeId) {
      closeModal({ updateHash: false, returnFocus: false });
    }
  };

  window.addEventListener('hashchange', syncWithHash);

  // Run once on load in case the page was opened with a service hash already set.
  syncWithHash();
}