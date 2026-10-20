/* ═══════════════════════════════════════════════════════════════
   TRACKER.JS — High-Precision Analytics & Health Telemetry
   Tracks unique visitors, page views, CV downloads & outbound clicks
   Supports: 1st-Party Cloudflare Worker API, GA4 & Privacy Trackers
═══════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  // Prevent duplicate execution on same page load
  if (window.__sk_tracker_initialized) return;
  window.__sk_tracker_initialized = true;

  // Optional Analytics Integrations:
  // To enable Google Analytics 4: set window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';
  // To enable Umami: set window.UMAMI_WEBSITE_ID = 'your-website-id'; window.UMAMI_HOST_URL = 'https://...';
  const GA_ID = window.GA_MEASUREMENT_ID || null;
  const UMAMI_ID = window.UMAMI_WEBSITE_ID || null;

  // 1. Get or create persistent anonymous visitor ID
  function getVisitorId() {
    try {
      let vid = localStorage.getItem('sk_visitor_id');
      if (!vid) {
        vid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('sk_visitor_id', vid);
      }
      return vid;
    } catch(e) {
      return 'anon_' + Math.random().toString(36).substring(2, 10);
    }
  }

  const visitorId = getVisitorId();

  // Normalize page name
  function getPageName() {
    let p = location.pathname || '/';
    if (p.endsWith('/index.html') || p === '/index') p = '/';
    return p;
  }

  // 2. Send 1st-party tracking event to Cloudflare Worker API
  function sendTrack(payload) {
    const data = {
      visitorId,
      page: getPageName(),
      referrer: document.referrer || '',
      screenWidth: window.screen ? window.screen.width : null,
      timestamp: new Date().toISOString(),
      ...payload
    };

    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      try {
        const sent = navigator.sendBeacon('/api/track', blob);
        if (sent) return;
      } catch(e) {}
    }

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true
    }).catch(() => {});
  }

  // Track initial page view
  sendTrack({ event: 'pageview' });

  // 3. Optional GA4 Dynamic Loader (Non-blocking)
  if (GA_ID && !window.gtag) {
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: true });
  }

  // 4. Optional Umami Dynamic Loader
  if (UMAMI_ID && !document.querySelector('script[data-website-id]')) {
    const us = document.createElement('script');
    us.async = true;
    us.defer = true;
    us.dataset.websiteId = UMAMI_ID;
    us.src = (window.UMAMI_HOST_URL || 'https://cloud.umami.is') + '/script.js';
    document.head.appendChild(us);
  }

  // 5. Track CV downloads & Outbound Links
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = (link.getAttribute('href') || '').toLowerCase();
    const text = (link.textContent || '').trim().toLowerCase();

    // CV Download detection
    const isCv = href.includes('.pdf') ||
                 href.includes('cv') ||
                 href.includes('/file/cv') ||
                 link.hasAttribute('data-cv-link') ||
                 link.id === 'dyn-cv-link' ||
                 text.includes('cv') ||
                 text.includes('resume');

    if (isCv) {
      sendTrack({ page: '/cv-download', type: 'cv_download', href });
      if (window.gtag) {
        window.gtag('event', 'file_download', { file_name: 'Sanket_Kandel_CV.pdf', link_url: href });
      }
      return;
    }

    // Outbound link tracking (GitHub, LinkedIn, Kaggle, live demos)
    if (href.startsWith('http://') || href.startsWith('https://')) {
      const url = new URL(link.href);
      if (url.hostname !== location.hostname) {
        sendTrack({
          event: 'outbound_click',
          targetUrl: link.href,
          targetDomain: url.hostname
        });
        if (window.gtag) {
          window.gtag('event', 'click', { event_category: 'outbound', event_label: link.href });
        }
      }
    }
  }, true);
})();
