/* WinA — client-side, privacy-preserving analytics + page behavior
 *
 * Design (see /analytics.html):
 *  - Five defined events: page_view, outbound_click, guide_read, reader_capture, disclosure_view
 *  - No cookies, no fingerprinting, no IP storage. Only event type, timestamp, page path and a
 *    small payload are kept.
 *  - Events are beaconed to the self-hosted endpoint /analytics/collect. GitHub Pages is static
 *    hosting, so that endpoint is not implemented here; events fall back to localStorage only and
 *    can be reviewed/exported on /analytics.html. Nothing is sent to third parties.
 */
(function () {
  var STORAGE_KEY = 'wina_events_v1';
  var ENDPOINT = '/analytics/collect';
  var EVENTS = ['page_view', 'outbound_click', 'guide_read', 'reader_capture', 'disclosure_view'];

  function getEvents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }
  function save(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      // storage unavailable — events live only for this page view
    }
  }
  function sendBeacon(ev) {
    var body = JSON.stringify(ev);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    fetch(ENDPOINT, {
      method: 'POST',
      body: body,
      credentials: 'omit',
      keepalive: true
    }).catch(function () {
      // endpoint not implemented on static hosting — event remains local only
    });
  }

  window.winA = {
    EVENTS: EVENTS,
    logEvent: function (type, payload) {
      if (!type || EVENTS.indexOf(type) === -1) return null;
      var ev = {
        type: type,
        ts: new Date().toISOString(),
        url: location.href,
        path: location.pathname,
        payload: payload || {}
      };
      var events = getEvents();
      events.push(ev);
      save(events);
      sendBeacon(ev);
      renderCounter();
      return ev;
    },
    getEvents: getEvents,
    exportEvents: function () {
      var events = getEvents();
      var blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'wina-events-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  function renderCounter() {
    var el = document.getElementById('wina-event-counter');
    if (!el) return;
    el.textContent = getEvents().length + ' event(s) logged this session (local only — /analytics/collect not implemented on static hosting)';
  }

  function ensureDisclosure() {
    if (document.querySelector('.disclosure-strip')) return;
    var html =
      '<div class="disclosure-strip">' +
      '<div class="container">' +
      '<div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">' +
      '<b>Affiliate disclosure:</b> As an Amazon Associate we earn from qualifying purchases. Links marked ' +
      '<span class="sponsored-chip">sponsored</span> are affiliate links. ' +
      '<a href="/disclosures.html">Read our full disclosure &amp; Associates statement &rarr;</a>' +
      '</div></div></div>';
    var main = document.querySelector('main') || document.body;
    var frag = document.createElement('div');
    frag.innerHTML = html;
    main.parentNode.insertBefore(frag.firstElementChild, main.nextSibling);
  }

  function attachClickTracking() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[rel~="sponsored"]') : null;
      if (!a) return;
      winA.logEvent('outbound_click', {
        link: a.href,
        text: (a.textContent || '').trim().slice(0, 80)
      });
    }, true);
  }

  document.addEventListener('DOMContentLoaded', function () {
    ensureDisclosure();
    attachClickTracking();
    var pageType = document.body.dataset.pageType || 'page_view';
    winA.logEvent(pageType, { referrer: document.referrer });
    renderCounter();

    var capture = document.getElementById('wina-capture-form');
    if (capture) {
      capture.addEventListener('submit', function (e) {
        e.preventDefault();
        winA.logEvent('reader_capture', { form: 'newsletter' });
        var msg = document.getElementById('wina-capture-msg');
        if (msg) {
          msg.style.display = 'block';
          capture.reset();
        }
      });
    }
  });
})();
