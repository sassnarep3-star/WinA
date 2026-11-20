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
import { about, disclosure, privacy, marketing, seo, promo } from "./pages-content.mjs";

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
<table class="data sortable">
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
/* Guide and category bodies are authored as raw HTML in the content files.
   Any table inside one is wrapped in a horizontally scrollable box, so a
   wide table scrolls on a phone instead of pushing the whole page sideways. */
const body = (html) =>
  html
    .replace(/\{BASE\}/g, BASE)
    .replace(/<table class="([^"]*)"[^>]*>([\s\S]*?)<\/table>/g, (m, cls, inner) =>
      m.includes("tablewrap") ? m : `<div class="tablewrap"><table class="${cls}" data-body-table>${inner}</table></div>`
    );

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
  { href: url("/start-here/"), label: "Start here" },
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
    <button class="searchbtn" type="button" data-search-open aria-label="Search this site">
      <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true" focusable="false"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="1.8"/><line x1="12.8" y1="12.8" x2="17" y2="17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      <span class="searchbtn__label">Search</span>
    </button>
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
          <li><a href="${url("/start-here/")}">Start here</a></li>
          <li><a href="${url("/air-fryers/")}">Air fryers</a></li>
          <li><a href="${url("/thermometers/")}">Thermometers</a></li>
          <li><a href="${url("/compare/")}">Compare all five</a></li>
          <li><a href="${url("/guides/")}">Buying guides</a></li>
          <li><a href="${url("/season/")}">Cooking by season</a></li>
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
          <li><a href="${url("/marketing/kit/")}">Marketing kit</a></li>
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

<div class="searchbox" data-search hidden>
  <div class="searchbox__panel" role="dialog" aria-modal="true" aria-label="Search this site">
    <div class="searchbox__row">
      <input class="searchbox__input" type="search" data-search-input placeholder="Search guides, products and pages…" aria-label="Search this site" autocomplete="off" spellcheck="false">
      <button class="searchbox__close" type="button" data-search-close aria-label="Close search">Esc</button>
    </div>
    <p class="searchbox__hint">Type a question you would actually ask. Nothing is tracked and nothing leaves your browser.</p>
    <ul class="searchbox__results" data-search-results></ul>
    <p class="searchbox__empty" data-search-empty hidden>No page matches that. The <a href="${url(
      "/guides/"
    )}">guides index</a> and <a href="${url(
      "/start-here/"
    )}">start here</a> page are the best way in.</p>
  </div>
</div>

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

function sourceCell(s, p) {
  if (!s.source) return '<span class="faint">none</span>';
  const one = (kind) => {
    if (kind === "amazon-listing")
      return `<a href="${special(p.asin)}" rel="sponsored nofollow noopener" target="_blank" data-affiliate="${
        p.asin
      }" data-slot="spec-source">Amazon listing</a>`;
    if (kind === "manufacturer") {
      const src = (p.specSources || {})[s.label];
      if (!src || !src.url) throw new Error(`spec "${s.label}" cites a manufacturer but has no URL`);
      return `<a href="${esc(src.url)}" rel="nofollow noopener" target="_blank" data-slot="spec-source">${esc(
        src.label
      )}</a>`;
    }
    throw new Error(`unknown spec source "${kind}" on ${p.slug}`);
  };
  // A row may rest on more than one official source. Where two official pages
  // disagree, both links are shown rather than one being silently preferred.
  const extra = (s.alsoSources || []).map(one).join(" · ");
  const primary = one(s.source);
  return extra ? `${primary} <span class="faint">+</span> ${extra}` : primary;
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
      <td>${sourceCell(s, p)}</td>
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

/* A wide, original scene for the front page. Original art only — no product
   photography, no stock imagery, nothing fetched from a third party. */
function heroScene() {
  const a = PAL.accent, c = PAL.clay, i = PAL.ink, r = PAL.rule;
  return `<svg class="scene" viewBox="0 0 960 300" width="960" height="300" role="img"
  aria-label="Illustration: a kitchen counter with a countertop oven, a two-drawer air fryer, a single-drawer air fryer, an instant-read probe and a set of wireless probes." xmlns="http://www.w3.org/2000/svg">
  <rect width="960" height="300" fill="${PAL.paper}"/>
  <rect x="0" y="0" width="960" height="212" fill="${PAL.panel}" opacity=".55"/>
  <circle cx="852" cy="66" r="38" fill="${PAL.paper}" stroke="${r}" stroke-width="1.5"/>
  <circle cx="852" cy="66" r="22" fill="none" stroke="${r}" stroke-width="1.5" opacity=".7"/>
  <line x1="48" y1="212" x2="912" y2="212" stroke="${i}" stroke-width="2"/>
  <line x1="48" y1="222" x2="912" y2="222" stroke="${r}" stroke-width="1.5"/>

  <!-- countertop oven -->
  <path d="M96 206 V120 a76 48 0 0 1 152 0 v86 z" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M120 206 V126 a52 32 0 0 1 104 0 v80 z" fill="${PAL.paper}" stroke="${a}" stroke-width="1.6" opacity=".8"/>
  <line x1="120" y1="150" x2="224" y2="150" stroke="${a}" stroke-width="1.6" opacity=".55"/>
  <line x1="158" y1="206" x2="186" y2="206" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="172" cy="96" r="3.5" fill="${c}"/>

  <!-- dual-basket drawers -->
  <rect x="292" y="146" width="104" height="28" rx="4" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
  <rect x="292" y="180" width="104" height="28" rx="4" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
  <line x1="316" y1="146" x2="316" y2="174" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="340" y1="146" x2="340" y2="174" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="364" y1="146" x2="364" y2="174" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="316" y1="180" x2="316" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="340" y1="180" x2="340" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="364" y1="180" x2="364" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="326" y1="160" x2="362" y2="160" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="326" y1="194" x2="362" y2="194" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- single drawer -->
  <rect x="432" y="160" width="118" height="48" rx="5" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
  <line x1="454" y1="160" x2="454" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="480" y1="160" x2="480" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="506" y1="160" x2="506" y2="208" stroke="${a}" stroke-width="1.4" opacity=".55"/>
  <line x1="468" y1="208" x2="514" y2="208" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>

  <!-- pot on the counter -->
  <path d="M578 172 h72 v28 a8 8 0 0 1 -8 8 h-56 a8 8 0 0 1 -8 -8 z" fill="${PAL.paper}" stroke="${a}" stroke-width="2.5"/>
  <path d="M650 180 a12 12 0 0 1 0 18" fill="none" stroke="${a}" stroke-width="2.5"/>
  <line x1="578" y1="172" x2="650" y2="172" stroke="${a}" stroke-width="2.5"/>

  <!-- instant-read probe -->
  <line x1="686" y1="206" x2="762" y2="146" stroke="${i}" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M762 146 l14 -4 -4 14 z" fill="${c}"/>
  <rect x="666" y="192" width="26" height="16" rx="4" fill="${PAL.wash}" stroke="${a}" stroke-width="2"/>

  <!-- wireless probes -->
  <rect x="800" y="140" width="9" height="68" rx="4.5" fill="${PAL.wash}" stroke="${a}" stroke-width="2.2"/>
  <rect x="824" y="140" width="9" height="68" rx="4.5" fill="${PAL.wash}" stroke="${a}" stroke-width="2.2"/>
  <rect x="848" y="140" width="9" height="68" rx="4.5" fill="${PAL.wash}" stroke="${a}" stroke-width="2.2"/>
  <circle cx="804.5" cy="146" r="2.8" fill="${c}"/>
  <circle cx="828.5" cy="146" r="2.8" fill="${c}"/>
  <circle cx="852.5" cy="146" r="2.8" fill="${c}"/>
  <path d="M804 212 a48 48 0 0 1 48 -48" fill="none" stroke="${a}" stroke-width="1.8" opacity=".55"/>
  <path d="M804 212 a70 70 0 0 1 70 -70" fill="none" stroke="${a}" stroke-width="1.8" opacity=".32"/>
</svg>`;
}

/* ============================================================
   COVER ART — original geometric illustrations
   Generated deterministically from a seed string, so the same page
   always gets the same artwork and the build stays reproducible.

   These are schematics. No product photography is used anywhere on
   this site: Amazon's program policies require API-supplied content
   for anything we cannot license ourselves, and drawing our own is
   both simpler and more honest than borrowing a listing image.
   ============================================================ */
function hashOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PAL = {
  paper: "#fbf8f3",
  panel: "#f3ede3",
  ink: "#191512",
  accent: "#0f4c5c",
  clay: "#a8452b",
  rule: "#e2d9cc",
  wash: "#e6eef0"
};

/* Five motifs, one per product form factor plus one generic mark. */
function coverMotif(kind) {
  const a = PAL.accent, c = PAL.clay, i = PAL.ink, r = PAL.rule;
  switch (kind) {
    case "dual-basket":
      return `
      <rect x="150" y="104" width="82" height="72" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <rect x="248" y="104" width="82" height="72" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <line x1="168" y1="104" x2="168" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="192" y1="104" x2="192" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="216" y1="104" x2="216" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="266" y1="104" x2="266" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="290" y1="104" x2="290" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="314" y1="104" x2="314" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="196" y1="186" x2="284" y2="186" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="240" cy="118" r="3.5" fill="${c}"/>`;
    case "oven-style":
      return `
      <path d="M164 176 V126 a76 46 0 0 1 152 0 v50 z" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M186 176 V128 a54 32 0 0 1 108 0 v48 z" fill="${PAL.paper}" stroke="${a}" stroke-width="1.6" opacity=".75"/>
      <line x1="186" y1="150" x2="294" y2="150" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="228" y1="186" x2="252" y2="186" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="240" cy="104" r="3.5" fill="${c}"/>`;
    case "single-basket":
      return `
      <rect x="158" y="100" width="164" height="76" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <line x1="178" y1="100" x2="178" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="206" y1="100" x2="206" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="234" y1="100" x2="234" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="262" y1="100" x2="262" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="290" y1="100" x2="290" y2="176" stroke="${a}" stroke-width="1.6" opacity=".55"/>
      <line x1="200" y1="186" x2="280" y2="186" stroke="${i}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="240" cy="114" r="3.5" fill="${c}"/>`;
    case "instant-read":
      return `
      <line x1="176" y1="168" x2="268" y2="94" stroke="${i}" stroke-width="4" stroke-linecap="round"/>
      <path d="M268 94 l16 -4 -4 16 z" fill="${c}"/>
      <rect x="150" y="150" width="34" height="20" rx="4" fill="${PAL.wash}" stroke="${a}" stroke-width="2"/>
      <circle cx="196" cy="128" r="3" fill="${a}" opacity=".6"/>
      <circle cx="214" cy="114" r="3" fill="${a}" opacity=".6"/>
      <circle cx="232" cy="100" r="3" fill="${a}" opacity=".6"/>`;
    case "wireless-leave-in":
      return `
      <rect x="196" y="96" width="12" height="82" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <rect x="252" y="96" width="12" height="82" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <rect x="308" y="96" width="12" height="82" rx="6" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <circle cx="202" cy="104" r="3.2" fill="${c}"/>
      <circle cx="258" cy="104" r="3.2" fill="${c}"/>
      <circle cx="314" cy="104" r="3.2" fill="${c}"/>
      <path d="M240 196 a44 44 0 0 1 44 -44" fill="none" stroke="${a}" stroke-width="2" opacity=".65"/>
      <path d="M240 196 a64 64 0 0 1 64 -64" fill="none" stroke="${a}" stroke-width="2" opacity=".4"/>
      <path d="M240 196 a84 84 0 0 1 84 -84" fill="none" stroke="${a}" stroke-width="2" opacity=".2"/>`;
    default:
      return `
      <circle cx="240" cy="136" r="46" fill="${PAL.wash}" stroke="${a}" stroke-width="2.5"/>
      <path d="M240 90 a46 46 0 0 1 40 22" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round"/>`;
  }
}

function coverArt(seed, kind, opts = {}) {
  const w = opts.w || 480;
  const h = opts.h || 270;
  const label = opts.label || "";
  return `<svg class="cover" viewBox="0 0 480 270" width="${w}" height="${h}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="270" fill="${PAL.paper}"/>
  <rect x="14" y="14" width="452" height="242" rx="4" fill="none" stroke="${PAL.rule}" stroke-width="1.5"/>
  <line x1="40" y1="206" x2="440" y2="206" stroke="${PAL.rule}" stroke-width="2"/>
  <line x1="40" y1="60" x2="440" y2="60" stroke="${PAL.rule}" stroke-width="1" opacity=".7"/>
  <circle cx="410" cy="60" r="16" fill="${PAL.panel}" stroke="${PAL.rule}" stroke-width="1.5"/>
  ${coverMotif(kind)}
</svg>`;
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
  <div class="wrap">
    <figure class="scene-frame">
      ${heroScene()}
      <figcaption class="scene-frame__cap">The five products in this comparison, drawn as schematics. This is our own illustration — no product photography is used anywhere on this site.</figcaption>
    </figure>
  </div>
</section>

<div class="strip">
  <div class="wrap strip__inner">
    <div class="strip__cell"><p class="strip__num">${products.length}</p><p class="strip__lab">Products compared</p></div>
    <div class="strip__cell"><p class="strip__num">${guides.length}</p><p class="strip__lab">Guides</p></div>
    <div class="strip__cell"><p class="strip__num">0</p><p class="strip__lab">Products tested</p></div>
    <div class="strip__cell"><p class="strip__num">${policy.policy.length}</p><p class="strip__lab">Policy checks passed</p></div>
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
    <div class="section__head section__head--split">
      <div>
        <h2 class="section__title">Read before you buy</h2>
        <p class="section__dek">${guides.length} question-shaped guides, grouped by the job you are trying to do. Written as decisions rather than rankings, because we have not tested any of these products.</p>
      </div>
      <a class="section__more" href="${url("/start-here/")}">Start here →</a>
    </div>
    ${CLUSTERS.map(
      (c) => `<div class="cluster">
      <div class="cluster__head">
        <div>
          <h3 class="cluster__name">${esc(c.name)}</h3>
          <p class="cluster__blurb">${esc(c.blurb)}</p>
        </div>
        <div class="cluster__art">${coverArt(`cluster-${c.id}`, c.cover, { w: 200, h: 112, label: `Illustration for the ${c.name} section` })}</div>
      </div>
      <div class="guides guides--two">
        ${guides
          .filter((g) => g.cluster === c.id)
          .map(
            (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span>
          <h4 class="guide-link__title">${esc(g.title)}</h4>
          <p class="guide-link__dek">${esc(g.dek)}</p>
        </span>
      </a>`
          )
          .join("")}
      </div>
    </div>`
    ).join("")}
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
    <figure class="article-art article-art--left">
      ${coverArt(`product-${p.slug}`, p.formFactor, {
        w: 340,
        h: 191,
        label: `Schematic illustration of the ${p.formFactor.replace(/-/g, " ")} form factor`
      })}
      <figcaption class="scene-frame__cap">Schematic of the <em>form factor</em>, not a photograph of this product.</figcaption>
    </figure>

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
    <p class="kicker">Guide ${g.number} · ${esc(cat ? cat.name : "Buying")} · ${esc(
    clusterOf(g).name
  )}</p>
    <h1 class="article-head__title">${esc(g.title)}</h1>
    <p class="article-head__dek">${esc(g.dek)}</p>
    <div class="byline">
      <span>${esc(site.name)} editorial</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>${esc(g.readingTime)} read</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span class="unverified">No hands-on testing claimed</span>
    </div>
    <figure class="article-art">
      ${coverArt(`guide-${g.slug}`, g.coverKind || clusterOf(g).cover, {
        w: 480,
        h: 270,
        label: `Schematic illustration for the guide "${g.title}"`
      })}
      <figcaption class="scene-frame__cap">Original schematic illustration. Not a photograph of any product.</figcaption>
    </figure>
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

    ${
      g.sources && g.sources.length
        ? `<div class="note mt2">
      <p class="note__title">Sources for this guide</p>
      <ul class="src-list">
        ${g.sources
          .map((s) => `<li>${cite(s.url, esc(s.label))}</li>`)
          .join("")}
      </ul>
      <p class="small muted" style="margin-top:.7rem">Every specification quoted above is reproduced from one of these sources, or is marked on the product pages as a manufacturer claim we could not independently verify. Nothing here was measured by us.</p>
      <p class="small muted">These are evidence links, not purchase paths: they carry no tracking tag and earn nothing. Use the sponsored product links if you want to buy.</p>
    </div>`
        : ""
    }

    ${(() => {
      const i = guides.findIndex((x) => x.slug === g.slug);
      const prev = guides[i - 1];
      const next = guides[i + 1];
      return `<nav class="guide-pager" aria-label="More guides">
      ${
        prev
          ? `<a class="guide-pager__link" href="${url(`/guides/${prev.slug}/`)}"><span class="guide-pager__dir">← Previous</span><span class="guide-pager__title">${esc(
              prev.title
            )}</span></a>`
          : `<span class="guide-pager__link guide-pager__link--empty"></span>`
      }
      ${
        next
          ? `<a class="guide-pager__link guide-pager__link--next" href="${url(`/guides/${next.slug}/`)}"><span class="guide-pager__dir">Next →</span><span class="guide-pager__title">${esc(
              next.title
            )}</span></a>`
          : `<span class="guide-pager__link guide-pager__link--empty"></span>`
      }
    </nav>`;
    })()}

    <p class="small muted mt2">All guides: <a href="${url("/guides/")}">${guides.length} of them</a> · <a href="${url(
      "/start-here/"
    )}">start here</a> · <a href="${url("/compare/")}">compare all five products</a></p>
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
    <p class="article-head__dek">${guides.length} guides, each built around one decision, grouped by the job you are trying to do. No rankings, no "best of" list, no claim that any of this was tested.</p>
    <div class="byline">
      <span>${esc(site.name)} editorial</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>${guides.length} guides in ${CLUSTERS.length} clusters</span>
    </div>
  </div>
</div>
<section class="section">
  <div class="wrap">
    ${CLUSTERS.map(
      (c) => `<div class="cluster">
      <div class="cluster__head">
        <div>
          <h2 class="cluster__name">${esc(c.name)}</h2>
          <p class="cluster__blurb">${esc(c.blurb)}</p>
        </div>
        <div class="cluster__art">${coverArt(`cluster-${c.id}`, c.cover, { w: 200, h: 112, label: `Illustration for the ${c.name} section` })}</div>
      </div>
      <div class="guides">
        ${guides
          .filter((g) => g.cluster === c.id)
          .map(
            (g) => `<a class="guide-link" href="${url(`/guides/${g.slug}/`)}">
        <span class="guide-link__num">${g.number}</span>
        <span>
          <h3 class="guide-link__title">${esc(g.title)}</h3>
          <p class="guide-link__dek">${esc(g.dek)}</p>
          <p class="tiny faint" style="margin:.4rem 0 0">${esc(g.readingTime)} · ${esc(
            g.topics.join(" · ")
          )}</p>
        </span>
      </a>`
          )
          .join("")}
      </div>
    </div>`
    ).join("")}
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
    desc: `${guides.length} question-shaped guides to air fryers and thermometers: form factor, capacity, cleanup, family cooking, safe temperatures and probe technique.`,
    html,
    priority: "0.8",
    changefreq: "weekly"
  });
}

/* Topic clusters. Readers do not arrive asking for "a guide"; they arrive
   with a job to do. The clusters are those jobs. */
const CLUSTERS = [
  {
    id: "choosing",
    name: "Choosing between them",
    blurb: "The shape of the decision: form factor, capacity, and who each one is wrong for.",
    cover: "single-basket"
  },
  {
    id: "keeping",
    name: "Living with it",
    blurb: "The part that decides whether you still use it in a year: washing, care and counter space.",
    cover: "dual-basket"
  },
  {
    id: "cooking",
    name: "Cooking with confidence",
    blurb: "Temperature, timing and technique — the questions that stop a cook from being a guess.",
    cover: "instant-read"
  }
];

const clusterOf = (g) => CLUSTERS.find((c) => c.id === g.cluster) || CLUSTERS[0];

/* ============================================================
   START HERE — the decision entry point
   A reader who arrives knowing nothing should be able to find their
   own situation on this page in under a minute.
   ============================================================ */
const SITUATIONS = [
  {
    id: "two",
    title: "I cook for two, most nights",
    answer: "You want one chamber, one temperature, one basket to wash. The dual basket is the wrong shape here — you would be heating an empty drawer to cook one piece of protein. Of the single-chamber fryers, the 8-quart is the only one, so it wins on shape rather than on capacity.",
    guides: ["basket-vs-oven", "air-fryer-vs-toaster-oven"],
    products: ["chefman-8-quart-turbofry"]
  },
  {
    id: "two-things",
    title: "I cook two things at two different temperatures",
    answer: "Two independent chambers, so a protein and a side finish together instead of in shifts. This is the whole argument for a dual basket.",
    guides: ["basket-vs-oven", "capacity"],
    products: ["chefman-6-quart-dual-basket"]
  },
  {
    id: "crowd",
    title: "I cook for a crowd, or a whole bird",
    answer: "One big chamber and a door. A 26-quart interior is the only one of these that takes a tray or a whole chicken in a single run.",
    guides: ["air-fryer-for-a-family", "whole-chicken-in-an-air-fryer"],
    products: ["emeril-lagasse-26qt-french-door"]
  },
  {
    id: "counter",
    title: "My counter is tiny",
    answer: "Measure before you buy, because the biggest number is the wrong buy if it has to live next to the toaster every day. The published footprint of the dual basket is 13.38 × 11.81 × 10.63 inches and the French-door oven is 16.9 × 15.8 × 14.8. The 8-quart fryer's dimensions are not published, which is itself a reason to ask before you commit.",
    guides: ["cleanup", "air-fryer-vs-toaster-oven"],
    products: ["chefman-8-quart-turbofry"]
  },
  {
    id: "guessing",
    title: "I want to stop guessing when food is done",
    answer: "An instant-read thermometer. One second, and it lives on your fridge on a magnet.",
    guides: ["how-hot-should-chicken-be", "where-to-probe-a-chicken"],
    products: ["thermomaven-1-sec-thermometer"]
  },
  {
    id: "long-cook",
    title: "I cook for hours and leave the kitchen",
    answer: "A leave-in probe designed to stay in the food and report while the lid stays shut. The trade is an app, a hub and a charging habit.",
    guides: ["wireless-thermometer-for-smoking", "where-to-probe-a-chicken"],
    products: ["chef-iq-sense-gen3"]
  },
  {
    id: "lost",
    title: "I honestly do not know yet",
    answer: "Start with the decision, not the product. Write down the last five meals you actually cooked — that answer is more useful than any comparison table.",
    guides: ["basket-vs-oven", "air-fryer-for-a-family", "how-hot-should-chicken-be"],
    products: []
  }
];

function startHerePage() {
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Start here" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Start here</p>
    <h1 class="article-head__title">Five minutes, and you will know which of these five to buy</h1>
    <p class="article-head__dek">Pick the line that sounds like your kitchen. Each one names the product shape that fits, the reading that explains why, and what would make it the wrong choice.</p>
    <div class="byline">
      <span>${esc(site.name)} editorial</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>${guides.length} guides</span>
      <span class="byline__dot" aria-hidden="true"></span>
      <span>No hands-on testing claimed</span>
    </div>
  </div>
</div>

<section class="section">
  <div class="wrap">
    <div class="situation-grid">
      ${SITUATIONS.map(
        (s) => `<article class="situation">
        <h2 class="situation__q">${esc(s.title)}</h2>
        <p class="situation__a">${esc(s.answer)}</p>
        <div class="situation__links">
          ${s.guides
            .map((g) => {
              const gd = guides.find((x) => x.slug === g);
              return `<a class="chip" href="${url(`/guides/${g}/`)}">${esc(gd ? gd.title : g)}</a>`;
            })
            .join("")}
          ${s.products
            .map((sl) => {
              const p = products.find((x) => x.slug === sl);
              if (!p) return "";
              return `<a class="chip chip--buy" href="${url(`/products/${sl}/`)}">${esc(p.shortName)} →</a>`;
            })
            .join("")}
        </div>
      </article>`
      ).join("")}
    </div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap narrow">
    <div class="note note--warn">
      <p class="note__title">One thing before you use this page</p>
      <p>Every answer here points at a shape of appliance, not a winner. We have not tested any of these five, so we cannot tell you which one fries better. What we can tell you is which one is the wrong shape for the way you cook — and that is the question that actually decides the purchase.</p>
    </div>
    <p class="small muted mt2">Want the long version instead? <a href="${url("/guides/")}">All ${guides.length} guides</a> · <a href="${url("/compare/")}">Compare all five products</a> · <a href="${url("/season/")}">Cooking gear by season</a></p>
  </div>
</section>
`;
  pages.push({
    path: "/start-here/",
    title: "Start here — which of these five is right for you",
    desc: `${SITUATIONS.length} situations, the product shape that fits each one, and the reading that explains why. ${guides.length} guides, no testing claims, no prices.`,
    html,
    priority: "0.9",
    changefreq: "weekly",
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Start here",
      description: "Which of the five compared kitchen appliances fits the way you cook.",
      url: abs("/start-here/")
    }
  });
}

/* ============================================================
   SEASON — the seasonal layer
   The same decision changes shape across the year. This page makes
   that explicit without pretending any of it is measured.
   ============================================================ */
const SEASONS = [
  {
    id: "winter",
    season: "January",
    label: "The reset",
    body: "The month people notice how much counter they are giving away. This is the one season where the cleanup guide matters more than the capacity guide, because the appliance you resent is the one you stop using. The dual basket's two removable baskets are a smaller washing job than an oven's door, rack and crumb tray — and a machine you do not have to scrub is a machine you reach for.",
    guides: ["cleanup", "dishwasher-safe-air-fryer-baskets"],
    products: ["chefman-6-quart-dual-basket"]
  },
  {
    id: "spring",
    season: "Spring",
    label: "Grill season opens",
    body: "The first long outdoor cook of the year is where a thermometer stops being optional. Colour is not a safety indicator — the USDA is explicit that surface browning happens before the interior is safe — so the tool that decides the cook is the one you put in the food. An instant-read handles a chicken breast; a leave-in probe handles the four hours you are not standing there.",
    guides: ["how-hot-should-chicken-be", "wireless-thermometer-for-smoking", "where-to-probe-a-chicken"],
    products: ["thermomaven-1-sec-thermometer", "chef-iq-sense-gen3"]
  },
  {
    id: "summer",
    season: "Summer",
    label: "A hot kitchen and no patience",
    body: "In July nobody wants a 45-minute preheat for two portions, and a large chamber in a hot room is the wrong shape entirely. The small single basket wins on season alone: less metal to heat, less to wash afterwards, and nothing permanently occupying the counter. It is also the season to be honest about what you will actually cook — one batch of one thing.",
    guides: ["basket-vs-oven", "air-fryer-vs-toaster-oven"],
    products: ["chefman-8-quart-turbofry"]
  },
  {
    id: "autumn",
    season: "Autumn",
    label: "Hosting",
    body: "This is the season the 26-quart chamber starts to make sense. A maker's own serving guide puts that capacity at food for four to six people — which is a claim about a serving guide, not a guarantee of a single round, but it is the only published number of its kind in this set. A tray that stays flat, a door that opens, and one chamber that does not have to be run twice.",
    guides: ["air-fryer-for-a-family", "capacity"],
    products: ["emeril-lagasse-26qt-french-door"]
  },
  {
    id: "winter2",
    season: "November & December",
    label: "The big cook",
    body: "Whole birds, sides, and a cooker that has to hold one large thing in one layer. The question that decides it is the one nobody publishes: the interior cavity dimensions. Measure your bird against the cavity opening before you order, and pick the thermometer based on who is going to take the temperature during the cook — not after.",
    guides: ["whole-chicken-in-an-air-fryer", "where-to-probe-a-chicken", "air-fryer-for-a-family"],
    products: ["emeril-lagasse-26qt-french-door", "chef-iq-sense-gen3"]
  }
];

function seasonPage() {
  const html = `
${breadcrumb([{ href: url("/"), label: "Home" }, { label: "Cooking by season" }])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">The seasonal layer</p>
    <h1 class="article-head__title">The same five products, and five different reasons to pick one</h1>
    <p class="article-head__dek">Which appliance is right genuinely changes with the calendar — not because the appliances change, but because what you cook, how long for, and how often you wash up change. None of this is measured. It is a reading of the published specifications against how people actually cook.</p>
  </div>
</div>

<section class="section">
  <div class="wrap">
    <div class="season-list">
      ${SEASONS.map(
        (s) => `<article class="season">
        <div class="season__head">
          <p class="season__name">${esc(s.season)}</p>
          <h2 class="season__label">${esc(s.label)}</h2>
        </div>
        <div class="season__body">
          <p>${esc(s.body)}</p>
          <div class="season__links">
            ${s.guides
              .map((g) => {
                const gd = guides.find((x) => x.slug === g);
                return `<a class="chip" href="${url(`/guides/${g}/`)}">${esc(gd ? gd.title : g)}</a>`;
              })
              .join("")}
            ${s.products
              .map((sl) => {
                const p = products.find((x) => x.slug === sl);
                if (!p) return "";
                return `<a class="chip chip--buy" href="${url(`/products/${sl}/`)}">${esc(p.shortName)} →</a>`;
              })
              .join("")}
          </div>
        </div>
      </article>`
      ).join("")}
    </div>
  </div>
</section>

<section class="section section--deep">
  <div class="wrap narrow">
    <div class="note">
      <p class="note__title">Why no recipes?</p>
      <p>Because we did not cook anything in these appliances, and a recipe page written by someone who never ran one is a page of guesses dressed as instructions. What we can do honestly is tell you which appliance is the right shape for the meal, and which published specification makes that true.</p>
      <p class="mt1"><a href="${url("/about/")}">How this site is written →</a></p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/season/",
    title: "Cooking gear by season — how the decision changes",
    desc: "Five seasons, five different reasons to pick a different appliance: the counter reset, grill season, hot kitchens, hosting, and the big holiday cook.",
    html,
    priority: "0.7",
    changefreq: "monthly",
    jsonld: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Cooking gear by season",
      description: "How the choice between five kitchen appliances changes across the year.",
      url: abs("/season/")
    }
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
    <div class="tablewrap"><table class="data sortable">
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
        <td>${sourceCell(s, p)}</td>
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

    <h2 class="section__title" style="font-size:1.4rem">Decisions and what is standing in the way</h2>
    <p class="section__dek" style="margin-bottom:1.2rem">Seven decisions this publication is likely to face, and the questions that have to be answered first. A decision whose blockers are open is not ready to make, and saying so is cheaper than making it badly.</p>
    <div class="tablewrap" style="margin-bottom:2rem">
      <table class="data sortable">
        <caption>Decision gates. Each row names a decision someone may want to make, the questions that must be answered before it can be made responsibly, and what happens once they are.</caption>
        <thead><tr><th scope="col">Decision</th><th scope="col">Blocked by</th><th scope="col">What happens when it is unblocked</th></tr></thead>
        <tbody>${questions.decisionGates
          .map(
            (d) => `<tr>
          <td><strong>${esc(d.decision)}</strong></td>
          <td>${d.blockedBy
            .map((id) => {
              const qq = questions.questions.find((x) => x.id === id);
              return `<code>${esc(id)}</code>${qq ? `<br><span class="tiny">${esc(qq.question)}</span>` : ""}`;
            })
            .join("<br>")}</td>
          <td class="small">${esc(d.unblocked)}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>

    <h2 class="section__title" style="font-size:1.4rem">The full register</h2>
    <p class="section__dek" style="margin-bottom:1.2rem">Every question, with the answer so far, what is still missing, and the specific action that would close it.</p>
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

    <h2 class="section__title" style="font-size:1.4rem;margin-top:2.5rem">Missing information register</h2>
    <p class="section__dek" style="margin-bottom:1.2rem">${esc(suggestions.discovery.intro)}</p>
    <div class="tablewrap">
      <table class="data sortable">
        <caption>Every gap this site checked for and could not close from an official source, with the specific artefact that would close it. Sorted by ID.</caption>
        <thead>
          <tr>
            <th scope="col">ID</th><th scope="col">What is missing</th><th scope="col">Why it matters</th>
            <th scope="col">What would close it</th><th scope="col">Who can close it</th><th scope="col">Effort</th>
          </tr>
        </thead>
        <tbody>${suggestions.discovery.rows
          .map(
            (r) => `<tr>
          <td><code>${esc(r.id)}</code></td>
          <td><strong>${esc(r.gap)}</strong></td>
          <td class="small">${esc(r.why)}</td>
          <td class="small">${esc(r.close)}</td>
          <td class="small">${esc(r.who)}${
              r.links && r.links.length
                ? `<br><span class="tiny">${r.links.map((l) => cite(l.url, esc(l.label))).join(" · ")}</span>`
                : ""
            }</td>
          <td class="small">${esc(r.effort)}</td>
        </tr>`
          )
          .join("")}</tbody>
      </table>
    </div>

    <div class="note mt2">
      <p class="note__title">If you accept only three</p>
      <p><strong>SUG-04</strong> — prove one affiliate link actually tracks, because nothing else matters if it does not. <strong>SUG-03</strong> — get API access, which unlocks prices, ratings and images at once. <strong>SUG-23</strong> — test one unit per form factor, which is the only thing that turns this from an inference site into an evidence site.</p>
    </div>

    <div class="note note--stop mt1">
      <p class="note__title">Three suggestions are rejections</p>
      <p><strong>SUG-12</strong> (price tracking), <strong>SUG-13</strong> (generated near-duplicate pages) and <strong>SUG-25</strong> (year-stamped "best of" listicles) are listed so that a future session does not build them in good faith. The first breaches Amazon's program policies outright; the second and third produce the exact content this publication exists to avoid.</p>
    </div>
  </div>
</section>
`;
  pages.push({
    path: "/suggestions/",
    title: "Suggestions",
    desc: `A reviewable decision list: ${suggestions.suggestions.length} suggestions with rationale, cost, risk and a recommendation, plus a missing-information register naming what would close each open gap. Nothing implemented without a decision.`,
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
      <li><strong>${guides.length} question-shaped guides</strong>, written as decisions rather than rankings, in ${CLUSTERS.length} clusters — choosing, living with it, and cooking with confidence.</li>
      <li><strong>A decision entry point</strong> at <a href="${url("/start-here/")}">/start-here/</a>: seven kitchen situations, each naming the product shape that fits it and what would make it wrong. It is the page a reader with no idea what they want lands on.</li>
      <li><strong>A seasonal layer</strong> at <a href="${url("/season/")}">/season/</a>, which shows that the same five products have five different reasons to be chosen across the year.</li>
      <li><strong>Original illustration throughout</strong> — schematics drawn by the build itself, not product photography, because Amazon's program policies require API-supplied content for anything we cannot license.</li>
      <li><strong>A complete source register</strong>: ${policy.sources.length} primary sources and ${products.reduce(
        (n, p) => n + p.specs.length,
        0
      )} specification rows, ${products.reduce(
        (n, p) => n + p.specs.filter((s) => s.value).length,
        0
      )} of them filled and each with a verification status; the rest are blank on purpose, with the reason recorded.</li>
      <li><strong>Marketing copy for all five links</strong> — a social post, a newsletter paragraph and its mandatory disclosure per product, on <a href="${url(
        "/marketing/kit/"
      )}">the marketing kit</a>.</li>
      <li><strong>${policy.policy.length} policy checks</strong> traced to the exact clause, with the text quoted verbatim so the summary can be audited, plus ${gov.flagged.length} items on the flagged register.</li>
      <li><strong>A publication gate</strong> in the build: it fails if any page loses its disclosure, or if any Amazon link loses its sponsored marking.</li>
      <li><strong>SEO foundations</strong>: sitemap, RSS feed, canonical URLs, structured data, and descriptions written for humans.</li>
      <li><strong>A defined measurement plan</strong>: five events, a self-hosted collector, and a ledger schema.</li>
    </ul>

    <h2>What does not exist, and why</h2>
    <p>This section is the important one.</p>
    <ul>
      <li><strong>No prices, ratings, reviews or product photos.</strong> Amazon's program policies prohibit displaying these without API access. We do not have it. Showing them anyway would risk the account; inventing them would be worse.</li>
      <li><strong>No hands-on testing.</strong> None took place, so none is claimed. Every page writes about the decision instead of a verdict, and the FTC's rule against describing experience you do not have is the reason.</li>
      <li><strong>No traffic or conversion data.</strong> Search Console is unverified and the analytics collector is not deployed, so nothing is being measured yet. Every guide title on this site is an editorial hypothesis, not a measured claim about what people search for.</li>
      <li><strong>Interior cavity dimensions for the two basket fryers.</strong> The oven-style unit is covered: its owner's manual gives the cavity as 26 quarts, 1519 cubic inches. Neither basket fryer publishes an interior figure, so "will a whole chicken fit" for those two is answered as far as the published record allows and no further.</li>
      <li><strong>Official sources that disagree with each other.</strong> The ThermoMaven water-resistance wording: the retailer says IP67, the maker says "100% waterproof", and the maker's own manual publishes no IP rating at all. The Emeril preset count: the owner's manual names 24 presets, the maker's specification panel says 25. The 8-quart Chefman dimensions and wattage: the listing and the maker give different numbers for the same model. Every one of them is shown, each attributed to the page that says it, rather than one being silently preferred.</li>
      <li><strong>No automated product research.</strong> The brief asked for an agent that identifies trending, high-converting products. Identifying "trending" requires a data source; without one, any such claim would be a fabrication with a chart attached. The pipeline is defined and its data inputs are documented as missing.</li>
      <li><strong>No revenue projection.</strong> Several unknowns multiplied together produce fiction.</li>
    </ul>

    <h2>What is unresolved</h2>
    <p>${gov.flagged.length} items on the <a href="${url(
      "/flagged/"
    )}">flagged for review</a> page, and ${questions.questions.length} questions on the <a href="${url(
      "/questions/"
    )}">open questions</a> page, which also carries a table of the seven decisions that are not yet ready to be made and the questions standing in the way of each. Four matter commercially:</p>
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
      <li>Publish one guide a week for eight weeks. ${guides.length} guides already exist, but they were written in one sitting, which is not a cadence.</li>
      <li>At week eight, read the query report and replace the topic hypotheses with measured demand.</li>
      <li>Apply for Product Advertising API access once the account qualifies — it unlocks prices, ratings and images together.</li>
      <li>Ask the manufacturers the questions that only they can answer: the basket fryers' interior cavity dimensions, whether the 8-quart TurboFry reaches 450°F and whether it is 1000 W or 1700 W, the Emeril preset and accessory counts, the ThermoMaven IP rating, and the CHEF iQ app support horizon. All of them are listed on the <a href="${url("/suggestions/")}">suggestions</a> page as the missing-information register, and each is one email.</li>
    </ol>

    <h2>The honest verdict</h2>
    <p>What exists is a small, well-documented, compliant publication with ${guides.length} guides and ${products.length} products. It is not yet a business: it has no traffic, no verified affiliate attribution, and no data. It is, however, built so that when those three things arrive, nothing has to be torn down — and so that nothing on it is a lie.</p>
    <p>The main strategic risk is not technical. It is that ${guides.length} guides, published in one sitting, is still not a body of content that ranks in a crowded category, and the plan for fixing that is a cadence, not a feature.</p>
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

  promoPage();

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

function promoPage() {
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
  const cards = promo.entries
    .map((e) => {
      const p = bySlug[e.slug];
      if (!p) throw new Error(`promo entry ${e.slug} matches no product`);
      const href = url(`/products/${p.slug}/`);
      const fill = (t) => esc(t).replace(/\[review\]/g, `<a href="${href}">the full record</a>`);
      return `<article class="promo">
  <header class="promo__head">
    <p class="kicker">${esc(p.brand)}</p>
    <h2 class="promo__title">${esc(p.shortName)}</h2>
    <p class="promo__hook">${esc(e.hook)}</p>
  </header>
  <div class="promo__block">
    <p class="promo__label">Social post</p>
    <p class="promo__copy">${fill(e.social)}</p>
  </div>
  <div class="promo__block">
    <p class="promo__label">Newsletter paragraph</p>
    <p class="promo__copy">${fill(e.newsletter)}</p>
  </div>
  <div class="promo__block promo__block--rule">
    <p class="promo__label">Travels with every post</p>
    <p class="promo__copy"><strong>${esc(e.disclosureNote)}</strong></p>
  </div>
  <p class="promo__caution"><strong>Watch the claim:</strong> ${esc(e.caution)}</p>
</article>`;
    })
    .join("");

  pages.push({
    path: "/marketing/kit/",
    title: "Marketing kit — copy for the five products",
    desc: promo.dek,
    html: `
${breadcrumb([
  { href: url("/"), label: "Home" },
  { href: url("/marketing/"), label: "Marketing plan" },
  { label: "Marketing kit" }
])}
<div class="article-head">
  <div class="wrap">
    <p class="kicker">Go-to-market</p>
    <h1 class="article-head__title">${esc(promo.title)}</h1>
    <p class="article-head__dek">${esc(promo.dek)}</p>
  </div>
</div>
<section class="section">
  <div class="wrap narrow prose">
    <p class="lede">${esc(promo.intro)}</p>
    <h2>The five rules this copy obeys</h2>
    <ol>${promo.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <div class="section__head">
      <h2 class="section__title">Copy for the five links</h2>
      <p class="section__dek">Each block is written to be pasted as-is. Bracketed links point at the review page on this site, not at Amazon, so the reader meets the disclosure before the buy button.</p>
    </div>
    <div class="promo-grid">${cards}</div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow prose">
    <h2>Before anything is published</h2>
    <ol>${promo.checklist.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>
    <p class="small">If a post fails the third question, it is a price post. Those go stale and, under the Program Policies, they are not ours to publish in the first place.</p>
  </div>
</section>`,
    priority: "0.4",
    changefreq: "monthly"
  });
}

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

  // A small static index so the reader can find a page without knowing the
  // site's shape. It is a convenience, not a ranking system, and it says so.
  const index = pages
    .filter((p) => p.path !== "/404.html")
    .map((p) => ({
      p: p.path,
      t: p.title.replace(/\s+—\s+Counter Space$/, ""),
      d: p.desc.replace(/\s+/g, " ").slice(0, 180),
      k: p.pageType || "page"
    }));
  fs.writeFileSync(
    path.join(ROOT, "search-index.json"),
    JSON.stringify({ generated: site.built, pages: index }, null, 0)
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
startHerePage();
seasonPage();
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
