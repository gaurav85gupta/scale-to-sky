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
  initLogoReveal();
  initCardParallax();
  initFAQ();
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

  const lenis = new Lenis({
    duration: 0.5,
    easing: (t) => 1 - Math.pow(1 - t, 3),
    smoothWheel: true,
    wheelMultiplier: 1,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Keep in-page anchor links (e.g. nav "#services") working smoothly
  // through Lenis instead of the browser's native jump/CSS smooth-scroll.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -84 }); // offset for fixed header height
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
      setTimeout(() => { window.location.href = url; }, 200);
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
