/* The Crisp Counter — privacy-preserving analytics layer (five defined events).
 *
 * Events: page_view, outbound_click, disclosure_view, guide_read, signup_intent.
 * Design constraints (see data-room/measurement.html):
 *  - no cookies, no third-party requests, no cross-site identifiers
 *  - session id is a random value kept in sessionStorage only
 *  - referrer is reduced to origin; no query strings or form values are sent
 *  - if no first-party endpoint is configured (meta[name=cc-endpoint]), events are
 *    queued locally and nothing leaves the browser (fail-closed)
 *  - Do Not Track / Global Privacy Control disable sending entirely
 */
(function () {
  "use strict";

  var QUEUE_KEY = "cc_event_queue_v1";
  var SESSION_KEY = "cc_sid";
  var MAX_QUEUE = 50;

  function dnt() {
    return navigator.doNotTrack === "1" ||
      window.doNotTrack === "1" ||
      navigator.globalPrivacyControl === true;
  }

  function sessionId() {
    try {
      var s = sessionStorage.getItem(SESSION_KEY);
      if (!s) {
        s = "s-" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, s);
      }
      return s;
    } catch (e) {
      return "s-ephemeral";
    }
  }

  function endpoint() {
    var meta = document.querySelector('meta[name="cc-endpoint"]');
    return meta && meta.content ? meta.content : "";
  }

  function queue(evt) {
    try {
      var q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
      if (!Array.isArray(q)) q = [];
      if (q.length >= MAX_QUEUE) q.shift();
      q.push(evt);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
    } catch (e) { /* storage unavailable — drop silently */ }
  }

  function send(evt) {
    if (dnt()) return;
    var url = endpoint();
    if (!url) { queue(evt); return; }          // fail-closed until owner sets endpoint
    try {
      fetch(url, {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(evt)
      }).catch(function () { queue(evt); });
    } catch (e) { queue(evt); }
  }

  function track(name, payload) {
    var evt = {
      event: name,
      ts: new Date().toISOString(),
      sid: sessionId(),
      path: location.pathname,
      title: document.title.slice(0, 120)
    };
    if (payload && typeof payload === "object") {
      for (var k in payload) {
        if (Object.prototype.hasOwnProperty.call(payload, k)) {
          evt[k] = String(payload[k]).slice(0, 120);
        }
      }
    }
    send(evt);
  }

  // 1) page_view
  track("page_view", {});

  // 2) outbound_click — sponsored / affiliate links only
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var rel = (a.getAttribute("rel") || "");
    if (rel.indexOf("sponsored") === -1 && a.getAttribute("data-cc") !== "outbound") return;
    var host = "";
    try { host = new URL(a.href, location.href).hostname; } catch (err) { host = "unknown"; }
    track("outbound_click", {
      target_host: host,
      asin: a.getAttribute("data-asin") || "",
      placement: a.getAttribute("data-placement") || "link"
    });
  });

  // 3) disclosure_view — first time the top disclosure strip becomes visible
  var strip = document.getElementById("disclosure");
  if (strip && "IntersectionObserver" in window) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !seen) {
          seen = true;
          track("disclosure_view", {});
          io.disconnect();
        }
      });
    }, { threshold: 0.6 });
    io.observe(strip);
  }

  // 4) guide_read — reader reaches 50% scroll depth on a guide page
  if (document.body && document.body.getAttribute("data-page") === "guide") {
    var fired = false;
    window.addEventListener("scroll", function () {
      if (fired) return;
      var h = document.documentElement;
      var depth = (window.scrollY + window.innerHeight) / (h.scrollHeight || 1);
      if (depth >= 0.5) {
        fired = true;
        track("guide_read", { guide: document.body.getAttribute("data-guide") || location.pathname });
      }
    }, { passive: true });
  }

  // 5) signup_intent — fired by site.js on reader-capture submit

  window.cc = {
    track: track,
    flushQueue: function () { /* hook for owner endpoint migration */ },
    pending: function () {
      try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]").length; }
      catch (e) { return 0; }
    }
  };
})();
