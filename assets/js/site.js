/* The Crisp Counter — site behavior (nav, disclosure, small affordances). */
(function () {
  "use strict";

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // Year stamp in footer
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  // Reader-capture form: honest no-op until an endpoint exists (gate G-6).
  var form = document.getElementById("capture-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("capture-note");
      var email = form.querySelector("input[type=email]");
      if (window.cc && email && email.value) {
        window.cc.track("signup_intent", { email_domain: (email.value.split("@")[1] || "") });
      }
      if (note) {
        note.textContent =
          "Thanks — the launch list endpoint is not live yet (see Data room → Measurement, gate G-6). " +
          "For now, follow the RSS feed (feed.xml) for new guides.";
      }
      form.reset();
    });
  }

  // Comparison table filter (Compare page)
  var filter = document.getElementById("compare-filter");
  if (filter) {
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      document.querySelectorAll("#compare-table tbody tr").forEach(function (row) {
        row.style.display = !q || row.textContent.toLowerCase().indexOf(q) !== -1 ? "" : "none";
      });
    });
  }
})();

/* ----------------------------------------------------------
   DECISION BOARD (/suggestions/) — T17
   Records a reviewer's choice per suggestion in this browser
   (localStorage) and exports it as text. Deliberately local:
   no request is sent; this is not one of the five measured
   events and does not become one without a decision.
   ---------------------------------------------------------- */
(function () {
  "use strict";

  var KEY = "cs-decisions";
  var sets = document.querySelectorAll("[data-decision]");
  if (!sets.length) return;

  var countEl = document.getElementById("decision-count");
  var exportEl = document.getElementById("decision-export");
  var copyBtn = document.getElementById("decision-copy");

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "{}") || {};
    } catch (err) {
      return {};
    }
  }

  function save(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
    } catch (err) {
      /* private mode; the board still works for this page view */
    }
  }

  function labelFor(value) {
    return { adopt: "adopt the recommendation", modify: "adopt with changes", hold: "hold", reject: "reject" }[value] || value;
  }

  function refresh() {
    var map = load();
    var decided = 0;
    var lines = [];
    Array.prototype.forEach.call(sets, function (fs) {
      var id = fs.getAttribute("data-decision");
      var val = map[id];
      if (val) {
        decided++;
        var title = "";
        var card = fs.closest ? fs.closest(".decision") : null;
        var h = card && card.querySelector(".decision__title");
        if (h) title = h.textContent.replace(/\s+/g, " ").trim();
        lines.push(id + " — " + labelFor(val) + " — " + title);
        fs.setAttribute("data-answered", "true");
        var radio = fs.querySelector('input[value="' + val + '"]');
        if (radio) radio.checked = true;
      } else {
        fs.setAttribute("data-answered", "false");
      }
    });
    if (countEl) countEl.textContent = decided + " of " + sets.length;
    if (exportEl) {
      exportEl.value = lines.length
        ? "The Crisp Counter — suggestion decisions (" + decided + " of " + sets.length + " recorded)\n" + lines.join("\n")
        : "No decisions recorded yet. Choose a path on any card above.";
    }
  }

  Array.prototype.forEach.call(sets, function (fs) {
    fs.addEventListener("change", function (ev) {
      if (!ev.target || !ev.target.name) return;
      var map = load();
      map[fs.getAttribute("data-decision")] = ev.target.value;
      save(map);
      refresh();
    });
  });

  if (copyBtn && exportEl) {
    copyBtn.addEventListener("click", function () {
      var text = exportEl.value;
      function fallback() {
        exportEl.focus();
        exportEl.select();
        copyBtn.textContent = "Selected — press Ctrl/Cmd+C";
        setTimeout(function () { copyBtn.textContent = "Copy my decisions"; }, 2500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copyBtn.textContent = "Copied";
          setTimeout(function () { copyBtn.textContent = "Copy my decisions"; }, 2000);
        }, fallback);
      } else {
        fallback();
      }
    });
  }

  refresh();
})();
