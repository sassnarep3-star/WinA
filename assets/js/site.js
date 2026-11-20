/* ============================================================
   COUNTER SPACE — reader-side script
   Two jobs only:
     1. Record the five defined events, if a collector is deployed.
     2. Make the sponsored nature of outbound links visible at
        the moment of the click, not only in the page furniture.
   No cookies. No identifiers. No third-party requests.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.CS_CONFIG || {};
  var endpoint = (cfg.analyticsEndpoint || "").trim();
  var enabled = Boolean(cfg.analyticsEnabled) && endpoint !== "";

  /* ----------------------------------------------------------
     Event queue. If there is no collector, events are dropped
     on purpose rather than buffered forever or sent elsewhere.
     ---------------------------------------------------------- */
  function send(event, props) {
    if (!enabled) return;
    var body;
    try {
      body = JSON.stringify({
        e: event,
        p: props || {},
        /* coarse, non-identifying context only */
        w: window.innerWidth < 700 ? "s" : window.innerWidth < 1100 ? "m" : "l"
      });
    } catch (err) {
      return;
    }
    /* sendBeacon survives the navigation that an outbound click causes */
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", endpoint, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(body);
      }
    } catch (err) {
      /* A failed measurement must never break the page. */
    }
  }

  var path = window.location.pathname.replace(/\/index\.html$/, "/");
  var pageData = document.body ? document.body.dataset : {};

  /* EV-01  page_view */
  send("page_view", { path: path });

  /* EV-04  compare_view */
  if (pageData.pageType === "compare") {
    send("compare_view", { path: path });
  }

  /* EV-03  guide_read — 75% scroll depth, once */
  if (pageData.pageType === "guide") {
    var fired = false;
    var onScroll = function () {
      if (fired) return;
      var doc = document.documentElement;
      var height = doc.scrollHeight - window.innerHeight;
      if (height <= 0) return;
      if (window.scrollY / height >= 0.75) {
        fired = true;
        send("guide_read", { path: path });
        window.removeEventListener("scroll", onScroll, { passive: true });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------
     EV-02  outbound_click
     Every element that leaves for Amazon carries data-affiliate.
     We record which ASIN earned the click and where on the page.
     ---------------------------------------------------------- */
  document.addEventListener("click", function (ev) {
    var el = ev.target.closest ? ev.target.closest("[data-affiliate]") : null;
    if (!el) return;

    send("outbound_click", {
      asin: el.getAttribute("data-affiliate") || "",
      path: path,
      slot: el.getAttribute("data-slot") || "inline"
    });

    /* Only confirm once per session; a prompt on every click is hostile. */
    try {
      if (!sessionStorage.getItem("cs_aff_ack")) {
        sessionStorage.setItem("cs_aff_ack", "1");
        var b = el.closest(".buybox") || el.closest(".pcard") || document.body;
        var note = document.createElement("p");
        note.className = "aff-ack";
        note.setAttribute("role", "status");
        note.textContent =
          "Opening Amazon in a new tab. This is a sponsored link: we earn a commission " +
          "if you buy, at no extra cost to you.";
        note.style.cssText =
          "margin:0.6rem 0 0;padding:0.55rem 0.75rem;font-size:0.74rem;line-height:1.45;" +
          "background:#e6eef0;color:#0a3742;border-radius:2px;border:1px solid #c2d8dd;";
        if (b) b.appendChild(note);
      }
    } catch (err) {
      /* sessionStorage can throw in private modes; ignore. */
    }
  });

  /* ----------------------------------------------------------
     EV-05  capture_intent
     The form has no provider, so it must not pretend to work.
     We still measure whether anyone wanted it.
     ---------------------------------------------------------- */
  var form = document.querySelector("[data-capture-form]");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      send("capture_intent", { path: path, slot: "footer" });
      var status = form.querySelector("[data-capture-status]");
      if (status) {
        status.hidden = false;
        status.textContent =
          "Not connected yet. No email service is wired to this form, so nothing was sent " +
          "and your address was not stored. This page records only that someone wanted a digest.";
      }
    });
  }

  /* Footer year, so nothing visibly rots. */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();

/* ----------------------------------------------------------
   SORTABLE TABLES — every table.data.sortable.
   Click a column heading (or press Enter / Space on it) to sort
   by that column. Numbers sort as numbers, text as text. The sort
   changes only the view: no cell content is altered.
   ---------------------------------------------------------- */
(function () {
  "use strict";

  function read(cell) {
    var t = (cell ? cell.textContent : "").replace(/\s+/g, " ").trim();
    var bare = t.replace(/[,%]/g, "");
    var n = /^[-+]?\d+(\.\d+)?$/.test(bare) ? parseFloat(bare) : NaN;
    return { t: t, n: n };
  }

  function enhance(table) {
    var head = table.tHead && table.tHead.rows[0];
    var body = table.tBodies[0];
    if (!head || !body) return;
    Array.prototype.forEach.call(head.cells, function (th, col) {
      var label = th.textContent.trim();
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sort-btn";
      btn.textContent = label;
      th.textContent = "";
      th.appendChild(btn);
      th.setAttribute("aria-sort", "none");
      btn.addEventListener("click", function () {
        var dir = th.getAttribute("aria-sort") === "ascending" ? -1 : 1;
        Array.prototype.forEach.call(head.cells, function (h) { h.setAttribute("aria-sort", "none"); });
        th.setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
        var rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = read(a.cells[col]), y = read(b.cells[col]);
          if (!isNaN(x.n) && !isNaN(y.n)) return (x.n - y.n) * dir;
          return x.t.localeCompare(y.t, undefined, { numeric: true, sensitivity: "base" }) * dir;
        });
        rows.forEach(function (r) { body.appendChild(r); });
      });
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("table.data.sortable"), enhance);
})();

/* ----------------------------------------------------------
   THE SHELF — client-side category filter over the product
   table. Progressive enhancement only: with JS off, every row
   is visible and the buttons do nothing harmful. No product
   data is created here; rows are filtered, never rewritten.
   ---------------------------------------------------------- */
(function () {
  "use strict";

  var shelf = document.querySelector("[data-shelf]");
  if (!shelf) return;

  var buttons = shelf.querySelectorAll("[data-filter]");
  var rows = shelf.querySelectorAll("tbody tr[data-cat]");
  var count = shelf.querySelector("[data-shelf-count]");
  if (!buttons.length || !rows.length) return;

  function apply(filter) {
    var shown = 0;
    Array.prototype.forEach.call(rows, function (row) {
      var match = filter === "all" || row.getAttribute("data-cat") === filter;
      if (match) { row.removeAttribute("hidden"); shown++; }
      else row.setAttribute("hidden", "");
    });
    Array.prototype.forEach.call(buttons, function (b) {
      var on = b.getAttribute("data-filter") === filter;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (count) count.textContent = shown + (shown === 1 ? " product" : " products");
  }

  Array.prototype.forEach.call(buttons, function (b) {
    b.setAttribute("aria-pressed", b.classList.contains("is-on") ? "true" : "false");
    b.addEventListener("click", function () { apply(b.getAttribute("data-filter")); });
  });
})();

/* ----------------------------------------------------------
   JUMP BAR — mark the section you are currently reading.
   Read-only indicator; it never scrolls the page for you.
   ---------------------------------------------------------- */
(function () {
  "use strict";

  var bar = document.querySelector("[data-jumpbar]");
  if (!bar || !("IntersectionObserver" in window)) return;
  var links = bar.querySelectorAll('a[href^="#"]');
  if (!links.length) return;

  var targets = [];
  Array.prototype.forEach.call(links, function (a) {
    var el = document.getElementById(a.getAttribute("href").slice(1));
    if (el) targets.push({ el: el, a: a });
  });
  if (!targets.length) return;

  var visible = new Set();
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
      });
      var current = null;
      targets.forEach(function (t) { if (visible.has(t.el)) current = t.a; });
      Array.prototype.forEach.call(links, function (a) {
        if (a === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  targets.forEach(function (t) { io.observe(t.el); });
})();
