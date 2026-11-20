/* WinA analytics — privacy-preserving outbound-click counter.
 *
 * The five documented events (see data/analytics-events.json and /platform/):
 *   page_view · outbound_click · affiliate_click · search_query · article_read
 *
 * Privacy properties:
 *   - no cookies, no local identifiers beyond a per-browser queue
 *   - no IP, no user-agent, no fingerprint fields are ever sent by this file
 *   - Do Not Track / Global Privacy Control short-circuits everything
 *   - events are POSTed to a FIRST-PARTY endpoint only (set ANALYTICS_ENDPOINT);
 *     until then they queue locally (localStorage, cap 100) and are never
 *     shared with third parties.
 *
 * Deployment note (FLG-010 / Q-08): GitHub Pages is static-only, so the
 * endpoint ships as tools/analytics_endpoint.py and must be hosted elsewhere.
 */
(function () {
  'use strict';

  var CONFIG = {
    endpoint: null,          // e.g. 'https://metrics.example.com/e' — set after Q-08
    queueKey: 'wina.evt.q',
    queueCap: 100
  };

  var DNT = (function () {
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return dnt === '1' || dnt === 'yes' || (navigator.globalPrivacyControl === true);
  })();

  function enabled() { return !DNT; }

  function now() { return new Date().toISOString(); }

  function referrerHost() {
    try { return document.referrer ? new URL(document.referrer).host : ''; }
    catch (e) { return ''; }
  }

  function readQueue() {
    try { return JSON.parse(localStorage.getItem(CONFIG.queueKey) || '[]'); }
    catch (e) { return []; }
  }

  function writeQueue(q) {
    try { localStorage.setItem(CONFIG.queueKey, JSON.stringify(q.slice(-CONFIG.queueCap))); }
    catch (e) { /* storage full/blocked — drop oldest silently */ }
  }

  function flush() {
    if (!CONFIG.endpoint || DNT) return;
    var q = readQueue();
    if (!q.length) return;
    var batch = q.splice(0, q.length);
    writeQueue(q);
    try {
      var body = JSON.stringify(batch);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(CONFIG.endpoint, { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
      }
    } catch (e) {
      writeQueue(readQueue().concat(batch)); // put back for next flush
    }
  }

  function record(event, payload) {
    if (!enabled()) return;
    if (['page_view', 'outbound_click', 'affiliate_click', 'search_query', 'article_read'].indexOf(event) === -1) return;
    var entry = { event: event, ts: now(), path: location.pathname };
    if (payload) { for (var k in payload) { if (Object.prototype.hasOwnProperty.call(payload, k)) entry[k] = payload[k]; } }
    var q = readQueue();
    q.push(entry);
    writeQueue(q);
    flush();
  }

  window.WinAAnalytics = { record: record, flush: flush, config: CONFIG };

  // page_view
  record('page_view', { referrer_host: referrerHost() });

  // outbound_click + affiliate_click (affiliate = carries the tracking tag)
  document.addEventListener('click', function (ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^https?:\/\//i.test(href) && new URL(href, location.href).host !== location.host) {
      record('outbound_click', { host: new URL(href, location.href).host });
      if (href.indexOf('tag=') !== -1 || a.hasAttribute('data-aff')) {
        record('affiliate_click', { product_id: a.getAttribute('data-product') || '' });
      }
    }
  }, true);

  // article_read — 50% scroll, once per page view, only on guides
  var readFired = false;
  window.addEventListener('scroll', function () {
    if (readFired || location.pathname.indexOf('/guides/') === -1) return;
    var doc = document.documentElement;
    var depth = (window.scrollY + window.innerHeight) / doc.scrollHeight;
    if (depth >= 0.5) {
      readFired = true;
      record('article_read', {});
    }
  }, { passive: true });

  // flush queued events when the tab returns
  window.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') flush();
  });
})();
