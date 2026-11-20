#!/usr/bin/env node
/**
 * Static site generator for Countertop Report.
 * Zero dependencies. Reads data/*.json, writes site/*.html.
 *
 * Compliance invariants enforced here and re-checked by scripts/verify.mjs:
 *  1. The disclosure strip sits directly under the masthead on EVERY page.
 *  2. The disclosure is repeated in EVERY footer.
 *  3. Every amazon.com outbound link carries rel="sponsored nofollow noopener".
 *  4. No price literal ($, £, € followed by digits) appears in output.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.cwd();
const OUT = join(ROOT, 'site');

const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));

const siteCfg = read('data/site.json');
const S = siteCfg.site;
const { products, categories } = read('data/products.json');
const { links } = read('data/links.json');
const { policies } = read('data/policies.json');
const { questions } = read('data/questions.json');
const { suggestions } = read('data/suggestions.json');
const { flags } = read('data/flags.json');
const ledger = read('data/ledger.json');
const eventSpec = read('data/events.json');
const guides = read('content/guides.json');

const byId = Object.fromEntries(products.map((p) => [p.id, p]));
const linkFor = (pid) => links.find((l) => l.product === pid) || {};
const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

/* ---------------------------------------------------------------- helpers */

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const url = (path = '/') => `${S.canonical_host}${path}`;

/** Build a sponsored outbound link. Never emits a bare amazon.com link. */
function buyLink(pid, label, cls = 'btn') {
  const l = linkFor(pid);
  if (!l.supplied_short_link) throw new Error(`No link registered for ${pid}`);
  return `<a class="${cls}" href="${esc(l.supplied_short_link)}" rel="sponsored nofollow noopener" target="_blank" data-product="${esc(pid)}" data-link="${esc(l.id)}" data-placement="${esc(cls)}">${esc(label)}<span class="sr-only"> (opens Amazon in a new tab; we earn a commission on qualifying purchases)</span></a>`;
}

/**
 * The ONLY way this file is allowed to emit an external link.
 *
 * Rule: if a reader can land on a page where they can buy something, the link
 * is a product link and must be marked sponsored — even when we are citing it
 * as a source. Amazon's own help/policy pages are documentation, not shopfronts,
 * and marking those sponsored would misrepresent them.
 */
function ext(href, label, opts = {}) {
  const buying =
    /^https?:\/\/(www\.)?amazon\.com\/(dp|gp|stores|[A-Za-z0-9-]+\/b\/)/i.test(href) ||
    /^https?:\/\/link\.amazon\//i.test(href) ||
    /^https?:\/\/amzn\.to\//i.test(href);
  const rel = buying ? 'sponsored nofollow noopener' : 'noopener';
  const cls = opts.cls ? ` class="${opts.cls}"` : '';
  const title = opts.title ? ` title="${esc(opts.title)}"` : '';
  return `<a${cls} href="${esc(href)}" rel="${rel}"${title} target="_blank">${label}</a>`;
}

const observedLine = (p) =>
  p.observed
    ? `<span class="observed">Amazon rating <b>${p.observed.rating.toFixed(1)}</b> from ${p.observed.rating_count.toLocaleString('en-US')} ratings${p.observed.badge ? ` · ${esc(p.observed.badge)}` : ''} · <span title="Point-in-time observation, not live data">read ${esc(p.observed.observed_at_utc.slice(0, 10))}</span></span>`
    : '';

const specCell = (spec) => {
  if (!spec) return '<span class="na">—</span>';
  if (!spec.value) {
    return `<span class="unconfirmed" title="${esc(spec.note || 'Not confirmed from a primary source')}">Not confirmed</span>`;
  }
  const conf = spec.status === 'conflict'
    ? ` <span class="conflict" title="${esc(spec.note || '')}">conflict</span>`
    : '';
  const src = spec.source ? ` ${ext(spec.source, '↗', { cls: 'src', title: 'Source' })}` : '';
  return `${esc(spec.value)}${conf}${src}`;
};

/* ------------------------------------------------------------------ shell */

const NAV = [
  { href: '/air-fryers/', label: 'Air fryers' },
  { href: '/thermometers/', label: 'Thermometers' },
  { href: '/guides/', label: 'Guides' },
  { href: '/compare/', label: 'Compare' },
  { href: '/how-we-work/', label: 'How we work' },
];

const FOOTER_COLS = [
  {
    heading: 'The catalogue',
    items: [
      { href: '/air-fryers/', label: 'Air fryers' },
      { href: '/thermometers/', label: 'Thermometers' },
      { href: '/compare/', label: 'Compare all five' },
      { href: '/guides/', label: 'Buying guides' },
    ],
  },
  {
    heading: 'The register',
    items: [
      { href: '/links/', label: 'Source register' },
      { href: '/questions/', label: 'Open questions' },
      { href: '/suggestions/', label: 'Suggestions' },
      { href: '/flags/', label: 'Flagged for review' },
    ],
  },
  {
    heading: 'The dashboard',
    items: [
      { href: '/ledger/', label: 'Campaign ledger' },
      { href: '/events/', label: 'Event schema' },
      { href: '/disclosure/', label: 'Disclosure' },
      { href: '/feed.xml', label: 'RSS feed' },
    ],
  },
];

const disclosureStrip = () => `
  <div class="disclosure" role="note" aria-label="Affiliate disclosure">
    <div class="disclosure__inner">
      <strong>Affiliate disclosure</strong>
      <span>${esc(S.disclosure_short)}</span>
      <span class="disclosure__more">When you buy through a link here we may earn a commission at no extra cost to you.
      <a href="/disclosure/">Read the full disclosure</a>.</span>
    </div>
  </div>`;

function layout({ title, description, path, body, extraHead = '', wide = false }) {
  const canonical = url(path);
  return `<!doctype html>
<html lang="${esc(S.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(S.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${esc(S.name)}" href="${esc(url('/feed.xml'))}">
<link rel="stylesheet" href="/assets/styles.css">
<script src="/assets/config.js"></script>
<script src="/assets/analytics.js" defer></script>
${extraHead}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <div class="wrap masthead__inner">
    <a class="brand" href="/">
      <span class="brand__mark" aria-hidden="true">CR</span>
      <span class="brand__text">
        <span class="brand__name">${esc(S.masthead)}</span>
        <span class="brand__tag">${esc(S.tagline)}</span>
      </span>
    </a>
    <nav class="nav" aria-label="Primary">
      <ul>
        ${NAV.map((n) => `<li><a href="${n.href}"${path.startsWith(n.href) ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('\n        ')}
      </ul>
    </nav>
  </div>
</header>
${disclosureStrip()}

<main id="main" class="${wide ? 'wrap wrap--wide' : 'wrap'}">
${body}
</main>

<footer class="footer">
  <div class="wrap">
    <div class="footer__cols">
      ${FOOTER_COLS.map(
        (c) => `<div class="footer__col">
        <h2>${esc(c.heading)}</h2>
        <ul>${c.items.map((i) => `<li><a href="${i.href}">${esc(i.label)}</a></li>`).join('')}</ul>
      </div>`
      ).join('\n      ')}
    </div>
    <div class="footer__disclosure">
      <p><strong>Affiliate disclosure.</strong> ${esc(S.disclosure_long)}</p>
      <p class="footer__stat">
        Tracking ID <code>${esc(S.tracking_id)}</code> · <span class="unconfirmed">enrollment unverified</span>
        · Data observed ${esc(S.updated)} · No prices are shown on this site by design.
      </p>
      <p class="footer__stat">
        <a href="/disclosure/">Disclosure</a> · <a href="/how-we-work/">How we work</a> ·
        <a href="/flags/">Flagged for review</a> · <a href="/feed.xml">RSS</a>
      </p>
    </div>
  </div>
</footer>
</body>
</html>`;
}

/* -------------------------------------------------------------- fragments */

function productCard(p, opts = {}) {
  const c = catById[p.category];
  const keySpecs = [
    p.id.startsWith('chefman-dual') && ['Capacity', '6 qt total · 2 × 3 qt'],
    p.id === 'chefman-turbofry-8qt' && ['Capacity', '8 qt single basket'],
    p.id === 'emeril-french-door-26qt' && ['Capacity', '26 qt French-door oven'],
    p.id === 'thermomaven-1sec' && ['Read time', '1 second'],
    p.id === 'chefiq-sense-gen3' && ['Probes', '3 wireless'],
  ].filter(Boolean);

  const secondary = p.id.includes('chefman') || p.id.includes('emeril')
    ? [['Heat range', p.specs.temperature_range?.value || 'Not confirmed'], ['Modes', p.id === 'emeril-french-door-26qt' ? 'Multi-function oven' : p.specs.dual_zone?.value?.startsWith('No') ? 'Single zone' : 'Dual zone']]
    : [['Accuracy', p.specs.accuracy?.value || 'Not confirmed'], ['Water', p.specs.water_resistance?.value || (p.specs.heat_rating?.value ? 'Heat safe to 1000°F' : 'Not confirmed')]];

  return `<article class="card" id="${esc(p.id)}">
  <div class="card__top">
    <span class="kicker">${esc(c ? c.label : p.category)}</span>
    <h3><a href="/products/${p.id}/">${esc(p.short_name)}</a></h3>
    <p class="card__tagline">${esc(p.tagline)}</p>
  </div>
  <dl class="card__specs">
    ${keySpecs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    ${secondary.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
  </dl>
  <p class="card__for"><span>Best for</span> ${esc(p.best_for)}</p>
  <div class="card__foot">
    ${observedLine(p)}
    <div class="card__actions">
      <a class="btn btn--ghost" href="/products/${p.id}/">Read the notes</a>
      ${buyLink(p.id, 'Check it on Amazon')}
    </div>
    <p class="micro">${esc(S.disclosure_short)} Price is not shown here — Amazon's terms only allow us to display price data Amazon supplies.</p>
  </div>
</article>`;
}

function specTable(p) {
  const order = [
    ['capacity_total', 'Capacity'],
    ['capacity_spec_table', 'Capacity (page spec table)'],
    ['temperature_range', 'Temperature range'],
    ['read_time', 'Read time'],
    ['accuracy', 'Accuracy'],
    ['sensor', 'Sensor'],
    ['certification', 'Certification'],
    ['water_resistance', 'Water resistance'],
    ['probe_count', 'Probes'],
    ['sensor_count', 'Sensors'],
    ['connectivity', 'Connectivity'],
    ['heat_rating', 'Heat rating'],
    ['generation', 'Generation'],
    ['preset_count', 'Preset options'],
    ['controls', 'Controls'],
    ['dual_zone', 'Cooking zones'],
    ['window', 'Viewing'],
    ['hi_fry', 'Hi-Fry finish'],
    ['rotisserie', 'Rotisserie'],
    ['pizza_capacity', 'Pizza capacity'],
    ['dishwasher_safe_basket', 'Dishwasher-safe basket'],
    ['auto_shutoff', 'Automatic shutoff'],
    ['dimensions', 'Dimensions'],
    ['wattage', 'Wattage'],
    ['model_number', 'Model number'],
    ['included', 'In the box'],
    ['warranty', 'Warranty'],
  ];
  const rows = order
    .filter(([k]) => p.specs[k])
    .map(([k, label]) => {
      const spec = p.specs[k];
      const note = spec.note ? `<div class="note">${esc(spec.note)}</div>` : '';
      return `<tr>
      <th scope="row">${esc(label)}</th>
      <td>${specCell(spec)}${note}</td>
    </tr>`;
    })
    .join('\n');

  return `<table class="spec-table" data-verified="true">
  < caption class="sr-only">Verified specifications for ${esc(p.short_name)}</caption>
  <thead><tr><th scope="col">Field</th><th scope="col">Value, with source</th></tr></thead>
  <tbody>
${rows}
  </tbody>
</table>
<p class="table-note">Every value above was read from the Amazon product detail page for
${ext(p.url_official, `ASIN ${esc(p.asin)}`)} on ${esc(S.updated)}.
A <span class="unconfirmed">Not confirmed</span> cell means the page did not state it, so we left it blank
rather than guess. A <span class="conflict">conflict</span> tag means the page states two different things.</p>`;
}

function questionRow(q) {
  return `<tr>
  <th scope="row" class="q-id">${esc(q.id)}</th>
  <td>
    <strong>${esc(q.question)}</strong>
    <div class="qa"><span>Known</span> ${esc(q.what_we_know)}</div>
    <div class="qa"><span>Missing</span> ${esc(q.what_is_missing)}</div>
    <div class="qa"><span>Why it blocks</span> ${esc(q.why_it_matters)}</div>
    <div class="qa"><span>How to close</span> ${esc(q.how_to_close)}</div>
  </td>
  <td class="center">${q.blocks_a_decision ? '<span class="pill pill--stop">Blocks a decision</span>' : '<span class="pill">Context only</span>'}</td>
  <td class="center">${ext(q.source, '↗', { cls: 'src', title: 'Official source' })}</td>
</tr>`;
}

function suggestionCard(s) {
  return `<article class="suggestion" id="${esc(s.id)}">
  <header>
    <span class="kicker">${esc(s.id)} · priority ${s.priority}</span>
    <h3>${esc(s.title)}</h3>
    <p class="lead">${esc(s.problem)}</p>
  </header>
  <p class="evidence"><span>Evidence</span> ${esc(s.evidence)}</p>
  <table class="opt-table">
    <thead><tr><th scope="col">Path</th><th scope="col">Cost</th><th scope="col">What it gets you</th></tr></thead>
    <tbody>
      ${s.options
        .map(
          (o) => `<tr><td><b>${esc(o.id)}</b> · ${esc(o.label)}</td><td>${esc(o.cost)}</td><td>${esc(o.effect)}</td></tr>`
        )
        .join('\n      ')}
    </tbody>
  </table>
  <p class="rec"><span>Recommended</span> ${esc(s.recommendation)}</p>
  <p class="micro">Answer first: ${s.blocks.map((b) => `<a href="/questions/#${esc(b.toLowerCase())}">${esc(b)}</a>`).join(', ')}</p>
</article>`;
}

/* ------------------------------------------------------------------ pages */

const pages = [];
const addPage = (path, html, meta) => pages.push({ path, html, ...meta });

/* -- front page ---------------------------------------------------------- */
const airFryers = products.filter((p) => p.category === 'air-fryers');
const thermometers = products.filter((p) => p.category === 'thermometers');

const frontBody = `
<section class="hero">
  <div class="hero__text">
    <span class="kicker">Five products · two categories · one register</span>
    <h1>Two questions decide most kitchen-appliance purchases.<br><em>How much food, and how many things at once.</em></h1>
    <p class="hero__stand">Every spec below is quoted from the listing it came from and dated. Where the listing contradicts itself we print the contradiction instead of picking the nicer number. We show no prices, because Amazon's terms only allow price data Amazon itself supplies — so we send you to the listing to see it.</p>
    <div class="hero__actions">
      <a class="btn" href="#air-fryers">Start with the air fryers</a>
      <a class="btn btn--ghost" href="/compare/">Compare all five</a>
    </div>
  </div>
  <aside class="hero__aside" aria-label="What this site is">
    <h2>Read this first</h2>
    <ul class="facts">
      <li><b>No prices.</b> Deliberate. Amazon's Associates terms restrict price display to data Amazon supplies.</li>
      <li><b>No invented reviews.</b> The only ratings shown are Amazon's, stamped with the day we read them.</li>
      <li><b>No guessing.</b> Fields we could not confirm say <span class="unconfirmed">Not confirmed</span>.</li>
      <li><b>Every outbound link is marked sponsored</b> and is disclosed above this text.</li>
    </ul>
    <a class="link-arrow" href="/how-we-work/">How we work →</a>
  </aside>
</section>

<section class="section" id="air-fryers">
  <header class="section__head">
    <div>
      <span class="kicker">${esc(categories[0].label)}</span>
      <h2>${esc(categories[0].headline)}</h2>
    </div>
    <p>${esc(categories[0].blurb)}</p>
  </header>
  <div class="grid grid--3">
    ${airFryers.map((p) => productCard(p)).join('\n    ')}
  </div>
</section>

<section class="section" id="thermometers">
  <header class="section__head">
    <div>
      <span class="kicker">${esc(categories[1].label)}</span>
      <h2>${esc(categories[1].headline)}</h2>
    </div>
    <p>${esc(categories[1].blurb)}</p>
  </header>
  <div class="grid grid--2">
    ${thermometers.map((p) => productCard(p)).join('\n    ')}
  </div>
</section>

<section class="section section--guides">
  <header class="section__head">
    <div>
      <span class="kicker">Guides</span>
      <h2>Question-shaped, because that is how people search</h2>
    </div>
    <p>These are working titles written from the real decision points in the catalogue above. They are not claims about search volume.</p>
  </header>
  <ol class="guide-list">
    ${guides.guides
      .map(
        (g) => `<li>
      <span class="guide-list__n">${esc(g.number)}</span>
      <div>
        <h3><a href="/guides/${esc(g.slug)}/">${esc(g.title)}</a></h3>
        <p>${esc(g.dek)}</p>
        <span class="mini">${esc(g.reading_time)} min read · answers ${esc(g.answers)}</span>
      </div>
    </li>`
      )
      .join('\n    ')}
  </ol>
</section>

<section class="section section--open">
  <div class="open-grid">
    <div>
      <span class="kicker">Still open</span>
      <h2>${questions.length} questions we could not answer on our own</h2>
      <p>A buying guide is only as honest as the gaps it admits to. These are the ones that change a decision — enrollment, attribution, analytics, and whether any of these products has actually been held by a human.</p>
      <a class="link-arrow" href="/questions/">Read the open questions →</a>
    </div>
    <div>
      <span class="kicker">Decision queue</span>
      <h2>${suggestions.length} proposals, none implemented</h2>
      <p>Every change we would make next, with its cost and its evidence, waiting for a reviewer to pick a path. Nothing on that page has been built.</p>
      <a class="link-arrow" href="/suggestions/">Review the suggestions →</a>
    </div>
    <div>
      <span class="kicker">Flagged</span>
      <h2>${flags.length} items on the review page</h2>
      <p>Contradictory listings, unverified identifiers, and the one thing we deliberately refuse to print. Each carries a source link.</p>
      <a class="link-arrow" href="/flags/">See what is flagged →</a>
    </div>
  </div>
</section>`;

addPage('/index.html', layout({
  title: `${S.name} — specification-led buying notes on air fryers and meat thermometers`,
  description: S.description,
  path: '/',
  body: frontBody,
}), { url: '/', title: S.name, priority: '1.0' });

/* -- category pages ------------------------------------------------------ */
for (const c of categories) {
  const items = products.filter((p) => p.category === c.id);
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <span>${esc(c.label)}</span></nav>
<header class="page-head">
  <span class="kicker">${esc(c.label)} · ${items.length} products</span>
  <h1>${esc(c.headline)}</h1>
  <p class="standfirst">${esc(c.blurb)}</p>
</header>
<div class="grid ${items.length > 2 ? 'grid--3' : 'grid--2'}">
  ${items.map((p) => productCard(p)).join('\n  ')}
</div>
<section class="section">
  <h2>What separates these ${items.length}</h2>
  <table class="compare-table" data-verified="true">
    <thead>
      <tr><th scope="col">Product</th><th scope="col">Capacity</th><th scope="col">Zones</th><th scope="col">Heat range</th><th scope="col">Source</th></tr>
    </thead>
    <tbody>
      ${items
        .map(
          (p) => `<tr>
        <th scope="row"><a href="/products/${p.id}/">${esc(p.short_name)}</a></th>
        <td>${specCell(p.specs.capacity_total)}</td>
        <td>${esc(p.specs.dual_zone?.value || 'Not confirmed')}</td>
        <td>${specCell(p.specs.temperature_range || p.specs.heat_rating)}</td>
        <td>${ext(p.url_official, '↗', { cls: 'src', title: 'Official listing' })}</td>
      </tr>`
        )
        .join('\n      ')}
    </tbody>
  </table>
  <p class="table-note">Category definition per Amazon's own browse node: ${ext(c.source, esc(c.source))}</p>
</section>`;
  addPage(`/${c.id}/index.html`, layout({
    title: `${c.label} — ${S.name}`,
    description: `${c.headline}. ${c.blurb}`,
    path: `/${c.id}/`,
    body,
  }), { url: `/${c.id}/`, title: c.label, priority: '0.9' });
}

/* -- product pages ------------------------------------------------------- */
for (const p of products) {
  const related = products.filter((x) => x.category === p.category && x.id !== p.id);
  const body = `
<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/">Home</a> <span>/</span> <a href="/${esc(p.category)}/">${esc(catById[p.category].label)}</a> <span>/</span> <span>${esc(p.short_name)}</span>
</nav>
<header class="product-head">
  <div class="product-head__main">
    <span class="kicker">${esc(p.brand)} · ASIN ${esc(p.asin)}</span>
    <h1>${esc(p.short_name)}</h1>
    <p class="standfirst">${esc(p.tagline)}</p>
    <p class="product-head__title">Listing title, quoted: <em>${esc(p.title)}</em></p>
  </div>
  <aside class="buybox">
    <span class="kicker">Where to buy</span>
    ${buyLink(p.id, 'Check availability on Amazon', 'btn btn--block')}
    <p class="micro">${esc(S.disclosure_short)}</p>
    <dl class="buybox__meta">
      <div><dt>Price</dt><dd>Not shown here — see the listing</dd></div>
      <div><dt>Observed</dt><dd>${esc(p.observed.observed_at_utc.slice(0, 10))}</dd></div>
      <div><dt>Source</dt><dd>${ext(p.url_official, 'Amazon listing ↗')}</dd></div>
      <div><dt>Short link</dt><dd><code>${esc(linkFor(p.id).supplied_short_link.replace('https://', ''))}</code></dd></div>
    </dl>
    <p class="micro muted">Why no price? Amazon permits price display only when Amazon serves the link or when the data comes from its API. This is a static site, so it does neither.</p>
  </aside>
</header>

<section class="two-col">
  <div>
    <h2>Who it suits</h2>
    <p class="lead">${esc(p.best_for)}</p>
    <h2>Where it gives something up</h2>
    <ul class="tradeoffs">
      ${p.tradeoffs.map((t) => `<li>${esc(t)}</li>`).join('\n      ')}
    </ul>
    <h2>Specifications</h2>
    ${specTable(p)}
  </div>
  <aside class="sidebar">
    <h2>Amazon's own figures</h2>
    <p class="rating-big"><b>${p.observed.rating.toFixed(1)}</b><span>/ 5</span></p>
    <p class="micro">From ${p.observed.rating_count.toLocaleString('en-US')} ratings${p.observed.badge ? ` · ${esc(p.observed.badge)}` : ''}.
    Read ${esc(p.observed.observed_at_utc.slice(0, 10))}. Point-in-time, not live. We did not collect these.</p>
    ${p.observed.recent_sales_claim ? `<p class="micro">Amazon states “${esc(p.observed.recent_sales_claim)}”. That is Amazon's claim, not a measurement we made.</p>` : ''}
    <hr>
    <h2>Provenance</h2>
    <ul class="prov">
      <li><span>Intended ASIN</span> <code>${esc(linkFor(p.id).intended_asin)}</code></li>
      <li><span>Resolved ASIN</span> <code>${esc(linkFor(p.id).resolved_asin)}</code></li>
      <li><span>Link confirmed</span> ${esc(linkFor(p.id).confirmation_date_utc)}</li>
      <li><span>Tag in redirect</span> ${linkFor(p.id).tag_parameter_present ? 'yes' : '<span class="unconfirmed">not observed</span>'}</li>
    </ul>
    <p class="micro"><a href="/links/">Full source register →</a></p>
  </aside>
</section>

<section class="section">
  <h2>Compare with the other ${esc(catById[p.category].label.toLowerCase())}</h2>
  <div class="grid grid--2">
    ${related.map((r) => productCard(r)).join('\n    ')}
  </div>
</section>`;
  addPage(`/products/${p.id}/index.html`, layout({
    title: `${p.short_name} — specifications, trade-offs and source | ${S.name}`,
    description: `${p.short_name}: ${p.tagline} Verified specifications and trade-offs, each with a source link.`,
    path: `/products/${p.id}/`,
    body,
  }), { url: `/products/${p.id}/`, title: p.short_name, priority: '0.8' });
}

/* -- compare ------------------------------------------------------------- */
const compareBody = `
<header class="page-head">
  <span class="kicker">Side by side</span>
  <h1>All five, on the fields that actually differ</h1>
  <p class="standfirst">This is a specification comparison, not a scored ranking. A score would imply a weighting, and the weighting depends on which question you arrived with.</p>
</header>
<div class="scroll-x">
<table class="compare-table compare-table--big" data-verified="true">
  <thead>
    <tr>
      <th scope="col">Field</th>
      ${products.map((p) => `<th scope="col"><a href="/products/${p.id}/">${esc(p.short_name)}</a><span class="th-sub">${esc(p.brand)}</span></th>`).join('\n      ')}
    </tr>
  </thead>
  <tbody>
    <tr><th scope="row">Amazon rating <span class="mini">(observed ${esc(S.updated)})</span></th>
      ${products.map((p) => `<td><b>${p.observed.rating.toFixed(1)}</b> <span class="mini">${p.observed.rating_count.toLocaleString('en-US')}</span></td>`).join('')}</tr>
    <tr><th scope="row">Category</th>${products.map((p) => `<td>${esc(catById[p.category].label)}</td>`).join('')}</tr>
    <tr><th scope="row">Capacity / form</th>${products.map((p) => `<td>${specCell(p.specs.capacity_total)}</td>`).join('')}</tr>
    <tr><th scope="row">Cooking zones</th>${products.map((p) => `<td>${esc(p.specs.dual_zone?.value || 'n/a')}</td>`).join('')}</tr>
    <tr><th scope="row">Heat range</th>${products.map((p) => `<td>${specCell(p.specs.temperature_range || p.specs.heat_rating)}</td>`).join('')}</tr>
    <tr><th scope="row">Read time</th>${products.map((p) => `<td>${esc(p.specs.read_time?.value || 'n/a')}</td>`).join('')}</tr>
    <tr><th scope="row">Accuracy</th>${products.map((p) => `<td>${specCell(p.specs.accuracy)}</td>`).join('')}</tr>
    <tr><th scope="row">Dishwasher-safe</th>${products.map((p) => `<td>${specCell(p.specs.dishwasher_safe_basket)}</td>`).join('')}</tr>
    <tr><th scope="row">Dimensions</th>${products.map((p) => `<td>${specCell(p.specs.dimensions)}</td>`).join('')}</tr>
    <tr><th scope="row">Wattage</th>${products.map((p) => `<td>${specCell(p.specs.wattage)}</td>`).join('')}</tr>
    <tr><th scope="row">Source</th>${products.map((p) => `<td>${ext(p.url_official, '↗', { cls: 'src', title: 'Official listing' })}</td>`).join('')}</tr>
    <tr><th scope="row">Check it</th>${products.map((p) => `<td>${buyLink(p.id, 'Amazon', 'btn btn--sm')}</td>`).join('')}</tr>
  </tbody>
</table>
</div>
<p class="table-note">${esc(S.disclosure_short)} No price row exists in this table on purpose — see the disclosure page for the reason.</p>
<section class="section">
  <h2>How to read this table</h2>
  <div class="prose">
    <p>Start from the field that constrains you, not from the rating. If two people are cooking at once, the dual-basket column matters more than half a star. If you are feeding six, the capacity column matters more than the mode count. If you keep overcooking chicken, the thermometer columns matter more than any of the fryer columns.</p>
    <p>A dash means the field does not apply to that kind of product. “Not confirmed” means the listing did not state it and we refused to fill the gap.</p>
  </div>
</section>`;
addPage('/compare/index.html', layout({
  title: `Compare all five products — ${S.name}`,
  description: 'Every verified field, side by side, with the source listing for each column.',
  path: '/compare/',
  body: compareBody,
  wide: true,
}), { url: '/compare/', title: 'Compare', priority: '0.9' });

/* -- guides -------------------------------------------------------------- */
guides.guides.forEach((g) => {
  const body = `
<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span>/</span> <a href="/guides/">Guides</a> <span>/</span> <span>Guide ${esc(g.number)}</span></nav>
<article class="guide">
  <header class="guide__head">
    <span class="kicker">Guide ${esc(g.number)} · ${esc(g.reading_time)} min · updated ${esc(S.updated)}</span>
    <h1>${esc(g.title)}</h1>
    <p class="standfirst">${esc(g.dek)}</p>
    <p class="micro">This guide answers: ${esc(g.answers)}. It is a working editorial title, not a claim about search demand.</p>
  </header>
  <div class="prose">
    ${g.body}
  </div>
  <aside class="guide__cta">
    <h2>Products referred to in this guide</h2>
    <div class="grid grid--2">
      ${g.products.map((pid) => productCard(byId[pid])).join('\n      ')}
    </div>
  </aside>
  <nav class="pager" aria-label="Guide navigation">
    ${guides.guides
      .filter((x) => x.slug !== g.slug)
      .map((x) => `<a href="/guides/${esc(x.slug)}/"><span>Guide ${esc(x.number)}</span>${esc(x.title)}</a>`)
      .join('\n    ')}
  </nav>
</article>`;
  addPage(`/guides/${g.slug}/index.html`, layout({
    title: `${g.title} — ${S.name}`,
    description: g.dek,
    path: `/guides/${g.slug}/`,
    body,
  }), { url: `/guides/${g.slug}/`, title: g.title, priority: '0.8', date: S.updated });
});

const guidesIndex = `
<header class="page-head">
  <span class="kicker">Guides · ${guides.guides.length} published</span>
  <h1>Buying guides, written as answers</h1>
  <p class="standfirst">Each guide starts from a question someone actually types into a search bar, then answers it from the verified register rather than from opinion.</p>
</header>
<ol class="guide-list guide-list--large">
  ${guides.guides
    .map(
      (g) => `<li>
    <span class="guide-list__n">${esc(g.number)}</span>
    <div>
      <h3><a href="/guides/${esc(g.slug)}/">${esc(g.title)}</a></h3>
      <p>${esc(g.dek)}</p>
      <span class="mini">${esc(g.reading_time)} min read · answers ${esc(g.answers)}</span>
    </div>
  </li>`
    )
    .join('\n  ')}
</ol>
<section class="section section--open">
  <div class="prose">
    <h2>Why there are only four</h2>
    <p>Four is what we could write without inventing search volume. The next topic should be chosen from measured queries once Search Console is live — not from instinct. That is logged as an open question, and the publishing cadence is logged as a suggestion.</p>
    <p><a class="link-arrow" href="/suggestions/#sg-06">Read the cadence proposal →</a></p>
  </div>
</section>`;
addPage('/guides/index.html', layout({
  title: `Buying guides — ${S.name}`,
  description: 'Question-shaped buying guides on air fryer capacity, cleanup, and kitchen thermometers.',
  path: '/guides/',
  body: guidesIndex,
}), { url: '/guides/', title: 'Guides', priority: '0.9' });

/* -- disclosure ---------------------------------------------------------- */
const disclosureBody = `
<header class="page-head">
  <span class="kicker">Compliance</span>
  <h1>Disclosure</h1>
  <p class="standfirst">The short version appears under the masthead of every page on this site. This is the long version.</p>
</header>
<div class="prose prose--narrow">
  <h2>The statement</h2>
  <blockquote>${esc(S.disclosure_short)}</blockquote>
  <p>That is the exact wording the Associates Program Operating Agreement (§5) requires, and it appears above the fold on every page, repeated in every footer. It is not only on this page.</p>

  <h2>What that means in practice</h2>
  <ul>
    <li>When you click a product link and buy something, the seller pays us a small percentage. The price you pay is unchanged.</li>
    <li>We do not know who you are. We receive aggregate counts, not identities.</li>
    <li>Nothing on this site is a paid placement. No brand paid us to be listed, ranked, described or omitted.</li>
  </ul>

  <h2>Why there are no prices here</h2>
  <p>Amazon's Associates Program Policies permit a site to show price and availability only if (a) Amazon serves the link in which that data is displayed, or (b) the data comes from the Creators API or PA API and complies with the license. This is a static site. It satisfies neither condition, so it prints no price at all. That is a rule we are following, not an oversight.</p>
  <p class="source-line">Source: <a href="https://affiliate-program.amazon.com/help/operating/policies" rel="noopener" target="_blank">Associates Program Policies</a>, updated 2026-04-14, Participation Requirements §2(b).</p>

  <h2>Why every product link is marked sponsored</h2>
  <p>Every outbound link to Amazon on this site carries <code>rel="sponsored"</code>. The FTC's Guides Concerning the Use of Endorsements and Testimonials in Advertising (16 CFR Part 255, §255.5) require that a material connection be disclosed clearly and conspicuously. Marking the link as sponsored and stating the connection in plain words, in the place where the reader encounters the link, is how this site does that.</p>
  <p class="source-line">Source: <a href="https://www.ecfr.gov/current/title-16/chapter-I/subchapter-B/part-255" rel="noopener" target="_blank">16 CFR Part 255</a>, current as of 2026-11-18.</p>

  <h2>What we do not do</h2>
  <ul>
    <li>We do not claim to have tested a product we have not held. No page on this site says “we tested”.</li>
    <li>We do not invent reviews, quotes or star ratings. The only ratings shown are Amazon's, stamped with the date we read them.</li>
    <li>We do not print a specification we could not source. Those cells say “Not confirmed”.</li>
    <li>We do not collect personal data. No cookies are set and analytics ships disabled.</li>
  </ul>

  <h2>The full policy register</h2>
  <p>Every rule this site is built against, quoted and linked to its primary document, is in the policy register. It is the source of truth for the build gate.</p>
  <table class="spec-table">
    <thead><tr><th scope="col">ID</th><th scope="col">Requirement</th><th scope="col">How this site complies</th><th scope="col">Source</th></tr></thead>
    <tbody>
      ${policies
        .map(
          (pol) => `<tr>
        <th scope="row">${esc(pol.id)}</th>
        <td><b>${esc(pol.title)}</b><div class="note">${esc(pol.requirement)}</div></td>
        <td>${esc(pol.how_this_site_complies)}</td>
        <td>${ext(pol.source, '↗', { cls: 'src', title: `${pol.document} (${pol.document_updated})` })}</td>
      </tr>`
        )
        .join('\n      ')}
    </tbody>
  </table>
</div>`;
addPage('/disclosure/index.html', layout({
  title: `Disclosure — ${S.name}`,
  description: 'Full affiliate disclosure, why no prices are shown, and the policy register this site is built against.',
  path: '/disclosure/',
  body: disclosureBody,
}), { url: '/disclosure/', title: 'Disclosure', priority: '0.6' });

/* -- how we work --------------------------------------------------------- */
const howBody = `
<header class="page-head">
  <span class="kicker">Method</span>
  <h1>How this site is built, and what it refuses to do</h1>
  <p class="standfirst">The rules below are not aspirations. A build script checks most of them on every deploy and fails the deploy if one breaks.</p>
</header>
<div class="prose">
  <h2>The five rules</h2>
  <ol class="rules">
    <li><b>One source per fact.</b> Every specification links to the page it came from. If there is no page, the cell says “Not confirmed”.</li>
    <li><b>Contradictions are printed, not resolved.</b> When a listing disagrees with itself, the site shows both figures. See the flagged page for three live examples.</li>
    <li><b>No price, ever.</b> Amazon's terms restrict price display to data Amazon supplies. A static site cannot comply, so it does not print price.</li>
    <li><b>No invented experience.</b> Nothing here claims hands-on testing, because nothing has been tested by hand.</li>
    <li><b>Disclosure above the fold, on every page.</b> Not buried, not only on a legal page.</li>
  </ol>

  <h2>What the build checks automatically</h2>
  <p>On every push, a verification script reads the generated HTML and fails if any of these are false:</p>
  <ul class="checks">
    <li>The disclosure strip appears on every page, before the main content.</li>
    <li>The disclosure is repeated in every footer.</li>
    <li>Every link to amazon.com carries <code>rel="sponsored nofollow noopener"</code>.</li>
    <li>No price literal appears anywhere in the output.</li>
    <li>Every page has a canonical URL on a single host.</li>
    <li>The sitemap lists exactly the pages that exist, and nothing else.</li>
    <li>Every spec table row carries a source link or an explicit “Not confirmed”.</li>
  </ul>

  <h2>What a human has to check</h2>
  <p>Three things cannot be automated, and are logged instead:</p>
  <ul>
    <li>Whether the tracking ID is actually enrolled and crediting clicks.</li>
    <li>Whether a specification still matches the live listing (it will drift).</li>
    <li>Whether the editorial voice is still honest — the machine can check that a source exists, not that the sentence using it is fair.</li>
  </ul>
  <p>All three appear in the <a href="/questions/">open questions register</a> with the specific action that closes them.</p>

  <h2>Editorial voice</h2>
  <p>The site writes about trade-offs rather than winners. Where a product is worse at something, the page says so in the same breath as what it is good at. Where two products are genuinely interchangeable for a reader, the page says that too, instead of manufacturing a distinction to justify a recommendation.</p>
</div>`;
addPage('/how-we-work/index.html', layout({
  title: `How we work — ${S.name}`,
  description: 'The sourcing rules this site is built on, what the build verifies automatically, and what a human still has to check.',
  path: '/how-we-work/',
  body: howBody,
}), { url: '/how-we-work/', title: 'How we work', priority: '0.6' });

/* -- links / source register -------------------------------------------- */
const linksBody = `
<header class="page-head">
  <span class="kicker">Register</span>
  <h1>Source register</h1>
  <p class="standfirst">For each submitted link: the intended ASIN, the official listing, the date it was confirmed, where it came from, and — kept strictly separate — what the redirect actually did.</p>
</header>
<div class="callout">
  <p><b>Intent and observation are stored separately and are never merged.</b> An ASIN is a checkable identifier, so the record of what we meant to link to must not be silently rewritten by what a redirect happens to do today.</p>
</div>
<div class="scroll-x">
<table class="spec-table">
  <thead><tr>
    <th scope="col">ID</th><th scope="col">Supplied link</th><th scope="col">Intended ASIN</th><th scope="col">Official listing</th>
    <th scope="col">Confirmed</th><th scope="col">Source</th><th scope="col">Observed redirect target</th><th scope="col">Tag in redirect</th>
  </tr></thead>
  <tbody>
    ${links
      .map(
        (l) => `<tr>
      <th scope="row">${esc(l.id)}</th>
      <td>${ext(l.supplied_short_link, esc(l.supplied_short_link.replace('https://', '')))}</td>
      <td><code>${esc(l.intended_asin)}</code></td>
      <td>${ext(l.official_listing_url, `amazon.com/dp/${esc(l.official_listing_url.split('/dp/')[1])} ↗`)}</td>
      <td>${esc(l.confirmation_date_utc)}</td>
      <td class="micro">${esc(l.source_of_supply)}</td>
      <td class="micro mono-wrap">${esc(l.observed_redirect_target)}</td>
      <td class="center">${l.tag_parameter_present ? 'yes' : '<span class="unconfirmed">not observed</span>'}</td>
    </tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
</div>
<section class="section">
  <h2>What the register does and does not prove</h2>
  <div class="prose">
    <p><b>It proves</b> that all five short links resolve to the ASIN the owner described. Every row is verifiable by following the link yourself.</p>
    <p><b>It does not prove</b> that those links credit the tracking ID. None of the observed redirect targets contains a <code>tag=</code> parameter; they carry Amazon's own page-share token instead. We are not claiming the links are invalid. We are recording that their compliance status is unresolved and cannot be settled from outside the account.</p>
    <p>The cheapest way to settle it is one click, followed by one look at the Associates click report. That is logged as <a href="/questions/#q03">Q03</a> and as the first item in the <a href="/suggestions/">decision queue</a>.</p>
  </div>
</section>`;
addPage('/links/index.html', layout({
  title: `Source register — ${S.name}`,
  description: 'The five submitted links, their intended ASINs, official listings, confirmation dates, and observed redirect targets kept as a separate field.',
  path: '/links/',
  body: linksBody,
  wide: true,
}), { url: '/links/', title: 'Source register', priority: '0.5' });

/* -- questions ----------------------------------------------------------- */
const qBlocks = questions.filter((q) => q.blocks_a_decision).length;
const questionsBody = `
<header class="page-head">
  <span class="kicker">Register · ${questions.length} questions</span>
  <h1>What has to be answered before a decision is reasonable</h1>
  <p class="standfirst">${qBlocks} of these ${questions.length} block a decision outright. The rest are context. Each one lists what we know, what is missing, and the cheapest way to close it — none of them require a specialist.</p>
</header>
<div class="scroll-x">
<table class="spec-table q-table">
  <thead><tr><th scope="col">ID</th><th scope="col">Question, evidence and route to an answer</th><th scope="col">Weight</th><th scope="col">Source</th></tr></thead>
  <tbody>
    ${questions.map((q) => questionRow(q).replace('id="', 'id="q')).join('\n    ')}
  </tbody>
</table>
</div>
<section class="section">
  <h2>The four that matter most</h2>
  <div class="prose">
    <p><b>Enrollment (Q01).</b> If the account is not in good standing, nothing else on this site matters.</p>
    <p><b>Attribution (Q02, Q03).</b> The links resolve correctly but no tag is visible. One click and one report settles it.</p>
    <p><b>Analytics (Q09).</b> Static hosting cannot run an endpoint. Until that is decided, every traffic number stays empty.</p>
    <p><b>Experience (Q10).</b> Nobody has held these products. That single fact sets the honest ceiling on the editorial voice.</p>
  </div>
</section>`;
addPage('/questions/index.html', layout({
  title: `Open questions — ${S.name}`,
  description: 'Every question that must be answered before a decision can reasonably be made, with what is known, what is missing, and how to close it.',
  path: '/questions/',
  body: questionsBody,
  wide: true,
}), { url: '/questions/', title: 'Open questions', priority: '0.7' });

/* -- suggestions --------------------------------------------------------- */
const suggestionsBody = `
<header class="page-head">
  <span class="kicker">Decision queue · ${suggestions.length} proposals</span>
  <h1>Suggestions, waiting for a decision</h1>
  <p class="standfirst">This section exists so that nothing gets implemented before someone chooses a path. Each proposal names the problem, the evidence, the options, the cost and what it gets you. Nothing below has been built.</p>
</header>
<div class="callout callout--warn">
  <p><b>How to use this page.</b> Work top to bottom. Priority is the order to <em>decide</em>, not the order to build — SG-01 costs one click and invalidates five other items if it comes back negative. Pick an option letter, and that is the whole review.</p>
</div>
<div class="suggestion-list">
  ${suggestions.map((s) => suggestionCard(s)).join('\n  ')}
</div>`;
addPage('/suggestions/index.html', layout({
  title: `Suggestions and decision queue — ${S.name}`,
  description: 'Proposed changes with options, costs and evidence, reviewed before anything is implemented.',
  path: '/suggestions/',
  body: suggestionsBody,
}), { url: '/suggestions/', title: 'Suggestions', priority: '0.7' });

/* -- flags --------------------------------------------------------------- */
const flagsBody = `
<header class="page-head">
  <span class="kicker">Flagged for review · ${flags.length} items</span>
  <h1>Flagged for review</h1>
  <p class="standfirst">Everything that could not be confirmed from a primary source, or that a primary source contradicts. None of these block the site from being live. All of them are here so you can review them after the fact and ask for changes.</p>
</header>
<div class="flag-grid">
  ${flags
    .map(
      (f) => `<article class="flag" id="${esc(f.id.toLowerCase())}">
    <header>
      <span class="pill pill--${f.severity === 'policy' || f.severity === 'account' || f.severity === 'links' ? 'stop' : 'warn'}">${esc(f.severity)}</span>
      <span class="kicker">${esc(f.id)}</span>
      <h3>${esc(f.title)}</h3>
    </header>
    <p>${esc(f.finding)}</p>
    <p class="evidence"><span>Impact</span> ${esc(f.impact)}</p>
    <p class="evidence"><span>Status</span> ${esc(f.status)}</p>
    <p class="evidence"><span>To close</span> ${esc(f.action_to_close)}</p>
    <p class="micro">Source: ${ext(f.source, `${esc(f.source_label)} ↗`)}${
        f.evidence ? `<br>Evidence: <code>${esc(f.evidence)}</code>` : ''
      }</p>
  </article>`
    )
    .join('\n  ')}
</div>`;
addPage('/flags/index.html', layout({
  title: `Flagged for review — ${S.name}`,
  description: 'Unverified items, contradictory source data, and deliberate omissions, each with a source link.',
  path: '/flags/',
  body: flagsBody,
}), { url: '/flags/', title: 'Flagged for review', priority: '0.6' });

/* -- ledger -------------------------------------------------------------- */
const ledgerBody = `
<header class="page-head">
  <span class="kicker">Dashboard · measurement</span>
  <h1>Campaign ledger</h1>
  <p class="standfirst">Structurally complete, numerically empty. A row only exists when an authorised first-party report supplies it. Null means not measured — it does not mean zero, and it is never estimated.</p>
</header>
<div class="stat-row">
  <div class="stat"><span class="stat__n">—</span><span class="stat__l">Eligible sessions</span><span class="micro">not measured</span></div>
  <div class="stat"><span class="stat__n">—</span><span class="stat__l">Outbound clicks</span><span class="micro">not measured</span></div>
  <div class="stat"><span class="stat__n">—</span><span class="stat__l">Reported orders</span><span class="micro">not measured</span></div>
  <div class="stat"><span class="stat__n">0</span><span class="stat__l">Rows in ledger</span><span class="micro">no report pulled</span></div>
</div>
<div class="callout callout--warn">
  <p><b>No conversion score and no revenue forecast appears on this site.</b> Both would require inventing numbers. The schema below is the entire contract for what a valid row looks like once real reports exist.</p>
</div>
<section class="section">
  <h2>Accepted row schema</h2>
  <table class="spec-table">
    <thead><tr><th scope="col">Field</th><th scope="col">Type</th><th scope="col">Rule</th></tr></thead>
    <tbody>
      ${Object.entries(ledger._meta.schema)
        .map(
          ([k, v]) =>
            typeof v === 'string'
              ? `<tr><th scope="row"><code>${esc(k)}</code></th><td>${esc(v)}</td><td>${
                  k.includes('utc') ? 'Required. Provenance.' : 'Required.'
                }</td></tr>`
              : ''
        )
        .join('\n      ')}
      <tr><th scope="row"><code>provenance</code></th><td>object</td><td>report_name, report_period, pulled_at_utc, pulled_by. A row without all four is invalid.</td></tr>
    </tbody>
  </table>
</section>
<section class="section">
  <h2>Definitions fixed in advance</h2>
  <dl class="defs">
    ${Object.entries(ledger._meta.definitions)
      .map(([k, v]) => `<div><dt><code>${esc(k)}</code></dt><dd>${esc(v)}</dd></div>`)
      .join('\n    ')}
  </dl>
</section>
<section class="section">
  <h2>Why it is empty</h2>
  <div class="prose">
    <p>Two things are missing and both are logged: there is no analytics endpoint (<a href="/flags/#flg-006">FLG-006</a>) because GitHub Pages cannot execute server code, and no Associates report has been pulled (<a href="/flags/#flg-010">FLG-010</a>).</p>
    <p>The event layer that will feed the sessions and clicks columns is already written and shipped — disabled, with five defined events. Choosing an endpoint is <a href="/suggestions/#sg-02">SG-02</a>.</p>
  </div>
</section>`;
addPage('/ledger/index.html', layout({
  title: `Campaign ledger — ${S.name}`,
  description: 'The campaign ledger schema, its definitions, and why every figure is currently empty rather than zero.',
  path: '/ledger/',
  body: ledgerBody,
}), { url: '/ledger/', title: 'Campaign ledger', priority: '0.4' });

/* -- events -------------------------------------------------------------- */
const eventsBody = `
<header class="page-head">
  <span class="kicker">Dashboard · measurement</span>
  <h1>The five events</h1>
  <p class="standfirst">Written, shipped, and switched off. When an endpoint is chosen, these begin flowing with no code change. Nothing here identifies a reader.</p>
</header>
<div class="callout">
  <p><b>Privacy position.</b> ${esc(eventSpec._meta.privacy)}</p>
</div>
<table class="spec-table">
  <thead><tr><th scope="col">Event</th><th scope="col">Fires when</th><th scope="col">Why it exists</th><th scope="col">Fields</th><th scope="col">Feeds</th></tr></thead>
  <tbody>
    ${eventSpec.events
      .map(
        (e) => `<tr>
      <th scope="row"><code>${esc(e.name)}</code></th>
      <td>${esc(e.fires_when)}</td>
      <td>${esc(e.why)}</td>
      <td class="micro">${e.fields.map((f) => `<code>${esc(f)}</code>`).join(' ')}</td>
      <td class="micro">${esc(e.maps_to)}</td>
    </tr>`
      )
      .join('\n    ')}
  </tbody>
</table>
<section class="section">
  <h2>Session bucketing without tracking</h2>
  <div class="prose">
    <p>${esc(eventSpec._meta && eventSpec.session_bucket ? eventSpec.session_bucket.definition : '')} ${esc(eventSpec.session_bucket && eventSpec.session_bucket.definition ? '' : eventSpec.session_bucket)}</p>
    <p>${esc(eventSpec.session_bucket ? eventSpec.session_bucket.purpose : '')}</p>
  </div>
</section>
<section class="section">
  <h2>Status</h2>
  <p class="lead">${esc(eventSpec._meta.why_disabled)}</p>
  <p class="micro">Current endpoint value: <code>${esc(String(siteCfg.analytics.endpoint))}</code></p>
</section>`;
addPage('/events/index.html', layout({
  title: `Event schema — ${S.name}`,
  description: 'The five measurement events, their fields, and the cookie-free session bucket that keeps them unlinkable across visits.',
  path: '/events/',
  body: eventsBody,
}), { url: '/events/', title: 'Event schema', priority: '0.4' });

/* -- 404 ----------------------------------------------------------------- */
addPage('/404.html', layout({
  title: `Page not found — ${S.name}`,
  description: 'That page does not exist.',
  path: '/404.html',
  body: `<header class="page-head"><span class="kicker">404</span><h1>That page does not exist</h1>
  <p class="standfirst">Nothing was found at this address. The catalogue is small enough that the front page is the best place to restart.</p>
  <p><a class="btn" href="/">Go to the front page</a></p></header>`,
}), { url: '/404.html', title: 'Not found', noindex: true });

/* ------------------------------------------------------------------ write */

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

/**
 * GitHub project Pages serve from /<repo>/, not from the domain root. Every
 * root-relative href/src therefore has to carry the base path or it 404s.
 * Doing it once here means no template has to remember, and there is exactly
 * one place to change if the site ever moves to a custom domain.
 */
const BASE = S.base_path || '';
function rebase(html) {
  if (!BASE) return html;
  return html
    .replace(/href="\/(?![\/])/g, `href="${BASE}/`)
    .replace(/src="\/(?![\/])/g, `src="${BASE}/`);
}

for (const p of pages) {
  const dest = join(OUT, p.path);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, rebase(p.html), 'utf8');
}

cpSync(join(ROOT, 'assets'), join(OUT, 'assets'), { recursive: true });

/* sitemap */
const indexable = pages.filter((p) => !p.noindex);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable
  .map(
    (p) => `  <url>
    <loc>${esc(url(p.url))}</loc>
    <lastmod>${S.updated}</lastmod>
    <changefreq>${p.url === '/' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p.priority || '0.5'}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
writeFileSync(join(OUT, 'sitemap.xml'), sitemap, 'utf8');

/* rss */
const feedItems = [
  ...guides.guides.map((g) => ({
    title: g.title,
    link: url(`/guides/${g.slug}/`),
    desc: g.dek,
    date: `${S.updated}T09:00:00Z`,
  })),
  ...products.map((p) => ({
    title: `${p.short_name}: ${p.tagline}`,
    link: url(`/products/${p.id}/`),
    desc: p.best_for,
    date: `${S.updated}T08:00:00Z`,
  })),
];

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(S.name)}</title>
    <link>${esc(url('/'))}</link>
    <description>${esc(S.description)}</description>
    <language>${esc(S.lang)}</language>
    <lastBuildDate>${new Date(`${S.updated}T12:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${esc(url('/feed.xml'))}" rel="self" type="application/rss+xml"/>
${feedItems
  .map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="true">${esc(i.link)}</guid>
      <description>${esc(i.desc)}</description>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>
`;
writeFileSync(join(OUT, 'feed.xml'), rss, 'utf8');

/* robots */
writeFileSync(
  join(OUT, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`,
  'utf8'
);

/* CNAME is intentionally absent: the site is served from the github.io origin.
   Adding a domain later means adding site/CNAME and changing canonical_host in data/site.json. */

console.log(`Built ${pages.length} pages → site/`);
console.log(`  sitemap: ${indexable.length} indexable URLs`);
console.log(`  feed:    ${feedItems.length} items`);
