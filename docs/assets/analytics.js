// Privacy-preserving analytics for the five events in analytics/events.json.
// Inert unless an endpoint is set in assets/config.js (see analytics/README.md).
// Sends only the fields each event defines. No cookies, no localStorage, no query strings,
// no full referrer URLs, and no form input. The request uses text/plain so that sendBeacon
// needs no CORS preflight.
(function () {
  var cfg = window.ARENA_CONFIG || {};
  var endpoint = cfg.analyticsEndpoint;
  if (!endpoint || !navigator.sendBeacon) return;

  var EVENTS = { page_view: 1, outbound_click: 1, guide_read: 1, disclosure_expand: 1, feed_click: 1 };

  function host(url) {
    try { return new URL(url, location.href).hostname; } catch (e) { return ""; }
  }
  function send(name, fields) {
    if (!EVENTS[name]) return;
    var body = { event: name, path: location.pathname, day: new Date().toISOString().slice(0, 10) };
    for (var k in fields) { if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") body[k] = fields[k]; }
    navigator.sendBeacon(endpoint, new Blob([JSON.stringify(body)], { type: "text/plain" }));
  }

  // page_view: path and referrer host only
  send("page_view", { referrer_host: host(document.referrer) === location.hostname ? "" : host(document.referrer) });

  // outbound_click: any sponsored (Amazon) link, plus the explicit data-event markers
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    if (a.getAttribute("rel") && a.getAttribute("rel").indexOf("sponsored") !== -1) {
      send("outbound_click", { link_id: a.getAttribute("data-link-id") || "", destination_host: host(a.href) });
    } else if (a.getAttribute("data-event") === "disclosure_expand") {
      send("disclosure_expand", {});
    } else if (a.getAttribute("data-event") === "feed_click") {
      send("feed_click", {});
    }
  }, true);

  // guide_read: fires once when the reader passes 75% of a guide
  var guide = document.querySelector("[data-guide]");
  if (guide) {
    var sent = false;
    window.addEventListener("scroll", function () {
      if (sent) return;
      var r = guide.getBoundingClientRect();
      var total = r.height - window.innerHeight;
      var seen = -r.top;
      if (total > 0 && seen / total >= 0.75) {
        sent = true;
        send("guide_read", { guide_slug: guide.getAttribute("data-guide") });
      }
    }, { passive: true });
  }
})();
