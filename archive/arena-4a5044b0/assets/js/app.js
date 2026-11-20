/* WinA — shared frontend
   - Highlights the active nav item.
   - Injects the disclosure strip above the fold when a page omits it.
   - Builds the footer dashboard link groups so every surface is reachable
     from the footer and from a single navigation group.
   All logic is client-side; no cookies, no PII. */

(function () {
  const NAV_ITEMS = [
    { href: "index.html", label: "Home" },
    { href: "products.html", label: "Products" },
    { href: "guides.html", label: "Buying Guides" },
    { href: "suggest.html", label: "Suggestions" },
    { href: "questions.html", label: "Questions & Answers" },
    { href: "executive-summary.html", label: "Executive Summary" },
    { href: "flagged.html", label: "Flagged for Review" },
  ];

  const FOOTER_GROUPS = [
    {
      title: "Shop",
      links: [
        { href: "index.html", label: "Home" },
        { href: "products.html", label: "All products" },
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
        { href: "https://www.ftc.gov", label: "FTC endorsement guidance", ext: true },
      ],
    },
  ];

  const DISCLOSURE_HTML =
    '<section class="disclosure-strip" aria-label="Affiliate disclosure">\n' +
    '  <div class="wrap">\n' +
    '    <strong>Affiliate disclosure:</strong> As an Amazon Associate we earn from qualifying purchases. ' +
    '    Outbound product links on this page are marked <span class="tag-sponsored" aria-hidden="true">sponsored</span> ' +
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
      '<div>As an Amazon Associate we earn from qualifying purchases.</div>' +
      '<div><a href="flagged.html">Flagged for review</a> &middot; <a href="https://www.ftc.gov">FTC guidance</a> &middot; <a href="https://docs.github.com/pages">GitHub Pages</a></div>';
    footer.appendChild(bottom);
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildNav();
    ensureDisclosure();
    buildFooter();
    buildFooterBottom();
    if (typeof winAOnReady === "function") winAOnReady();
  });
})();
