/**
 * portfolio-loader.js
 * Dynamically loads content from the Cloudflare Workers API (/api/public/*)
 * and populates all portfolio pages in real-time.
 * Manages themes, CV cache-busting, header/footer sync, and real-time content.
 */
(function () {
  'use strict';

  const API = '/api/public';
  const rawPath = location.pathname.split('/').pop() || 'index.html';
  const page = rawPath.replace(/\.html$/, '') || 'index';

  /* ── Fetch helper with timeout ───────────────────────────────── */
  async function get(endpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(API + endpoint, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`${endpoint} returned ${res.status}`);
      return res.json();
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  /* ── DOM helpers ─────────────────────────────────────────────── */
  function setText(id, value) {
    if (value === undefined || value === null) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function setHref(id, href) {
    if (!href) return;
    const el = document.getElementById(id);
    if (el) el.href = href;
  }
  function esc(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function attr(str) {
    return String(str || '').replace(/"/g, '&quot;');
  }

  /* ══════════════════════════════════════════════════════════════
     THEMING ENGINE (6 Presets + Live Floating Switcher)
  ══════════════════════════════════════════════════════════════ */
  const THEMES = [
    { id: 'cyber-neon',         name: 'Cyber Neon',         dot: 'linear-gradient(135deg, #d926f2, #00f0ff)', desc: 'Violet & Cyan' },
    { id: 'emerald-matrix',     name: 'Emerald Matrix',     dot: 'linear-gradient(135deg, #10b981, #34d399)', desc: 'Hacker Green' },
    { id: 'sunset-ember',       name: 'Sunset Ember',       dot: 'linear-gradient(135deg, #f97316, #ec4899)', desc: 'Fire Orange' },
    { id: 'electric-ocean',     name: 'Electric Ocean',     dot: 'linear-gradient(135deg, #38bdf8, #6366f1)', desc: 'Sapphire & Azure' },
    { id: 'luxury-gold',        name: 'Luxury Gold',        dot: 'linear-gradient(135deg, #eab308, #ca8a04)', desc: 'Champagne Gold' },
    { id: 'amethyst-twilight',  name: 'Amethyst Twilight',  dot: 'linear-gradient(135deg, #a855f7, #f43f5e)', desc: 'Deep Violet & Rose' },
    { id: 'crimson-cyber',      name: 'Crimson Cyber',      dot: 'linear-gradient(135deg, #f43f5e, #e11d48)', desc: 'Stealth & Ruby' },
    { id: 'minimal-light',      name: 'Minimal Light',      dot: 'linear-gradient(135deg, #4f46e5, #0284c7)', desc: 'High-Contrast Light' }
  ];

  function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    try { localStorage.setItem('sk_theme', themeId); } catch(e) {}

    // Update active state in picker menu if exists
    document.querySelectorAll('.theme-opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === themeId);
    });
  }

  async function initTheme() {
    let currentTheme = null;
    try { currentTheme = localStorage.getItem('sk_theme'); } catch(e) {}

    if (!currentTheme) {
      try {
        const res = await get('/theme');
        if (res && res.theme) currentTheme = res.theme;
      } catch(e) {}
    }

    if (!currentTheme) currentTheme = 'cyber-neon';
    applyTheme(currentTheme);

    // Inject floating theme switcher if not already present
    if (!document.getElementById('floating-theme-pill')) {
      const pill = document.createElement('div');
      pill.id = 'floating-theme-pill';
      pill.className = 'floating-theme-pill';
      pill.setAttribute('aria-label', 'Switch website theme');
      pill.innerHTML = `
        <span class="theme-dot"></span>
        <span>Theme</span>
        <i class="fa-solid fa-palette" style="font-size:12px;opacity:0.8;"></i>
      `;

      const menu = document.createElement('div');
      menu.id = 'theme-picker-menu';
      menu.className = 'theme-picker-menu';
      menu.innerHTML = THEMES.map(t => `
        <button class="theme-opt-btn ${t.id === currentTheme ? 'active' : ''}" data-theme="${t.id}">
          <span class="theme-opt-swatch" style="background:${t.dot};"></span>
          <span>${t.name}</span>
        </button>
      `).join('');

      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
      });

      menu.addEventListener('click', (e) => {
        const btn = e.target.closest('.theme-opt-btn');
        if (btn) {
          const tid = btn.dataset.theme;
          applyTheme(tid);
          menu.classList.remove('active');
        }
      });

      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !pill.contains(e.target)) {
          menu.classList.remove('active');
        }
      });

      document.body.appendChild(pill);
      document.body.appendChild(menu);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     CV SYNCHRONIZATION (Instant Zero-Cache & Meta Verification)
  ══════════════════════════════════════════════════════════════ */
  async function syncCV() {
    try {
      let cvUrl = null;
      try {
        cvUrl = localStorage.getItem('sk_uploaded_cv_url');
      } catch (e) {}

      const [metaRes, contactRes] = await Promise.allSettled([
        get('/file/cv/meta'),
        get('/contact')
      ]);

      if (metaRes.status === 'fulfilled' && metaRes.value && metaRes.value.exists) {
        cvUrl = metaRes.value.url || `/api/public/file/cv?v=${metaRes.value.uploadedAt || Date.now()}`;
        try { localStorage.setItem('sk_uploaded_cv_url', cvUrl); } catch(e) {}
      } else if (contactRes.status === 'fulfilled' && contactRes.value && contactRes.value.cvUrl) {
        cvUrl = contactRes.value.cvUrl;
        try { localStorage.setItem('sk_uploaded_cv_url', cvUrl); } catch(e) {}
      }

      if (!cvUrl) {
        cvUrl = '/api/public/file/cv';
      }

      // Update every CV link across the page
      document.querySelectorAll('a[data-cv-link], #dyn-cv-link, a[href*="cv.pdf"], a[href*="/file/cv"], a[href*="resume"]').forEach(a => {
        a.href = cvUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        if (!a.hasAttribute('download')) a.setAttribute('download', 'Sanket_Kandel_CV.pdf');
      });
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     GLOBAL HEADER & FOOTER SYNCHRONIZATION
  ══════════════════════════════════════════════════════════════ */
  async function syncHeaderFooter() {
    try {
      const [headerRes, footerRes, contactRes] = await Promise.allSettled([
        get('/header'),
        get('/footer'),
        get('/contact')
      ]);

      // 1. Header Sync
      if (headerRes.status === 'fulfilled' && headerRes.value) {
        const h = headerRes.value;
        if (h.logoText) {
          const logoEl = document.getElementById('dyn-header-logo');
          if (logoEl) logoEl.textContent = h.logoSub || h.logoText;
        }
        if (h.hireBtnText) {
          const hireEl = document.getElementById('dyn-hire-btn');
          if (hireEl) {
            hireEl.innerHTML = `${esc(h.hireBtnText)} <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>`;
            if (h.hireBtnLink) hireEl.href = h.hireBtnLink;
          }
        }
        if (h.availabilityText) {
          document.querySelectorAll('.c-avail-banner__text, #dyn-status').forEach(el => {
            el.textContent = h.availabilityText;
          });
        }
      }

      // 2. Footer Sync
      if (footerRes.status === 'fulfilled' && footerRes.value) {
        const f = footerRes.value;
        if (f.logoText) setText('dyn-footer-logo', f.logoText);
        if (f.tagline)  setText('dyn-footer-tagline', f.tagline);
        if (f.copy)     setText('dyn-footer-copy', f.copy);
      }

      // 3. Socials Sync
      if (contactRes.status === 'fulfilled' && contactRes.value && contactRes.value.socials) {
        const s = contactRes.value.socials;
        if (s.github)    document.querySelectorAll('[data-social="github"], #dyn-social-github').forEach(a => { a.href = s.github; });
        if (s.linkedin)  document.querySelectorAll('[data-social="linkedin"], #dyn-social-linkedin').forEach(a => { a.href = s.linkedin; });
        if (s.twitter)   document.querySelectorAll('[data-social="twitter"], #dyn-social-twitter').forEach(a => { a.href = s.twitter; });
        if (s.instagram) document.querySelectorAll('[data-social="instagram"], #dyn-social-instagram').forEach(a => { a.href = s.instagram; });
      }
    } catch(e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     INDEX PAGE
  ══════════════════════════════════════════════════════════════ */
  async function loadIndex() {
    const [heroRes, projectsRes] = await Promise.allSettled([
      get('/hero'), get('/projects')
    ]);

    // ── Hero content
    if (heroRes.status === 'fulfilled') {
      const d = heroRes.value;
      if (d && Object.keys(d).length) {
        if (d.name) setText('dyn-hero-name', d.name);

        if (d.eyebrow) {
          const el = document.getElementById('dyn-eyebrow');
          if (el) {
            const icon = el.querySelector('i');
            el.innerHTML = '';
            if (icon) el.appendChild(icon);
            el.append('\u00a0' + d.eyebrow);
          }
        }

        if (d.bio) setText('dyn-hero-bio', d.bio);
        if (d.status) setText('dyn-status', d.status);

        if (d.stats) {
          if (d.stats.years)    setText('dyn-stat-years',    d.stats.years);
          if (d.stats.projects) setText('dyn-stat-projects', d.stats.projects);
          if (d.stats.stars)    setText('dyn-stat-stars',    d.stats.stars);
          if (d.stats.clients)  setText('dyn-stat-clients',  d.stats.clients);
        }

        if (Array.isArray(d.typewriterWords) && d.typewriterWords.length) {
          window.__twWords = d.typewriterWords;
        }
      }
    }

    // ── Featured projects grid
    if (projectsRes.status === 'fulfilled') {
      const { projects = [] } = projectsRes.value;
      const featured = projects.filter(p => p.featured).slice(0, 3);
      if (featured.length) renderFeaturedCards(featured);
    }
  }

  function renderFeaturedCards(projects) {
    const grid = document.getElementById('dyn-featured-grid');
    if (!grid) return;
    grid.innerHTML = projects.map(p => `
      <article class="c-project-card c-reveal" role="listitem" aria-label="${attr(p.name)} project">
        <div class="c-project-card__meta">
          <div class="c-project-card__icon" aria-hidden="true"><i class="${attr(p.icon || 'fa-solid fa-rocket')}"></i></div>
          <div class="c-project-card__title-wrap">
            <div class="c-project-card__title">${esc(p.name)}</div>
            <div class="c-project-card__subtitle">${esc(p.category || '')}</div>
          </div>
        </div>
        <p class="c-project-card__desc">${esc(p.desc || '')}</p>
        <div class="c-project-card__tags" aria-label="Technologies used">
          ${(p.tags || []).map(t => `<span class="c-project-card__tag">${esc(t)}</span>`).join('')}
        </div>
        <div class="c-project-card__links">
          ${p.liveUrl   ? `<a href="${attr(p.liveUrl)}"   target="_blank" rel="noopener" class="c-project-card__link c-project-card__link--primary">Live Demo <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>` : ''}
          ${p.githubUrl ? `<a href="${attr(p.githubUrl)}" target="_blank" rel="noopener" class="c-project-card__link c-project-card__link--secondary"><i class="fa-brands fa-github" aria-hidden="true"></i> GitHub</a>` : ''}
        </div>
      </article>`).join('');
  }

  /* ══════════════════════════════════════════════════════════════
     ABOUT PAGE (+ Core Beliefs / Philosophy)
  ══════════════════════════════════════════════════════════════ */
  async function loadAbout() {
    const [aboutRes, beliefsRes] = await Promise.allSettled([
      get('/about'),
      get('/beliefs')
    ]);

    if (aboutRes.status === 'fulfilled') {
      const d = aboutRes.value;
      if (d && Object.keys(d).length) {
        if (d.bio?.[0]) setText('dyn-about-p1', d.bio[0]);
        if (d.bio?.[1]) setText('dyn-about-p2', d.bio[1]);
        if (d.bio?.[2]) setText('dyn-about-p3', d.bio[2]);
        if (d.currentFocus) setText('dyn-current-focus', d.currentFocus);
        if (d.timeline?.length)   renderTimeline(d.timeline);
        if (d.education?.length)  renderEducation(d.education);
        if (d.interests?.length)  renderInterests(d.interests);
      }
    }

    if (beliefsRes.status === 'fulfilled' && Array.isArray(beliefsRes.value)) {
      renderBeliefs(beliefsRes.value);
    }
  }

  function renderBeliefs(items) {
    const el = document.getElementById('dyn-beliefs');
    if (!el || !items.length) return;
    el.innerHTML = items.map(b => `
      <div class="belief-card glass reveal">
        <div class="belief-icon"><i class="${attr(b.icon || 'fa-solid fa-lightbulb')}"></i></div>
        <div class="belief-title">${esc(b.title)}</div>
        <div class="belief-desc">${esc(b.desc)}</div>
      </div>
    `).join('');
  }

  function renderTimeline(items) {
    const el = document.getElementById('dyn-timeline');
    if (!el) return;
    el.innerHTML = items.map(i => `
      <div class="timeline-item">
        <span class="timeline-date">${esc(i.date)}</span>
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-role">${esc(i.role)}</div>
          <div class="timeline-company">${esc(i.company)}</div>
          <div class="timeline-desc">${esc(i.desc)}</div>
        </div>
      </div>`).join('');
  }

  function renderEducation(items) {
    const el = document.getElementById('dyn-education');
    if (!el) return;
    el.innerHTML = items.map((i, idx) => `
      <div class="edu-card glass" ${idx === 0 ? 'style="border-left: 3px solid var(--accent-cyan);"' : ''}>
        <div class="edu-degree"><i class="${attr(i.icon || 'fa-solid fa-graduation-cap')} ${idx === 0 ? 'icon-cyan' : ''}"></i> ${esc(i.degree)}</div>
        <div class="edu-school">${esc(i.school)}</div>
        <div class="edu-year">${esc(i.year)}</div>
      </div>`).join('');
  }

  function renderInterests(items) {
    const el = document.getElementById('dyn-interests');
    if (!el) return;
    el.innerHTML = items.map(i => `
      <div class="interest-item glass">
        <div class="interest-icon"><i class="${attr(i.icon || 'fa-solid fa-star')}"></i></div>
        <div class="interest-label">${esc(i.label)}</div>
      </div>`).join('');
  }

  /* ══════════════════════════════════════════════════════════════
     PROJECTS PAGE (+ Open Source Contributions)
  ══════════════════════════════════════════════════════════════ */
  async function loadProjects() {
    const [projRes, ossRes] = await Promise.allSettled([
      get('/projects'),
      get('/oss')
    ]);

    if (projRes.status === 'fulfilled') {
      const { projects = [] } = projRes.value;
      if (projects.length) {
        const grid = document.getElementById('projects-grid');
        if (grid) {
          const featured = projects.filter(p => p.featured);
          const regular  = projects.filter(p => !p.featured);

          grid.innerHTML = [
            ...featured.map(renderProjectFeatured),
            ...regular.map(renderProjectCard)
          ].join('');

          bindProjectFilters();
        }
      }
    }

    if (ossRes.status === 'fulfilled' && Array.isArray(ossRes.value)) {
      renderOss(ossRes.value);
    }

    if (window.initScrollReveal) window.initScrollReveal();
  }

  function renderOss(items) {
    const el = document.getElementById('dyn-oss-list');
    if (!el || !items.length) return;
    el.innerHTML = items.map(o => `
      <div class="oss-item glass reveal">
        <div class="oss-icon"><i class="fa-brands fa-github icon-cyan"></i></div>
        <div>
          <div class="oss-name">${o.link ? `<a href="${attr(o.link)}" target="_blank" rel="noopener" style="color:inherit;text-decoration:none;">${esc(o.name)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:11px;opacity:0.7;"></i></a>` : esc(o.name)}</div>
          <div class="oss-desc">${esc(o.desc)}</div>
        </div>
        <div class="oss-stats">
          ${o.stars ? `<span class="oss-stat"><i class="fa-solid fa-star icon-amber"></i> ${esc(o.stars)}</span>` : ''}
          ${o.prs ? `<span class="oss-stat"><i class="fa-solid fa-code-pull-request"></i> ${esc(o.prs)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  function renderProjectFeatured(p) {
    const cat = (p.category || 'fullstack cloud').toLowerCase();
    return `
      <div class="project-card glass-lg project-featured reveal" data-category="${attr(cat)}">
        <div class="project-visual"><i class="${attr(p.icon || 'fa-solid fa-rocket')}"></i></div>
        <div class="project-content">
          <div class="featured-label"><i class="fa-solid fa-star"></i> Featured Project</div>
          <div class="project-title">${esc(p.name)}</div>
          <p class="project-desc">${esc(p.desc || '')}</p>
          <div class="project-tags">${(p.tags || []).map(t => `<span class="project-tag">${esc(t)}</span>`).join('')}</div>
          <div class="project-links">
            ${p.liveUrl   ? `<a href="${attr(p.liveUrl)}"   target="_blank" rel="noopener" class="project-link">Live Demo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
            ${p.githubUrl ? `<a href="${attr(p.githubUrl)}" target="_blank" rel="noopener" class="project-link secondary"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
            <span class="badge badge-green project-status"><i class="fa-solid fa-circle-check"></i> ${esc(p.status || 'In Production')}</span>
          </div>
        </div>
      </div>`;
  }

  function renderProjectCard(p) {
    const cat = (p.category || 'fullstack').toLowerCase();
    return `
      <div class="project-card glass reveal" data-category="${attr(cat)}">
        <div class="project-icon"><i class="${attr(p.icon || 'fa-solid fa-cube')}"></i></div>
        <div class="project-title">${esc(p.name)}</div>
        <p class="project-desc">${esc(p.desc || '')}</p>
        <div class="project-tags">${(p.tags || []).map(t => `<span class="project-tag">${esc(t)}</span>`).join('')}</div>
        <div class="project-links">
          ${p.liveUrl   ? `<a href="${attr(p.liveUrl)}"   target="_blank" rel="noopener" class="project-link">Live <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
          ${p.githubUrl ? `<a href="${attr(p.githubUrl)}" target="_blank" rel="noopener" class="project-link secondary"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
        </div>
      </div>`;
  }

  function bindProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const cards = document.querySelectorAll('#projects-grid [data-category]');
        cards.forEach(card => {
          const cats = card.dataset.category || '';
          card.style.display = (filter === 'all' || cats.includes(filter)) ? '' : 'none';
        });
      };
    });
  }

  /* ══════════════════════════════════════════════════════════════
     SKILLS PAGE (+ Tech Stack Tools of the Trade)
  ══════════════════════════════════════════════════════════════ */
  async function loadSkills() {
    const [skillsRes, techRes] = await Promise.allSettled([
      get('/skills'),
      get('/tech-stack')
    ]);

    if (skillsRes.status === 'fulfilled') {
      const { groups = [] } = skillsRes.value;
      if (groups.length) {
        const wrap = document.getElementById('dyn-skills-groups');
        if (wrap) {
          wrap.innerHTML = groups.map(g => `
            <div class="skill-group glass reveal">
              <div class="skill-group-title"><span><i class="${attr(g.icon || 'fa-solid fa-code')}"></i></span> ${esc(g.name)}</div>
              ${(g.skills || []).map(s => `
                <div class="skill-bar-wrap">
                  <div class="skill-bar-header"><span>${esc(s.name)}</span><span>${s.level || 0}%</span></div>
                  <div class="skill-bar-track"><div class="skill-bar-fill" data-width="${s.level || 0}%" style="width: ${s.level || 0}%;"></div></div>
                </div>`).join('')}
            </div>`).join('');
        }
      }
    }

    if (techRes.status === 'fulfilled' && Array.isArray(techRes.value)) {
      renderTechStack(techRes.value);
    }

    if (window.initScrollReveal) window.initScrollReveal();
    if (window.initSkillBars)    window.initSkillBars();
  }

  function renderTechStack(items) {
    const el = document.getElementById('dyn-tech-grid');
    if (!el || !items.length) return;
    el.innerHTML = items.map(t => `
      <div class="tech-item glass reveal">
        <div class="tech-icon"><i class="${attr(t.icon || 'fa-solid fa-microchip')}"></i></div>
        <div class="tech-name">${esc(t.name)}</div>
        ${t.category ? `<span class="tech-cat" style="font-size:11px;color:var(--text-dim);display:block;margin-top:2px;">${esc(t.category)}</span>` : ''}
      </div>
    `).join('');
  }

  /* ══════════════════════════════════════════════════════════════
     CONTACT PAGE
  ══════════════════════════════════════════════════════════════ */
  async function loadContact() {
    const d = await get('/contact');
    if (!d || !Object.keys(d).length) return;

    if (d.badge) setText('dyn-contact-badge', d.badge);
    if (d.heroTitle) {
      const el = document.getElementById('dyn-contact-hero-title');
      if (el) el.innerHTML = d.heroTitle;
    }
    if (d.heroSub) setText('dyn-contact-hero-sub', d.heroSub);
    if (d.infoTitle) {
      const el = document.getElementById('dyn-contact-info-title');
      if (el) el.innerHTML = d.infoTitle;
    }
    if (d.infoDesc) setText('dyn-contact-info-desc', d.infoDesc);

    if (d.email) {
      const emailLink = document.getElementById('dyn-email-link');
      if (emailLink) {
        emailLink.href = `mailto:${d.email}`;
        const val = emailLink.querySelector('.contact-item-value');
        if (val) val.textContent = d.email;
      }
    }

    if (d.phone) {
      const phoneLink = document.getElementById('dyn-phone-link');
      if (phoneLink) {
        phoneLink.href = `tel:${d.phone.replace(/\s+/g,'')}`;
        const val = phoneLink.querySelector('.contact-item-value');
        if (val) val.textContent = d.phone;
      }
    }

    if (d.location) {
      setText('dyn-location', d.location);
    }

    if (d.timezone) {
      setText('dyn-timezone', d.timezone);
    }

    if (d.cvLabel) setText('dyn-contact-cv-label', d.cvLabel);
    if (d.cvSub) setText('dyn-contact-cv-val', d.cvSub);

    if (d.mapTitle) {
      setText('dyn-contact-map-title', d.mapTitle);
    } else if (d.location) {
      setText('dyn-contact-map-title', `Based in ${d.location}`);
    }

    if (d.mapSub) setText('dyn-contact-map-sub', d.mapSub);
    if (d.note) setText('dyn-contact-note', d.note);

    if (d.availability) {
      setText('dyn-contact-avail', d.availability);
      const el = document.querySelector('.c-avail-banner__text');
      if (el) el.textContent = d.availability;
    }

    if (d.replyTime) {
      setText('dyn-contact-reply-time', d.replyTime);
      const el = document.querySelector('.c-avail-banner__sub');
      if (el) el.textContent = d.replyTime;
    }

    const s = d.socials || {};
    const updateSocial = (id, url) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!url) {
        if (id === 'dyn-social-instagram') el.style.display = 'none';
        return;
      }
      el.href = url;
      el.style.display = 'flex';
      const span = el.querySelector('span:not(.external-link-icon)');
      if (span) span.textContent = url.replace(/^https?:\/\/(www\.)?/, '');
    };
    updateSocial('dyn-social-github',   s.github);
    updateSocial('dyn-social-linkedin', s.linkedin);
    updateSocial('dyn-social-twitter',  s.twitter);
    updateSocial('dyn-social-instagram', s.instagram);
  }

  /* ══════════════════════════════════════════════════════════════
     BLOG PAGE
  ══════════════════════════════════════════════════════════════ */
  async function loadBlog() {
    const { posts = [] } = await get('/blog');
    if (!posts.length) return;

    // Featured post (only if explicitly marked featured: true)
    const featured = posts.find(p => p.featured === true);
    const featEl = document.getElementById('dyn-blog-featured');
    if (featEl) {
      if (featured) {
        featEl.href = `blog-post.html?slug=${attr(featured.slug || featured.id)}`;
        featEl.style.display = 'grid';
        featEl.innerHTML = `
          <div class="blog-featured-img"><i class="${attr(featured.icon || 'fa-solid fa-newspaper')}"></i></div>
          <div class="blog-featured-content">
            <div class="blog-featured-label"><i class="fa-solid fa-star"></i> Featured Article</div>
            <div class="blog-featured-title">${esc(featured.title)}</div>
            <div class="blog-meta">
              <span><i class="fa-regular fa-calendar"></i> ${esc(featured.date || '')}</span>
              <span><i class="fa-regular fa-clock"></i> ${esc(featured.readTime || '')}</span>
              <span class="badge badge-violet">${esc(featured.category || 'Engineering')}</span>
            </div>
            <div class="blog-featured-excerpt">${esc(featured.excerpt || '')}</div>
            <div class="blog-read-more">Read Article <i class="fa-solid fa-arrow-right"></i></div>
          </div>`;
      } else {
        featEl.style.display = 'none';
      }
    }

    // Posts grid (supports both #dyn-blog-posts and #dyn-blog-grid)
    const grid = document.getElementById('dyn-blog-posts') || document.getElementById('dyn-blog-grid');
    if (grid) {
      const list = (featEl && featured) ? posts.filter(p => p.id !== featured.id) : posts;
      grid.innerHTML = (list.length ? list : posts).map(p => `
        <a href="blog-post.html?slug=${attr(p.slug || p.id)}" class="blog-card glass reveal" data-category="${attr((p.category || 'Engineering').toLowerCase())}">
          <div class="blog-card-icon"><i class="${attr(p.icon || 'fa-solid fa-code')} icon-cyan"></i></div>
          <div class="blog-meta">
            <span><i class="fa-regular fa-calendar"></i> ${esc(p.date || '')}</span>
            <span><i class="fa-regular fa-clock"></i> ${esc(p.readTime || '')}</span>
          </div>
          <div class="blog-title">${esc(p.title)}</div>
          <div class="blog-excerpt">${esc(p.excerpt || '')}</div>
          <div class="blog-tags">
            <span class="badge badge-cyan">${esc(p.category || 'Article')}</span>
            ${(p.tags || []).slice(0, 2).map(t => `<span class="badge badge-violet">${esc(t)}</span>`).join('')}
          </div>
          <div class="blog-read-more">Read More <i class="fa-solid fa-arrow-right"></i></div>
        </a>`).join('');

      bindBlogFilters();
      if (window.initScrollReveal) window.initScrollReveal();
    }
  }

  function bindBlogFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn, .cat-btn, #blog-filter-bar button');
    filterBtns.forEach(btn => {
      btn.onclick = () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = (btn.dataset.category || btn.textContent).trim().toLowerCase();
        const cards = document.querySelectorAll('#dyn-blog-posts .blog-card, #dyn-blog-grid .blog-card');
        cards.forEach(card => {
          const cat = (card.dataset.category || '').toLowerCase();
          if (filter === 'all' || !filter) {
            card.style.display = '';
            return;
          }
          const isMatch = cat.includes(filter) ||
                          filter.includes(cat) ||
                          (filter.includes('ai') && (cat.includes('ai') || cat.includes('machine learning') || cat.includes('intelligence') || cat.includes('deep learning'))) ||
                          (filter.includes('cloud') && (cat.includes('cloud') || cat.includes('aws') || cat.includes('architecture') || cat.includes('distributed'))) ||
                          (filter.includes('react') && (cat.includes('react') || cat.includes('frontend'))) ||
                          (filter.includes('devops') && (cat.includes('devops') || cat.includes('tooling') || cat.includes('docker') || cat.includes('kubernetes')));
          card.style.display = isMatch ? '' : 'none';
        });
      };
    });
  }

  /* ══════════════════════════════════════════════════════════════
     CONTACT FORM — Real API submission
  ══════════════════════════════════════════════════════════════ */
  function initRealContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.dataset.realApi = 'true';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      const btn = form.querySelector('[type=submit]');
      const origHTML = btn.innerHTML;
      btn.innerHTML = 'Sending\u2026 <i class="fa-solid fa-circle-notch fa-spin"></i>';
      btn.disabled = true;

      try {
        const body = {
          name:    (form.querySelector('[name=name]')?.value    || '').trim(),
          email:   (form.querySelector('[name=email]')?.value   || '').trim(),
          subject: (form.querySelector('[name=subject]')?.value || '').trim(),
          message: (form.querySelector('[name=message]')?.value || '').trim(),
          type:    (form.querySelector('[name=type]')?.value    || '').trim()
        };

        if (!body.name || !body.email || !body.message) {
          throw new Error('required-fields');
        }

        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('api-error');

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
        btn.style.background = 'linear-gradient(135deg,#10b981,#06b6d4)';
        form.reset();
        if (window.Toast) Toast.success('Message Sent!', "Thanks for reaching out. I'll reply within 24h.");
        setTimeout(() => { btn.innerHTML = origHTML; btn.style.background = ''; btn.disabled = false; }, 4000);
      } catch (err) {
        btn.innerHTML = origHTML;
        btn.disabled = false;
        if (window.Toast) {
          if (err.message === 'required-fields') {
            Toast.error('Missing fields', 'Please fill in your name, email, and message.');
          } else {
            Toast.error('Send failed', 'Please email me directly at info@sanketkandel.com.np');
          }
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     INITIALIZATION
  ══════════════════════════════════════════════════════════════ */
  async function init() {
    initTheme();
    syncCV();
    syncHeaderFooter();

    try {
      if (page === 'index' || page === '') {
        await loadIndex();
      } else if (page === 'about') {
        await loadAbout();
      } else if (page === 'projects') {
        await loadProjects();
      } else if (page === 'skills') {
        await loadSkills();
      } else if (page === 'contact') {
        initRealContactForm();
        await loadContact();
      } else if (page === 'blog') {
        await loadBlog();
      }
    } catch (e) {
      console.info('portfolio-loader: API error or offline:', e.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
