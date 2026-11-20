/* WinA — shared frontend
   - Highlights the active nav item (SG-27: single navigation group).
   - Injects the disclosure strip above the fold when a page omits it.
   - Builds footer dashboard link groups so every surface is reachable
     from the footer and from a single navigation group.
   - Reader capture (SG-30): local-only newsletter signup (no backend yet).
   All logic is client-side; no cookies, no PII sent anywhere. */

(function () {
  const NAV_ITEMS = [
    { href: "index.html", label: "Home" },
    { href: "products.html", label: "Shop" },
    { href: "guides.html", label: "Guides" },
    { href: "suggest.html", label: "Suggestions" },
    { href: "questions.html", label: "Q&A" },
    { href: "executive-summary.html", label: "Summary" },
    { href: "flagged.html", label: "Flagged" },
  ];

  const FOOTER_GROUPS = [
    {
      title: "Shop",
      links: [
        { href: "index.html", label: "Home" },
        { href: "products.html", label: "All products" },
        { href: "products.html#air-fryers", label: "Air fryers (3)" },
        { href: "products.html#thermometers", label: "Meat thermometers (2)" },
      ],
    },
    {
      title: "Learn",
      links: [
        { href: "guides.html", label: "Buying guides" },
        { href: "questions.html", label: "Questions & answers" },
      ],
    },
    {
      title: "Community",
      links: [
        { href: "suggest.html", label: "Suggestions" },
        { href: "flagged.html", label: "Flagged for review" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "executive-summary.html", label: "Executive summary" },
        { href: "https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking", label: "FTC endorsement guidance", ext: true },
        { href: "https://affiliate-program.amazon.com/help/operating/policies", label: "Amazon Associates policies", ext: true },
      ],
    },
  ];

  const DISCLOSURE_HTML =
    '<section class="disclosure-strip" aria-label="Affiliate disclosure" style="padding:7px 16px;">\n' +
    '  <div class="wrap">\n' +
    '    <strong>Affiliate disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. ' +
    '    Outbound product links are marked <span class="tag-sponsored" aria-hidden="true"></span> ' +
    '    (rel="sponsored"). We may earn a commission if you buy through them, at no extra cost to you. ' +
    '    <a href="flagged.html">See flagged items &amp; sources</a>.\n' +
    '  </div>\n' +
    '</section>\n';

  function activeNav() {
    const path = location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll(".nav-links a");
    links.forEach((a) => {
      const href = a.getAttribute("href");
      if (href === path) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function buildNav() {
    const nav = document.querySelector(".nav-links");
    if (!nav) return;
    nav.innerHTML = NAV_ITEMS.map((i) => '<a href="' + i.href + '">' + i.label + "</a>").join("");
    activeNav();
  }

  function ensureDisclosure() {
    if (document.querySelector(".disclosure-strip")) return;
    const hero = document.querySelector(".hero");
    const container = document.querySelector(".container");
    const target = hero || container || document.body;
    target.insertAdjacentHTML("afterbegin", DISCLOSURE_HTML);
  }

  function buildFooter() {
    const footer = document.querySelector("footer");
    if (!footer) return;
    const existing = footer.querySelector(".footer-grid");
    if (existing) return;
    const grid = document.createElement("div");
    grid.className = "footer-grid";
    grid.innerHTML = FOOTER_GROUPS.map(
      (g) =>
        '<div class="footer-col"><h4>' +
        g.title +
        '</h4><ul>' +
        g.links
          .map(
            (l) =>
              '<li><a href="' +
              l.href +
              '"' +
              (l.ext ? ' target="_blank" rel="nofollow sponsored"' : "") +
              ">" +
              l.label +
              "</a></li>"
          )
          .join("") +
        "</ul></div>"
    ).join("");
    footer.insertAdjacentElement("afterbegin", grid);
  }

  function buildFooterBottom() {
    const footer = document.querySelector("footer");
    if (!footer) return;
    if (footer.querySelector(".footer-bottom")) return;
    const bottom = document.createElement("div");
    bottom.className = "footer-bottom";
    bottom.innerHTML =
      '<div>As an Amazon Associate I earn from qualifying purchases.</div>' +
      '<div><a href="flagged.html">Flagged for review</a> &middot; <a href="feed.xml">RSS feed</a> &middot; <a href="sitemap.xml">Sitemap</a></div>';
    footer.appendChild(bottom);
  }

  /* Reader capture (SG-30): local-only until a mailing provider is connected.
     Stores the address in localStorage; sends nothing. */
  function initCapture() {
    const form = document.getElementById("captureForm");
    if (!form) return;
    const email = document.getElementById("captureEmail");
    const msg = document.getElementById("captureMsg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const value = (email.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        msg.textContent = "Please enter a valid email address.";
        return;
      }
      try {
        const existing = JSON.parse(localStorage.getItem("wina_subscribers") || "[]");
        existing.push({ email: value, ts: new Date().toISOString(), source: "front-page-capture" });
        localStorage.setItem("wina_subscribers", JSON.stringify(existing));
      } catch (err) {
        /* storage unavailable; still confirm locally */
      }
      msg.textContent = "Thanks — saved in your browser. Connect a mailing provider to receive guides by email (see Suggestions).";
      if (window.winA && typeof winA.record === "function") {
        winA.record("suggestion_review", { action: "reader_capture_local" });
      }
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    ensureDisclosure();
    buildFooter();
    buildFooterBottom();
    initCapture();
    if (typeof winAOnReady === "function") winAOnReady();
  });
})();
