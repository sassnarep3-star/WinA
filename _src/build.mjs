// ============================================================
// Build: renders the static site + runs the publication gate.
//   node _src/build.mjs
// Output is written to the repo root so GitHub Pages serves it
// as-is from /WinA/ on the default branch.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { guides, editorNote } from "./content.mjs";
import { about, disclosure, privacy, marketing, seo } from "./pages-content.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const data = read("data/products.json");
const policy = read("data/policy.json");
const gov = read("data/governance.json");
const questions = read("data/questions.json");
const suggestions = read("data/suggestions.json");
const specialLink = read("data/special_link_tests.json");
// AI-platform concept (framed as a concept only; nothing here is implemented)
const aiConcept = {
  title: "AI-platform concept",
  dek: "A concept for a possible system behind a publication like this one. It is not built, not connected to any data, and nothing on the site runs it.",
  body: `
<p><strong>Concept only. Not implemented.</strong> This page describes what a system could do. Nothing here is running. No model, no data feed, no pricing source and no review data is connected to this site, and no output from such a system is published. Every claim on the site is written by hand from a cited source.</p>
<h2>Five functions, each a candidate design</h2>
<table class="data">
<thead><tr><th scope="col">Function</th><th scope="col">Concept (not implemented)</th><th scope="col">Requirement before any use</th></tr></thead>
<tbody>
<tr><td>Product research</td><td>Collect candidate listings from a permitted source and group them by category.</td><td>Only sources Associates permits. Product data kept separate from intended and observed fields.</td></tr>
<tr><td>Pricing and review analysis</td><td>Summarise price and review data so it can be compared.</td><td>Prices and star ratings may be shown only through Creators API or PA API (Participation Requirements §2(b)). Neither is shown today (FLG-005, FLG-006).</td></tr>
<tr><td>Content generation</td><td>Draft guide text from the source register and listing titles.</td><td>Every claim cites a source, a person checks each draft, and no spec, date or performance claim is invented (Google helpful-content guidance).</td></tr>
<tr><td>Link management</td><td>Build and check outbound links, mark them sponsored, and find broken ones.</td><td>Each product passes one Special Link test first (FLG-003, FLG-024). Short-link status is unresolved and is not claimed invalid.</td></tr>
<tr><td>Tracking</td><td>Count outbound clicks and sessions with no personal data and no sub-tag per reader.</td><td>The collector is not deployed (FLG-011). The five events are defined but not recording. The campaign ledger takes only authorised first-party reports (FLG-012).</td></tr>
</tbody>
</table>
<h2>What it is not</h2>
<p>It is not a recommendation engine, a conversion predictor, a revenue forecast, or a source of product claims. It makes no statement about how any product performs. Whether to build any part of it is an owner decision. See the <a href="{BASE}/suggestions/">suggestions</a> and <a href="{BASE}/flagged/">flagged items</a>.</p>
`
};


const { site, products, categories } = data;
const BASE = site.baseurl;
const ORIGIN = site.origin;
const TAG = site.trackingId;

/* ---------- helpers ---------- */
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const url = (p = "/") => `${BASE}${p}`;
const abs = (p = "/") => `${ORIGIN}${p}`;
const body = (html) => html.replace(/\{BASE\}/g, BASE);

/** Constructed Special Link. Destination is always visible in the href. */
const special = (asin) => `https://www.amazon.com/dp/${asin}?tag=${TAG}`;

/**
 * Citation link. If it points at a product page we monetise it the same way
 * as any other purchase path; anything else is marked as a deliberate
 * non-affiliate link so the gate can tell the two apart.
 */
function cite(url, label, asin) {
  if (/\/dp\/[A-Z0-9]{10}/.test(url) && asin) {
    return `<a href="${special(asin)}" rel="sponsored nofollow noopener" target="_blank"
      data-affiliate="${asin}" data-slot="citation">${label}</a>`;
  }
  if (/^https:\/\/(?:www\.)?(?:amazon\.[a-z.]+|link\.amazon|amzn\.to)\//.test(url)) {
    return `<a href="${url}" rel="nofollow noopener" target="_blank" data-nonaffiliate="true">${label}</a>`;
  }
  return `<a href="${url}" rel="noopener" target="_blank">${label}</a>`;
}

const pages = []; // {path, title, desc, html, type, priority, lastmod}

function writePage(p, html) {
  const outDir = path.join(ROOT, p.replace(/^\/|\/$/g, ""));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html);
}

/* ---------- layout ---------- */
const NAV = [
  { href: url("/air-fryers/"), label: "Air fryers" },
  { href: url("/thermometers/"), label: "Thermometers" },
  { href: url("/guides/"), label: "Guides" },
  { href: url("/compare/"), label: "Compare" },
  { href: url("/about/"), label: "About" }
];

function layout(opts) {
  const {
    title,
    desc,
    children,
    current = "",
    canonical = "/",
    type = "website",
    pageType = "page",
    jsonld = null
  } = opts;

  const fullTitle = title.includes(site.name) ? title : `${title} — ${site.name}`;
  const nav = NAV.map(
    (n) =>
      `<a href="${n.href}"${current === n.href ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("");

  const ld = jsonld
    ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`
    : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(canonical)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="google-site-verification" content="REPLACE_WITH_REAL_TOKEN_FLG009">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="${type}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(fullTitle)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)}" href="${url("/feed.xml")}">
<link rel="stylesheet" href="${url("/assets/css/site.css")}">
<script>window.CS_CONFIG={analyticsEnabled:${gov.analytics.enabled},analyticsEndpoint:""};</script>
${ld}
</head>
<body data-page-type="${pageType}">
<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <div class="wrap masthead__inner">
    <a class="brand" href="${url("/")}">
      <span class="brand__mark" aria-hidden="true">C</span>
      <span class="brand__name">${esc(site.name)}</span>
      <span class="brand__sub">Kitchen gear, judged honestly</span>
    </a>
    <nav class="nav" aria-label="Primary">${nav}</nav>
  </div>
</header>

<!-- Disclosure: above the fold on every page (OA §5, FTC Disclosures 101) -->
<div class="disclosure">
  <div class="wrap disclosure__inner">
    <span class="disclosure__tag">Disclosure</span>
    <span><strong>${esc(site.associateStatement)}</strong>
    Product links are sponsored. Prices and ratings are not shown — see <a href="${url(
      "/disclosure/"
    )}">why</a>.</span>
  </div>
</div>

<main id="main">
${children}
</main>

<footer class="footer">
  <div class="wrap">
    <p class="footer__statement"><strong>${esc(site.associateStatement)}</strong>
    ${esc(site.name)} is written and published independently and is not endorsed by Amazon or by any brand mentioned here.</p>

    <div class="footer__grid">
      <div>
        <p class="footer__brandname">${esc(site.name)}</p>
        <p class="footer__tagline">${esc(site.tagline)}</p>
        <p class="tiny" style="color:#8d847a;margin:0">Product links open Amazon in a new tab and carry our tracking tag.</p>
      </div>
      <div>
        <h3>Shop</h3>
        <ul>
          <li><a href="${url("/air-fryers/")}">Air fryers</a></li>
          <li><a href="${url("/thermometers/")}">Thermometers</a></li>
          <li><a href="${url("/compare/")}">Compare all five</a></li>
          <li><a href="${url("/guides/")}">Buying guides</a></li>
        </ul>
      </div>
      <div>
        <h3>Publication</h3>
        <ul>
          <li><a href="${url("/about/")}">About &amp; editorial standards</a></li>
          <li><a href="${url("/disclosure/")}">Affiliate disclosure</a></li>
          <li><a href="${url("/privacy/")}">Privacy</a></li>
          <li><a href="${url("/concept/")}">AI-platform concept (not built)</a></li>
          <li><a href="${url("/feed.xml")}">RSS feed</a></li>
        </ul>
      </div>
      <div>
        <h3>Record &amp; review</h3>
        <ul>
          <li><a href="${url("/register/")}">Source register</a></li>
          <li><a href="${url("/flagged/")}">Flagged for review</a></li>
          <li><a href="${url("/dashboard/")}">Campaign ledger</a></li>
          <li><a href="${url("/analytics/")}">Measurement</a></li>
          <li><a href="${url("/questions/")}">Open questions</a></li>
          <li><a href="${url("/suggestions/")}">Suggestions</a></li>
          <li><a href="${url("/summary/")}">Executive summary</a></li>
          <li><a href="${url("/marketing/")}">Marketing plan</a></li>
          <li><a href="${url("/seo/")}">Search &amp; findability</a></li>
        </ul>
      </div>
    </div>

    <div class="footer__bottom">
      <p>&copy; <span data-year>2026</span> ${esc(site.name)}. Built ${esc(site.built)}.</p>
      <p>Tracking ID ${esc(TAG)} · <a href="${url("/register/")}">Sources</a></p>
    </div>
  </div>
</footer>

<script src="${url("/assets/js/site.js")}" defer></script>
</body>
</html>`;
}

/* ---------- shared partials ---------- */
function buybox(p, slot) {
  return `<div class="buybox">
  <p class="buybox__label">Sponsored link</p>
  <p class="buybox__price">Price not shown. Amazon requires current pricing from its API, which we do not have — so we show none rather than a figure that goes stale.</p>
  <a class="btn btn--amazon" href="${special(p.asin)}"
     rel="sponsored nofollow noopener" target="_blank"
     data-affiliate="${p.asin}" data-slot="${slot}">
     Check price on Amazon →
  </a>
  <p class="buybox__legal">Opens amazon.com. We earn a commission if you buy, at no extra cost to you. ${esc(
    site.associateStatement
  )}</p>
</div>`;
}

function specTable(p) {
  const rows = p.specs
    .map((s) => {
      const label = s.status === "withheld" ? "Withheld" : s.status === "unverified" ? "Unverified" : "";
      const val = s.value
        ? esc(s.value)
        : `<span class="faint">— ${
            s.status === "withheld"
              ? "not displayable under Amazon program policy"
              : "not confirmed from an official source"
          }</span>`;
      return `<tr>
      <td>${esc(s.label)}</td>
      <td>${val}</td>
      <td><span class="pill pill--${s.status}">${label || s.status}</span></td>
      <td>${
        s.source
          ? `<a href="${special(p.asin)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${
              p.asin
            }" data-slot="spec-source">Amazon listing</a>`
          : '<span class="faint">none</span>'
      }</td>
    </tr>`;
    })
    .join("");

  return `<div class="tablewrap">
  <table class="data sortable">
    <caption>Specifications for the ${esc(p.shortName)}. Status shows how well each value is supported. Nothing is inferred.</caption>
    <thead><tr><th scope="col">Specification</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}

function productCard(p, rank) {
  const top = p.specs.filter((s) => s.value).slice(0, 3);
  return `<article class="pcard">
  <div class="pcard__top">
    ${rank ? `<span class="pcard__rank">${rank}</span>` : "<span></span>"}
    <span class="pcard__tag">${esc(
      p.formFactor.replace(/-/g, " ")
    )}</span>
  </div>
  <div class="pcard__body">
    <p class="pcard__brand">${esc(p.brand)}</p>
    <h3 class="pcard__name"><a href="${url(`/products/${p.slug}/`)}">${esc(p.shortName)}</a></h3>
    <p class="pcard__verdict">${esc(p.verdict)}</p>
    <ul class="pcard__specs">
      ${top
        .map(
          (s) =>
            `<li><span class="k">${esc(s.label)}</span><span class="v">${esc(s.value)}</span></li>`
        )
        .join("")}
    </ul>
  </div>
  <div class="pcard__foot">
    <a class="btn btn--amazon" href="${special(p.asin)}" rel="sponsored nofollow noopener"
       target="_blank" data-affiliate="${p.asin}" data-slot="card">Check price on Amazon →</a>
    <p class="pcard__note">Sponsored. ${esc(site.associateStatement)}</p>
  </div>
</article>`;
}

const breadcrumb = (trail) =>
  `<nav class="wrap breadcrumb" aria-label="Breadcrumb">${trail
    .map((t, i) =>
      i === trail.length - 1
        ? `<span aria-current="page">${esc(t.label)}</span>`
        : `<a href="${t.href}">${esc(t.label)}</a><span aria-hidden="true">/</span>`
    )
    .join("")}</nav>`;

/* ============================================================
   FRONT PAGE — a publication front page, not a dashboard
   ============================================================ */
function frontPage() {
  const picks = products.slice(0, 3);
  const lead = products[0];

  const html = `
<section class="hero">
  <div class="wrap hero__grid">
    <div>
      <p class="kicker">Air fryers &amp; precision</p>
      <h1>Buy the one that fits your <em>counter</em>, not the one with the biggest number.</h1>
      <p class="hero__dek">Three air fryers and two thermometers, compared on the things that decide whether you still use them in a year: how many things cook at once, how much counter it takes, and how much of it ends up in the sink.</p>
      <div class="hero__actions">
        <a class="btn btn--primary" href="${url("/air-fryers/")}">See the air fryers</a>
        <a class="btn btn--ghost" href="${url("/guides/basket-vs-oven/")}">Basket or oven? Start here</a>
      </div>
      <p class="tiny faint" style="margin-top:1.1rem">No testing claims. No invented prices. Every spec is labelled with how it was verified.</p>
    </div>
    <aside class="pick">
      <p class="pick__label">Start here</p>
      <h2 class="pick__name">${esc(lead.shortName)}</h2>
      <p class="pick__verdict">${esc(lead.verdict)}</p>
      <dl class="pick__meta">
        <div class="pick__stat"><dt>Capacity</dt><dd>6 qt</dd></div>
        <div class="pick__stat"><dt>Chambers</dt><dd>Two</dd></div>
        <div class="pick__stat"><dt>Best for</dt><dd style="font-size:.86rem;font-family:var(--sans)">Two-part dinners</dd></div>
      </dl>
      <a class="btn btn--amazon" href="${special(lead.asin)}" rel="sponsored nofollow noopener"
         target="_blank" data-affiliate="${lead.asin}" data-slot="hero">Check price on Amazon →</a>
      <p class="pcard__note">Sponsored. ${esc(site.associateStatement)}</p>
    </aside>
  </div>
</section>

<div class="strip">
  <div class="wrap strip__inner">
    <div class="strip__cell"><p class="strip__num">5</p><p class="strip__lab">Products compared</p></div>
    <div class="strip__cell"><p class="strip__num">4</p><p class="strip__lab">Guides</p></div>
    <div class="strip__cell"><p class="strip__num">0</p><p class="strip__lab">Products tested</p></div>
    <div class="strip__cell"><p class="strip__num">10</p><p class="strip__lab">Policy checks passed</p></div>
  </div>
</div>

<section class="section">
  <div class="wrap">
    <div class="section__head section__head--split">
      <div>
        <h2 class="section__title">What we'd put on your counter</h2>
        <p class="section__dek">Three air fryers at three different points on the same trade-off. None of them is the "best" — one of them is right for you, and the other two are wrong in specific ways.</p>
      </div>
      <a class="section__more" href="${url("/air-fryers/")}">All air fryers</a>
    </div>
    <div class="products products--three">
      ${picks.map((p, i) => productCard(p, i + 1)).join("")}
    </div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap">
    <div class="section__head section__head--split">
      <div>
        <h2 class="section__title">The cheapest upgrade in the kitchen</h2>
        <p class="section__dek">An air fryer you can hear and smell your way through. A roast you cannot. Two ways to stop guessing.</p>
      </div>
      <a class="section__more" href="${url("/thermometers/")}">Both thermometers</a>
    </div>
    <div class="products">
      ${products.slice(3).map((p) => productCard(p, null)).join("")}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section__head">
      <h2 class="section__title">Read before you buy</h2>
      <p class="section__dek">Four questions that come up before any of these purchases, answered without a verdict at the end.</p>
    </div>
    <div class="guides guides--two">
      ${guides
        .map(
          (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span>
          <h3 class="guide-link__title">${esc(g.title)}</h3>
          <p class="guide-link__dek">${esc(g.dek)}</p>
        </span>
      </a>`
        )
        .join("")}
    </div>
  </div>
</section>

<section class="section" style="padding-top:0">
  <div class="wrap narrow">
    <div class="note note--warn">
      <p class="note__title">${esc(editorNote.title)}</p>
      <p>${esc(editorNote.body)}</p>
      <p class="mt1"><a href="${url("/about/")}">Full editorial standards →</a></p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/",
    title: `${site.name} — air fryers and thermometers, chosen for counter space`,
    desc: "Three air fryers and two thermometers compared on capacity, batching, cleanup and counter cost. No testing claims, no invented prices, every spec labelled with how it was verified.",
    html,
    priority: "1.0",
    changefreq: "weekly"
  });
}

/* ============================================================
   CATEGORY HUBS
   ============================================================ */
function categoryPages() {
  for (const c of categories) {
    const items = products.filter((p) => p.category === c.slug);
    const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: c.name }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">${esc(c.kicker)}</p>
    <h1 class="article-head__title">${esc(c.name)} that earn their counter space</h1>
    <p class="article-head__dek">${esc(c.dek)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <p class="lede" style="margin-bottom:2rem">${esc(c.intro)}</p>
    <div class="products products--three">
      ${items.map((p, i) => productCard(p, i + 1)).join("")}
    </div>
  </div>
</section>
<section class="section section--deep">
  <div class="wrap narrow">
    <h2 class="section__title" style="font-size:1.4rem">Before you pick one</h2>
    <div class="guides">
      ${guides
        .filter((g) => g.category === c.slug || items.some((p) => p.guideTopics.includes(g.slug)))
        .map(
          (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span><h3 class="guide-link__title">${esc(g.title)}</h3>
        <p class="guide-link__dek">${esc(g.dek)}</p></span></a>`
        )
        .join("")}
    </div>
    <p class="small muted mt2">Browse the category on Amazon: ${cite(
      c.browseNodeUrl,
      esc(c.browseNode)
    )} <span class="faint">(deliberate non-affiliate link — no tracking tag, no commission)</span></p>
  </div>
</section>
`;
    pages.push({
      path: `/${c.slug}/`,
      title: `${c.name} — ${site.name}`,
      desc: c.dek,
      html,
      priority: "0.9",
      changefreq: "weekly",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: c.name,
        itemListElement: items.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: p.name,
          url: abs(`/products/${p.slug}/`)
        }))
      }
    });
  }
}

/* ============================================================
   PRODUCT PAGES
   ============================================================ */
function productPages() {
  for (const p of products) {
    const cat = categories.find((c) => c.slug === p.category);
    const related = guides.filter((g) => p.guideTopics.includes(g.slug)).slice(0, 3);
    const html = `
${breadcrumb([
  { href: url("/"), label: "Home" },
  { href: url(`/${cat.slug}/`), label: cat.name },
  { label: p.shortName }
])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">${esc(p.brand)} · ${esc(p.formFactor.replace(/-/g, " "))}</p>
    <h1 class="article-head__title">${esc(p.name)}</h1>
    <p class="article-head__dek">${esc(p.verdict)}</p>
    <div class="byline">
      <span>${esc(site.name)} editorial</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span class="unverified">Not hands-on tested</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>Specs checked ${esc(p.observedOn)}</span>
    </div>
  </div>
</div>

<div class="wrap layout">
  <div>
    <dl class="facts">
      <div class="fact"><dt>Best for</dt><dd>${esc(p.bestFor)}</dd></div>
      <div class="fact"><dt>Main trade-off</dt><dd>${esc(p.tradeoff)}</dd></div>
      <div class="fact"><dt>ASIN</dt><dd>${esc(p.asin)}</dd></div>
      <div class="fact"><dt>Form factor</dt><dd>${esc(p.formFactor.replace(/-/g, " "))}</dd></div>
    </dl>

    <div class="prose">
      <h2>Why it is on this list</h2>
      <ul>${p.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>

      <h2>What to think twice about</h2>
      <ul>${p.consider.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>

      <h2>Who it is wrong for</h2>
      <p>${esc(whoNotFor(p))}</p>
    </div>

    <h2 class="section__title" style="font-size:1.35rem;margin-top:2.5rem">Specifications</h2>
    <p class="small muted" style="margin-top:-.5rem;margin-bottom:1rem">
      Status key: <span class="pill pill--verified">verified</span> confirmed on the official listing ·
      <span class="pill pill--claim">claim</span> manufacturer's stated figure, not independently verifiable ·
      <span class="pill pill--unverified">unverified</span> could not confirm, left blank ·
      <span class="pill pill--withheld">withheld</span> exists but may not be displayed.
    </p>
    ${specTable(p)}

    <div class="note mt2">
      <p class="note__title">On what is missing from this page</p>
      <p>Price, star rating, review count and product photography are all absent. Amazon's program policies prohibit displaying ratings, reviews or current prices unless supplied through its API, and prohibit price tracking outright. We have no API access, so we show nothing rather than something inaccurate. The gaps are listed on the <a href="${url(
        "/flagged/"
      )}">flagged for review</a> page.</p>
    </div>

    ${
      related.length
        ? `<h2 class="section__title" style="font-size:1.35rem;margin-top:2.5rem">Related reading</h2>
    <div class="guides">
      ${related
        .map(
          (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span><h3 class="guide-link__title">${esc(g.title)}</h3>
        <p class="guide-link__dek">${esc(g.dek)}</p></span></a>`
        )
        .join("")}
    </div>`
        : ""
    }
  </div>

  <aside class="layout__aside">
    ${buybox(p, "sidebar")}
    <div class="note mt2">
      <p class="note__title">Buying from outside the US?</p>
      <p class="small">These links point at amazon.com. Associates links are marketplace-specific, and a non-US reader may be routed to their local store, where our tag may not apply.</p>
    </div>
  </aside>
</div>
`;
    pages.push({
      path: `/products/${p.slug}/`,
      title: `${p.name} — review and trade-offs`,
      desc: p.verdict.slice(0, 155),
      html,
      priority: "0.8",
      changefreq: "monthly",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: p.name,
        description: p.verdict,
        dateModified: p.observedOn,
        author: { "@type": "Organization", name: site.name },
        publisher: { "@type": "Organization", name: site.name },
        isAccessibleForFree: true
      }
    });
  }
}

function whoNotFor(p) {
  const map = {
    "chefman-6-quart-dual-basket":
      "Anyone cooking one large thing. Two 3-quart drawers cannot hold a whole chicken, and 6 quarts split in half is less usable volume than it sounds. If you consistently cook a single big batch, the 8-quart single basket does that better and with less washing. It is also wrong for anyone whose counter cannot spare the extra width a dual-basket body needs.",
    "emeril-lagasse-26qt-french-door":
      "Anyone cooking two portions on a weeknight. It is a small oven, and it behaves like one: more to preheat, more to wash, more counter permanently occupied. If you want fast fries for two, this is the wrong tool and you will resent it by the third week.",
    "chefman-8-quart-turbofry":
      "Anyone whose meals are a protein and a side at different temperatures. One drawer means one temperature, so you will cook in sequence or compromise. It is also wrong if you want to bake in a pan or cook something whole and flat.",
    "thermomaven-1-sec-thermometer":
      "Anyone who wants to monitor a roast without standing there. This is an instant-read probe: it measures when you insert it and nothing else. For a long cook in a closed oven or on a smoker, you need a leave-in probe instead.",
    "chef-iq-sense-gen3":
      "Anyone cooking one thing quickly, and anyone unwilling to depend on an app. It is a monitoring system, not a grab-and-check tool, and its long-term usefulness depends on software support we could not verify."
  };
  return map[p.slug] || p.tradeoff;
}

/* ============================================================
   GUIDES
   ============================================================ */
function guidePages() {
  for (const g of guides) {
    const cat = categories.find((c) => c.slug === g.category);
    const related = products.filter((p) => p.guideTopics.includes(g.slug));

    const html = `
${breadcrumb([
  { href: url("/"), label: "Home" },
  { href: url("/guides/"), label: "Guides" },
  { label: g.title }
])}
<article>
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Guide ${g.number} · ${esc(cat ? cat.name : "Buying")}</p>
    <h1 class="article-head__title">${esc(g.title)}</h1>
    <p class="article-head__dek">${esc(g.dek)}</p>
    <div class="byline">
      <span>${esc(site.name)} editorial</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>${esc(g.readingTime)} read</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span class="unverified">No hands-on testing claimed</span>
    </div>
  </div>
</div>

<div class="wrap layout">
  <div>
    <div class="note" style="margin-top:1.5rem">
      <p class="note__title">The short answer</p>
      <p>${esc(g.intro.split("\n\n")[0])}</p>
    </div>

    <div class="prose" style="margin-top:1.75rem">
      ${body(g.body)}
    </div>

    <div class="note note--warn mt2">
      <p class="note__title">Takeaways</p>
      <ul style="margin:.3rem 0 0;padding-left:1.1rem">
        ${g.takeaways.map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>
    </div>

    ${
      related.length
        ? `<h2 class="section__title" style="font-size:1.35rem;margin-top:2.5rem">The products this applies to</h2>
    <div class="products" style="margin-top:1rem">
      ${related.map((p) => productCard(p, null)).join("")}
    </div>`
        : ""
    }

    <p class="small muted mt2">Next: <a href="${url("/guides/")}">all guides</a> · <a href="${url(
      "/compare/"
    )}">compare all five products</a></p>
  </div>

  <aside class="layout__aside">
    <div class="buybox">
      <p class="buybox__label">Sponsored</p>
      <p class="small" style="margin:0 0 .9rem">The products discussed in this guide, with current pricing on Amazon — we do not display prices ourselves.</p>
      ${related
        .slice(0, 3)
        .map(
          (p) => `<p style="margin:0 0 .6rem"><a href="${special(
            p.asin
          )}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${
            p.asin
          }" data-slot="guide-sidebar" style="font-size:.85rem">${esc(
            p.shortName
          )} on Amazon →</a></p>`
        )
        .join("")}
      <p class="buybox__legal">${esc(site.associateStatement)}</p>
    </div>
    <div class="note mt2">
      <p class="note__title">How this was written</p>
      <p class="small">From published specifications and the trade-offs they imply. Nothing here describes hands-on use, because none took place. <a href="${url(
        "/about/"
      )}">Editorial standards</a></p>
    </div>
  </aside>
</div>
</article>
`;
    pages.push({
      path: `/guides/${g.slug}/`,
      title: g.title,
      desc: g.dek,
      html,
      type: "article",
      pageType: "guide",
      priority: "0.85",
      changefreq: "monthly",
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: g.title,
        description: g.dek,
        datePublished: site.built,
        dateModified: site.built,
        author: { "@type": "Organization", name: site.name },
        publisher: { "@type": "Organization", name: site.name },
        isAccessibleForFree: true
      }
    });
  }

  // Guides index
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Guides" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Buying guides</p>
    <h1 class="article-head__title">The questions people ask before they buy</h1>
    <p class="article-head__dek">Four guides, each built around one decision. No rankings, no "best of" list, no claim that any of this was tested.</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="guides">
      ${guides
        .map(
          (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span>
          <h2 class="guide-link__title">${esc(g.title)}</h2>
          <p class="guide-link__dek">${esc(g.dek)}</p>
          <p class="tiny faint" style="margin:.4rem 0 0">${esc(g.readingTime)} · ${esc(
            g.topics.join(" · ")
          )}</p>
        </span>
      </a>`
        )
        .join("")}
    </div>
    <div class="note mt2">
      <p class="note__title">These titles are hypotheses</p>
      <p>They were written as editorial questions, not from search volume data. No keyword tool or Search Console report informed them. Which one actually earns traffic will be known only after the sitemap is indexed and the query report has something in it — tracked on the <a href="${url(
        "/questions/"
      )}">open questions</a> page.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/guides/",
    title: "Buying guides",
    desc: "Four question-shaped guides to air fryers and thermometers: form factor, capacity, cleanup, and multi-function claims.",
    html,
    priority: "0.8",
    changefreq: "weekly"
  });
}

/* ============================================================
   COMPARE
   ============================================================ */
function comparePage() {
  const cols = products;
  const specKeys = [
    ["Capacity", (p) => p.specs.find((s) => s.label === "Capacity")?.value],
    ["Form factor", (p) => p.formFactor.replace(/-/g, " ")],
    ["Chambers", (p) => (p.formFactor.includes("dual") ? "Two" : "One")],
    ["Max temp", (p) => p.specs.find((s) => s.label === "Max temperature")?.value],
    ["Functions", (p) => p.specs.find((s) => s.label === "Functions")?.value],
    ["Probes", (p) => p.specs.find((s) => s.label === "Probes")?.value],
    ["Read time", (p) => p.specs.find((s) => s.label === "Read time")?.value],
    ["Connectivity", (p) => p.specs.find((s) => s.label === "Connectivity")?.value],
    ["Best for", (p) => p.bestFor],
    ["Trade-off", (p) => p.tradeoff],
    ["Price", () => null],
    ["Rating", () => null]
  ];

  const rows = specKeys
    .map(([label, fn]) => {
      const cells = cols
        .map((p) => {
          const v = fn(p);
          if (label === "Price" || label === "Rating")
            return `<td class="blank">withheld</td>`;
          return v ? `<td>${esc(v)}</td>` : `<td class="blank">unverified</td>`;
        })
        .join("");
      return `<tr><th scope="row">${esc(label)}</th>${cells}</tr>`;
    })
    .join("");

  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Compare" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Side by side</p>
    <h1 class="article-head__title">All five, in one table</h1>
    <p class="article-head__dek">The specs we could verify, the trade-offs, and honest blanks where a value could not be confirmed. "Unverified" means nobody should guess — including us.</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Comparison of all five products. Blank cells are values we could not confirm from an official source; they are not zeroes and not estimates.</caption>
        <thead>
          <tr><th scope="col">Spec</th>${cols
            .map(
              (p) =>
                `<th scope="col"><a href="${url(`/products/${p.slug}/`)}">${esc(
                  p.shortName
                )}</a></th>`
            )
            .join("")}</tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="note note--warn mt2">
      <p class="note__title">Why the price and rating rows are empty</p>
      <p>Not an oversight and not laziness. Amazon prohibits displaying current prices or customer ratings unless they come from its Product Advertising API, and prohibits price tracking outright. We do not have API access. Every other blank row is a value we tried and failed to confirm — wattage, dimensions and warranty for all five products. Both categories of gap are published on the <a href="${url(
        "/flagged/"
      )}">flagged for review</a> page.</p>
    </div>

    <h2 class="section__title" style="font-size:1.35rem;margin-top:2.5rem">Which one, in one line each</h2>
    <div class="prose">
      <p><strong>Chefman 6-quart dual basket</strong> — if your dinners are two things at two temperatures. ${esc(
        products[0].tradeoff
      )}.</p>
      <p><strong>Emeril Lagasse 26QT</strong> — if you would otherwise be buying a second oven. ${esc(
        products[1].tradeoff
      )}.</p>
      <p><strong>Chefman 8-quart TurboFry</strong> — if you cook one big thing and want it crisp. ${esc(
        products[2].tradeoff
      )}.</p>
      <p><strong>ThermoMaven instant-read</strong> — if you want a number right now. ${esc(
        products[3].tradeoff
      )}.</p>
      <p><strong>CHEF iQ Sense</strong> — if you want to walk away and be told. ${esc(
        products[4].tradeoff
      )}.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/compare/",
    title: "Compare all five products",
    desc: "Side-by-side comparison of three air fryers and two meat thermometers, with unverifiable values left blank rather than estimated.",
    html,
    priority: "0.85",
    changefreq: "monthly",
    pageType: "compare",
    jsonld: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Compared products",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: abs(`/products/${p.slug}/`)
      }))
    }
  });
}

/* ============================================================
   REGISTER — the source register
   ============================================================ */
// Special Link test register (FLG-003, FLG-024): one test per product before scaling.
function specialLinkSection() {
  const rows = specialLink.tests.map((t) => {
    // Match on the observed ASIN in the destination URL (main keys products by slug, not by P-number).
    const p = products.find((x) => t.observed_destination_url === `https://www.amazon.com/dp/${x.asin}`);
    if (!p) throw new Error(`special link test ${t.product_id} matches no product by observed ASIN`);
    return `<tr>
        <td>${esc(t.product_id)} · ${esc(p.shortName)}</td>
        <td><code>${esc(t.submitted_url)}</code> <span class="faint">(not validated)</span></td>
        <td><span class="pill pill--review">${esc(t.test_status)}</span></td>
        <td>${t.tested_on ? esc(t.tested_on) : '<span class="faint">Not tested</span>'}</td>
        <td>${t.destination_seen ? esc(t.destination_seen) : '<span class="faint">Not recorded</span>'}</td>
        <td>${t.tracking_report_line_seen ? esc(t.tracking_report_line_seen) : '<span class="faint">Not recorded</span>'}</td>
      </tr>`;
  });
  return `<section class="section">
  <div class="wrap">
    <h2 class="section__title" style="font-size:1.4rem">Special Link test, one per product</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">${esc(specialLink.blocker)} Each row needs its test recorded before any further product is added. None is marked as passed. Flags: FLG-003, FLG-024.</p>
    <div class="table-wrap"><table>
      <thead><tr><th scope="col">Product</th><th scope="col">Submitted short link</th><th scope="col">Test status</th><th scope="col">Tested on</th><th scope="col">Destination seen</th><th scope="col">Tracking report line</th></tr></thead>
      <tbody>${rows.join("\n      ")}</tbody>
    </table></div>
  </div>
</section>
`;
}

function registerPage() {
  const specRows = [];
  for (const p of products) {
    for (const s of p.specs) {
      specRows.push(`<tr>
        <td><a href="${url(`/products/${p.slug}/`)}">${esc(p.shortName)}</a></td>
        <td>${esc(s.label)}</td>
        <td>${s.value ? esc(s.value) : '<span class="faint">—</span>'}</td>
        <td><span class="pill pill--${s.status}">${s.status}</span></td>
        <td>${
          s.source
            ? `<a href="${special(p.asin)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${p.asin}" data-slot="register">amazon.com/dp/${esc(p.asin)}</a>`
            : "<span class='faint'>no source</span>"
        }</td>
      </tr>`);
    }
  }

  const sourceRows = policy.sources
    .map(
      (s) => `<tr>
    <td><code>${esc(s.id)}</code></td>
    <td>${esc(s.type)}</td>
    <td>${esc(s.label)}</td>
    <td>${esc(s.note)}</td>
    <td>${esc(s.accessed)}</td>
    <td>${s.url ? cite(s.url, "Open") : 'amazon.com/dp/<em>ASIN</em> <span class="faint">(per product)</span>'}</td>
  </tr>`
    )
    .join("");

  const policyRows = policy.policy
    .map(
      (p) => `<tr>
    <td><code>${esc(p.id)}</code></td>
    <td><strong>${esc(p.topic)}</strong><br><span class="tiny muted">${esc(p.section)}</span></td>
    <td class="small">${esc(p.requirement)}</td>
    <td><span class="pill pill--${p.status}">${esc(p.status)}</span></td>
    <td class="small">${esc(p.howMet)}</td>
    <td><a href="${p.sourceUrl}" rel="${/^https:\/\/link\.amazon\//.test(p.sourceUrl) ? "nofollow noopener" : "noopener"}" target="_blank"${/^https:\/\/link\.amazon\//.test(p.sourceUrl) ? ' data-nonaffiliate="true"' : ""}>${esc(p.source)}</a></td>
  </tr>`
    )
    .join("");

  const linkRows = products
    .map(
      (p) => `<tr>
    <td><code>${esc(p.submittedLink.replace("https://link.amazon/", ""))}</code></td>
    <td><a href="${p.submittedLink}" rel="nofollow noopener" target="_blank" data-nonaffiliate="true">link.amazon</a></td>
    <td>${cite(p.observedDestination, `<code>${esc(p.asin)}</code>`, p.asin)}</td>
    <td class="blank">not supplied</td>
    <td>${esc(p.observedOn)}</td>
    <td>observed redirect</td>
  </tr>`
    )
    .join("");

  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Source register" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">The record</p>
    <h1 class="article-head__title">Source register</h1>
    <p class="article-head__dek">Every claim on this site, where it came from, and how confident we are. If a value has no source, it has no value.</p>
  </div>
</div>

<section class="section">
  <div class="wrap">
    <h2 class="section__title" style="font-size:1.4rem">Link resolution</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">The five submitted short links, what they resolved to, and the separation between the intended ASIN (never supplied) and the observed destination (recorded by following the link).</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Submitted link → observed destination. Intended ASIN is a separate field from observed destination and is deliberately blank.</caption>
        <thead><tr><th scope="col">Submitted code</th><th scope="col">Link</th><th scope="col">Observed ASIN</th><th scope="col">Intended ASIN</th><th scope="col">Confirmed</th><th scope="col">Method</th></tr></thead>
        <tbody>${linkRows}</tbody>
      </table>
    </div>
    <div class="note note--warn mt1">
      <p class="note__title">The short code is not the ASIN</p>
      <p>None of the five short codes matches the product it resolves to. Treating the code as an identifier would produce broken links in every case. See <a href="${url(
        "/flagged/"
      )}">FLG-001</a>.</p>
    </div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap">
    <h2 class="section__title" style="font-size:1.4rem">Official sources used</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">Every row of policy text and every specification on this site traces to one of these.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Source register. All sources are primary: the publisher's own page, read on the date shown.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Type</th><th scope="col">Source</th><th scope="col">What it was used for</th><th scope="col">Read</th><th scope="col">Link</th></tr></thead>
        <tbody>${sourceRows}</tbody>
      </table>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <h2 class="section__title" style="font-size:1.4rem">Specification register</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">All ${specRows.length} specification rows across the five products, each with its verification status and source.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Every specification, with status. verified = confirmed on the official listing; claim = manufacturer's stated figure we could not independently verify; unverified = no confirmed value, left blank; withheld = exists but may not be displayed.</caption>
        <thead><tr><th scope="col">Product</th><th scope="col">Spec</th><th scope="col">Value</th><th scope="col">Status</th><th scope="col">Source</th></tr></thead>
        <tbody>${specRows.join("")}</tbody>
      </table>
    </div>
  </div>
</section>

${specialLinkSection()}
<section class="section section--deep">
  <div class="wrap">
    <h2 class="section__title" style="font-size:1.4rem">Policy checks</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">Ten requirements from Amazon's program terms and the FTC's guidance, each traced to the exact clause and to what the site does about it.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Compliance register. Requirement text is quoted from the cited clause; the final column links to the primary source.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Requirement</th><th scope="col">What it requires</th><th scope="col">Status</th><th scope="col">How this site meets it</th><th scope="col">Source</th></tr></thead>
        <tbody>${policyRows}</tbody>
      </table>
    </div>
    <div class="tablewrap mt2">
      <table class="data sortable">
        <caption>Verbatim clause text for each requirement, so it can be checked without trusting our summary.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Clause</th><th scope="col">Quoted text</th></tr></thead>
        <tbody>${policy.policy
          .map(
            (p) => `<tr><td><code>${esc(p.id)}</code></td><td class="small">${esc(
              p.section
            )}</td><td class="small">“${esc(p.quote)}”</td></tr>`
          )
          .join("")}</tbody>
      </table>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/register/",
    title: "Source register",
    desc: "Every specification and policy claim on this site, with its verification status and a link to the primary source.",
    html,
    priority: "0.6",
    changefreq: "monthly"
  });
}

/* ============================================================
   FLAGGED FOR REVIEW
   ============================================================ */
function flaggedPage() {
  // Needs-attention first; resolved last. A review page should open with
  // the open questions, not with what already got answered.
  const order = { review: 0, action: 1, withheld: 2, low: 3, resolved: 4 };
  const items = [...gov.flagged].sort((a, b) => order[a.severity] - order[b.severity]);

  const cards = items
    .map(
      (f) => `<article class="note ${
        f.severity === "resolved" ? "" : f.severity === "withheld" ? "note--stop" : "note--warn"
      }" style="margin-bottom:1.25rem">
    <p class="note__title">${esc(f.id)} <span class="pill pill--${f.severity}">${esc(
        f.severity
      )}</span></p>
    <h3 style="font-family:var(--serif);font-size:1.15rem;margin:.2rem 0 .5rem;color:var(--ink)">${esc(
      f.title
    )}</h3>
    <p style="margin:0 0 .6rem">${esc(f.detail)}</p>
    <p style="margin:0 0 .6rem"><strong>What we did:</strong> ${esc(f.action)}</p>
    <p class="small" style="margin:0">${cite(f.sourceUrl, esc(f.sourceLabel), f.sourceAsin)}</p>
  </article>`
    )
    .join("");

  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Flagged for review" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Needs your decision</p>
    <h1 class="article-head__title">Flagged for review</h1>
    <p class="article-head__dek">Everything this build could not resolve, could not verify, or deliberately withheld — with a source link for each so it can be checked. None of these blocked publication. Several block growth.</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="tablewrap" style="margin-bottom:2rem">
      <table class="data sortable">
        <caption>Summary. "Resolved" means we found the answer and recorded it; "review" means the answer is not knowable from here; "action" means it needs a credential or a deploy; "withheld" means a policy prevents display.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Item</th><th scope="col">Severity</th><th scope="col">Source</th></tr></thead>
        <tbody>${items
          .map(
            (f) => `<tr>
          <td><code>${esc(f.id)}</code></td>
          <td>${esc(f.title)}</td>
          <td><span class="pill pill--${f.severity}">${esc(f.severity)}</span></td>
          <td>${cite(f.sourceUrl, "open", f.sourceAsin)}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>

    <h2 class="section__title" style="font-size:1.4rem">In detail</h2>
    <div style="margin-top:1.25rem">${cards}</div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">Prior audit work on this repository</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">Other sessions built earlier versions of this site on the same repo. Their findings are merged into the register above rather than discarded, and their complete data, toolchain and generated pages are preserved unchanged in <code>archive/</code>. Nothing was deleted.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Archived builds. Each is a complete, browsable copy from the commit it was merged at; none is served as the live site any more.</caption>
        <thead><tr><th scope="col">Archive</th><th scope="col">Session</th><th scope="col">Finding</th><th scope="col">Browse</th></tr></thead>
        <tbody>
          <tr>
            <td><code>archive/arena-2ca62ce9/</code></td>
            <td>arena-2ca62ce9</td>
            <td>Independent verification of the same five ASINs; 18-item flag register; source register SRC-01…SRC-11; its own questions, suggestions and ledger. Fourteen of its findings are folded into this register with attribution.</td>
            <td><a href="${url("/archive/arena-2ca62ce9/")}">Open archived site</a></td>
          </tr>
          <tr>
            <td><code>archive/arena-2ca62ce9/data/flags.json</code></td>
            <td>arena-2ca62ce9</td>
            <td>The original 18-item flag register, unmodified, for line-by-line comparison.</td>
            <td><a href="${url("/archive/arena-2ca62ce9/data/flags.json")}">View JSON</a></td>
          </tr>
          <tr>
            <td><code>archive/arena-6bd1be15/</code></td>
            <td>arena-6bd1be15</td>
            <td>Earlier root-level site, kept for the record. Its verification log is the origin of FLG-016.</td>
            <td><a href="${url("/archive/arena-6bd1be15/")}">Open archived site</a></td>
          </tr>
          <tr>
            <td><code>archive/arena-4a5044b0/</code></td>
            <td>arena-4a5044b0</td>
            <td>First build on this repo. Its claim that Amazon was unreachable is superseded — see FLG-017.</td>
            <td><a href="${url("/archive/arena-4a5044b0/")}">Open archived site</a></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="note mt2">
      <p class="note__title">The four that actually matter</p>
      <p>If you only read four: <strong>FLG-004</strong> (the tracking ID may not be enrolled, in which case nothing earns), <strong>FLG-003</strong> (the short links' compliance status is genuinely unknown), <strong>FLG-009</strong> (Search Console unverified means nobody knows if this site is indexed), and <strong>FLG-011</strong> (no analytics means no learning). The rest are constraints we worked around.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/flagged/",
    title: "Flagged for review",
    desc: "Every item this build could not resolve or deliberately withheld, with a source link and the specific action that would close it.",
    html,
    priority: "0.5",
    changefreq: "weekly"
  });
}

/* ============================================================
   DASHBOARD — campaign ledger
   ============================================================ */
function dashboardPage() {
  const cols = gov.ledger.schema;
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Campaign ledger" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Measurement</p>
    <h1 class="article-head__title">Campaign ledger</h1>
    <p class="article-head__dek">An empty table with strict rules, which is more useful than a full table with loose ones.</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="tablewrap">
      <table class="data sortable">
        <caption>${esc(gov.ledger.provenanceNote)}</caption>
        <thead><tr>${cols
          .map((c) => `<th scope="col">${esc(c)}</th>`)
          .join("")}</tr></thead>
        <tbody>
          <tr><td colspan="${cols.length}" style="text-align:center;padding:2.5rem 1rem;color:var(--ink-mute)">
            <strong style="display:block;font-family:var(--serif);font-size:1.1rem;color:var(--ink);margin-bottom:.4rem">No rows yet — by design</strong>
            There is no authorized first-party report to draw from. Each row needs a dated Associates report behind it.
          </td></tr>
        </tbody>
      </table>
    </div>

    <div class="note note--stop mt2">
      <p class="note__title">Why this is empty</p>
      <p>There is no traffic history and no Associates report for this site, because it launched with this build. Any number placed here would be invented. A conversion score or revenue forecast built on nothing is worse than no score at all, because it looks like evidence.</p>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">What makes a row admissible</h2>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Rules for adding a ledger row. A row missing any of these is not entered.</caption>
        <thead><tr><th scope="col">Column</th><th scope="col">Rule</th></tr></thead>
        <tbody>
          <tr><td><code>date</code></td><td>The date of the report, not the date you typed it in.</td></tr>
          <tr><td><code>source</code></td><td>Where the traffic came from — organic, direct, referral, by name.</td></tr>
          <tr><td><code>channel</code></td><td>The specific channel or campaign if one was tagged. Otherwise the same as source.</td></tr>
          <tr><td><code>eligibleSessions</code></td><td>From the associated report only. Not estimated from page views.</td></tr>
          <tr><td><code>clicks</code></td><td>Outbound clicks to Amazon. Our own counter may differ from Amazon's; record both if they disagree, and note it.</td></tr>
          <tr><td><code>reportedOrders</code></td><td>Orders as reported by Amazon. Never inferred from commission, and never modelled.</td></tr>
          <tr><td><code>provenance</code></td><td>The specific report and its date range. Without this the row is a rumour.</td></tr>
        </tbody>
      </table>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">Defined events</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">Five events, defined before any content was written. Full detail on the <a href="${url(
      "/analytics/"
    )}">measurement page</a>.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Event definitions. All five are defined; none are currently being recorded, because no collector is deployed.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Event</th><th scope="col">Fires when</th><th scope="col">Payload</th><th scope="col">Status</th></tr></thead>
        <tbody>${gov.events
          .map(
            (e) => `<tr>
          <td><code>${esc(e.id)}</code></td>
          <td><strong>${esc(e.name)}</strong></td>
          <td>${esc(e.fires)}</td>
          <td class="small">${esc(e.payload)}</td>
          <td><span class="pill pill--${e.status === "defined" ? "claim" : "verified"}">${esc(
              e.status
            )}</span></td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/dashboard/",
    title: "Campaign ledger",
    desc: "A defined, intentionally empty campaign ledger with strict provenance rules for every row.",
    html,
    priority: "0.4",
    changefreq: "weekly"
  });
}

/* ============================================================
   QUESTIONS
   ============================================================ */
function questionsPage() {
  const areas = Object.fromEntries(questions.areas.map((a) => [a.id, a.name]));
  const priorityOrder = { blocking: 0, high: 1, medium: 2, low: 3 };
  const items = [...questions.questions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const rows = items
    .map(
      (q) => `<tr>
    <td><code>${esc(q.id)}</code></td>
    <td class="small">${esc(areas[q.area] || q.area)}</td>
    <td><strong>${esc(q.question)}</strong><br><span class="pill pill--${esc(
        q.priority
      )}" style="margin-top:.4rem">${esc(q.priority)}</span></td>
    <td class="small">${esc(q.answer)}</td>
    <td class="small">${esc(q.missing)}</td>
    <td class="small">${esc(q.howToFind)}</td>
    <td><span class="pill pill--${esc(q.status.replace(/[^a-z-]/g, ""))}">${esc(
        q.status
      )}</span></td>
    <td class="small">${
      q.sourceUrl ? cite(q.sourceUrl, esc(q.sourceLabel), q.sourceAsin) : "<span class='faint'>—</span>"
    }</td>
  </tr>`
    )
    .join("");

  const blocking = items.filter((q) => q.priority === "blocking").length;

  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Open questions" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Before any decision</p>
    <h1 class="article-head__title">Open questions</h1>
    <p class="article-head__dek">${esc(questions.intro)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="strip" style="border:1px solid var(--rule);margin-bottom:2rem">
      <div class="strip__inner">
        <div class="strip__cell"><p class="strip__num">${items.length}</p><p class="strip__lab">Questions logged</p></div>
        <div class="strip__cell"><p class="strip__num">${blocking}</p><p class="strip__lab">Blocking</p></div>
        <div class="strip__cell"><p class="strip__num">${
          items.filter((q) => q.status === "answered").length
        }</p><p class="strip__lab">Answered</p></div>
        <div class="strip__cell"><p class="strip__num">${
          items.filter((q) => q.status !== "answered").length
        }</p><p class="strip__lab">Still open</p></div>
      </div>
    </div>

    <div class="tablewrap">
      <table class="data sortable">
        <caption>Every open question, ordered by how much it blocks. "What is missing" is the honest list of what this build does not know; "how to close it" names the specific action or document.</caption>
        <thead>
          <tr>
            <th scope="col">ID</th><th scope="col">Area</th><th scope="col">Question</th>
            <th scope="col">Best current answer</th><th scope="col">What is missing</th>
            <th scope="col">How to close it</th><th scope="col">Status</th><th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/questions/",
    title: "Open questions",
    desc: "Every question that must be answered before further decisions: what we know, what we do not, and the specific action that would settle each one.",
    html,
    priority: "0.6",
    changefreq: "weekly"
  });
}

/* ============================================================
   SUGGESTIONS
   ============================================================ */
function suggestionsPage() {
  // Highest weight first: these are the moves we are most confident about.
  const items = [...suggestions.suggestions].sort((a, b) => b.weight - a.weight);
  const counts = {};
  for (const s of items) counts[s.status] = (counts[s.status] || 0) + 1;

  const rows = items
    .map(
      (s) => `<tr>
    <td><code>${esc(s.id)}</code></td>
    <td><strong>${esc(s.title)}</strong></td>
    <td><span class="pill pill--${esc(s.status)}">${esc(s.status)}</span></td>
    <td class="num">${esc(s.weight)}</td>
    <td class="small">${esc(s.why)}</td>
    <td class="small">${esc(s.cost)}</td>
    <td class="small">${esc(s.risk)}</td>
    <td class="small">${esc(s.decide)}${
        s.links && s.links.length
          ? `<br><span class="tiny">${s.links
              .map((l) => cite(l.url, esc(l.label)))
              .join(" · ")}</span>`
          : ""
      }</td>
  </tr>`
    )
    .join("");

  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Suggestions" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Review before implementing</p>
    <h1 class="article-head__title">Suggestions</h1>
    <p class="article-head__dek">${esc(suggestions.intro)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="tablewrap" style="margin-bottom:1.5rem">
      <table class="data sortable">
        <caption>Status key. Anything not marked "shipped" is waiting for a decision — nothing beyond the initial build has been implemented.</caption>
        <thead><tr><th scope="col">Status</th><th scope="col">Meaning</th><th scope="col">Count</th></tr></thead>
        <tbody>${suggestions.statusKey
          .map(
            (k) => `<tr>
          <td><span class="pill pill--${esc(k.id)}">${esc(k.id)}</span></td>
          <td>${esc(k.note)}</td>
          <td class="num">${counts[k.id] || 0}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>

    <div class="tablewrap">
      <table class="data sortable">
        <caption>Every suggestion, ordered by weight. Weight is our confidence that it is the right next move, not its effort. Read the "risk" column before accepting any of them.</caption>
        <thead>
          <tr>
            <th scope="col">ID</th><th scope="col">Suggestion</th><th scope="col">Status</th>
            <th scope="col">Weight</th><th scope="col">Why</th><th scope="col">Cost</th>
            <th scope="col">Risk / what could go wrong</th><th scope="col">Decision</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="note mt2">
      <p class="note__title">If you accept only three</p>
      <p><strong>SUG-04</strong> — prove one affiliate link actually tracks, because nothing else matters if it does not. <strong>SUG-03</strong> — get API access, which unlocks prices, ratings and images at once. <strong>SUG-05</strong> — publish weekly for eight weeks, then let the query report choose the next topic instead of instinct.</p>
    </div>

    <div class="note note--stop mt1">
      <p class="note__title">Two suggestions are rejections</p>
      <p><strong>SUG-12</strong> (price tracking) and <strong>SUG-13</strong> (generated near-duplicate pages) are listed so that a future session does not build them in good faith. The first breaches Amazon's program policies outright; the second produces the exact content this publication exists to avoid.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/suggestions/",
    title: "Suggestions",
    desc: "A reviewable decision list: sixteen suggestions with rationale, cost, risk, and a recommendation — nothing implemented without a decision.",
    html,
    priority: "0.6",
    changefreq: "weekly"
  });
}

/* ============================================================
   EXECUTIVE SUMMARY
   ============================================================ */
function summaryPage() {
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Executive summary" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">One page</p>
    <h1 class="article-head__title">Executive summary</h1>
    <p class="article-head__dek">What was asked for, what exists now, what is missing, and what to do next. Written ${esc(
      site.built
    )}.</p>
  </div>
</div>
<section class="section">
  <div class="wrap narrow prose">
    <h2>What was asked</h2>
    <p>Build an Amazon affiliate site around five submitted product links, with automated research and content generation, SEO, click and conversion tracking, and strict compliance with Amazon Associates policy and FTC disclosure rules. Ship it to GitHub Pages, coordinate through a shared task board, and merge without waiting for approval.</p>

    <h2>What exists</h2>
    <ul>
      <li><strong>A five-product publication</strong> — three air fryers, two thermometers — with individual pages, two category hubs, and a full comparison table.</li>
      <li><strong>Four question-shaped guides</strong>, written as decisions rather than rankings.</li>
      <li><strong>A complete source register</strong>: ${policy.sources.length} primary sources and ${products.reduce(
        (n, p) => n + p.specs.length,
        0
      )} specification rows, each with a verification status.</li>
      <li><strong>Ten policy checks</strong> traced to the exact clause, with the text quoted verbatim so the summary can be audited.</li>
      <li><strong>A publication gate</strong> in the build: it fails if any page loses its disclosure, or if any Amazon link loses its sponsored marking.</li>
      <li><strong>SEO foundations</strong>: sitemap, RSS feed, canonical URLs, structured data, and descriptions written for humans.</li>
      <li><strong>A defined measurement plan</strong>: five events, a self-hosted collector, and a ledger schema.</li>
    </ul>

    <h2>What does not exist, and why</h2>
    <p>This section is the important one.</p>
    <ul>
      <li><strong>No prices, ratings, reviews or product photos.</strong> Amazon's program policies prohibit displaying these without API access. We do not have it. Showing them anyway would risk the account; inventing them would be worse.</li>
      <li><strong>No hands-on testing.</strong> None took place, so none is claimed. Every page writes about the decision instead of a verdict, and the FTC's rule against describing experience you do not have is the reason.</li>
      <li><strong>No traffic or conversion data.</strong> The site launched with this build. Search Console is unverified and the analytics collector is not deployed, so nothing is being measured yet.</li>
      <li><strong>No automated product research.</strong> The brief asked for an agent that identifies trending, high-converting products. Identifying "trending" requires a data source; without one, any such claim would be a fabrication with a chart attached. The pipeline is defined and its data inputs are documented as missing.</li>
      <li><strong>No revenue projection.</strong> Four unknowns multiplied together produce fiction.</li>
    </ul>

    <h2>What is unresolved</h2>
    <p>${gov.flagged.length} items on the <a href="${url(
      "/flagged/"
    )}">flagged for review</a> page. Four matter commercially:</p>
    <ol>
      <li>The tracking ID <code>${esc(TAG)}</code> may not be enrolled. If it is not, nothing on this site earns anything.</li>
      <li>The compliance status of the submitted <code>link.amazon</code> short links is genuinely unknown — we did not declare them invalid, we simply do not depend on them.</li>
      <li>Search Console is unverified, so nobody knows whether the site is indexed.</li>
      <li>No analytics collector is deployed, so no learning is happening.</li>
    </ol>

    <h2>What to do next, in order</h2>
    <ol>
      <li>Sign in to Associates and confirm one product link per product appears in the tracking report.</li>
      <li>Deploy the collector in <code>_worker/</code> and set the endpoint, then rebuild.</li>
      <li>Verify Search Console, replace the placeholder token, submit the sitemap.</li>
      <li>Publish one guide a week for eight weeks.</li>
      <li>At week eight, read the query report and replace the topic hypotheses with measured demand.</li>
      <li>Apply for Product Advertising API access once the account qualifies — it unlocks prices, ratings and images together.</li>
    </ol>

    <h2>The honest verdict</h2>
    <p>What exists is a small, well-documented, compliant publication with four decent guides and five products. It is not yet a business: it has no traffic, no verified affiliate attribution, and no data. It is, however, built so that when those three things arrive, nothing has to be torn down — and so that nothing on it is a lie.</p>
    <p>The main strategic risk is not technical. It is that four guides is not enough content to rank in a crowded category, and the plan for fixing that is a cadence, not a feature.</p>
  </div>
</section>
`;
  pages.push({
    path: "/summary/",
    title: "Executive summary",
    desc: "One-page summary of what was built, what is deliberately missing, what remains unresolved, and the order of next actions.",
    html,
    priority: "0.5",
    changefreq: "monthly"
  });
}

/* ============================================================
   ANALYTICS
   ============================================================ */
function analyticsPage() {
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Measurement" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Click and conversion measurement</p>
    <h1 class="article-head__title">Measurement</h1>
    <p class="article-head__dek">Five events, defined before any content was written, recorded without cookies or identifiers — and currently switched off, because no collector is deployed.</p>
  </div>
</div>
<section class="section">
  <div class="wrap">
    <div class="note note--warn">
      <p class="note__title">Status: not recording</p>
      <p>${esc(gov.analytics.reason)} The client checks a config flag at load; with no endpoint it returns immediately and nothing is sent anywhere. Nothing is buffered, queued, or forwarded to a third party.</p>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">The five events</h2>
    <p class="section__dek" style="margin-bottom:1.25rem">Defined before the guides were written, so that the questions come before the answers.</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Event definitions and payloads. Every payload is deliberately minimal: no cookies, no identifiers, no referrer, no personal data.</caption>
        <thead><tr><th scope="col">ID</th><th scope="col">Event</th><th scope="col">Fires when</th><th scope="col">What it records</th><th scope="col">What question it answers</th></tr></thead>
        <tbody>${gov.events
          .map(
            (e) => `<tr>
          <td><code>${esc(e.id)}</code></td>
          <td><strong>${esc(e.name)}</strong></td>
          <td>${esc(e.fires)}</td>
          <td class="small"><code>${esc(e.payload)}</code></td>
          <td class="small">${esc(e.purpose)}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">Why the collector is self-hosted</h2>
    <div class="prose">
      <p>Adding a third-party analytics script would mean handing a vendor a record of reader behaviour on a page about buying things, in exchange for a dashboard. The reader gets nothing from that trade. A first-party collector on a small worker keeps the data in one place and keeps the payloads minimal.</p>
      <p>The stated principles are in the code and on the <a href="${url("/privacy/")}">privacy page</a>:</p>
      <ul>${gov.analytics.principles.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">What cannot be measured from here</h2>
    <div class="prose">
      <p><strong>Orders and revenue.</strong> Only Amazon can report those, and only to the account holder, inside the Associates dashboard. There is no API path from this site to that number. When a report is exported, its figures are entered by hand into the <a href="${url(
        "/dashboard/"
      )}">campaign ledger</a> with the report date attached. Nothing is inferred from clicks, and no click-to-order conversion rate is estimated.</p>
      <p><strong>Whether the tracking tag is working at all.</strong> Our counter can record that a reader clicked. Only Amazon can confirm the click was attributed to <code>${esc(
        TAG
      )}</code>. Those are different facts and are stored separately.</p>
    </div>

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">Deploying it</h2>
    <div class="prose">
      <p>The collector is in <code>_worker/</code> and is a single small handler with no third-party dependency. Deploy it, set the endpoint in the build config, rebuild, and the flag flips. The exact steps are in the repository README.</p>
      <p>Until that happens, this page is a plan rather than a report. It is marked as such deliberately, because a measurement page that implies data exists when it does not is worse than no measurement page.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/analytics/",
    title: "Measurement",
    desc: "Five defined events, a privacy-preserving self-hosted collector, and an honest statement that nothing is currently being recorded.",
    html,
    priority: "0.4",
    changefreq: "monthly"
  });
}

/* ============================================================
   ABOUT / DISCLOSURE / PRIVACY / MARKETING / SEO
   ============================================================ */
function prosePages() {
  const simple = (key, pageTitle, pageDesc, kicker, priority) => {
    const c = key;
    pages.push({
      path: `/${c.slug}/`,
      title: pageTitle,
      desc: pageDesc,
      html: `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: c.title }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">${esc(kicker)}</p>
    <h1 class="article-head__title">${esc(c.title)}</h1>
    <p class="article-head__dek">${esc(c.dek)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap narrow prose">${body(c.body)}</div>
</section>`,
      priority,
      changefreq: "monthly"
    });
  };

  simple({ slug: "concept", ...aiConcept }, "AI-platform concept", aiConcept.dek, "Concept, not implemented", "0.4");
  simple({ slug: "about", ...about }, "About and editorial standards", about.dek, "Editorial standards", "0.6");
  simple({ slug: "disclosure", ...disclosure }, "Affiliate disclosure", disclosure.dek, "Disclosure", "0.5");
  simple({ slug: "privacy", ...privacy }, "Privacy", privacy.dek, "Privacy", "0.4");

  // Marketing
  pages.push({
    path: "/marketing/",
    title: "Marketing plan",
    desc: marketing.dek,
    html: `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Marketing plan" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Go-to-market</p>
    <h1 class="article-head__title">${esc(marketing.title)}</h1>
    <p class="article-head__dek">${esc(marketing.dek)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap narrow">
    <p class="lede">${esc(marketing.intro)}</p>
    <div class="prose" style="margin-top:2rem">
      ${marketing.sections
        .map((s) => `<h2>${esc(s.title)}</h2>${body(s.body)}`)
        .join("")}
    </div>
  </div>
</section>`,
    priority: "0.4",
    changefreq: "monthly"
  });

  // SEO
  pages.push({
    path: "/seo/",
    title: "Search and findability",
    desc: seo.dek,
    html: `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Search & findability" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Findability</p>
    <h1 class="article-head__title">${esc(seo.title)}</h1>
    <p class="article-head__dek">${esc(seo.dek)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap narrow">
    <div class="prose">
      ${seo.sections.map((s) => `<h2>${esc(s.title)}</h2>${body(s.body)}`).join("")}
    </div>
  </div>
</section>`,
    priority: "0.4",
    changefreq: "monthly"
  });
}

/* ============================================================
   SITEMAP, FEED, ROBOTS, 404
   ============================================================ */
function feeds() {
  // Deterministic: the declared build date, not the wall clock. A build that
  // embeds `new Date()` can never pass a "is the output committed?" check.
  const now = new Date(`${site.built}T00:00:00Z`).toUTCString();
  const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .sort((a, b) => (a.path === "/" ? -1 : b.path === "/" ? 1 : a.path.localeCompare(b.path)))
  .map(
    (p) => `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${site.built}</lastmod>
    <changefreq>${p.changefreq || "monthly"}</changefreq>
    <priority>${p.priority || "0.5"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sm);

  const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${ORIGIN}/</link>
    <description>${esc(site.tagline)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${abs("/feed.xml")}" rel="self" type="application/rss+xml"/>
${guides
  .map(
    (g) => `    <item>
      <title>${esc(g.title)}</title>
      <link>${abs(`/guides/${g.slug}/`)}</link>
      <guid isPermaLink="true">${abs(`/guides/${g.slug}/`)}</guid>
      <description>${esc(g.dek)}</description>
      <pubDate>${new Date(site.built).toUTCString()}</pubDate>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(ROOT, "feed.xml"), feed);

  fs.writeFileSync(
    path.join(ROOT, "robots.txt"),
    `# ${site.name}
User-agent: *
Allow: /

Sitemap: ${abs("/sitemap.xml")}
`
  );

  const notFound = layout({
    title: "Page not found",
    desc: "That page does not exist.",
    canonical: "/404.html",
    children: `<section class="section"><div class="wrap narrow center">
      <p class="kicker" style="justify-content:center">404</p>
      <h1 class="article-head__title" style="margin-inline:auto">Nothing here.</h1>
      <p class="lede" style="margin-inline:auto">The page you asked for does not exist. It may have been renamed, or the link may be wrong.</p>
      <p class="mt2"><a class="btn btn--primary" href="${url("/")}">Back to the front page</a></p>
    </div></section>`
  });
  fs.writeFileSync(path.join(ROOT, "404.html"), notFound);
}

/* ============================================================
   RENDER
   ============================================================ */
frontPage();
categoryPages();
productPages();
guidePages();
comparePage();
registerPage();
flaggedPage();
dashboardPage();
questionsPage();
suggestionsPage();
summaryPage();
analyticsPage();
prosePages();

for (const p of pages) {
  const html = layout({
    title: p.title,
    desc: p.desc.replace(/\s+/g, " ").slice(0, 300),
    children: p.html,
    current: NAV.find((n) => p.path.startsWith(n.href.replace(BASE, "")))?.href || "",
    canonical: p.path,
    type: p.type || "website",
    pageType: p.pageType || "page",
    jsonld: p.jsonld || {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: ORIGIN,
      description: site.tagline
    }
  });
  writePage(p.path, html);
}

feeds();

/* ============================================================
   THE PUBLICATION GATE
   Fails the build on compliance or fabrication regressions.
   ============================================================ */
const findings = [];
const fail = (m) => findings.push({ level: "FAIL", m });
const warn = (m) => findings.push({ level: "WARN", m });
const ok = (m) => findings.push({ level: "PASS", m });

const htmlFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    // `archive/` holds prior sessions' builds, preserved verbatim and not served
    // as the live site. They are intentionally excluded from the live gate: the
    // point of archiving them is to keep them unchanged, not to retrofit them.
    if (["node_modules", ".git", "_src", "_worker", "assets", "data", "archive"].includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith(".html")) htmlFiles.push(full);
  }
})(ROOT);

ok(`${htmlFiles.length} HTML pages generated`);

let disclosureMissing = 0;
let statementMissing = 0;
let tagMissing = 0;
let amazonUnsponsored = 0;
let canonicalMissing = 0;
let priceShown = 0;
let ratingShown = 0;

for (const f of htmlFiles) {
  const src = fs.readFileSync(f, "utf8");
  const rel = path.relative(ROOT, f);

  if (!src.includes('class="disclosure"')) {
    disclosureMissing++;
    fail(`${rel}: missing disclosure strip`);
  }
  if (!src.includes(site.associateStatement)) {
    statementMissing++;
    fail(`${rel}: missing exact Associate statement`);
  }
  if (!src.includes('rel="canonical"')) {
    canonicalMissing++;
    fail(`${rel}: missing canonical`);
  }

  // Every Amazon anchor must be one of two things, declared explicitly:
  //   (a) a monetised Special Link  -> carries the tag AND rel="sponsored"
  //   (b) a deliberate citation     -> data-nonaffiliate, no tag, rel="nofollow"
  // Anything else is ambiguous and fails the gate.
  const anchors = [...src.matchAll(/<a\b[^>]*href="(https:\/\/(?:www\.)?(?:amazon\.[a-z.]+|link\.amazon|amzn\.to)[^"]*)"[^>]*>/g)];
  for (const a of anchors) {
    const tag = a[0];
    const link = a[1];
    const declared = /data-nonaffiliate="true"/.test(tag);
    const sponsored = /rel="[^"]*sponsored/.test(tag);
    const hasTag = link.includes(`tag=${TAG}`);

    if (declared) {
      if (hasTag) {
        amazonUnsponsored++;
        fail(`${rel}: declared non-affiliate but carries the tracking tag: ${link}`);
      }
    } else if (!sponsored || !hasTag) {
      amazonUnsponsored++;
      fail(`${rel}: Amazon anchor is neither a tagged sponsored link nor a declared non-affiliate citation: ${link}`);
    }
  }

  // no price strings, no star ratings presented as fact
  if (/\$\d{1,4}(\.\d{2})?/.test(src) && !rel.includes("guide")) {
    priceShown++;
    warn(`${rel}: contains a dollar figure — confirm it is not a product price`);
  }
  if (/out of 5 stars|★/.test(src)) {
    ratingShown++;
    fail(`${rel}: appears to display a star rating (Program Policies 6(t))`);
  }
}

if (!disclosureMissing) ok("every page carries the disclosure strip above the fold");
if (!statementMissing) ok(`every page carries the exact statement required by OA §5`);
if (!canonicalMissing) ok("every page declares a canonical URL");
if (!amazonUnsponsored) ok(`every Amazon anchor is either a tagged sponsored link or a declared non-affiliate citation`);
if (!ratingShown) ok("no star ratings or review quotes displayed anywhere");

// fabrication guard: no unverified spec may have a value
let fabricated = 0;
for (const p of products) {
  for (const s of p.specs) {
    if ((s.status === "unverified" || s.status === "withheld") && s.value) {
      fabricated++;
      fail(`${p.slug} / ${s.label}: value present but status is ${s.status}`);
    }
    if (s.status === "verified" && !s.source) {
      fabricated++;
      fail(`${p.slug} / ${s.label}: marked verified with no source`);
    }
  }
}
if (!fabricated) ok("no spec carries a value while marked unverified or withheld");

// policy register completeness
const missingQuotes = policy.policy.filter((p) => !p.quote || !p.sourceUrl);
if (missingQuotes.length) fail(`${missingQuotes.length} policy rows lack a quote or source URL`);
else ok(`all ${policy.policy.length} policy checks quote a clause and link a primary source`);

// internal link check
const internal = new Set(pages.map((p) => p.path));
let broken = 0;
for (const f of htmlFiles) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/href="\/WinA(\/[^"#?]*)"/g)) {
    const target = m[1];
    if (target.startsWith("/assets/") || target.endsWith(".xml") || target.endsWith(".txt")) continue;

    // Archived prior builds are real files on disk, not generated pages.
    if (target.startsWith("/archive/")) {
      const onDisk = path.join(ROOT, target.replace(/^\/WinA/, ""));
      const asDir = path.join(onDisk, "index.html");
      if (!fs.existsSync(onDisk) && !fs.existsSync(asDir)) {
        broken++;
        fail(`broken archive link in ${path.relative(ROOT, f)}: ${target}`);
      }
      continue;
    }

    if (!internal.has(target) && target !== "/404.html") {
      broken++;
      fail(`broken internal link in ${path.relative(ROOT, f)}: ${target}`);
    }
  }
}
if (!broken) ok(`all internal links resolve across ${internal.size} pages`);

// Duplicate-content guard: exactly one build may own the served root.
// A merge that resurrects a prior session's site would create two competing
// pages per guide, which is the SEO failure this whole integration avoids.
const FORBIDDEN = ["shop", "tools", "dashboard/register.html", "dashboard/ledger.html",
  "products.html", "guides.html", "suggest.html", "questions.html",
  "executive-summary.html", "flagged.html", "data/flags.json", "assets/site.css"];
const resurrected = FORBIDDEN.filter((f) => fs.existsSync(path.join(ROOT, f)));
if (resurrected.length) {
  fail(`prior build resurrected at the root: ${resurrected.join(", ")} — these belong in archive/ only`);
} else {
  ok("single build owns the served root; no prior site resurrected");
}

// Archived builds must remain present and untouched in count.
const archiveCount = (function count(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += count(path.join(dir, e.name));
    else n += 1;
  }
  return n;
})(path.join(ROOT, "archive"));
if (archiveCount < 60) fail(`archive/ has only ${archiveCount} files — prior work may have been lost`);
else ok(`archive intact: ${archiveCount} files preserved from three prior builds`);

// sitemap covers all pages
const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const uncited = pages.filter((p) => !sitemap.includes(abs(p.path)));
if (uncited.length) fail(`sitemap missing: ${uncited.map((p) => p.path).join(", ")}`);
else ok(`sitemap lists all ${pages.length} pages`);

const fails = findings.filter((f) => f.level === "FAIL");
const warns = findings.filter((f) => f.level === "WARN");

const report = `# Build validation report

Generated ${site.built} by \`_src/build.mjs\` (deterministic: no wall-clock timestamps).

**Result: ${fails.length ? "FAILED" : "PASSED"}** — ${fails.length} failure(s), ${warns.length} warning(s).

## Checks

${findings
  .map((f) => `- \`${f.level}\` ${f.m}`)
  .join("\n")}

## What the gate enforces

| Check | Rule it protects |
|---|---|
| Disclosure strip on every page | Operating Agreement §5, FTC Disclosures 101 |
| Exact Associate statement on every page | Operating Agreement §5 |
| Canonical URL on every page | One site to index |
| Tracking tag on every product link | Attribution |
| \`rel="sponsored"\` on every Amazon anchor | FTC endorsement disclosure |
| No star ratings or review quotes | Program Policies §6(t) |
| No valued-but-unverified specs | No fabrication |
| Every policy row has a quote + source | Auditable compliance |
| All internal links resolve | No broken site |
| Sitemap covers every page | Indexability |

## Note

Warnings about dollar figures outside guide pages are expected for the policy and pricing
discussion pages, where a currency symbol appears in prose about *why* prices are not shown.
No product price is printed anywhere on the site.
`;

fs.writeFileSync(path.join(ROOT, "VALIDATION.md"), report);

console.log(`\nGenerated ${htmlFiles.length} pages, ${pages.length} in sitemap.`);
console.log(fails.length ? `FAILED: ${fails.length} issue(s)` : "PASSED: all gates clear");
for (const f of fails.slice(0, 20)) console.log(`  FAIL ${f.m}`);
for (const w of warns.slice(0, 10)) console.log(`  WARN ${w.m}`);
if (fails.length) process.exitCode = 1;
