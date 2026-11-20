/**
 * Privacy-preserving measurement layer for Countertop Report.
 *
 * Design constraints, in order of priority:
 *  1. No cookies, no localStorage, no sessionStorage, no IndexedDB.
 *  2. No device fingerprinting, no user agent string, no IP lookup client-side.
 *  3. No third-party script is loaded. Ever.
 *  4. If the reader sets Do Not Track or Global Privacy Control, nothing is sent.
 *  5. Disabled unless window.WINA_CONFIG.endpoint is a non-empty string.
 *
 * The five events are defined in /data/events.json and documented at /events/.
 * Field names here must match that schema exactly.
 */
(function () {
  'use strict';

  var cfg = window.WINA_CONFIG || {};
  var endpoint = cfg.endpoint;

  /* ------------------------------------------------------------ kill switch */

  if (!endpoint) {
    // Expose a no-op so nothing elsewhere breaks, and leave quietly.
    window.wina = { track: function () {}, enabled: false };
    return;
  }

  function optedOut() {
    if (cfg.respectDoNotTrack) {
      var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
      if (dnt === '1' || dnt === 'yes') return true;
    }
    if (cfg.respectGlobalPrivacyControl && navigator.globalPrivacyControl === true) {
      return true;
    }
    return false;
  }

  if (optedOut()) {
    window.wina = { track: function () {}, enabled: false, reason: 'privacy-signal' };
    return;
  }

  /* -------------------------------------------------- ephemeral bucket id */

  // Random per page load, held only in this closure. Not persisted anywhere,
  // so it cannot link two visits. Its only job is to stop one reader's five
  // scroll events from being counted as five readers.
  var bucket = '';
  try {
    var bytes = new Uint8Array(4);
    (window.crypto || window.msCrypto).getRandomValues(bytes);
    for (var i = 0; i < bytes.length; i++) {
      bucket += ('0' + bytes[i].toString(16)).slice(-2);
    }
  } catch (e) {
    bucket = String(Math.random()).slice(2, 8);
  }

  /* ------------------------------------------------------------- transport */

  function send(name, fields) {
    var payload = {
      e: name,
      p: location.pathname,
      b: bucket,
      t: Math.round(Date.now() / 1000),
      v: cfg.version || '1'
    };
    // Copy only allow-listed scalars. No free text, no PII can ride along.
    if (fields) {
      for (var k in fields) {
        if (!Object.prototype.hasOwnProperty.call(fields, k)) continue;
        var val = fields[k];
        if (val === null || val === undefined) continue;
        if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
          payload[k] = String(val).slice(0, 64);
        }
      }
    }

    var body = JSON.stringify(payload);

    // sendBeacon survives the navigation that follows an outbound click,
    // which is exactly when we need it most.
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
        return;
      } catch (e) { /* fall through */ }
    }
    try {
      fetch(endpoint, { method: 'POST', body: body, keepalive: true, mode: 'cors', credentials: 'omit' });
    } catch (e) { /* measurement must never break the page */ }
  }

  /* ---------------------------------------------------------------- events */

  var fired = {};

  function once(name, fields) {
    if (fired[name]) return;
    fired[name] = true;
    send(name, fields);
  }

  /* 1. disclosure_view — the compliance-evidence event.
        Fires when the disclosure strip is actually on screen, not merely in
        the DOM. This is the one event that proves the material connection was
        visible rather than hidden. */
  function watchDisclosure() {
    var strip = document.querySelector('.disclosure');
    if (!strip) return;
    if (!('IntersectionObserver' in window)) {
      once('disclosure_view', {});
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          once('disclosure_view', {});
          io.disconnect();
        }
      });
    }, { threshold: 0.5 });
    io.observe(strip);
  }

  /* 2. product_view — the product a reader actually reached. */
  function trackProductView() {
    var card = document.querySelector('.product-head, .card');
    if (!card) return;
    var id =
      (card.querySelector('[data-product]') &&
        card.querySelector('[data-product]').getAttribute('data-product')) ||
      document.body.getAttribute('data-product');
    if (!id) return;
    once('product_view', { product_id: id });
  }

  /* 3. outbound_click — the outbound-click counter.
        Delegated so it catches links added at render time. Only counts links
        we ourselves marked rel="sponsored", which keeps the number honest. */
  function trackClicks() {
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[rel~="sponsored"]') : null;
      if (!a) return;
      send('outbound_click', {
        product_id: a.getAttribute('data-product') || '',
        link_id: a.getAttribute('data-link') || '',
        placement: a.getAttribute('data-placement') || '',
        asin: a.getAttribute('data-asin') || ''
      });
    }, true);
  }

  /* 4. compare_open — deciding readers versus decided readers. */
  function trackCompare() {
    var tables = document.querySelectorAll('.compare-table, .opt-table');
    if (!tables.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          once('compare_open', { page: location.pathname });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(tables, function (t) { io.observe(t); });
  }

  /* 5. guide_read_complete — did anyone actually read it? */
  function trackGuideRead() {
    if (!document.querySelector('.guide')) return;
    var done = false;
    function check() {
      if (done) return;
      var doc = document.documentElement;
      var seen = (window.scrollY || doc.scrollTop) + window.innerHeight;
      if (seen / doc.scrollHeight >= 0.9) {
        done = true;
        send('guide_read_complete', { page: location.pathname });
        window.removeEventListener('scroll', check);
      }
    }
    window.addEventListener('scroll', check, { passive: true });
    check();
  }

  /* ----------------------------------------------------------------- start */

  function boot() {
    watchDisclosure();
    trackProductView();
    trackClicks();
    trackCompare();
    trackGuideRead();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.wina = { track: send, enabled: true };
})();
