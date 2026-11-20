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
   SITE SEARCH — a static index, read once, kept in memory.
   The reader types a question; we match against page titles
   and descriptions. Nothing is sent anywhere: the index is
   fetched from this same site and the search runs locally.
   ---------------------------------------------------------- */
(function () {
  "use strict";

  var box = document.querySelector("[data-search]");
  var openBtn = document.querySelector("[data-search-open]");
  if (!box || !openBtn) return;

  var input = box.querySelector("[data-search-input]");
  var list = box.querySelector("[data-search-results]");
  var empty = box.querySelector("[data-search-empty]");
  var closeBtn = box.querySelector("[data-search-close]");
  var index = null;
  var lastFocused = null;

  /* The site lives under a subpath on Pages (/WinA/); derive the base from
     the page's own stylesheet link so this works under a subpath and at a
     root without either one being hard-coded. */
  function base() {
    var link = document.querySelector('link[rel="stylesheet"]');
    var href = link ? link.getAttribute("href") || "" : "";
    var m = href.match(/^(.*?)\/assets\//);
    if (m) return m[1] + "/";
    var i = href.lastIndexOf("/");
    return i === -1 ? "" : href.slice(0, i + 1);
  }

  function load() {
    if (index) return Promise.resolve(index);
    return fetch(base() + "search-index.json", { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("no index");
        return r.json();
      })
      .then(function (data) {
        index = (data && data.pages) || [];
        return index;
      })
      .catch(function () {
        index = [];
        return index;
      });
  }

  function score(page, terms) {
    var title = (page.t || "").toLowerCase();
    var desc = (page.d || "").toLowerCase();
    var path = (page.p || "").toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      var inTitle = title.indexOf(t);
      var inDesc = desc.indexOf(t);
      var inPath = path.indexOf(t);
      if (inTitle === -1 && inDesc === -1 && inPath === -1) return 0;
      if (inTitle !== -1) total += inTitle === 0 ? 12 : 6;
      if (inDesc !== -1) total += 2;
      if (inPath !== -1) total += 3;
    }
    return total;
  }

  function render(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    list.innerHTML = "";
    if (!terms.length) {
      empty.hidden = true;
      return;
    }
    var hits = [];
    for (var i = 0; i < index.length; i++) {
      var s = score(index[i], terms);
      if (s > 0) hits.push({ page: index[i], s: s });
    }
    hits.sort(function (a, b) {
      if (b.s !== a.s) return b.s - a.s;
      return (a.page.t || "").localeCompare(b.page.t || "");
    });
    hits = hits.slice(0, 8);

    empty.hidden = hits.length !== 0;
    hits.forEach(function (h) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = base() + h.page.p.replace(/^\//, "");
      var t = document.createElement("span");
      t.className = "searchbox__title";
      t.textContent = h.page.t;
      var d = document.createElement("span");
      d.className = "searchbox__desc";
      d.textContent = h.page.d;
      a.appendChild(t);
      a.appendChild(d);
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function open() {
    lastFocused = document.activeElement;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    load().then(function () {
      if (input) input.focus();
    });
  }

  function close() {
    box.hidden = true;
    document.body.style.overflow = "";
    if (input) input.value = "";
    list.innerHTML = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  openBtn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  box.addEventListener("click", function (ev) {
    if (ev.target === box) close();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && !box.hidden) close();
    if (ev.key === "/" && box.hidden) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag !== "INPUT" && tag !== "TEXTAREA") {
        ev.preventDefault();
        open();
      }
    }
  });
  if (input) {
    input.addEventListener("input", function () {
      render(input.value);
    });
  }
})();
