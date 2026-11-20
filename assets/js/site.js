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
