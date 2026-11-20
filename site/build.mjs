// The Preheat — static site generator.
// Zero dependencies, so the only thing between a commit and a live page is this file.
// Reads data/*.json + site/content/**, writes the publishable site into docs/.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, copyFileSync, existsSync } from "node:fs";
import { join, dirname, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs");
const cfg = load("config/site.config.json");
const sources = load("data/sources.json");
const products = load("data/products.json");
const intents = load("data/product-intent.json");
const categories = load("data/categories.json").categories;
const flags = load("data/flags.json").flags;
const sugg = load("data/suggestions.json");
const questions = load("data/questions.json").questions;
const ledger = load("data/campaign-ledger.json");
const events = load("data/events.json");

const PAGES = []; // {path, key, title, desc, type, noIndex, robotsNote}
const built = new Map(); // outPath -> html (so the gate can inspect without re-reading disk)

// ------------------------------------------------------------------ utilities
function load(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), "utf8"));
}
function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const R = (html) => ({ __html: html });
const isRaw = (v) => v && typeof v === "object" && "__html" in v;
function longDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function na(reason = "Not confirmed from an official source") {
  return R(`<span class="na" title="${esc(reason)}">—</span>`);
}
function rel(base, path) {
  if (path === "/") return base === "." ? "./" : base + "/index.html";
  return posix.join(base, path).replace(/^\.\//, "");
}
// Depth of a page's directory below the site root, turned into the relative prefix.
function baseFor(path) {
  const dir = path.replace(/^\//, "").replace(/\/index\.html$/, "").replace(/\/$/, "");
  if (!dir) return ".";
  return "../".repeat(dir.split("/").length);
}
function abs(path) {
  return cfg.baseUrl.replace(/\/$/, "") + path;
}
function write(outPath, html) {
  const full = join(OUT, outPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html.endsWith(".html") ? html : html, "utf8");
  built.set(outPath, html);
}
function addPage(spec) {
  PAGES.push(spec);
}
function tableBlock(cols, rows, opts = {}) {
  const head = cols.map((c) => `<th scope="col">${esc(c)}</th>`).join("");
  const body = rows
    .map((r) => {
      const tds = r
        .map((cell, i) => {
          const v = cell === null || cell === undefined || cell === "" ? na() : cell;
          const content = isRaw(v) ? v.__html : esc(v);
          const cls = i === 0 ? ' class="k"' : "";
          return `<td${cls}>${content}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("\n        ");
  const cap = opts.caption ? `<caption>${esc(opts.caption)}</caption>` : "";
  const note = opts.note ? `<p class="table-note">${opts.note}</p>` : "";
  return `<div class="table-wrap"><table class="grid">${cap}<thead><tr>${head}</tr></thead><tbody>\n        ${body}\n      </tbody></table></div>${note}`;
}
function srcLink(id, label) {
  const s = sources.sources.find((x) => x.id === id);
  if (!s) return label ? esc(label) : "";
  const text = label || `${s.issuer.split(" (")[0]} — ${s.title}`;
  return R(`<a class="srclink" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(text)}</a>`);
}
function srcLinks(ids) {
  if (!ids || !ids.length) return na("No external source was needed or used for this row");
  return R(ids.map((id) => `<a class="srclink" href="${esc(sources.sources.find((s) => s.id === id).url)}" target="_blank" rel="noopener">${esc(id)}</a>`).join(" "));
}

// ------------------------------------------------------------------ chrome
const NAV_READER = [
  { label: "Guides", path: "/guides/" },
  ...categories.map((c) => ({ label: c.name, path: `/section/${c.slug}/` })),
  { label: "The shelf", path: "/picks/" },
  { label: "Tools", path: "/tools/" }
];
const NAV_OPS = [
  { label: "Executive summary", path: "/executive-summary/" },
  { label: "Dashboard", path: "/dashboard/" },
  { label: "How we verified", path: "/verify/" },
  { label: "Flagged for review", path: "/flagged/" },
  { label: "Suggestion board", path: "/suggestions/" },
  { label: "Decision brief", path: "/decision-brief/" },
  { label: "Measurement", path: "/measurement/" }
];
const MARK =
  '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="13.2" fill="none" stroke="currentColor" stroke-width="2.1"/><path d="M16 16 21.3 9.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="16" cy="16" r="2" fill="currentColor"/><path d="M5.4 20.5A11 11 0 0 0 11 26.4" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" opacity=".55"/></svg>';

function disclosureStrip(base, { variant = "top" } = {}) {
  const href = variant === "footer" ? rel(base, "/disclosure/") : rel(base, "/disclosure/");
  return `
  <aside class="${variant === "footer" ? "disclosure disclosure--foot" : "disclosure"}" id="disclosure-strip">
    <p>
      <strong>Reader-supported.</strong> ${esc(cfg.affiliate.statement)} Links to Amazon are paid links — if you buy through one we may earn a commission, at no cost to you.
      <a href="${href}">How disclosure works here</a>.
    </p>
  </aside>`;
}
function navHtml(base, active) {
  const item = (n) =>
    `<a href="${rel(base, n.path)}"${n.path === active ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`;
  return `
  <nav class="mainnav" id="mainnav" aria-label="Sections">
    <div class="mainnav__reader">${NAV_READER.map(item).join("")}</div>
    <div class="mainnav__ops">
      <span class="mainnav__opslabel">Inside the numbers</span>
      ${NAV_OPS.map(item).join("")}
    </div>
  </nav>`;
}
function footerHtml(base) {
  const col = (title, links) =>
    `<nav class="footcol" aria-label="${esc(title)}"><h3>${esc(title)}</h3><ul>${links
      .map((l) => `<li><a href="${rel(base, l.path)}">${esc(l.label)}</a></li>`)
      .join("")}</ul></nav>`;
  return `
  <footer class="sitefoot">
    <div class="wrap footgrid">
      ${col("Sections", categories.map((c) => ({ label: c.name, path: `/section/${c.slug}/` })))}
      ${col("Guides", [
        ...guides.slice(0, 5).map((g) => ({ label: g.meta.title.split(":")[0], path: `/guides/${g.meta.slug}/` })),
        { label: "All guides", path: "/guides/" }
      ])}
      ${col("Inside the numbers", [...NAV_OPS, { label: "Campaign ledger", path: "/dashboard/#ledger" }, { label: "Source register", path: "/verify/" }])}
      ${col("The fine print", [
        { label: "Amazon disclosure", path: "/disclosure/" },
        { label: "Editorial standards", path: "/editorial-standards/" },
        { label: "Privacy", path: "/privacy/" },
        { label: "About this publication", path: "/about/" },
        { label: "Contact", path: "/contact/" },
        { label: "RSS feed", path: "/feed.xml" },
        { label: "Sitemap", path: "/sitemap.xml" }
      ])}
    </div>
    <div class="wrap footend">
      ${disclosureStrip(base, { variant: "footer" })}
      <p class="footmeta">
        <span class="brand-inline">${MARK}<span>${esc(cfg.brand.name)}</span></span>
        ${esc(cfg.brand.descriptor)}. ${esc(cfg.editorial.testingNote)} Built from ${esc(cfg.repo.replace("https://github.com/", ""))};
        published ${esc(longDate(cfg.updated))}. No product was tested in the making of this site.
      </p>
    </div>
  </footer>`;
}

function layout({ title, desc, path, base, body, type = "page", jsonLd = [], noIndex = false, hero = null }) {
  // "/guides/x/" -> docs/guides/x/index.html ; "/404.html" -> docs/404.html
  const out = path === "/" ? "index.html" : path.replace(/^\//, "").replace(/\/$/, "") + (path.endsWith("/") ? "/index.html" : "");
  const u = abs(path);
  const ld = jsonLd.length ? jsonLd.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n  ") : "";
  const html = `<!doctype html>
<html lang="${cfg.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(u)}">
${noIndex ? '<meta name="robots" content="noindex,follow">' : ""}
<meta property="og:site_name" content="${esc(cfg.brand.name)}">
<meta property="og:type" content="${type === "guide" ? "article" : "website"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(u)}">
<meta property="og:image" content="${esc(abs("/assets/img/hero-countertop.jpg"))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#f7f2ea">
<link rel="alternate" type="application/rss+xml" title="${esc(cfg.brand.name)} — guides" href="${esc(abs("/feed.xml"))}">
<link rel="icon" href="${rel(base, "/assets/favicon.svg")}" type="image/svg+xml">
<link rel="stylesheet" href="${rel(base, "/assets/styles.css")}">
${ld}
</head>
<body class="t-${esc(type)}" data-base="${esc(base)}" data-endpoint="${esc(cfg.measurement.endpoint || "")}" data-brand="${esc(cfg.brand.name)}">
<a class="skip" href="#main">Skip to the main text</a>
<header class="masthead">
  <div class="wrap masthead__row">
    <a class="brand" href="${rel(base, "/")}">
      <span class="brand__mark">${MARK}</span>
      <span class="brand__name">${esc(cfg.brand.name)}</span>
      <span class="brand__kicker">${esc(cfg.brand.kicker)}</span>
    </a>
    <button class="menubtn" aria-expanded="false" aria-controls="mainnav">Menu</button>
    ${navHtml(base, path)}
  </div>
  ${disclosureStrip(base)}
</header>
${hero ? `<div class="wrap">${hero}</div>` : ""}
<main id="main" class="wrap ${type === "guide" ? "wrap--read" : ""}">
${body}
</main>
${footerHtml(base)}
<script src="${rel(base, "/assets/app.js")}" defer></script>
</body>
</html>`;
  addPage({ path, title, desc, type, noIndex });
  write(out, html);
  return html;
}

// ------------------------------------------------------------------ components
function productCard(p, base, { slot = "shelf", detail = false } = {}) {
  const title = p.title || R('<span class="pending-title">Listing not verified</span>');
  const blurb = p.title ? "" : `<p class="card-note">Nothing about this listing is confirmed yet — no name, no price, no rating. The register page says exactly what is missing.</p>`;
  const href = p.official_listing_url;
  const cta = cfg.affiliate.linksEnabled && href
    ? R(`<a class="btn btn--buy" href="${esc(href)}" rel="sponsored nofollow" data-track="outbound_click" data-product="${esc(p.id)}" data-slot="${esc(slot)}">Check the listing <span class="paid">(paid link)</span></a>`)
    : R(`<button class="btn btn--locked" type="button" data-track="gate_block" data-product="${esc(p.id)}" data-slot="${esc(slot)}" data-reason="unverified-listing" aria-describedby="lock-${esc(p.id)}">Listing unverified — link locked</button>`);
  const rows = [
    ["Price", p.price === null ? na("No price is printed until a live listing can be checked (Q-13)") : `${p.price} ${p.currency || ""}`],
    ["Rating", p.star_rating === null ? na("No star rating is printed: it belongs to someone else's scale") : `${p.star_rating} from ${p.rating_count} ratings`],
    ["Brand", p.brand === null ? na() : p.brand],
    ["Filed under", p.category === null ? R(`<a href="${rel(base, "/decision-brief/#q-06")}">awaiting confirmation</a>`) : p.category]
  ];
  const dl = `<dl class="cardfacts">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${isRaw(v) ? v.__html : esc(v)}</dd></div>`).join("")}</dl>`;
  return `<article class="card" data-impression data-product="${esc(p.id)}">
  <header class="card__head"><h3>${isRaw(title) ? title.__html : esc(title)}</h3><span class="card__id">in intake</span></header>
  ${blurb}
  ${dl}
  <p id="lock-${esc(p.id)}" class="card__lock">${esc(cfg.affiliate.linksDisabledReason)}</p>
  ${isRaw(cta) ? cta.__html : esc(cta)}
  ${detail ? "" : `<p class="card__more"><a href="${rel(base, `/product/${p.id.toLowerCase()}/`)}">Why this one is locked →</a></p>`}
</article>`;
}
function shelf(base, { limit = 5, heading = "The shelf", strap = "" } = {}) {
  const items = products.products.slice(0, limit).map((p) => productCard(p, base, { slot: heading === "The shelf" ? "hero" : "shelf" }));
  return `<section class="shelf">
  <div class="shelf__head">
    <h2>${esc(heading)}</h2>
    <p>${esc(strap)}</p>
    <p class="shelf__state"><span class="chip chip--lock">0 verified listings</span> <span class="chip">${products.products.length} intake records</span></p>
  </div>
  <div class="cards">${items.join("\n")}</div>
</section>`;
}
function guideCard(g, base, { lead = false } = {}) {
  const m = g.meta;
  const cat = categories.find((c) => c.slug === m.section);
  return `<article class="gcard${lead ? " gcard--lead" : ""}">
  <a class="gcard__link" href="${rel(base, `/guides/${m.slug}/`)}">
    <span class="gcard__kicker">${esc(cat ? cat.name : "Guide")}</span>
    <h3>${esc(m.title)}</h3>
    <p>${esc(m.dek)}</p>
    <span class="gcard__meta">${m.readMinutes} min · reviewed ${esc(longDate(m.lastReviewed))}</span>
  </a>
</article>`;
}

// ------------------------------------------------------------------ guides
const guides = [];
{
  const dir = join(ROOT, "site/content/guides");
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith(".mjs")) continue;
    const mod = await import(pathToFileURL(join(dir, f)).href);
    guides.push({ meta: mod.meta, body: mod.body });
  }
}
guides.sort((a, b) => (a.meta.published < b.meta.published ? 1 : -1));
const bySlug = Object.fromEntries(guides.map((g) => [g.meta.slug, g]));

function whatWeDidNotCheck(base) {
  return `<section class="notchecked">
  <h2>What we did not check</h2>
  <ul>
    <li>We have not used, measured, or timed any appliance while writing this.</li>
    <li>We print no price, no star rating, and no availability, because we have no verified listing to read them from.</li>
    <li>Nothing here ranks anything. There is no "top pick", because a ranking needs a comparison set and we do not have one.</li>
  </ul>
  <p class="notchecked__link"><a href="${rel(base, "/verify/")}">See what we did check</a> · <a href="${rel(base, "/flagged/")}">open items</a></p>
</section>`;
}
function sourcesBlock(base, ids) {
  if (!ids || !ids.length)
    return `<p class="methodline">Method for this page: a buyer's checklist assembled from the questions in the project brief. No external source was quoted, so there is no source to click — and no claim for you to check. <a href="${rel(base, "/editorial-standards/")}">Our standard</a>.</p>`;
  const rows = ids.map((id) => {
    const s = sources.sources.find((x) => x.id === id);
    return [s.id, s.issuer, R(`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.clause || s.title)}</a>`), R(`<q>${esc(s.quote.length > 240 ? s.quote.slice(0, 237) + "…" : s.quote)}</q>`), s.retrieved || sources.retrieved];
  });
  return `<section class="sourcesblock">
  <h2>Sources for the few numbers on this page</h2>
  ${tableBlock(["ID", "Who published it", "What we read", "As quoted", "Checked"], rows, {
    note: `Full register with every clause we relied on: <a href="${rel(base, "/verify/")}">/verify/</a>.`
  })}
</section>`;
}

function renderGuide(g) {
  const base = "../..";
  const m = g.meta;
  const cat = categories.find((c) => c.slug === m.section);
  const crumb = [{ name: cfg.brand.name, path: "/" }, { name: cat ? cat.name : "Guides", path: cat ? `/section/${cat.slug}/` : "/guides/" }, { name: m.title, path: `/guides/${m.slug}/` }];
  const bodyHtml = g.body.replaceAll("{{base}}", base);
  const faq = (m.faq || []).map((f) => `<div class="faq__item"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("");
  const related = guides
    .filter((o) => o.meta.slug !== m.slug && (o.meta.section === m.section || o.meta.seasons.some((s) => m.seasons.includes(s))))
    .slice(0, 3);
  const body = `
<article class="guide">
  <header class="guide__head">
    <p class="crumbs">${crumb.map((c, i) => (i === crumb.length - 1 ? `<span>${esc(c.name)}</span>` : `<a href="${rel(base, c.path)}">${esc(c.name)}</a>`)).join(" <span>/</span> ")}</p>
    <p class="kicker">${esc(cat ? cat.name : "Guide")} <span class="kicker__sep">·</span> ${esc(cat ? cat.strapline : cfg.brand.kicker)}</p>
    <h1>${esc(m.title)}</h1>
    <p class="dek">${esc(m.dek)}</p>
    <p class="byline">By <strong>${esc(cfg.brand.byline)}</strong> · published ${esc(longDate(m.published))} · last reviewed ${esc(longDate(m.lastReviewed))} · ${m.readMinutes} min</p>
    <p class="byline-note">${esc(m.hypotheses)} ${esc(cfg.affiliate.trackingId ? "" : "")}${esc(cfg.brand.bylineNote)}</p>
    <p class="telling">We have not tested any appliance for this guide. It is a checklist you can finish, not a verdict you have to trust. <a href="${rel(base, "/editorial-standards/")}">Why we publish like this</a>.</p>
  </header>
  <div class="prose">
  ${bodyHtml}
  </div>
  ${faq ? `<section class="faq"><h2>Short answers</h2>${faq}</section>` : ""}
  ${shelf(base, { heading: "The shelf: what we have lined up", strap: "Five listings are in intake. None has cleared verification yet, so nothing here carries a price, a rating, or a link." })}
  ${whatWeDidNotCheck(base)}
  ${sourcesBlock(base, m.sourceIds)}
  ${related.length ? `<section class="alsopack"><h2>Read next in this section</h2><div class="gcards">${related.map((o) => guideCard(o, base)).join("")}</div></section>` : ""}
  ${signupBlock(base)}
</article>`;
  layout({
    title: `${m.title} | ${cfg.brand.name}`,
    desc: m.dek,
    path: `/guides/${m.slug}/`,
    base,
    type: "guide",
    body,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: m.title,
        description: m.dek,
        datePublished: m.published,
        dateModified: m.lastReviewed,
        author: { "@type": "Organization", name: cfg.brand.byline },
        publisher: { "@type": "Organization", name: cfg.brand.name },
        mainEntityOfPage: abs(`/guides/${m.slug}/`),
        articleSection: cat ? cat.name : null
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: crumb.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) }))
      },
      m.faq && m.faq.length
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: m.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } }))
          }
        : null
    ].filter(Boolean)
  });
}

function signupBlock(base) {
  return `<section class="capture" data-capture>
  <div class="capture__text">
    <h2>One email when a new guide lands</h2>
    <p>No offer alerts, no "hot deals". When we publish a guide, subscribers get it, and get told plainly if a listing on it failed verification.</p>
  </div>
  <form class="capture__form" disabled aria-disabled="true">
    <label for="signup-email">Email</label>
    <input id="signup-email" type="email" name="email" placeholder="you@example.com" disabled>
    <button type="submit" disabled>Not wired yet</button>
    <p class="capture__state">Deliberately inactive: there is no storage decision or privacy policy for addresses yet, so nothing on this page transmits anything.</p>
  </form>
</section>`;
}

// ------------------------------------------------------------------ pages
function homeHero(base) {
  const lead = guides[0];
  const rest = guides.slice(1, 4);
  return `<section class="hero">
  <div class="hero__lead">
    <p class="kicker">Lead</p>
    ${guideCard(lead, base, { lead: true })}
  </div>
  <div class="hero__side">
    <h2 class="sr-only">Also on the front page</h2>
    <div class="gcards gcards--stack">${rest.map((g) => guideCard(g, base)).join("")}</div>
  </div>
</section>`;
}
function renderHome() {
  const base = ".";
  const body = `
${homeHero(base)}
<figure class="frontfig">
  <img src="${rel(base, "/assets/img/hero-countertop.jpg")}" alt="Risograph-style illustration of two air fryers, a thermometer and a printed checklist on a kitchen worktop in morning light" width="1376" height="768">
  <figcaption>Illustration made for this site. It shows the two shapes worth choosing between, and the one tool that matters more than either.</figcaption>
</figure>
<section class="rail">
  <h2>Pick your section</h2>
  <div class="rail__grid">
    ${categories
      .map(
        (c) => `<a class="railcard" href="${rel(base, `/section/${c.slug}/`)}">
      <h3>${esc(c.name)}</h3><p class="railcard__strap">${esc(c.strapline)}</p><p>${esc(c.blurb)}</p>
      <p class="railcard__meta">${c.guides.length} guides · ${c.products_verified} verified listing${c.products_verified === 1 ? "" : "s"} · ${c.products_pending} in intake</p></a>`
      )
      .join("")}
  </div>
</section>
${shelf(base, { heading: "The shelf", strap: "What we are lining up for this section of the kitchen — with the paperwork visible instead of hidden." })}
<section class="questions">
  <h2>The questions people actually ask</h2>
  <p class="section-strap">Our whole front page is built around these, because they are the questions a buying decision turns on. They are ours, not a search report: we have no query data yet, and we will not pretend to.</p>
  <ul class="qlist">
    ${guides
      .slice(0, 6)
      .map((g) => `<li><a href="${rel(base, `/guides/${g.meta.slug}/`)}">${esc(g.meta.title)}</a><span>${esc(g.meta.dek.split(".")[0])}.</span></li>`)
      .join("")}
  </ul>
</section>
<section class="twostrip">
  <div>
    <h2>You can check every number we print</h2>
    <p>Most advice sites have one source: the author. This one has a register — the official documents we read, the clause, the quotation, and the date it was checked — plus a list of everything we could not confirm. If a row here is wrong, the fix is a pull request.</p>
    <p class="actions"><a class="btn" href="${rel(base, "/verify/")}">Read the register</a> <a class="btn ghost" href="${rel(base, "/flagged/")}">What is unresolved</a></p>
  </div>
  <figure class="twostrip__img">
    <img src="${rel(base, "/assets/img/register.jpg")}" alt="Illustration of a printed checklist beside a laptop and a magnifying glass, on a kitchen worktop" width="1264" height="848" loading="lazy">
    <figcaption>Illustration made for this site — not a photograph of a test kitchen, because there is no test kitchen.</figcaption>
  </figure>
</section>
<section class="ops">
  <h2>For the owner: where the programme stands</h2>
  <p class="section-strap">Reader pages end above. These are the working surfaces, one click from here and from the footer.</p>
  <div class="ops__grid">
    ${[
      ["Executive summary", "The state of the project in one page.", "/executive-summary/"],
      ["Dashboard", "Every register, ledger and record in tables.", "/dashboard/"],
      ["Suggestion board", `${sugg.suggestions.length} options, three paths, your call.`, "/suggestions/"],
      ["Decision brief", `${questions.length} questions gating every decision.`, "/decision-brief/"],
      ["Flagged for review", `${flags.length} open items, each with its source links.`, "/flagged/"],
      ["Measurement", `${events.events.length} events, one endpoint, no profiles.`, "/measurement/"]
    ]
      .map(
        ([t, d, p]) => `<a class="opscard" href="${rel(base, p)}"><h3>${esc(t)}</h3><p>${esc(d)}</p><span class="opscard__go">Open →</span></a>`
      )
      .join("")}
  </div>
</section>`;
  layout({
    title: `${cfg.brand.name} — ${cfg.brand.kicker}`,
    desc: cfg.brand.tagline,
    path: "/",
    base,
    type: "home",
    hero: null,
    body,
    jsonLd: [
      { "@context": "https://schema.org", "@type": "WebSite", name: cfg.brand.name, url: abs("/"), description: cfg.brand.tagline, publisher: { "@type": "Organization", name: cfg.brand.name } },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Guides",
        itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/guides/${g.meta.slug}/`), name: g.meta.title }))
      }
    ]
  });
}
function renderGuidesIndex() {
  const base = "..";
  const body = `
<header class="pagehead">
  <h1>Every guide we have published</h1>
  <p class="pagehead__dek">Six pieces, all of them built to leave you with a decision you can defend. None of them tells you what is best, because we have not tested anything to compare. What they do is hand you the list of questions and the two numbers worth writing down.</p>
</header>
<div class="gcards gcards--grid">${guides.map((g) => guideCard(g, base)).join("")}</div>
${sectionClusters()}
${signupBlock(base)}`;
  function sectionClusters() {
    return `<section class="clusters"><h2>By section</h2><div class="clusters__grid">${categories
      .map((c) => {
        const gs = guides.filter((g) => g.meta.section === c.slug);
        return `<div class="cluster"><h3><a href="${rel(base, `/section/${c.slug}/`)}">${esc(c.name)}</a></h3><ul>${gs
          .map((g) => `<li><a href="${rel(base, `/guides/${g.meta.slug}/`)}">${esc(g.meta.title)}</a></li>`)
          .join("")}</ul></div>`;
      })
      .join("")}</div></section>`;
  }
  layout({ title: `Buying guides | ${cfg.brand.name}`, desc: `Every guide published so far — ${guides.length} pieces on air fryers, multi-cookers, cleanup and counter space, organised by the question each one answers.`, path: "/guides/", base, type: "index", body, jsonLd: [
    crumbLd([{ name: cfg.brand.name, path: "/" }, { name: "Guides", path: "/guides/" }]),
    { "@context": "https://schema.org", "@type": "ItemList", name: "Published guides", itemListElement: guides.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: abs(`/guides/${g.meta.slug}/`), name: g.meta.title })) }
  ] });
}
function renderSection(c) {
  const base = "../..";
  const gs = c.guides.map((s) => bySlug[s]).filter(Boolean);
  const pending = products.products;
  const body = `
<header class="pagehead pagehead--section">
  <p class="kicker">${esc(c.name)}</p>
  <h1>${esc(c.strapline)}</h1>
  <p class="pagehead__dek">${esc(c.blurb)}</p>
</header>
<section class="compare-on">
  <h2>Compare on this, in this order</h2>
  <ol class="numbers numbers--tight">${c.compare_on.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>
</section>
<section class="gcards gcards--grid">
  <h2>Guides in this section</h2>
  ${gs.map((g) => guideCard(g, base)).join("")}
</section>
${shelf(base, { heading: "Listings filed here", limit: 5, strap: "Filed, not endorsed. Nothing on this shelf has cleared verification, so there is no price, no rating and no link — see each register entry for what is missing." })}
<section class="pending">
  <h2>What has to happen before this section can sell anything</h2>
  <p>${pending.length} intake records sit in the product register. Each needs a 10-character ASIN, an official listing URL, a confirmation date, and one tagged link tested in Associates Central. Until then this page teaches, and does not recommend.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/picks/")}">See the shelf state</a> <a class="btn ghost" href="${rel(base, "/decision-brief/#q-01")}">The one answer that unblocks it</a></p>
  <p class="sheet"><a class="btn ghost" href="${rel(base, "/tools/#sheet:" + c.slug)}" data-sheet="${esc(c.slug)}">Print a blank comparison sheet for this section</a></p>
</section>
${whatWeDidNotCheck(base)}`;
  layout({
    title: `${c.name} — ${c.strapline} | ${cfg.brand.name}`,
    desc: c.blurb,
    path: `/section/${c.slug}/`,
    base,
    type: "section",
    body,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: c.name,
        description: c.blurb,
        url: abs(`/section/${c.slug}/`),
        hasPart: gs.map((g) => ({ "@type": "CreativeWork", name: g.meta.title, url: abs(`/guides/${g.meta.slug}/`) }))
      }
    ]
  });
}
function renderProductPage(p) {
  const base = baseFor(`/product/${p.id.toLowerCase()}/`);
  const rec = intents.records.find((r) => r.product_id === p.id);
  const fields = [
    ["Submitted string", R(`<code>${esc(p.submitted_ref)}</code>`)],
    ["Submitted URL", R(`<code>${esc(p.submitted_url)}</code>`)],
    ["Character count", `${p.asin_length} (an ASIN is 10)`],
    ["Passes ASIN format check", p.matches_asin_format ? "yes" : "no"],
    ["Title", p.title],
    ["Brand", p.brand],
    ["Price", p.price],
    ["Star rating", p.star_rating],
    ["Rating count", p.rating_count],
    ["Availability", p.availability],
    ["Official listing URL", p.official_listing_url],
    ["Commission category", p.commission_category],
    ["Link state", R(`<span class="chip chip--lock">${esc(p.link_state)}</span>`)],
    ["Flags", R(p.flags.map((f) => `<a class="chip chip--flag" href="${rel(base, `/flagged/#${f.toLowerCase()}`)}">${esc(f)}</a>`).join(" "))],
    ["Source of the format rule", srcLink("SRC-08")]
  ];
  const body = `
<header class="pagehead">
  <p class="kicker">Product register</p>
  <h1>${esc(p.title || "Listing not yet identified")}</h1>
  <p class="pagehead__dek">${esc(p.notes)}</p>
  <p class="notice notice--block">No recommendation, no rating, no link. This page documents what was submitted, what we could confirm, and what has to happen next. It is deliberately not a review.</p>
</header>
<section>
  <h2>What we can confirm</h2>
  ${tableBlock(["Field", "Value"], fields, { caption: `${p.id} — intake record`, note: `Intake date ${esc(longDate(products.intake_date))}. Legend: <code>—</code> means the value could not be confirmed from an official source, so it is left blank rather than estimated.` })}
</section>
<section>
  <h2>Product-intent record</h2>
  <p>Two separate blocks, never merged: what was <em>meant</em> to be promoted, and what a link was <em>observed</em> to do. Only the first is a claim about the product; only the second is a claim about a redirect.</p>
  ${tableBlock(
    ["Intent field", "Value"],
    [
      ["intended_asin", R(`<code>${esc(rec.intent.intended_asin)}</code> · valid: ${rec.intent.intended_asin_valid ? "yes" : "no"}`)],
      ["official_listing_url", rec.intent.official_listing_url],
      ["confirmation_date", rec.intent.confirmation_date],
      ["confirmation_source", rec.intent.confirmation_source],
      ["confirmed_by", rec.intent.confirmed_by],
      ["statement of intent", rec.intent.statement_of_intent]
    ],
    { caption: "intent (what the owner said)" }
  )}
  ${tableBlock(
    ["Observation field", "Value"],
    [
      ["observed_redirect_targets", rec.observation.observed_redirect_targets.length ? JSON.stringify(rec.observation.observed_redirect_targets) : na("Nothing was observed, so nothing is recorded")],
      ["observed_at", rec.observation.observed_at],
      ["method", rec.observation.method],
      ["outcome", rec.observation.outcome]
    ],
    { caption: "observation (what actually happened)", note: `Gate: <strong>${esc(rec.gate.status)}</strong> — ${rec.gate.blocking_reasons.map((b) => esc(b)).join("; ")}.` }
  )}
</section>
<section>
  <h2>How to clear this record</h2>
  <ol class="numbers numbers--tight">${rec.gate.clear_when.map((s, i) => `<li>${i + 1 === 1 ? "Replace the value with a real 10-character ASIN — copy it from the product page URL, after <code>/dp/</code>." : esc(s)}</li>`).join("")}</ol>
  <p class="actions">
    <a class="btn ghost" href="https://affiliate-program.amazon.com/home/productlinks/search" target="_blank" rel="noopener">Associates link builder (sign-in required)</a>
    <a class="btn ghost" href="${rel(base, "/flagged/#flg-001")}">Why the identifier failed</a>
    <a class="btn ghost" href="${rel(base, "/dashboard/#intents")}">All five records</a>
  </p>
</section>
${shelf(base, { heading: "Other listings in intake", strap: "", limit: 5 })}`;
  layout({
    title: `${p.id} ${p.title ? "— " + p.title : "— unverified listing record"} | ${cfg.brand.name}`,
    desc: `Register entry for the submitted identifier ${p.submitted_ref}. Verification state, intent record, and what is needed to publish a link.`,
    path: `/product/${p.id.toLowerCase()}/`,
    base,
    type: "record",
    body,
    noIndex: true
  });
}
function renderPicks() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">The shelf</p>
  <h1>Five listings, zero endorsements</h1>
  <p class="pagehead__dek">This is a shop that has not finished its paperwork. Below is every product we have in intake, with the fields that could not be confirmed left empty instead of filled in. When a record clears verification, its card gains a price, a rating, and a link — and the register shows when and how that happened.</p>
</header>
<figure class="frontfig frontfig--tight">
  <img src="${rel(base, "/assets/img/shelf.jpg")}" alt="Illustration of a shop shelf with five unbranded appliance silhouettes and empty price-tag holders" width="1264" height="848">
  <figcaption>An honest picture of the current state: five shapes on a shelf, no labels, no prices, and one padlock where the buy button would be.</figcaption>
</figure>
${shelf(base, { heading: "In intake", strap: "Tap any card for the register entry behind it." })}
<section class="whylocked">
  <h2>Why the buy buttons say “locked”</h2>
  <div class="whylocked__grid">
    <div><h3>The identifiers are the wrong length</h3><p>Amazon defines an ASIN as a unique 10-character alphanumeric code. All five submitted values are 9 characters. There is no listing to link to, and a link that 404s is worse for a reader than no link. <a href="${rel(base, "/flagged/#flg-001")}">FLG-001</a>.</p></div>
    <div><h3>The host is not Amazon's</h3><p>Product pages live at <code>amazon.com/dp/&lt;ASIN&gt;</code> and an Associates link carries the tag as a URL parameter. The submitted form has neither, so it cannot be shown to attribute a click. <a href="${rel(base, "/flagged/#flg-002")}">FLG-002</a>.</p></div>
    <div><h3>Nothing was called invalid</h3><p>Where the supplied short links go was not observed from here. “Unobserved” is not “invalid”, and the copy refuses to swap the two. <a href="${rel(base, "/flagged/#flg-003")}">FLG-003</a>.</p></div>
  </div>
  <p class="actions"><a class="btn" href="${rel(base, "/decision-brief/#q-01")}">The one answer that changes this page</a> <a class="btn ghost" href="${rel(base, "/editorial-standards/#links")}">Our link rules</a></p>
</section>`;
  layout({ title: `The shelf — what is in intake | ${cfg.brand.name}`, desc: "Every product record, its verification state, and exactly what is missing before a buy link can be published here.", path: "/picks/", base, type: "shop", body, jsonLd: [crumbLd([{ name: cfg.brand.name, path: "/" }, { name: "The shelf", path: "/picks/" }])] });
}

// ------------------------------------------------------------------ seasonal
const SEASONS = load("data/seasons.json").seasons;
function renderSeasonalIndex() {
  const base = "..";
  const rows = Object.entries(SEASONS).map(([slug, s]) => {
    const gs = guides.filter((g) => g.meta.seasons.includes(slug));
    return [
      R(`<a href="${rel(base, `/seasonal/${slug}/`)}">${esc(s.name)}</a>`),
      s.why,
      gs.length ? R(gs.map((g) => `<a href="${rel(base, `/guides/${g.meta.slug}/`)}">${esc(g.meta.title.split(":")[0])}</a>`).join("<br>")) : na("No guide filed here yet"),
      R(gs.length ? `${gs.length} guide${gs.length === 1 ? "" : "s"}` : "0 guides")
    ];
  });
  const body = `
<header class="pagehead">
  <p class="kicker">Clusters</p>
  <h1>Guides, by when the question gets asked</h1>
  <p class="pagehead__dek">Season pages assemble what already exists. They promise no deals, no price drops and no gift-guide verdicts, because we have no price data and no tested products — a season page here is a reading order, not a promotion.</p>
</header>
${tableBlock(["Season", "Why it changes the decision", "Filed here", "Depth"], rows, {
    caption: "Seasonal clusters",
    note: "Every cluster is regenerated from the guides' own tags at build time, so a new guide appears in its seasons without anyone editing a second file. A cluster with no guides is skipped rather than shipped empty."
})}
${signupBlock(base)}`;
  layout({ title: `Seasonal clusters | ${cfg.brand.name}`, desc: "Buying guides grouped by the moment the question gets asked: holiday cooking, weeknights, batch cooking, small kitchens and rentals.", path: "/seasonal/", base, type: "index", body, jsonLd: [crumbLd([{ name: cfg.brand.name, path: "/" }, { name: "Clusters", path: "/seasonal/" }])] });
}
function crumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) }))
  };
}
function renderSeason(slug, s) {
  const base = baseFor(`/seasonal/${slug}/`);
  const gs = guides.filter((g) => g.meta.seasons.includes(slug));
  const body = `
<header class="pagehead">
  <p class="kicker"><a href="${rel(base, "/seasonal/")}">Cluster</a> · ${esc(s.name)}</p>
  <h1>${esc(s.name)}</h1>
  <p class="pagehead__dek">${esc(s.why)}</p>
</header>
<div class="gcards gcards--grid">${gs.map((g) => guideCard(g, base)).join("")}</div>
<section class="pending">
  <h2>Assembly note</h2>
  <p>This page is generated from the season tags on ${gs.length} guide${gs.length === 1 ? "" : "s"}. It carries no pricing, availability or deal claim, and it is re-checked on the same ${cfg.editorial.reviewIntervalDays}-day review interval as the guides it points at.</p>
  <p class="actions"><a class="btn ghost" href="${rel(base, "/seasonal/")}">All clusters</a> <a class="btn ghost" href="${rel(base, "/editorial-standards/#review")}">How review dates work</a></p>
</section>`;
  layout({ title: `${s.name} — guides | ${cfg.brand.name}`, desc: `${s.why} ${gs.length} guide${gs.length === 1 ? "" : "s"} filed in this cluster, assembled from the tags on the guides themselves.`, path: `/seasonal/${slug}/`, base, type: "index", body, jsonLd: [crumbLd([{ name: cfg.brand.name, path: "/" }, { name: "Clusters", path: "/seasonal/" }, { name: s.name, path: `/seasonal/${slug}/` }])] });
}

// ------------------------------------------------------------------ tools
function renderTools() {
  const base = "..";
  const sheets = categories
    .map(
      (c) => `<section class="sheetblock" id="sheet:${c.slug}">
  <h3>${esc(c.name)}</h3>
  <p class="sheetblock__hint">Fill the columns in the shop or at the kitchen table. Blank on purpose: we are not pre-filling competitor claims we cannot source.</p>
  <table class="sheet" data-sheet="${esc(c.slug)}"><thead><tr><th>What to check</th><th>Model 1</th><th>Model 2</th><th>Model 3</th></tr></thead>
  <tbody>${c.compare_on.map((q) => `<tr><td>${esc(q)}</td><td class="blank"></td><td class="blank"></td><td class="blank"></td></tr>`).join("")}</tbody></table>
</section>`
    )
    .join("");
  const body = `
<header class="pagehead">
  <p class="kicker">Tools</p>
  <h1>Two calculators and a printable sheet</h1>
  <p class="pagehead__dek">Everything on this page computes from what you type. We deliberately print no appliance figures of our own: there is no verified listing to take them from, and a made-up wattage would turn a useful tool into a lie with a decimal point.</p>
</header>
<div class="tools">
  <section class="tool" id="costrun">
    <h2>What it costs to run</h2>
    <p>Type the wattage from the listing&#39;s own spec table and your supplier&#39;s rate per kWh. The arithmetic is printed next to the answer so you can check it rather than trust it.</p>
    <div class="toolbox toolbox--page" data-tool="costrun" data-warn="Preheat ramps and thermostat idling are not in this model, which is why the answer is a range. Treat the listing&#39;s stated wattage as a starting point, not a measurement."></div>
  </section>
  <section class="tool" id="footprint">
    <h2>Will it fit your counter</h2>
    <p>Appliance dimensions come from the listing; the gap is whatever your own manual demands around the unit. Enter both and see the space you actually have to clear.</p>
    <div class="toolbox toolbox--page" data-tool="footprint" data-warn="Clearance is an input here, not a claim. Some manuals ask for 5 cm at the back, others 15 cm all round plus a non-combustible wall — a number invented on this page would be the most dangerous figure on it."></div>
  </section>
</div>
<section class="sheets">
  <h2>Comparison sheets, one per section</h2>
  <p>The rows come from each section's compare-on list, so the sheet and the section can never drift apart.</p>
  ${sheets}
</section>
${whatWeDidNotCheck(base)}`;
  layout({ title: `Cost-to-run and counter-fit calculators | ${cfg.brand.name}`, desc: "Two calculators driven entirely by numbers you supply, plus a printable comparison sheet for each section of the site.", path: "/tools/", base, type: "tool", body, jsonLd: [crumbLd([{ name: cfg.brand.name, path: "/" }, { name: "Tools", path: "/tools/" }])] });
}
function renderSearch() {
  const base = "..";
  const body = `
<header class="pagehead">
  <h1>Search the site</h1>
  <p class="pagehead__dek">Runs in your browser against an index built with the site — no third-party widget, no query leaves this page.</p>
</header>
<form class="search" role="search" data-search>
  <label for="q" class="sr-only">Search guides, sections and tools</label>
  <input id="q" type="search" placeholder="capacity, cleanup, chicken, multi-cooker…" autocomplete="off">
  <span class="search__count" data-count></span>
</form>
<ul class="results" data-results aria-live="polite"></ul>
<p class="search__hint">Try a question rather than a product name. That is how the pages are written.</p>`;
  layout({ title: `Search the guides | ${cfg.brand.name}`, desc: "Search every buying guide, section page, cluster and tool on the site — the index is built with the site and runs in your browser.", path: "/search/", base, type: "tool", body, jsonLd: [{ "@context": "https://schema.org", "@type": "WebSite", name: cfg.brand.name, url: abs("/"), potentialAction: { "@type": "SearchAction", target: abs("/search/?q={search_term_string}"), "query-input": "required name=search_term_string" } }] });
}

// ------------------------------------------------------------------ operations
function renderVerify() {
  const base = "..";
  const rows = sources.sources.map((s) => [
    s.id,
    s.issuer,
    R(`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>`),
    s.clause,
    R(`<q>${esc(s.quote)}</q>`),
    s.read_level,
    s.page_dated ? s.page_dated : na("The page carries no visible revision date"),
    s.retrieved || sources.retrieved,
    R((s.supports || []).map(esc).join("<br>"))
  ]);
  const unverified = products.products.flatMap((p) => (p.unverified_fields || []).map((f) => [p.id, f, "FLG-001 / FLG-002"]));
  const body = `
<header class="pagehead">
  <p class="kicker">Register</p>
  <h1>What was verified, line by line</h1>
  <p class="pagehead__dek">Every factual row on this site traces to a line in this table. Where a value could not be confirmed from an official source, it is blank on the page and named below — the two states are never merged, and a gap is never filled with a likely number.</p>
</header>
<section class="method">
  <h2>How each row was checked</h2>
  <ol class="numbers numbers--tight">
    <li>Locate the document on the publisher's own domain — no aggregator, no screenshot, no blog paraphrase.</li>
    <li>Read the page body and copy the clause that carries the obligation, so the quote is checkable against the page rather than against a summary.</li>
    <li>Record the page's own revision date when it shows one, and the date it was read.</li>
    <li>Note the read level honestly: a full page read is not the same as text matched from an official-domain excerpt, and the column says which it is.</li>
    <li>Re-check before anything is quoted to a reader; the gate flags any row older than ${cfg.editorial.reviewIntervalDays} days.</li>
  </ol>
  <p class="method__cmd">Re-run the register check: <code>npm run check:data</code> · refresh quotes against the live pages: <code>node tools/compliance-gate.mjs --refresh-sources</code></p>
</section>
${tableBlock(
    ["ID", "Publisher", "Document", "Clause", "As read", "Read level", "Page dated", "Checked", "What it supports"],
    rows,
    { caption: `Official source register — ${sources.sources.length} documents read on ${longDate(sources.retrieved)}`, note: "Quotations are reproduced for the purpose of checking compliance. If a document has changed since the date in the last column, the register is stale, not the internet." }
)}
<section>
  <h2>Referenced, not re-read</h2>
  <p>These are cited where they matter, and marked as not independently re-read from this environment, so nobody mistakes a standard for a verified quotation.</p>
  ${tableBlock(["Standard", "Canonical URL", "Status"], sources.referenced_standards.map((s) => [s.name, R(`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.url)}</a>`), s.status]), {})}
</section>
<section>
  <h2>Everything left blank, and why</h2>
  <p>${unverified.length} product fields are blank on purpose. A blank cell is a statement: no official source was found, so nothing was written.</p>
  ${tableBlock(["Record", "Field left blank", "Blocking flag"], unverified, {})}
</section>
<section class="refusals">
  <h2>Four things this register refuses to do</h2>
  <ul class="cross">
    <li>Correct a 9-character identifier by adding a plausible tenth character.</li>
    <li>Quote an Amazon policy from a blog post about an Amazon policy.</li>
    <li>Print a price, rating or stock claim gathered from a cached page.</li>
    <li>Present a redirect we did not observe as evidence about a product.</li>
  </ul>
</section>
<p class="actions actions--center"><a class="btn" href="${rel(base, "/flagged/")}">Open items</a> <a class="btn ghost" href="${rel(base, "/dashboard/")}">Dashboard</a></p>`;
  layout({ title: `How we verified | ${cfg.brand.name}`, desc: "The official source register: document, clause, quotation, read level, revision date and retrieval date for every claim this site makes.", path: "/verify/", base, type: "ops", body });
}
function renderDashboard() {
  const base = "..";
  const counts = [
    ["Guides published", guides.length],
    ["Sections", categories.length],
    ["Seasonal clusters", Object.keys(SEASONS).length],
    ["Listings in intake", products.products.length],
    ["Listings verified", products.products.filter((p) => p.link_state === "live").length],
    ["Monetized links live", 0],
    ["Official sources read", sources.sources.length],
    ["Open flags", flags.filter((f) => f.status === "open" || f.status === "needs review").length],
    ["Suggestions on the board", sugg.suggestions.length],
    ["Suggestions shipped in this build", sugg.suggestions.filter((s) => s.status === "shipped").length],
    ["Ledger rows", ledger.rows.length],
    ["Fields left blank", products.products.reduce((a, p) => a + (p.unverified_fields || []).length, 0)]
  ];
  const prodRows = products.products.map((p) => [
    p.id,
    R(`<a href="${rel(base, `/product/${p.id.toLowerCase()}/`)}"><code>${esc(p.submitted_ref)}</code></a>`),
    `${p.asin_length}/10`,
    p.matches_asin_format ? "pass" : R('<span class="chip chip--bad">fail</span>'),
    p.title || na(),
    p.price === null ? na("No live listing to read a price from") : p.price,
    p.star_rating === null ? na() : p.star_rating,
    p.official_listing_url || na(),
    R(`<span class="chip chip--lock">${esc(p.link_state)}</span>`),
    R(p.flags.map((f) => `<a class="chip chip--flag" href="${rel(base, `/flagged/#${f.toLowerCase()}`)}">${esc(f)}</a>`).join(" ")),
    srcLink("SRC-08", "ASIN definition")
  ]);
  const intentRows = intents.records.map((r) => [
    r.id,
    r.product_id,
    R(`<code>${esc(r.intent.intended_asin)}</code>`),
    r.intent.intended_asin_valid ? "yes" : "no",
    r.intent.official_listing_url || na(),
    r.intent.confirmation_date || na(),
    r.intent.confirmation_source || na(),
    r.observation.observed_redirect_targets.length ? r.observation.observed_redirect_targets.join(", ") : na("Not observed"),
    R(`<span class="chip chip--lock">${esc(r.gate.status)}</span>`)
  ]);
  const suggRows = sugg.suggestions.map((s) => [
    s.id,
    s.track,
    R(`<strong>${esc(s.title)}</strong><br><span class="dim">${esc(s.problem)}</span>`),
    R(`<span class="chip chip--${s.status.includes("ed") ? "ok" : "wait"}">${esc(s.status)}</span>`),
    s.effort,
    s.path ? R(s.path.split(",").map((x) => `<a href="${rel(base, "/suggestions/#path-" + x.toLowerCase())}">${esc("PATH-" + x)}</a>`).join(" ")) : "—",
    R(`${esc(s.risk)}`)
  ]);
  const qRows = questions.map((q) => [
    q.id,
    R(`<a href="${rel(base, `/decision-brief/#${q.id.toLowerCase()}`)}"><strong>${esc(q.question)}</strong></a>`),
    q.blocker ? R('<span class="chip chip--bad">blocking</span>') : "—",
    q.answer_format,
    q.who,
    q.default_if_unanswered
  ]);
  const flagRows = flags.map((f) => [
    f.id,
    R(`<a href="${rel(base, `/flagged/#${f.id.toLowerCase()}`)}">${esc(f.title)}</a>`),
    f.severity,
    f.area,
    R(`<span class="chip chip--${f.status === "by design" ? "ok" : "wait"}">${esc(f.status)}</span>`),
    f.sources.length ? R(f.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join("<br>")) : na("Internal finding; no external source applies")
  ]);
  const ledgerRows = ledger.rows.length
    ? ledger.rows.map((r) => ledger.columns.map((c) => r[c.key] ?? na()))
    : [ledger.columns.map((c, i) => (i === 0 ? R(`<em>empty — ${esc(ledger.columns.length)} columns defined, zero rows</em>`) : na("Awaiting an authorized report")))];
  const eventRows = events.events.map((e) => [
    R(`<code>${esc(e.name)}</code>`),
    e.fires,
    Object.keys(e.properties).map((k) => `<code>${esc(k)}</code>`).join(" "),
    e.informs
  ]);
  const cadenceRows = guides.map((g) => {
    const due = new Date(new Date(g.meta.lastReviewed + "T12:00:00Z").getTime() + cfg.editorial.reviewIntervalDays * 864e5).toISOString().slice(0, 10);
    return [g.meta.slug, g.meta.published, g.meta.lastReviewed, longDate(due), R(`<a href="${rel(base, `/guides/${g.meta.slug}/`)}">${esc(g.meta.title.slice(0, 52))}${g.meta.title.length > 52 ? "…" : ""}</a>`)];
  });
  const body = `
<header class="pagehead">
  <p class="kicker">Operations</p>
  <h1>The dashboard</h1>
  <p class="pagehead__dek">One table per register, no charts, no scores. A number appears here only when a report produced it; a dash means nobody has measured it yet, which is the correct reading of most of this page today.</p>
</header>
<section class="counters"><h2 class="sr-only">Counters</h2><dl>${counts
    .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
    .join("")}</dl></section>
<section id="products">
  <h2>Product register</h2>
  ${tableBlock(["ID", "Submitted", "ASIN length", "Format", "Title", "Price", "Rating", "Official URL", "State", "Flags", "Format rule"], prodRows, {
    caption: `${products.products.length} intake records — ${products.products.filter((p) => p.link_state === "live").length} cleared for links`,
    note: `Field states are set by <code>tools/collect.mjs</code> from a source you supply; nothing on this table is typed by hand. ${esc(products.link_state_legend.live)}`
  })}
</section>
<section id="intents">
  <h2>Product-intent confirmations</h2>
  <p>The intended listing and the observed redirect are separate columns, because they answer different questions and merging them is how a wrong claim gets made.</p>
  ${tableBlock(["Record", "Product", "Intended ASIN", "Valid", "Listing URL", "Confirmed", "Source", "Observed redirect", "Gate"], intentRows, { caption: "intent vs observation" })}
</section>
<section id="sources">
  <h2>Source register (summary)</h2>
  ${tableBlock(["ID", "Publisher", "Clause", "Read level", "Checked"], sources.sources.map((s) => [s.id, s.issuer, R(`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.clause)}</a>`), s.read_level, s.retrieved || sources.retrieved]), { note: `Full quotations: <a href="${rel(base, "/verify/")}">/verify/</a>.` })}
</section>
<section id="suggestions">
  <h2>Suggestion board (summary)</h2>
  ${tableBlock(["ID", "Track", "Suggestion", "Status", "Effort", "Path", "Risk"], suggRows, { note: `Reviewing surface with the decision controls: <a href="${rel(base, "/suggestions/")}">/suggestions/</a>.` })}
</section>
<section id="questions">
  <h2>Open questions</h2>
  ${tableBlock(["ID", "Question", "Blocks", "Answer type", "Who can answer", "Default taken if unanswered"], qRows, { note: `Each row names the report or tool that produces the answer: <a href="${rel(base, "/decision-brief/")}">/decision-brief/</a>.` })}
</section>
<section id="flags">
  <h2>Flagged for review</h2>
  ${tableBlock(["ID", "Finding", "Severity", "Area", "Status", "Source"], flagRows, { note: `<a href="${rel(base, "/flagged/")}">Full page with the clearing steps</a>.` })}
</section>
<section id="ledger">
  <h2>Campaign ledger</h2>
  <p class="section-strap">${esc(ledger.policy["null_semantics"])}</p>
  ${tableBlock(ledger.columns.map((c) => `${c.key}`), ledgerRows, {
    caption: "Empty by design",
    note: `Allowed sources only: ${ledger.policy.allowed_sources.map(esc).join(" · ")}. A row without a <code>provenance</code> value is rejected by the data validator, which is what keeps the empty state empty.`
  })}
  <p class="dim small">Derived metrics (orders per 100 clicks, EPC) are computed at render time from rows and print a dash while any input is null. See <code>data/campaign-ledger.json</code>.</p>
</section>
<section id="events">
  <h2>Events defined</h2>
  ${tableBlock(["Event", "Fires", "Fields", "What it informs"], eventRows, { note: `Spec and reference endpoint: <a href="${rel(base, "/measurement/")}">/measurement/</a>.` })}
</section>
<section id="cadence">
  <h2>Editorial cadence and review dates</h2>
  ${tableBlock(["Guide", "Published", "Reviewed", "Review due", "Title"], cadenceRows, {
    caption: `Proposed cadence: ${esc(cfg.editorial.cadence.target)} — status ${esc(cfg.editorial.cadence.status)} (${esc(cfg.editorial.cadence.decisionNeeded)})`,
    note: "Review interval is the project's own rule, not a policy requirement: any guide older than 90 days gets re-read against its sources before it is linked to again."
  })}
</section>
<section id="build">
  <h2>Build state</h2>
  ${tableBlock(["Item", "Value"], [["Pages generated", PAGES.length], ["Reader-facing", PAGES.filter((p) => !["ops", "record", "index"].includes(p.type)).length], ["Records (noindex)", PAGES.filter((p) => p.noIndex).length], ["Built", longDate(cfg.updated)], ["Pages source", "branch <code>main</code>, folder <code>/docs</code>"]], {})}
</section>`;
  layout({ title: `Dashboard | ${cfg.brand.name}`, desc: "Every register in one place: products, intent records, sources, suggestions, open questions, flags, ledger, events, cadence.", path: "/dashboard/", base, type: "ops", body });
}
function renderSuggestions() {
  const base = "..";
  const tracks = [...new Set(sugg.suggestions.map((s) => s.track))];
  const paths = sugg.paths
    .map(
      (p) => `<section class="path" id="path-${p.id.split("-")[1].toLowerCase()}">
  <h3>${esc(p.name)}</h3>
  <p class="path__who">${esc(p.for_whom)}</p>
  <ol class="path__seq">${p.sequence.map((s) => `<li><a href="#item-${s.toLowerCase()}">${esc(s)}</a></li>`).join("")}</ol>
  <dl class="path__exit">
    <div><dt>Exit criteria</dt><dd>${esc(p.exit_criteria)}</dd></div>
    <div><dt>What you can measure after</dt><dd>${esc(p.what_you_get_measured)}</dd></div>
    <div><dt>Risk</dt><dd>${esc(p.risk)}</dd></div>
  </dl>
</section>`
    )
    .join("");
  const board = tracks
    .map(
      (t) => `<section class="track" data-track="${esc(t)}">
  <h2>${esc(t)}</h2>
  ${sugg.suggestions
    .filter((s) => s.track === t)
    .map(
      (s) => `<article class="sugg" id="item-${s.id.toLowerCase()}">
    <header class="sugg__head">
      <span class="sugg__id">${esc(s.id)}</span>
      <span class="chip chip--${s.status.includes("ed") ? "ok" : s.status === "needs review" ? "wait" : "neutral"}">${esc(s.status)}</span>
      <span class="chip">effort ${esc(s.effort)}</span>
      ${s.path ? `<span class="chip chip--path">${esc(s.path.split(",").map((x) => "PATH-" + x).join(" · "))}</span>` : ""}
      ${s.blocked_by ? `<span class="chip chip--bad">blocked by ${esc(s.blocked_by)}</span>` : ""}
    </header>
    <h3>${esc(s.title)}</h3>
    <dl class="sugg__body">
      <div><dt>Problem today</dt><dd>${esc(s.problem)}</dd></div>
      <div><dt>The change</dt><dd>${esc(s.change)}</dd></div>
      <div><dt>Why now</dt><dd>${esc(s.why_now)}</dd></div>
      <div><dt>What could go wrong</dt><dd>${esc(s.risk)}</dd></div>
      <div><dt>What it unlocks</dt><dd>${esc(s.unlocks)}</dd></div>
      ${s.evidence ? `<div><dt>Evidence</dt><dd>${s.evidence.map((e) => srcLink(e)).join(" ")}</dd></div>` : ""}
    </dl>
    <div class="sugg__decision" data-decision="${esc(s.id)}">
      <span class="sugg__decisionlabel">Your call</span>
      ${["adopt", "adopt-with-changes", "defer", "reject"]
        .map(
          (o) => `<label class="radio"><input type="radio" name="dec-${esc(s.id)}" value="${o}" data-choice><span>${esc(o)}</span></label>`
        )
        .join("")}
    </div>
  </article>`
    )
    .join("")}
</section>`
    )
    .join("");
  const body = `
<header class="pagehead">
  <p class="kicker">Review board</p>
  <h1>${sugg.suggestions.length} suggestions, three paths, no decision made for you</h1>
  <p class="pagehead__dek">${esc(sugg.how_to_read)}</p>
  <p class="notice">Pick one path and the board becomes a plan. Pick none and the ${sugg.suggestions.filter((s) => s.status === "shipped").length} rows already shipped are simply what exists. Nothing here is a promise, and a row marked <em>shipped</em> means built in this branch — not approved by you.</p>
</header>
<section class="paths">
  <h2>The three paths</h2>
  <p class="section-strap">They optimise different things and cannot all be first. Each lists its steps in order, with the items linked to their detail below.</p>
  <div class="paths__grid">${paths}</div>
</section>
<section class="filters" data-filters aria-label="Filter the board">
  <h2 class="sr-only">Filters</h2>
  <label>Track
    <select data-filter="track"><option value="">all</option>${tracks.map((t) => `<option>${esc(t)}</option>`).join("")}</select>
  </label>
  <label>Status
    <select data-filter="status"><option value="">all</option>${sugg.status_values.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
  </label>
  <label>Path
    <select data-filter="path"><option value="">all</option><option>A</option><option>B</option><option>C</option></select>
  </label>
  <p class="filters__count" data-filtercount>${sugg.suggestions.length} of ${sugg.suggestions.length} shown</p>
</section>
<section class="board-actions">
  <p>Your selections are kept in this browser only — nothing is sent anywhere, and no one else can see them. Use the export to record the decision in <code>COORDINATION.md</code>.</p>
  <p class="actions"><button class="btn" type="button" data-export-decisions>Copy decisions as JSON</button> <button class="btn ghost" type="button" data-clear-decisions>Clear my selections</button></p>
</section>
${board}`;
  layout({ title: `Suggestion board | ${cfg.brand.name}`, desc: "Every improvement on the table with its problem, cost, risk and the decision it unlocks — plus three ordered paths out of the ambiguity.", path: "/suggestions/", base, type: "ops", body });
}
function renderDecisionBrief() {
  const base = "..";
  const blockers = questions.filter((q) => q.blocker);
  const cards = questions
    .map(
      (q) => `<article class="q" id="${q.id.toLowerCase()}">
  <header><span class="q__id">${esc(q.id)}</span><h2>${esc(q.question)}</h2>${q.blocker ? '<span class="chip chip--bad">gates a decision</span>' : '<span class="chip chip--neutral">shapes the plan</span>'}</header>
  <dl>
    <div><dt>Why it matters</dt><dd>${esc(q.why_it_matters)}</dd></div>
    <div><dt>What we already have</dt><dd>${esc(q.what_we_have)}</dd></div>
    <div><dt>What is missing</dt><dd>${esc(q.missing)}</dd></div>
    <div><dt>Where the answer lives</dt><dd>${esc(q.where_to_get_it)}</dd></div>
    <div><dt>Answer format</dt><dd>${esc(q.answer_format)} <span class="dim">(${esc(sugg.how_to_read ? "" : "")}${esc(
        { value: "give me the literal value", yes_no: "a yes/no plus the date checked", file: "a file in data/inbox/ or data/exports/", choice: "pick an option", account: "a state readable only while logged in" }[q.answer_format] || ""
      )})</span></dd></div>
    <div><dt>Who can answer</dt><dd>${esc(q.who)}</dd></div>
    <div><dt>If nobody answers</dt><dd>${esc(q.default_if_unanswered)}</dd></div>
    <div><dt>Blocks</dt><dd>${q.blocks.map((b) => `<a href="#item-${b.toLowerCase()}">${esc(b)}</a>`).join(" ")}</dd></div>
  </dl>
</article>`
    )
    .join("");
  const body = `
<header class="pagehead">
  <p class="kicker">Decision brief</p>
  <h1>The ${questions.length} questions that gate every decision here</h1>
  <p class="pagehead__dek">A decision is only as good as the information behind it, so this page is the information: what we hold, what we do not, where each missing piece actually lives, and the default this build took while it waited. ${blockers.length} of these are blocking; the rest change the plan rather than the legality of it.</p>
  <p class="actions"><button class="btn" type="button" data-print="questions">Print this brief</button> <a class="btn ghost" href="${rel(base, "/suggestions/")}">The board these feed</a></p>
</header>
<section class="known">
  <h2>What we know without asking anyone</h2>
  <ul class="ticks">
    <li>Amazon's own definition of an ASIN is a 10-character alphanumeric code, and none of the five submitted identifiers is 10 characters.</li>
    <li>A qualifying link has to carry the Associates tag as a URL parameter, in a format Amazon provides — not as a wrapper page or a redirect.</li>
    <li>Disclosure in the exact words of the Operating Agreement has to be clear and prominent, and a breach of it is a material breach.</li>
    <li>The FTC standard for a material connection is that it be disclosed clearly and conspicuously, where people will see it, not on a separate page.</li>
    <li>Amazon reviews an application only once at least three qualifying sales land, personal orders excluded, and expects a site's content to be recent — with roughly 10 posts as its own rule of thumb.</li>
    <li>PA-API access, and therefore any automated product data, exists only for an accepted account whose primary owner signed up for it.</li>
  </ul>
</section>
${cards}
<section class="howtoanswer">
  <h2>Fastest way to answer all of it</h2>
  <ol class="numbers numbers--tight">
    <li>Log into Associates Central: note the Store ID, the Tracking IDs, the registered sites, and whether the account is accepted. That answers Q-02, Q-03 and half of Q-05 in one sitting.</li>
    <li>Open each of the five real listings and copy the ten characters after <code>/dp/</code> into <code>data/products.json</code>. Q-01 and Q-06, done.</li>
    <li>Build one tagged link in the link builder, click it logged out, confirm the destination and that a click appears in reporting. That is the whole test in SG-25.</li>
    <li>Decide the host for the counting endpoint and whether you will buy the products for photos. Everything else can stay at its default.</li>
  </ol>
  <p class="howtoanswer__note">Nothing in this list needs a developer. Steps 1–3 are an afternoon; the automation is already written and waiting for the data they produce.</p>
</section>`;
  layout({ title: `Decision brief | ${cfg.brand.name}`, desc: "Knowns, unknowns, the exact tool that answers each question, and the default taken while waiting.", path: "/decision-brief/", base, type: "ops", body });
}
function renderFlags() {
  const base = "..";
  const sev = { blocking: "chip--bad", high: "chip--bad", medium: "chip--wait", informational: "chip--neutral", "open question": "chip--wait" };
  const groups = [["blocking", "Blocking — nothing monetizable until these clear"], ["high", "High"], ["medium", "Medium"], ["open question", "Open questions"], ["informational", "By design, so nobody mistakes the state for an oversight"]];
  const card = (f) => `<article class="flag" id="${f.id.toLowerCase()}">
  <header><span class="flag__id">${esc(f.id)}</span><h3>${esc(f.title)}</h3>
    <p class="flag__meta"><span class="chip ${sev[f.severity] || "chip--neutral"}">${esc(f.severity)}</span> <span class="chip">${esc(f.area)}</span> <span class="chip chip--status">${esc(f.status)}</span></p>
  </header>
  <dl>
    <div><dt>What was found</dt><dd>${esc(f.what_we_found)}</dd></div>
    <div><dt>Why it matters</dt><dd>${esc(f.consequence)}</dd></div>
    <div><dt>How to clear it</dt><dd>${esc(f.how_to_clear)}</dd></div>
    <div><dt>Sources for the check</dt><dd>${f.sources.length ? f.sources.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(" · ") : "Internal finding — nothing external to cite, and no external claim depends on it."}</dd></div>
  </dl>
</article>`;
  const body = `
<header class="pagehead">
  <p class="kicker">Flagged for review</p>
  <h1>Everything this site could not confirm</h1>
  <p class="pagehead__dek">This page is not a disclaimer and not a to-do list for a future author. It is the working surface: what was checked, what failed, and the shortest route to closing each item. A reader is entitled to know that a buying guide has gaps, and a site that cannot say where it is unsure has no business recommending anything.</p>
  <p class="notice notice--block">${flags.filter((f) => f.severity === "blocking").length} blocking items, ${flags.filter((f) => f.severity === "high").length} high, ${flags.filter((f) => f.severity === "medium").length} medium, ${flags.filter((f) => f.status === "by design").length} recorded as by-design. Rows are never deleted here — clear one and it gets a resolution note instead of a vanished history.</p>
</header>
${groups
  .filter(([k]) => flags.some((f) => f.severity === k))
  .map(([k, title]) => `<section class="flaggroup"><h2>${esc(title)}</h2>${flags.filter((f) => f.severity === k).map(card).join("")}</section>`)
  .join("")}
<section class="flaghow">
  <h2>How an item gets on this page</h2>
  <ol class="numbers numbers--tight">
    <li>A value is needed for a table row or a piece of copy.</li>
    <li>An official source is looked for, and the clause is read rather than summarised.</li>
    <li>If nothing confirms the value, the field stays blank and the data validator requires a flag ID on the row.</li>
    <li>The flag states the check that was run, so the next reader does not repeat it — and so clearing it is a task, not an archaeology project.</li>
  </ol>
  <p class="actions"><a class="btn" href="${rel(base, "/decision-brief/")}">The questions these flags turn into</a> <a class="btn ghost" href="${rel(base, "/verify/")}">The register they came from</a></p>
</section>`;
  layout({ title: `Flagged for review | ${cfg.brand.name}`, desc: "Every unconfirmed value, blocked step and open question, with the source link and the minimum action to close it.", path: "/flagged/", base, type: "ops", body });
}

// ------------------------------------------------------------------ long-form ops pages
function renderExecSummary() {
  const base = "..";
  const blankFields = products.products.reduce((a, p) => a + (p.unverified_fields || []).length, 0);
  const shipped = sugg.suggestions.filter((s) => s.status === "shipped").length;
  const body = `
<header class="pagehead">
  <p class="kicker">Executive summary</p>
  <h1>Where this programme stands, and what it is waiting on</h1>
  <p class="pagehead__dek">A reader-facing publication now exists, with its compliance rules written as code and its product data deliberately empty. The commercial half of the brief — the part that turns traffic into commission — is specified, gated, and blocked on one answer only: five real ASINs. Nothing else in the plan is waiting on anybody.</p>
</header>
<nav class="toc" aria-label="Contents"><h2 class="sr-only">In this summary</h2><ol>
  <li><a href="#verdict">The verdict</a></li>
  <li><a href="#built">What exists today</a></li>
  <li><a href="#block">The one blocking finding</a></li>
  <li><a href="#compliance">Compliance posture</a></li>
  <li><a href="#measure">Measurement posture</a></li>
  <li><a href="#editorial">Editorial posture</a></li>
  <li><a href="#money">Money, and the refusal to forecast it</a></li>
  <li><a href="#auto">What the automation does, and does not</a></li>
  <li><a href="#risks">Risk register</a></li>
  <li><a href="#next">The next 14 days, and then 90</a></li>
  <li><a href="#asks">What is needed from you</a></li>
</ol></nav>

<section id="verdict">
  <h2>1 · The verdict</h2>
  <div class="verdict">
    <p><strong>Ship the publication, hold the monetization.</strong> The site is worth publishing now: it answers real buyer questions, it can be checked line by line, and it reads like something a person edits rather than something that was generated. It is not yet worth submitting to an Associates review, because the product identifiers supplied for it did not survive a one-line format check, and a review of an empty-shelf site with malformed links is a rejection that cannot be re-assessed.</p>
    <p>That is the whole tension in this project, and it is worth naming plainly: <em>the marketing layer is ready and the product layer has no products.</em> Everything else in the brief — the cadence, the clusters, the gate, the analytics, the ledger — is downstream of that and already built to receive the data.</p>
  </div>
</section>

<section id="built">
  <h2>2 · What exists today</h2>
  ${tableBlock(
    ["Surface", "State", "Evidence"],
    [
      ["Reader-facing site", R(`${PAGES.filter((p) => !["ops", "record"].includes(p.type)).length} pages: front page, ${guides.length} guides, ${categories.length} sections, ${Object.keys(SEASONS).length} seasonal clusters, a shelf, ${products.products.length} register entries, 2 calculators, search`), "This deployment"],
      ["Compliance gate", "Runs on every build; fails the publish on disclosure order, untagged or malformed Amazon links, missing alt text, invented product claims, or feed drift", R(`<code>tools/compliance-gate.mjs</code>`)],
      ["Link validator", "Checks ASIN shape, /dp/ structure, tag placement, host allow-list, rel qualification, and every internal href against the built tree", R("<code>tools/validate-links.mjs</code>")],
      ["Collector", "Reads listing JSON from <code>data/inbox/</code>, writes only fields present in the source, and records field-level provenance", R("<code>tools/collect.mjs</code>")],
      ["Measurement", "Five events defined; reference endpoint with aggregate-by-day storage and a click redirector, runnable locally with no dependencies", R("<a href=\"" + rel(base, "/measurement/") + "\">/measurement/</a>")],
      ["Campaign ledger", "Defined, empty, and validated: a row without an authorized source and provenance string is rejected", R("<code>data/campaign-ledger.json</code>")],
      ["Source register", R(`${sources.sources.length} official documents, each with the clause read, the quotation, the read level and the date`), R("<a href=\"" + rel(base, "/verify/") + "\">/verify/</a>")],
      ["Flag register", R(`${flags.length} items, ${flags.filter((f) => f.severity === "blocking").length} of them blocking`), R("<a href=\"" + rel(base, "/flagged/") + "\">/flagged/</a>")],
      ["Decision inputs", R(`${questions.length} questions with the tool that answers each, and the default taken meanwhile`), R("<a href=\"" + rel(base, "/decision-brief/") + "\">/decision-brief/</a>")],
      ["Options under review", R(`${sugg.suggestions.length} suggestions in three paths; ${shipped} built in this branch`), R("<a href=\"" + rel(base, "/suggestions/") + "\">/suggestions/</a>")]
    ],
    { caption: "State of the build as published" }
  )}
</section>

<section id="block">
  <h2>3 · The one blocking finding</h2>
  <p>All five submitted identifiers — <code>B04G1MEwY</code>, <code>B02NbDxp3</code>, <code>B00hJ57DV</code>, <code>B0c8moW59</code>, <code>B0f3GKalj</code> — are <strong>9 characters</strong>. Amazon's published definition of an ASIN is a unique 10-character alphanumeric code, typically beginning <code>B0</code>, and the checkable place to read one is the product page URL after <code>/dp/</code>. The host supplied alongside them, <code>link.amazon</code>, is not an Amazon product host, and no Associates tag appears in the URL — the tag has to appear as a parameter in the link for the referral to be attributable.</p>
  <p>Consequence, precisely: not "the links are invalid" but "no listing has been identified". The register therefore holds <strong>${blankFields} blank fields</strong> across five records, and every product card on the site renders a locked control with the reason printed. No title, price, rating, availability, category or commission figure was written anywhere, because none could be confirmed. Guessing the tenth character would have been the single most damaging thing this build could have done: it would have produced plausible-looking errors attached to a marketing claim.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/flagged/#flg-001")}">FLG-001 detail</a> <a class="btn ghost" href="${rel(base, "/decision-brief/#q-01")}">Q-01: the answer that unblocks it</a></p>
</section>

<section id="compliance">
  <h2>4 · Compliance posture</h2>
  <ul class="ticks">
    <li><strong>Disclosure is structural.</strong> The Operating Agreement's exact sentence appears in a strip beneath the masthead on every page and again in the footer, with a plain-language line above the first product control on any page that has one. The gate verifies presence <em>and order</em>, so a future template edit cannot quietly move it below the buy buttons.</li>
    <li><strong>Every paid link is qualified.</strong> Any Amazon product link the build emits carries <code>rel="sponsored nofollow"</code> and a visible <em>(paid link)</em> label; editorial citations to policy documents carry no tag, so nothing looks like a referral when it is a reference.</li>
    <li><strong>No implied endorsement.</strong> Nowhere does the site suggest Amazon supports, sponsors or verifies it — that prohibition sits in the same clause as the disclosure and is checked as a phrase ban.</li>
    <li><strong>No incentives, no bookmark prompts, no direct-from-elsewhere links</strong>, all three of which the Program Policies rule on, and all three implemented as lint rules rather than as advice.</li>
    <li><strong>No fabricated experience.</strong> The FTC standard this site is built to satisfy is not only disclosure but honesty: an endorsement must reflect the endorser's genuine opinion, and results claims must not stand in for the typical experience. Nothing was tested, so nothing claims to have been.</li>
    <li><strong>Customer questions go to Amazon.</strong> The contact page states it explicitly, because the agreement bars an Associate from handling Amazon customer contacts.</li>
  </ul>
  <p class="methodline">Two clauses are quoted from a readable locale copy of the agreement rather than the US text and are marked as such in the register (see <a href="${rel(base, "/verify/")}">/verify/</a>, read-level column). They inform the lint rules; they are not printed to readers as quotations. Re-read them before any legal sign-off.</p>
</section>

<section id="measure">
  <h2>5 · Measurement posture</h2>
  <p>The brief asked for click and conversion measurement before further writing, and that ordering is right — with one correction that changes the design: <em>conversion is not measurable on this site</em>. Orders happen on Amazon, attribution is Amazon's to report, and the only authorized source for what happened after the click is the Associates reporting you can log into. So the site measures the half it can see, precisely:</p>
  <ul class="ticks">
    ${events.events.map((e) => `<li><code>${esc(e.name)}</code> — ${esc(e.fires)}. Informs: ${esc(e.informs)}.</li>`).join("")}
  </ul>
  <p>Storage is aggregate-by-day by construction: no cookie, no browser identifier, no IP retained, no sub-tag attached to a person. That last one is not a privacy preference, it is a Program Policies prohibition on associating Associates reporting identifiers with individual end users — a design choice a lot of "affiliate analytics" tooling gets wrong by default.</p>
  <p>What is <em>not</em> running: the endpoint needs a runtime, GitHub Pages serves static files, and no page on this site claims that analytics are live. Until a host exists, the site publishes the counter's absence rather than a placeholder number.</p>
</section>

<section id="editorial">
  <h2>6 · Editorial posture</h2>
  <p>Six guides, all question-shaped, all ending with the same short list of what was not checked. They are written for the reader who is close to buying and is trying to work out which of three listings differs in a way they would notice — which is a different audience from the one that wants a verdict handed to it. Capacity is treated as inner dimensions rather than quarts; cleanup as a weekly habit rather than a coating; multi-function as an arithmetic of trade-offs rather than a count of presets.</p>
  <p>The four topics the brief proposed as working titles are published as guides, and labelled on the page as hypotheses rather than as demand: nothing on the site says a subject is popular, because no query data exists yet. The first genuinely measured topic choice becomes possible after two weeks of Search Console data, using the tool that reads the export (see <a href="${rel(base, "/measurement/")}">/measurement/</a>).</p>
  <p>Two structural choices are worth flagging upward: authorship is a desk byline with an explicit "AI-drafted, human-edited, nothing tested" note, and imagery is labelled illustration. Both are honest, and both are one decision away from being better — a named consenting editor (Q-07) and your own photographs of the products (Q-12) are the two highest-trust upgrades available, and neither needs a line of code.</p>
</section>

<section id="money">
  <h2>7 · Money, and the refusal to forecast it</h2>
  <p>There is no revenue projection in this project, in either direction. Not "expect a few hundred a month", not "this niche averages 3% conversion". A forecast assembled without a listing corpus, without query data, and without a single tracked click would be fiction in a table, and the site's whole differentiator is that its tables can be checked.</p>
  <p>What exists instead: the ledger with its columns and its allowed-source list; the two-week cadence for filling it; and a rule that any derived figure (EPC, orders per 100 clicks) prints a dash while any input is null. That is the discipline the brief asked for — measure before automating optimization — expressed as a validator rather than as an intention.</p>
</section>

<section id="auto">
  <h2>8 · What the automation does, and does not</h2>
  <p>The brief describes an autonomous platform: research products, spot trends, analyse price and reviews and competition and commission, generate SEO articles, publish and manage links, track clicks and conversions, continuously optimise. That is a coherent system. It is also a system with two parts that cannot be delegated: <em>confirming a product exists as described</em>, and <em>deciding that a claim is safe to print</em>.</p>
  ${tableBlock(
    ["Stage", "Automation", "The gate", "Why the gate stays"],
    [
      ["Product intake", "Format validation, field-level provenance, blank-on-missing, dedupe against the register", "A human confirms the listing URL matches the intended product", "An ASIN is checkable; an inferred one is not, and it is the identifier everything downstream trusts"],
      ["Trend selection", "Ranks candidate titles from a Search Console export by impressions on queries we appear for", "Nobody publishes a 'trending' claim without the export", "Today we have no query data, so the only honest trend report is the empty tool"],
      ["Price and review analysis", "Nothing: no feed, no API access, no scraping", "Prices are never printed at all while this stays true", "Amazon data is Program Content with its own licence terms; scraping is both a policy and a legal problem"],
      ["Article generation", "Structure, internal links, feeds, schema, sitemap, review dates", "Every factual claim must carry a source ID or be cut", "This is where AI output becomes a liability, and where a template cannot tell a plausible sentence from a true one"],
      ["Link publishing", "Builds tagged links, checks the tag and the host and the rel attributes, refuses to ship an unverified one", "One link per product is tested in Associates Central before the rest are generated", "A wrong tag silently loses every commission; a wrong destination silently loses the reader"],
      ["Optimization", "Re-ranks sections from measured click-through by slot; proposes the next topic from queries", "No re-ranking on fewer than 100 clicks per slot, and none from third-party estimates", "At small volumes a 'winner' is noise, and noise promoted to a decision is how a niche site self-harms"]
    ],
    { caption: "Automation map, with the human checkpoint named at every stage" }
  )}
</section>

<section id="risks">
  <h2>9 · Risk register</h2>
  ${tableBlock(
    ["Risk", "How likely", "What it costs", "Mitigation already in the build"],
    [
      ["Application rejection for a site that must be owned, filed at a sub-path", "live today", "One review cycle, and that application is not re-assessed", "SG-26: move to a domain you own before submitting; staging URL documented as staging"],
      ["Publishing a 9-character identifier into a live link and shipping a 404 to buyers", "blocked by design", "Trust, and possibly the account", "Links stay locked; the validator fails any malformed Amazon href at build time"],
      ["AI-drafted copy read as a fake review site", "high", "The only asset a small publication has", "Byline honesty, per-page 'what we did not check', no star ratings, no superlatives, no prices, all gate-enforced"],
      ["Quoted policy text going stale", "medium", "A compliance claim that is no longer true", "Register carries read dates and revision dates; validator warns past the review interval"],
      ["Optimising against a metric nobody measured", "medium", "Wasted cadence, and a plausible-sounding dashboard", "Ledger rows require provenance; derived metrics print a dash while inputs are null"],
      ["Effort spent on a niche nobody confirmed", "medium", "Six guides in the wrong category", "Sections carry frameworks that transfer; product filing is explicitly pending (FLG-004)"]
    ],
    { caption: "Top six, ranked by what they cost rather than by how loudly they were reported" }
  )}
</section>

<section id="next">
  <h2>10 · The next 14 days, and then 90</h2>
  <div class="twocol">
    <div>
      <h3>Days 1–14 · make it real</h3>
      <ol class="numbers numbers--tight">
        <li>Answer Q-01, Q-02, Q-03 (one login, one copy-paste).</li>
        <li>Run <code>npm run collect</code> on the first pasted listing, confirm the register fills without a single inferred field.</li>
        <li>Build one tagged link per product; click it logged out; confirm the destination, then confirm the click in reporting the next day.</li>
        <li>Unset the lock in config only after that test passes for all five.</li>
        <li>Verify the property in Search Console and submit the sitemap.</li>
      </ol>
    </div>
    <div>
      <h3>Days 15–90 · make it compound</h3>
      <ol class="numbers numbers--tight">
        <li>Publish on the chosen cadence; every guide into the sitemap and feed automatically.</li>
        <li>At ~100 clicks per slot, let the click data move the buy button, not a hunch.</li>
        <li>First topic chosen from a query export rather than from the brief.</li>
        <li>Shoot your own photos of whatever you buy, and retire the illustration labels.</li>
        <li>Re-read the register; close or escalate every flag older than the review interval.</li>
      </ol>
    </div>
  </div>
  <p class="methodline">These are commitments, not forecasts. No line above should be read as an expected outcome; the exit criteria for each path are on <a href="${rel(base, "/suggestions/")}">/suggestions/</a>, and they are all checkable states rather than revenue figures.</p>
</section>

<section id="asks">
  <h2>11 · What is needed from you</h2>
  ${tableBlock(["Ask", "Why only you can", "If it stays unanswered"], [
    ["The five real ASINs (or the /dp/ URLs)", "You are the only party with the intended listings", "The site publishes as an editorial property with a locked shelf"],
    ["Confirmation of tracking ID and registered site", "Read only inside Associates Central", "No tagged link is built, so nothing can be attributed to the account"],
    ["Account state (accepted? sales in the window?)", "It is the account's own status", "The collector stays in paste-mode and PA-API automation stays unbuilt"],
    ["A host decision for the endpoint", "It is a budget choice", "Client-side counting with no server; totals available only if you open the summary"],
    ["A named editor, or an explicit no", "It is a person's consent and reputation", "The desk byline and the AI-drafted note stay, which is honest but less persuasive"],
    ["A decision on buying the products for photos", "It is spend", "Guides stay framework-led and say they are"]
  ], { caption: "Six asks, none of them technical" })}
  <p class="actions actions--center"><a class="btn" href="${rel(base, "/decision-brief/")}">Full decision brief</a> <a class="btn ghost" href="${rel(base, "/suggestions/#path-a")}">Path A</a> <a class="btn ghost" href="${rel(base, "/suggestions/#path-b")}">Path B</a> <a class="btn ghost" href="${rel(base, "/suggestions/#path-c")}">Path C</a></p>
</section>
<p class="provenance">Written ${longDate(cfg.updated)} from the files in this repository. Every date, count and quotation above is generated from <code>data/</code> at build time, so this page cannot drift from the register it summarises — if a number here is wrong, the row that produced it is visible one click away.</p>`;
  layout({
    title: `Executive summary | ${cfg.brand.name}`,
    desc: "State of the affiliate programme: what was built, what the one blocking finding is, compliance and measurement posture, risks, and the next two weeks.",
    path: "/executive-summary/",
    base,
    type: "ops",
    body
  });
}
function renderMeasurement() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">Measurement</p>
  <h1>Clicks we can count, conversions we cannot</h1>
  <p class="pagehead__dek">A short page, because the honest version of affiliate measurement is short: you own the click, Amazon owns the outcome, and the only authorised way to join them is to log into Associates Central and read a report.</p>
</header>
<section>
  <h2>The five events</h2>
  ${tableBlock(["Event", "Fires", "Fields", "What it decides"], events.events.map((e) => [R(`<code>${esc(e.name)}</code>`), e.fires, Object.entries(e.properties).map(([k, v]) => `<code>${esc(k)}</code> ${esc(v)}`).join("<br>"), e.informs]), { caption: `Defined in <code>data/events.json</code>, implemented in <code>site/assets/app.js</code> and <code>tools/analytics-server.mjs</code>` })}
</section>
<section>
  <h2>Endpoint contract</h2>
  ${tableBlock(["Route", "Method", "Purpose", "Notes"], [
    ["/c/&lt;linkId&gt;", "GET", "302 to the tagged Amazon URL after recording one outbound_click", "Keeps the tagged href off the page markup if you prefer that; the destination is the same Special Link"],
    ["/e", "POST", "Record one event", "1×1 GIF response, <code>no-store</code>, 400 on unknown event names"],
    ["/summary", "GET", "Day-bucketed aggregates as JSON", "Read it yourself; nothing here is a dashboard and no number is projected"],
    ["/healthz", "GET", "Liveness and the current day key", "No data"]
  ], { note: esc(events.transport.identity) })}
  <p class="methodline">Storage is one JSON file per UTC day under a state directory, appended in process and flushed on exit — a design chosen so that "delete the folder" is a complete and verifiable deletion story. Rate limit: 30 events per minute per origin. No secret in the client: the page sends only an event name and a path.</p>
</section>
<section>
  <h2>What it deliberately cannot tell you</h2>
  <ul class="cross">
    <li>Conversion rate. Orders are reported by Amazon, not by this site, and the 24-hour session window means an on-site model of attribution would be invented.</li>
    <li>Revenue per page. Earnings are only available at the reporting grain Amazon provides; per-page earnings would be an allocation, not a measurement.</li>
    <li>Repeat visitors as persons. No cookie, no fingerprint — so a visitor counted twice is a visitor counted twice, and that is the trade for not building a profile.</li>
    <li>Anything about a reader who blocks scripts. They are simply missing, and the page says so rather than extrapolating.</li>
  </ul>
</section>
<section>
  <h2>Where it can run</h2>
  ${tableBlock(["Option", "Cost", "Trade-off", "State"], [
    ["Keep it local (current)", "nothing", "No data reaches anyone; you run the summary yourself", "implemented and tested"],
    ["Small VPS or container next to nothing else", "a few dollars a month", "You own the logs and the retention; you patch it", "documented, not provisioned"],
    ["A worker platform at the edge", "free tier usually enough", "You are adding a runtime dependency for one counter", "not started"],
    ["Self-hosted Umami or Plausible", "a host, plus their schema", "Richer UI, another set of rules to read on privacy", "not started"],
    ["No on-site analytics at all", "nothing", "Slot-level CTR becomes unknowable; buy-button placement stays a matter of taste", "a legitimate choice — record it and stop worrying"]
  ], { note: `Decision needed in <a href="${rel(base, "/decision-brief/#q-09")}">Q-09</a>. Until then <code>config.measurement.endpoint</code> is unset and the site counts nothing, which is the state the published pages describe.` })}
</section>
<section>
  <h2>Run it locally</h2>
  <pre class="codeblock"><code>npm run analytics            # starts on 127.0.0.1:8787
curl -s localhost:8787/healthz
curl -s -X POST localhost:8787/e -H 'content-type: application/json' \\
     -d '{"e":"outbound_click","p":"/picks/","l":"prd-01","slot":"shelf"}'
curl -s localhost:8787/summary</code></pre>
  <p class="methodline">Then set <code>config.measurement.endpoint</code> to your host's URL and rebuild: <code>app.js</code> sends beacons only when that value is non-null, so the site can never be quietly measuring somewhere you did not choose.</p>
</section>
<section id="gsc">
  <h2>Queries, the other half</h2>
  <p>Click counting tells you what a reader did on the page. Only Search Console tells you what they typed, which is the input that should choose the next guide. The pipeline is a file, not a service: export the Performance report into <code>data/exports/gsc-queries.csv</code> and run <code>npm run topics</code>. With no export present the tool prints the manual method and refuses to rank anything — no synthetic demand, ever.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/decision-brief/#q-09")}">Q-09: the host decision</a> <a class="btn ghost" href="${rel(base, "/dashboard/#ledger")}">Ledger state</a></p>
</section>`;
  layout({ title: `Measurement | ${cfg.brand.name}`, desc: "Five events, an endpoint contract, the limits of affiliate measurement, and where counting can run.", path: "/measurement/", base, type: "ops", body });
}
function renderEditorial() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">Standards</p>
  <h1>Editorial standards</h1>
  <p class="pagehead__dek">Short enough to actually follow, and enforced by a build step so that "we always" does not depend on anyone remembering.</p>
</header>
<section>
  <h2>What a guide has to contain</h2>
  <ol class="numbers numbers--tight">
    <li>A question in the title that a buyer would say out loud, and the answer inside the first screenful.</li>
    <li>At least one thing the reader can do differently after reading. A calculator, a list to print, a number to ask for.</li>
    <li>A "what we did not check" box naming the specific limits of this page.</li>
    <li>A source for every number. One source line per figure, not one bibliography at the end.</li>
    <li>A published date and a last-reviewed date, both printed.</li>
  </ol>
</section>
<section>
  <h2>Never, in any article</h2>
  <ul class="cross">
    <li>"Best", "top", "#1", or any ranking, without a stated comparison set and method.</li>
    <li>A star rating we did not compute from a defined corpus, printed as if it were ours or someone else's.</li>
    <li>A price, stock level, or "on sale now" claim, without a live feed we are licensed to use.</li>
    <li>Any experience claim in the first person plural: we have not cooked with these.</li>
    <li>"Amazon recommends", "officially endorsed", or anything implying a relationship beyond the programme.</li>
    <li>Results presented as typical — no "cuts cooking time in half", no "everyone notices".</li>
    <li>A borrowed review quote, screenshot of a review, or a scraped rating.</li>
  </ul>
  <p class="methodline">The gate in <code>tools/compliance-gate.mjs</code> enforces these as phrase and structure checks on the built HTML, so a draft cannot reach production by being ninety percent careful.</p>
</section>
<section id="testing">
  <h2>Testing policy</h2>
  <p>We do not test. A site with no lab and no budget that writes "we tested" is not being optimistic, it is being fraudulent, and it is exactly the sentence readers now scan for. The alternative we can afford is the one on every page here: the framework, the numbers worth asking for, and the arithmetic done in the open.</p>
  <p>If products are bought for photography (Q-12), the standard becomes: the photo is dated, captioned with what it shows, and any sentence derived from it says so. One in-person detail earns more trust than a hundred adjectives.</p>
</section>
<section id="links">
  <h2>Link policy</h2>
  <ul class="ticks">
    <li>Every outbound product link is an Associates Special Link in the tagged format Amazon provides, with the tag as a URL parameter, and it carries <code>rel="sponsored nofollow"</code> plus a visible <em>(paid link)</em> label.</li>
    <li>Links are accessed directly from this site. No wrapper pages, no interstitials, no "click here to unlock", no prompting a reader to bookmark a link.</li>
    <li>No incentive of any kind for using a link — no cashback, no raffle, no "support us by clicking", because the agreement treats it as grounds for non-payment.</li>
    <li>No Associates identifier is ever tied to an individual reader. Not a sub-tag per visitor, not a session ID joined to an email.</li>
    <li>A link is tested before it is scaled: one per product, destination confirmed, click confirmed in reporting the following day.</li>
    <li>Editorial citations (a policy page, a government chart) are never tagged. A reference is not a referral.</li>
  </ul>
</section>
<section id="review">
  <h2>Review, correction, and removal</h2>
  <p>Every guide is re-read against its sources every ${cfg.editorial.reviewIntervalDays} days; the dashboard prints the due date, and the register prints what was read when. A correction gets a dated note on the page rather than a silent edit — the reader who acted on the old version deserves to know the version changed.</p>
  <p>If a listing disappears, the card is retired in place with the date, not deleted, because a removed product with no note is how a site quietly becomes a catalogue of ghosts. Questions about an order, a return, or a delivery do not belong to us at all: the agreement requires that we send those to Amazon's own contact directions, and the contact page does exactly that.</p>
</section>
<section>
  <h2>AI assistance, disclosed</h2>
  <p>Copy on this site was drafted with AI assistance and edited here, under the standards above. That is stated on each guide rather than hidden, for two reasons: a fabricated human expert is the kind of claim that gets a site removed from a programme, and because "who wrote this" is now a legitimate reader question with a legitimate answer.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/verify/")}">The register behind these standards</a> <a class="btn ghost" href="${rel(base, "/disclosure/")}">Disclosure policy</a></p>
</section>`;
  layout({ title: `Editorial standards | ${cfg.brand.name}`, desc: "What a guide must contain, what it may never claim, how links are handled, and how corrections are made.", path: "/editorial-standards/", base, type: "page", body });
}
function renderDisclosure() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">Disclosure</p>
  <h1>Money, plainly</h1>
  <p class="pagehead__dek">The whole policy in the sentence you see at the top of every page: <strong>${esc(cfg.affiliate.statement)}</strong> If you buy something through a link on this site, we may earn a commission. You pay what you would pay anyway.</p>
</header>
<section>
  <h2>Where the disclosure appears, and why there</h2>
  <ul class="ticks">
    <li>In a strip beneath the masthead on <strong>every</strong> page, including this one, before any product control appears.</li>
    <li>In the footer of every page, so a reader who scrolls to the bottom is not told a different story from one who arrives at the top.</li>
    <li>As a plain-language line above each shelf of product cards, and as a visible <em>(paid link)</em> label on the link itself.</li>
    <li>In the RSS item body, because a reader who never visits the site still deserves to know.</li>
  </ul>
  <p>That placement is not decoration. Two separate rules point the same way: the Associates agreement requires the identification statement to be clear and prominent, and the Federal Trade Commission's standard for a material connection is that it be disclosed clearly and conspicuously — where people will see it, which in practice means before they act on the recommendation rather than three clicks away.</p>
</section>
<section>
  <h2>What is not going on</h2>
  <ul class="cross">
    <li>We do not have a paid relationship with any brand, and no brand has approved or seen any copy here.</li>
    <li>No product was gifted, and none was tested. There is no "review unit" narrative because there is no review unit.</li>
    <li>No ranking is for sale. There is no ranking at all yet, and the shelf's ordering is alphabetical by register ID, which the page says.</li>
    <li>No incentive is offered for using our links, and no link is a bookmark magnet or an interstitial.</li>
  </ul>
</section>
<section>
  <h2>The current state, which is unusual and worth stating</h2>
  <p>Right now there are <strong>no live affiliate links on this site</strong>. Every product control is locked, because the listings in intake did not pass verification (see <a href="${rel(base, "/flagged/#flg-001")}">FLG-001</a>). So this disclosure describes a promise about future links rather than a present arrangement — and it stays in place, above the fold, from the day the site has nothing to sell to the day it has something.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/editorial-standards/#links")}">Link policy</a> <a class="btn ghost" href="${rel(base, "/privacy/")}">Privacy</a></p>
</section>`;
  layout({ title: `Disclosure | ${cfg.brand.name}`, desc: "Exactly where the Amazon Associate statement appears and why, what relationships do not exist, and the current state of the links.", path: "/disclosure/", base, type: "page", body });
}
function renderPrivacy() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">Privacy</p>
  <h1>What this site stores: nothing</h1>
  <p class="pagehead__dek">No cookies, no local storage, no third-party scripts, no advertising pixels, no fingerprinting, no email form that works. This page is short because the practice is minimal, and it would grow the day any of that changes.</p>
</header>
<section>
  <h2>Reading a page here</h2>
  <ul class="ticks">
    <li>The HTML, CSS and images are served by GitHub Pages. Requests reach GitHub's servers, and whatever that host records in its own access logs is governed by GitHub, not by this site. See the <a href="https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site" target="_blank" rel="noopener">Pages publishing documentation</a> for how the site is served.</li>
    <li>This site sets no first-party or third-party cookie and writes nothing to localStorage except, optionally, your own review selections on the suggestion board, which stay in your browser.</li>
    <li>The search box runs in the page against a static index built with the site. Queries are not transmitted.</li>
    <li>The calculators take your numbers and multiply them in your browser; the values you type are not sent anywhere.</li>
  </ul>
</section>
<section>
  <h2>If measurement is switched on</h2>
  <p>The event design (<a href="${rel(base, "/measurement/")}">/measurement/</a>) is aggregate by day: an event is a name, a path, and a product or slot label. No IP address is retained, no user identifier is created, no Associates reporting identifier is ever joined to a person — the last of which is an Amazon Program Policies requirement, not a preference of ours. If a counting endpoint is deployed later, this page will name the host and the retention rule before the first beacon fires, because a privacy policy written after the fact is a confession.</p>
</section>
<section>
  <h2>Email, if it ever happens</h2>
  <p>The signup block on this site is disabled and states so on its face, because there is no chosen processor, no retention rule and no consent flow yet (FLG-015, Q-10). Nothing is collected, so nothing is stored, and there is nothing to delete on request. That is the honest state of a launch with no form, and it is preferable to a form whose policy is written as a maybe.</p>
</section>
<section>
  <h2>Your practical options today</h2>
  <ol class="numbers numbers--tight">
    <li>Read the site. Nothing needs your consent, because nothing needs your data.</li>
    <li>If you want an item gone from the register (a name, a URL you supplied), open an issue in the repository; the site is built from files in Git, so removal is an edit with a history.</li>
    <li>Questions about an order you placed at Amazon do not belong to us and we must not handle them; the <a href="${rel(base, "/contact/")}">contact page</a> explains where they go.</li>
  </ol>
  <p class="actions"><a class="btn" href="${rel(base, "/editorial-standards/")}">Editorial standards</a> <a class="btn ghost" href="${rel(base, "/disclosure/")}">Disclosure</a></p>
</section>`;
  layout({ title: `Privacy | ${cfg.brand.name}`, desc: "No cookies, no third-party scripts, no stored identifiers: what the site does and would not do with a reader's data.", path: "/privacy/", base, type: "page", body });
}
function renderAbout() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">About</p>
  <h1>A shop that shows its sums</h1>
  <p class="pagehead__dek">${esc(cfg.brand.tagline)} The Preheat covers small kitchen appliances — air fryers, multi-cookers, and the two square feet of counter that decide whether either gets used. It is independent and reader-supported.</p>
</header>
<section class="aboutgrid">
  <div>
    <h2>Why this exists</h2>
    <p>Most affiliate pages about appliances are a paraphrase of a listing with a superlative bolted on, arranged so that whatever pays best looks best. You can feel it within a paragraph and you can never check it, because there is nothing to check against.</p>
    <p>We started from the opposite constraint: write only what a reader can verify, and publish the list of what we could not. That is why this site has a register of sources with dates and quotations on it, why it has no star ratings, and why the shelf currently has locks on it instead of opinions.</p>
    <h2>What we can legitimately tell you</h2>
    <p>Which numbers to ask an appliance for. What the trade-offs actually are when you live with a machine for a month. What the government food-safety chart says about temperatures, verbatim, with a link. Where the arithmetic of running cost comes from. What an affiliate disclosure has to say and where it has to sit.</p>
    <h2>What we will not tell you</h2>
    <p data-quote="example">That anything is the best. That we used it. That the price is X. That a thousand owners averaged out to four and a half stars. If you came for those, this is the wrong tab, and the right one is the retailer's own page.</p>
  </div>
  <aside class="aside">
    <h2>The state of things</h2>
    <dl class="statlist">
      <div><dt>Guides published</dt><dd>${guides.length}</dd></div>
      <div><dt>Sections</dt><dd>${categories.length}</dd></div>
      <div><dt>Products in intake</dt><dd>${products.products.length}</dd></div>
      <div><dt>Products verified</dt><dd>0</dd></div>
      <div><dt>Live affiliate links</dt><dd>0</dd></div>
      <div><dt>Official sources in the register</dt><dd>${sources.sources.length}</dd></div>
      <div><dt>Open flags</dt><dd>${flags.filter((f) => f.status !== "by design").length}</dd></div>
      <div><dt>Products tested for this site</dt><dd>0</dd></div>
    </dl>
    <p class="aside__note">Every figure here is read from the site's own data files when the page is built, so this box is either accurate or the bug you came to report.</p>
    <p class="actions"><a class="btn" href="${rel(base, "/picks/")}">The shelf</a> <a class="btn ghost" href="${rel(base, "/flagged/")}">Open items</a></p>
  </aside>
</section>
<section>
  <h2>How to read a page here</h2>
  <ol class="numbers numbers--tight">
    <li>The title is the question. The first paragraph answers it. You may stop there.</li>
    <li>Anything numerical is either quoted with a source link or computed live from your own input.</li>
    <li>A dash in a table means "could not confirm", never "zero" and never "unknown but probably fine".</li>
    <li>The <em>what we did not check</em> box at the end is the part to read first if you are deciding whether to trust the rest.</li>
  </ol>
  <h2>The name, and the small print about it</h2>
  <p>"The Preheat" is a working masthead. It has not been cleared for trademark collision and it may change; nothing here is affiliated with, endorsed or sponsored by Amazon, and the Associate relationship is stated on every page exactly as the programme requires.</p>
  <p class="actions"><a class="btn ghost" href="${rel(base, "/editorial-standards/")}">Standards</a> <a class="btn ghost" href="${rel(base, "/contact/")}">Contact</a> <a class="btn ghost" href="${rel(base, "/verify/")}">Sources</a></p>
</section>`;
  layout({ title: `About | ${cfg.brand.name}`, desc: "Why this publication exists, what it will and will not tell you, and the current state of its registers.", path: "/about/", base, type: "page", body });
}
function renderContact() {
  const base = "..";
  const body = `
<header class="pagehead">
  <p class="kicker">Contact</p>
  <h1>Getting in touch, and where not to</h1>
  <p class="pagehead__dek">A deliberately short page, because one of the rules of being an Amazon Associate is that you must not act as Amazon's customer service — and this site would rather explain that than leave an inbox to rot.</p>
</header>
<section class="contactgrid">
  <div>
    <h2>Order, delivery, return or refund questions</h2>
    <p>Those have to go to Amazon, through the contact directions on the Amazon site you used. We cannot see your order, we cannot change it, and under the Associates agreement we must not take on handling Amazon customer contacts. Anything you send us about an order will get you a link back to Amazon and nothing else.</p>
    <h2>Corrections, and “you got this wrong”</h2>
    <p>The most useful message this site can receive, because the register is a file and a fix is an edit. Every page's claims trace to <a href="${rel(base, "/verify/")}">/verify/</a>; if a quotation does not match the source, say which row and what the live page says.</p>
    <h2>Product owners and brands</h2>
    <p>We do not accept review units, gifted products, sponsored placements or paid inclusion, and we do not remove factual content on request. If a page states something about your product that is not in your own published documentation, the correction we can make is to the source.</p>
  </div>
  <aside class="aside">
    <h2>Channels that work today</h2>
    <ul class="contactlist">
      <li><strong>Repository issues</strong><br><a href="${esc(cfg.repo)}/issues" target="_blank" rel="noopener">${esc(cfg.repo.replace("https://github.com/", ""))}/issues</a></li>
      <li><strong>Email</strong><br><span class="chip chip--wait">not configured</span> <span class="dim">There is no monitored address yet — see <a href="${rel(base, "/flagged/#flg-015")}">FLG-015</a>. Until it exists we would rather say so than print an address nobody reads.</span></li>
    </ul>
    <p class="aside__note">No form on this site transmits anything, so nothing here is collected on the way to you.</p>
  </aside>
</section>`;
  layout({ title: `Contact | ${cfg.brand.name}`, desc: "Where order questions have to go, how to file a correction, and what the site will not accept from brands.", path: "/contact/", base, type: "page", body });
}
function render404() {
  const base = ".";
  const body = `
<section class="nf">
  <p class="kicker">404</p>
  <h1>Nothing filed here</h1>
  <p>This page is not in the build. If you got here from a link on the site, that is a bug worth reporting — the build checks every internal href, so an unlinked page is a mistake rather than a mystery.</p>
  <p class="actions"><a class="btn" href="${rel(base, "/")}">Front page</a> <a class="btn ghost" href="${rel(base, "/guides/")}">All ${guides.length} guides</a> <a class="btn ghost" href="${rel(base, "/search/")}">Search</a></p>
</section>`;
  layout({ title: `Page not found | ${cfg.brand.name}`, desc: "Not found.", path: "/404.html", base, type: "page", body, noIndex: true });
  PAGES.pop(); // the 404 page must not appear in the sitemap
}

// ------------------------------------------------------------------ feeds
function renderFeeds() {
  const lastmod = cfg.updated;
  const urls = PAGES.filter((p) => !p.noIndex && p.path.endsWith("/")).map((p) => `  <url><loc>${esc(abs(p.path))}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n");
  write(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<!-- generated by site/build.mjs — do not edit by hand -->\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  const items = guides
    .map((g) => {
      const cat = categories.find((c) => c.slug === g.meta.section);
      return `    <item>
      <title>${esc(g.meta.title)}</title>
      <link>${esc(abs(`/guides/${g.meta.slug}/`))}</link>
      <guid isPermaLink="true">${esc(abs(`/guides/${g.meta.slug}/`))}</guid>
      <pubDate>${new Date(g.meta.published + "T09:00:00Z").toUTCString()}</pubDate>
      <category>${esc(cat ? cat.name : "Guides")}</category>
      <description>${esc(
        `${g.meta.dek} — ${cfg.brand.name}. Disclosure: ${cfg.affiliate.statement} Links to Amazon in the article are paid links.`
      )}</description>
    </item>`;
    })
    .join("\n");
  write(
    "feed.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${esc(cfg.brand.name)} — buying guides</title>\n    <link>${esc(abs("/"))}</link>\n    <description>${esc(cfg.brand.tagline + " " + cfg.affiliate.statement)}</description>\n    <language>${cfg.lang}</language>\n    <lastBuildDate>${new Date(lastmod + "T09:00:00Z").toUTCString()}</lastBuildDate>\n    <atom:link href="${esc(abs("/feed.xml"))}" rel="self" type="application/rss+xml"/>\n${items}\n  </channel>\n</rss>\n`
  );
  write("robots.txt", `# ${cfg.brand.name}\nUser-agent: *\nAllow: /\nDisallow: /404.html\n\nSitemap: ${esc(abs("/sitemap.xml"))}\n`);
  write("humans.txt", `/* the people */\nTeam: ${cfg.brand.byline} — ${cfg.brand.bylineNote}\nWritten with AI assistance, edited by the desk. Nothing tested.\n/* the site */\nSite: ${esc(abs("/"))}\nRepo: ${esc(cfg.repo)}\nLast updated: ${lastmod}\n/* technology */\nStatic HTML generated by site/build.mjs, no frameworks, no third-party scripts, no trackers.\n`);
  write(".nojekyll", "");
  const idx = [
    ...guides.map((g) => ({ t: g.meta.title, d: g.meta.dek, u: `/guides/${g.meta.slug}/`, k: "Guide", s: g.meta.section, w: [g.meta.title, g.meta.dek, ...g.meta.faq.flatMap((f) => [f.q, f.a])].join(" ").toLowerCase() })),
    ...categories.map((c) => ({ t: c.name, d: c.strapline + " " + c.blurb, u: `/section/${c.slug}/`, k: "Section", s: c.slug, w: [c.name, c.strapline, c.blurb, ...c.compare_on].join(" ").toLowerCase() })),
    ...Object.entries(SEASONS).map(([slug, s]) => ({ t: s.name, d: s.why, u: `/seasonal/${slug}/`, k: "Cluster", s: slug, w: (s.name + " " + s.why).toLowerCase() })),
    { t: "Cost-to-run and counter-fit calculators", d: "Two calculators driven by your own inputs, plus printable comparison sheets.", u: "/tools/", k: "Tool", s: "tools", w: "calculator wattage running cost electricity clearance counter footprint dimensions comparison sheet" },
    { t: "The shelf", d: "Every product in intake, with the unverified fields left blank.", u: "/picks/", k: "Shop", s: "picks", w: "shelf products listings intake verified locked" },
    { t: "Executive summary", d: "State of the programme, the blocking finding, risks, next steps.", u: "/executive-summary/", k: "Report", s: "ops", w: "executive summary status risk plan" },
    { t: "Flagged for review", d: "Everything that could not be confirmed, with sources.", u: "/flagged/", k: "Report", s: "ops", w: "flagged unverified issues asin link" },
    { t: "Suggestion board", d: `${sugg.suggestions.length} improvements and three paths.`, u: "/suggestions/", k: "Report", s: "ops", w: "suggestions improvements path roadmap" },
    { t: "How we verified", d: "The official source register with quotations and dates.", u: "/verify/", k: "Report", s: "ops", w: "sources verified register quotes operating agreement ftc" }
  ];
  write("search.json", JSON.stringify(idx, null, 1) + "\n");
}

// ------------------------------------------------------------------ run
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "assets"), { recursive: true });
for (const f of ["styles.css", "app.js", "favicon.svg"]) copyFileSync(join(ROOT, "site/assets", f), join(OUT, "assets", f));
if (existsSync(join(ROOT, "site/assets/img"))) {
  mkdirSync(join(OUT, "assets/img"), { recursive: true });
  for (const f of readdirSync(join(ROOT, "site/assets/img"))) copyFileSync(join(ROOT, "site/assets/img", f), join(OUT, "assets/img", f));
}
renderHome();
renderGuidesIndex();
guides.forEach(renderGuide);
categories.forEach(renderSection);
products.products.forEach(renderProductPage);
renderPicks();
renderSeasonalIndex();
for (const slug of Object.keys(SEASONS)) {
  if (guides.some((g) => g.meta.seasons.includes(slug))) renderSeason(slug, SEASONS[slug]);
}
renderTools();
renderSearch();
renderEditorial();
renderDisclosure();
renderPrivacy();
renderAbout();
renderContact();
renderVerify();
renderMeasurement();
renderDashboard();
renderSuggestions();
renderDecisionBrief();
renderFlags();
renderExecSummary();
render404();
renderFeeds();

// The redirector map the reference endpoint reads. Built from the register, never by hand:
// a product is only routable when it is verified AND links are enabled in config.
const linksMap = {};
if (cfg.affiliate.linksEnabled) {
  for (const p of products.products) {
    if (p.link_state === "live" && p.official_listing_url) {
      const u = new URL(p.official_listing_url);
      u.searchParams.set("tag", cfg.affiliate.trackingId);
      linksMap[p.id.toLowerCase()] = { href: u.toString(), rel: "sponsored nofollow", product: p.title || p.id };
    }
  }
}
writeFileSync(
  join(ROOT, "data", "link-map.json"),
  JSON.stringify(
    {
      $comment:
        "Redirector map for tools/analytics-server.mjs. Generated by site/build.mjs from data/products.json — a product appears only when link_state is 'live' and config.affiliate.linksEnabled is true. An empty map is the correct state while Q-01 is unanswered.",
      generated: new Date().toISOString(),
      linksEnabled: cfg.affiliate.linksEnabled,
      count: Object.keys(linksMap).length,
      links: linksMap
    },
    null,
    2
  ) + "\n"
);
write(
  "build-stats.json",
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      pages: PAGES.length,
      guides: guides.length,
      sections: categories.length,
      products: products.products.length,
      verifiedListings: products.products.filter((p) => p.link_state === "live").length,
      linksEnabled: cfg.affiliate.linksEnabled,
      flags: flags.length,
      sources: sources.sources.length,
      suggestions: sugg.suggestions.length,
      questions: questions.length
    },
    null,
    2
  ) + "\n"
);
console.log(`built ${PAGES.length} pages + sitemap/feed/search into docs/`);
console.log(`  guides ${guides.length} · sections ${categories.length} · records ${products.products.length} · verified listings ${products.products.filter((p) => p.link_state === "live").length}`);
console.log(`  links enabled: ${cfg.affiliate.linksEnabled} (locked state is the honest state until Q-01 is answered)`);
