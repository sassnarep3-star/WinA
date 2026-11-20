/* WinA — privacy-preserving outbound click counter + self-hosted analytics endpoint
   Records five defined events without cookies or PII:
     page_view, outbound_click, product_click, guide_view, suggestion_review
   Data is kept in localStorage and can be posted to a configurable,
   self-hosted analytics endpoint (ANALYTICS_ENDPOINT). No personal data is sent.
   Set winA.analyticsEndpoint = "https://your-self-hosted-collector.example/collect"
   to enable remote posting. */

(function () {
  const STORAGE_KEY = "wina_events";
  const MAX_EVENTS = 500;

  const winA = (window.winA = window.winA || {});
  winA.analyticsEndpoint = winA.analyticsEndpoint || null; // self-hosted collector URL
  winA.siteId = winA.siteId || "wina-github-pages";

  function readEvents() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }
  function writeEvents(events) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (e) {
      // storage unavailable; silently ignore
    }
  }

  function record(eventType, payload) {
    const event = {
      id: Math.random().toString(36).slice(2) + Date.now().toString(36),
      ts: new Date().toISOString(),
      type: eventType,
      path: location.pathname,
      referrer: document.referrer || null,
      payload: payload || {},
    };
    const events = readEvents();
    events.push(event);
    writeEvents(events);
    winA.onEvent && winA.onEvent(event);
    maybeFlush();
    return event;
  }

  function maybeFlush() {
    if (!winA.analyticsEndpoint) return; // local-only until self-hosted endpoint configured
    const events = readEvents();
    const pending = events.filter((e) => !e.sent);
    if (!pending.length) return;
    fetch(winA.analyticsEndpoint, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ siteId: winA.siteId, events: pending }),
    })
      .then(function () {
        const all = readEvents();
        all.forEach((e) => (e.sent = true));
        writeEvents(all);
      })
      .catch(function () {
        // endpoint unreachable; data remains in localStorage for later flush
      });
  }

  // Exposed API
  winA.record = record;
  winA.readEvents = readEvents;
  winA.flush = maybeFlush;

  // Automatic page view
  record("page_view");

  // Outbound + product click tracking on sponsored links
  document.addEventListener(
    "click",
    function (e) {
      const link = e.target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const isOutbound =
        href.startsWith("http://") || href.startsWith("https://");
      const isSponsored = link.rel && link.rel.includes("sponsored");
      const isAmazon = href.includes("amazon") || href.includes("link.amazon");

      if (isOutbound && isSponsored) {
        record("outbound_click", {
          url: href,
          amazon: isAmazon,
          label: link.textContent ? link.textContent.trim().slice(0, 80) : "",
        });
        if (isAmazon) {
          record("product_click", { url: href, amazon: true });
        }
      }
    },
    true
  );

  // Flush on visibility change (page hide) so clicks are not lost
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") maybeFlush();
  });
})();
