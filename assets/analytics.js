/*
 * Privacy-preserving event hook. Does nothing until window.CG_CONFIG.endpoint is set
 * to a self-hosted endpoint (see data/site.json, FLG-008). No cookies, no IP storage,
 * no per-reader identifiers and no sub-tags (Program Policies section 2(b)).
 */
(function () {
  "use strict";
  var cfg = window.CG_CONFIG || {};
  var endpoint = cfg.endpoint;

  function send(name, props) {
    if (!endpoint) return;
    if (cfg.events && cfg.events.indexOf(name) === -1) return;
    var body = JSON.stringify({ event: name, path: location.pathname, props: props || {} });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, body);
      } else {
        fetch(endpoint, { method: "POST", body: body, keepalive: true });
      }
    } catch (e) { /* analytics must never break the page */ }
  }

  document.addEventListener("DOMContentLoaded", function () {
    send("page_view");

    var path = location.pathname;
    if (/\/guides\/[^\/]+\.html$/.test(path) && !/index\.html$/.test(path)) {
      send("guide_view", { guide: path.split("/").pop().replace(".html", "") });
    }

    document.querySelectorAll("a[data-outbound]").forEach(function (a) {
      a.addEventListener("click", function () {
        send("outbound_click", { product: a.getAttribute("data-outbound") });
      });
    });

    document.querySelectorAll(".nav a").forEach(function (a) {
      a.addEventListener("click", function () { send("nav_click", { target: a.textContent.trim() }); });
    });

    document.querySelectorAll('a[href$="feed.xml"]').forEach(function (a) {
      a.addEventListener("click", function () { send("feed_subscribe_click"); });
    });
  });
})();
