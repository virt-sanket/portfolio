/**
 * ============================================================
 * COMPONENT ENGINE — Production-Grade JavaScript System
 * Sanket Kandel Portfolio
 *
 * Components:
 *  1. Navbar          — scroll detection, active link, mobile drawer
 *  2. Toast           — notification manager with queue
 *  3. ScrollReveal    — intersection-observer based reveal
 *  4. SkillBars       — animated width on scroll
 *  5. FilterBar       — click-to-filter with data-category
 *  6. TypeWriter      — accessible typewriter with reduced-motion
 *  7. CursorGlow      — subtle radial glow following cursor
 *  8. FormValidator   — real-time validation with ARIA
 *  9. ContactForm     — async submit with loading + toast
 * 10. Newsletter      — async submit with loading + toast
 * 11. StatCounter     — animated count-up on reveal
 * 12. PageTransition  — cross-page fade via <a> clicks
 * ============================================================
 */

'use strict';

/* ── Utility helpers ──────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── 1. NAVBAR COMPONENT ─────────────────────────────────── */
function initNavbar() {
  const nav         = $('.c-navbar');
  const hamburger   = $('.c-navbar__hamburger');
  const drawer      = $('.c-navbar__links');
  const links       = $$('.c-navbar__link');

  if (!nav) return;

  // Scroll detection — add data-scrolled after 20px
  const handleScroll = () => {
    nav.dataset.scrolled = window.scrollY > 20 ? 'true' : 'false';
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run on init

  // Active link detection via current page filename
  const page = location.pathname.split('/').pop() || 'index.html';
  links.forEach(a => {
    const href = a.getAttribute('href') || '';
    const isActive = href === page || (page === '' && href === 'index.html');
    if (isActive) {
      a.setAttribute('aria-current', 'page');
    }
  });

  // Mobile drawer toggle
  if (hamburger && drawer) {
    on(hamburger, 'click', () => {
      const isOpen = drawer.classList.toggle('is-open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      // Trap scroll when open
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    links.forEach(a => on(a, 'click', () => {
      drawer.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));

    // Close on outside click
    on(document, 'click', e => {
      if (!nav.contains(e.target) && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    // Close on Escape
    on(document, 'keydown', e => {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        drawer.classList.remove('is-open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        hamburger.focus();
      }
    });
  }
}

/* ── 2. TOAST NOTIFICATION MANAGER ──────────────────────── */
const Toast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'c-toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error:   '<i class="fa-solid fa-circle-xmark"></i>',
    info:    '<i class="fa-solid fa-circle-info"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
  };

  function show({ type = 'info', title = '', message = '', duration = 4000 } = {}) {
    const c    = getContainer();
    const el   = document.createElement('div');
    el.className = `c-toast c-toast--${type}`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `
      <span class="c-toast__icon">${ICONS[type] || ICONS.info}</span>
      <div class="c-toast__content">
        ${title ? `<div class="c-toast__title">${title}</div>` : ''}
        ${message ? `<div class="c-toast__msg">${message}</div>` : ''}
      </div>
      <button class="c-toast__close" aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark"></i>
      </button>`;

    c.appendChild(el);

    const dismiss = () => {
      el.classList.add('is-removing');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    };

    el.querySelector('.c-toast__close').addEventListener('click', dismiss);
    if (duration > 0) setTimeout(dismiss, duration);
    return { dismiss };
  }

  return {
    success: (title, message, opts) => show({ type: 'success', title, message, ...opts }),
    error:   (title, message, opts) => show({ type: 'error',   title, message, ...opts }),
    info:    (title, message, opts) => show({ type: 'info',    title, message, ...opts }),
    warning: (title, message, opts) => show({ type: 'warning', title, message, ...opts }),
  };
})();

/* ── 3. SCROLL REVEAL ────────────────────────────────────── */
function initScrollReveal() {
  const els = $$('.c-reveal, .reveal');

  if (!els.length) return;

  if (prefersReducedMotion()) {
    els.forEach(el => { el.classList.add('is-visible', 'visible'); });
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay || '0');
        setTimeout(() => {
          entry.target.classList.add('is-visible', 'visible');
        }, delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Auto-stagger sibling reveal elements
  const groups = new Map();
  els.forEach(el => {
    const parent = el.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(el);
  });

  groups.forEach(siblings => {
    if (siblings.length > 1) {
      siblings.forEach((el, i) => {
        if (!el.dataset.delay) el.dataset.delay = String(i * 80);
      });
    }
  });

  els.forEach(el => io.observe(el));
}

/* ── 4. SKILL BARS ───────────────────────────────────────── */
function initSkillBars() {
  const groups = $$('.skill-group');
  const newBars = $$('.c-skill-bar__fill');

  const animate = (fills) => {
    fills.forEach(bar => {
      const w = bar.dataset.width || bar.style.getPropertyValue('--target-width');
      if (w) bar.style.width = w;
    });
  };

  if (prefersReducedMotion()) {
    animate(newBars);
    animate($$('.skill-bar-fill'));
    return;
  }

  // Legacy .skill-bar-fill support
  const legacyObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.width;
        });
        legacyObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  groups.forEach(g => legacyObs.observe(g));

  // New .c-skill-bar__fill
  if (newBars.length) {
    const newObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.c-skill-bar__fill').forEach(bar => {
            bar.style.width = bar.dataset.width || '0%';
          });
          newObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    $$('.c-skill-bar').forEach(g => newObs.observe(g));
  }
}

/* ── 5. FILTER BAR ───────────────────────────────────────── */
function initFilterBars() {
  $$('.c-filter-bar, .filter-bar, .cat-bar').forEach(bar => {
    const btns  = $$('[class*="filter-btn"], .cat-btn', bar);
    const items = $$('[data-category]', bar.closest('.u-section, .section, .page-wrapper') || document);

    btns.forEach(btn => {
      on(btn, 'click', () => {
        btns.forEach(b => b.classList.remove('is-active', 'active'));
        btn.classList.add('is-active', 'active');

        const cat = btn.dataset.filter || btn.textContent.trim().toLowerCase();

        items.forEach(item => {
          const itemCat = (item.dataset.category || '').toLowerCase();
          const show = cat === 'all' || itemCat.includes(cat);
          item.style.display = show ? '' : 'none';
          // re-trigger reveal if coming back into view
          if (show) item.classList.remove('is-visible', 'visible');
          requestAnimationFrame(() => {
            if (show) item.classList.add('is-visible', 'visible');
          });
        });
      });
    });
  });
}

/* ── 6. TYPEWRITER ───────────────────────────────────────── */
function initTypewriter() {
  const el = $('#typewriter');
  if (!el) return;

  const words = ['Full-Stack Developer', 'Open-Source Enthusiast', 'UI/UX Craftsman', 'Cloud Architect'];

  if (prefersReducedMotion()) {
    el.textContent = words[0];
    return;
  }

  // Announce to screen readers on word change
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');

  let wi = 0, ci = 0, deleting = false;

  function tick() {
    const word = words[wi];
    el.textContent = deleting ? word.slice(0, --ci) : word.slice(0, ++ci);

    if (!deleting && ci === word.length) {
      deleting = true;
      setTimeout(tick, 2000);
      return;
    }
    if (deleting && ci === 0) {
      deleting = false;
      wi = (wi + 1) % words.length;
      setTimeout(tick, 300);
      return;
    }
    setTimeout(tick, deleting ? 40 : 80);
  }

  tick();
}

/* ── 7. CURSOR GLOW ──────────────────────────────────────── */
function initCursorGlow() {
  // Only on non-touch devices
  if ('ontouchstart' in window) return;
  if (prefersReducedMotion()) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  Object.assign(glow.style, {
    position:      'fixed',
    width:         '320px',
    height:        '320px',
    borderRadius:  '50%',
    pointerEvents: 'none',
    zIndex:        '9998',
    background:    'radial-gradient(circle, rgba(217,38,242,0.055) 0%, transparent 70%)',
    transform:     'translate(-50%, -50%)',
    transition:    'opacity 0.3s',
    willChange:    'left, top',
  });
  document.body.appendChild(glow);

  let raf;
  let cx = -500, cy = -500;

  document.addEventListener('mousemove', e => {
    cx = e.clientX; cy = e.clientY;
    if (!raf) {
      raf = requestAnimationFrame(() => {
        glow.style.left = cx + 'px';
        glow.style.top  = cy + 'px';
        raf = null;
      });
    }
  }, { passive: true });

  document.addEventListener('mouseleave', () => { glow.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { glow.style.opacity = '1'; });
}

/* ── 8. FORM VALIDATOR ───────────────────────────────────── */
function createValidator(form) {
  if (!form) return null;

  const rules = {
    required: v => v.trim() !== '' || 'This field is required',
    email:    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Please enter a valid email address',
    minlen:   (v, n) => v.trim().length >= n || `Minimum ${n} characters required`,
  };

  function validateField(input) {
    const errors = [];
    const v = input.value;

    if (input.required && !v.trim()) errors.push(rules.required(v));
    if (input.type === 'email' && v) {
      const r = rules.email(v);
      if (r !== true) errors.push(r);
    }
    if (input.minLength > 0 && v) {
      const r = rules.minlen(v, input.minLength);
      if (r !== true) errors.push(r);
    }

    const errEl = form.querySelector(`[data-error-for="${input.id}"]`);
    const isValid = errors.length === 0;

    input.setAttribute('aria-invalid', !isValid ? 'true' : 'false');
    if (isValid && v) input.dataset.valid = 'true';
    else delete input.dataset.valid;

    if (errEl) {
      errEl.textContent = errors[0] || '';
      errEl.style.display = errors[0] ? 'flex' : 'none';
    }

    return isValid;
  }

  // Real-time validation on blur
  $$('input, textarea, select', form).forEach(input => {
    on(input, 'blur', () => validateField(input));
    on(input, 'input', () => {
      if (input.getAttribute('aria-invalid') === 'true') validateField(input);
    });
  });

  return {
    validate() {
      const fields = $$('input, textarea, select', form);
      return fields.map(f => validateField(f)).every(Boolean);
    }
  };
}

/* ── 9. CONTACT FORM ─────────────────────────────────────── */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  const validator = createValidator(form);
  const submitBtn = form.querySelector('[type=submit]');

  on(form, 'submit', async e => {
    e.preventDefault();

    if (validator && !validator.validate()) {
      Toast.error('Validation Error', 'Please fix the highlighted fields.');
      return;
    }

    // Loading state
    submitBtn.dataset.loading = 'true';
    submitBtn.setAttribute('aria-disabled', 'true');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = 'Sending… <i class="fa-solid fa-circle-notch fa-spin"></i>';

    // Simulate API call (replace with real fetch)
    await new Promise(r => setTimeout(r, 1800));

    // Reset
    submitBtn.dataset.loading = 'false';
    submitBtn.removeAttribute('aria-disabled');
    submitBtn.innerHTML = originalText;

    Toast.success('Message Sent!', 'Thanks for reaching out. I\'ll reply within 24h.');
    form.reset();
    $$('input, textarea', form).forEach(el => {
      delete el.dataset.valid;
      el.removeAttribute('aria-invalid');
    });
  });
}

/* ── 10. NEWSLETTER FORM ─────────────────────────────────── */
function initNewsletter() {
  $$('.newsletter-form, .c-newsletter__form').forEach(form => {
    on(form, 'submit', async e => {
      e.preventDefault();
      const btn   = form.querySelector('button[type=submit]');
      const input = form.querySelector('input[type=email]');

      if (!input || !input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        Toast.error('Invalid Email', 'Please enter a valid email address.');
        input && input.focus();
        return;
      }

      btn.dataset.loading = 'true';
      await new Promise(r => setTimeout(r, 1200));
      btn.dataset.loading = 'false';

      Toast.success('Subscribed!', 'You\'re on the list. Watch your inbox!');
      form.reset();
    });
  });
}

/* ── 11. STAT COUNTER (count-up animation) ───────────────── */
function initStatCounters() {
  if (prefersReducedMotion()) return;

  const stats = $$('.c-stat__number, .stat-number');

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el  = entry.target;
      const raw = el.textContent.trim();
      const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
      const suffix = raw.replace(/[0-9.]/g, '');

      if (isNaN(num)) return;

      const duration = 1400;
      const start    = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased    = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        const current  = Math.round(eased * num * 10) / 10;
        el.textContent = (Number.isInteger(num) ? Math.round(current) : current.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(frame);
      }

      requestAnimationFrame(frame);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  stats.forEach(el => io.observe(el));
}

/* ── 12. PAGE TRANSITIONS ────────────────────────────────── */
function initPageTransitions() {
  if (prefersReducedMotion()) return;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'c-page-transition';
  document.body.appendChild(overlay);

  // Intercept internal link clicks
  on(document, 'click', e => {
    const a = e.target.closest('a');
    if (!a) return;

    const href = a.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || a.target === '_blank') return;

    // Only same-origin pages
    try {
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
    } catch { return; }

    e.preventDefault();
    overlay.classList.add('is-entering');

    overlay.addEventListener('animationend', () => {
      window.location.href = href;
    }, { once: true });
  });

  // On page load, exit animation
  overlay.classList.add('is-leaving');
}

/* ── 13. ACCESSIBILITY HELPERS ───────────────────────────── */
function initA11y() {
  // Skip link
  const skip = document.createElement('a');
  skip.href = '#main-content';
  skip.className = 'skip-link';
  skip.textContent = 'Skip to main content';
  document.body.prepend(skip);

  // Add id to main content if missing
  const main = $('main, .page-wrapper');
  if (main && !main.id) main.id = 'main-content';
}

/* ── INIT ALL ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initA11y();
  initNavbar();
  initScrollReveal();
  initSkillBars();
  initFilterBars();
  initTypewriter();
  initCursorGlow();
  initContactForm();
  initNewsletter();
  initStatCounters();
  // Page transitions disabled to avoid breaking simple nav; enable if desired:
  // initPageTransitions();
});

/* Expose Toast globally for inline usage */
window.Toast = Toast;

/* Legacy handleNewsletter() for blog.html inline handler */
window.handleNewsletter = function(e) {
  e.preventDefault();
  const form = e.target;
  const btn   = form.querySelector('button[type=submit]');
  const input = form.querySelector('input[type=email]');

  if (!input || !input.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
    Toast.error('Invalid Email', 'Please enter a valid email address.');
    return;
  }

  btn.dataset.loading = 'true';
  btn.setAttribute('aria-disabled', 'true');

  setTimeout(() => {
    btn.dataset.loading = 'false';
    btn.removeAttribute('aria-disabled');
    Toast.success('Subscribed!', "You're on the list. Watch your inbox!");
    form.reset();
  }, 1200);
};
