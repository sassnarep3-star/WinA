// Compliance gate. If it is not true here, it never reaches a reader.
//
// Why a gate instead of a checklist: the Amazon Associates agreement treats a missing disclosure
// as a material breach (Operating Agreement §5 + §6) and the FTC standard for a material
// connection is that it be clear and conspicuous where people act. Both are placement problems,
// and placement is exactly what a template edit quietly breaks. So placement is asserted.
//
//   npm run check:compliance            structural + wording checks on the built site
//   node tools/compliance-gate.mjs --refresh-sources
//                                       re-fetch each register row and diff the quotation
import { readFileSync, existsSync } from "node:fs";
import { join, posix } from "node:path";
import { OUT, ROOT, cfg, sources, flags, products, Report, tags, htmlFiles } from "./lib/site.mjs";

const args = process.argv.slice(2);
const r = new Report("compliance gate");
const STATEMENT = cfg.affiliate.statement;
const DISCLOSURE_ID = 'id="disclosure-strip"';
// Pages where policy language is quoted or argued about. Copy-level claim bans apply to the
// reader-facing pages; quoting a prohibition is not the same as making a claim.
const OPS = ["/verify/", "/flagged/", "/dashboard/", "/suggestions/", "/decision-brief/", "/executive-summary/", "/measurement/", "/editorial-standards/", "/disclosure/"];
// Buyer-facing pages only: a record page is allowed to speak the register's language.
const CONTENT_PAGE = /^(index\.html|guides\/|section\/|seasonal\/)/;
const CLAIM_RULES = [
  { re: /\bwe (have )?(tested|tried|used|measured|compared|cooked|reviewed)\b/i, why: "claims hands-on experience; nothing on this site was tested" },
  { re: /\bguarantee[ds]?\b/i, why: "guarantees are not ours to make" },
  { re: /\brisk[- ]free\b/i, why: "no product is risk-free and the claim is a deception risk" },
  { re: /\bbest[- ]of\b|\bbest (air fryer|multi-?cooker|appliance|countertop)\w*\b/i, why: "a 'best' ranking needs a comparison set and a method" },
  { re: /\btop[- ]rated\b|\beditor'?s choice\b|\b#1\b/i, why: "implied ranking without grounds" },
  { re: /\bamazon (recommends|endorses|approves|approved|selects|picks)\b/i, why: "implying Amazon sponsorship is prohibited by the agreement" },
  { re: /\b\d\.\d\s?(out of|\/)\s?5\b/i, why: "a star rating we did not compute from a defined corpus" },
  { re: /\$\s?\d+(\.\d{2})?\b/, why: "a price printed without a live, licensed feed (use the listing)" },
  { re: /\bin stock\b|\bonly \d+ left\b|\bsale ends\b/i, why: "availability and urgency claims we cannot verify" },
  { re: /\blifetime (warranty|guarantee)\b/i, why: "warranty terms belong to the listing and must be quoted with a date" },
  { re: /\bproven to\b|\bclinically (proven|tested)\b|\bdoctors recommend\b/i, why: "health claims are out of scope for a buying guide" }
];
const html = htmlFiles();
r.ok(html.length >= 30, "the build is too small to be complete", `${html.length} pages`);
let disclosures = 0, outboundChecked = 0, alts = 0, claimHits = 0;

for (const page of html) {
  const url = "/" + page.replace(/index\.html$/, "");
  const doc = readFileSync(join(OUT, page), "utf8");
  const isOps = OPS.some((o) => url.startsWith(o)) || page.startsWith("product/");
  const is404 = page === "404.html";

  /* ---- disclosure: present, above the fold, repeated in the footer */
  if (!is404) {
    r.ok(doc.includes(DISCLOSURE_ID), "no disclosure strip element on the page", url);
    disclosures++;
    r.ok(doc.includes(STATEMENT), `the exact required Associate sentence must appear verbatim: "${STATEMENT}"`, url);
    const stripAt = doc.indexOf(DISCLOSURE_ID);
    const footAt = doc.lastIndexOf(STATEMENT);
    r.ok(footAt > doc.indexOf("</main>"), "the statement must also appear in the footer, below the main content", url);
    if (stripAt > -1) {
      const firstPaid = doc.search(/data-track="outbound_click"|rel="sponsored/);
      r.ok(firstPaid === -1 || firstPaid > stripAt, "a paid link appears before the disclosure strip — disclosure must precede the action", url);
      const firstNav = doc.indexOf('<nav class="mainnav"');
      r.ok(stripAt > firstNav, "the disclosure strip belongs directly under the masthead, after the navigation", url);
    }
  }

  /* ---- document metadata a publisher needs */
  if (!is404) {
    const title = (doc.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
    const desc = (doc.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
    const canonical = (doc.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
    r.ok(title.length >= 12 && title.length <= 120, `title length ${title.length} is outside 12–120`, url);
    r.ok(title.includes(cfg.brand.name), "title must carry the publication name", url);
    r.ok(desc.length >= 60 && desc.length <= 200, `meta description length ${desc.length} is outside 60–200`, url);
    r.ok(canonical === cfg.baseUrl.replace(/\/$/, "") + url, "canonical must equal baseUrl + path", `${url} got ${canonical}`);
    for (const prop of ["og:title", "og:description", "og:url", "og:type", "og:site_name"])
      r.ok(doc.includes(`property="${prop}"`), `missing ${prop}`, url);
    r.ok(/<html lang="/.test(doc), "html element needs a lang attribute", url);
    r.ok(/name="viewport"/.test(doc), "viewport meta missing", url);
    r.ok(/rel="stylesheet"/.test(doc) && /assets\/styles\.css/.test(doc), "stylesheet not linked", url);
    const wantsLd = /^index\.html$|^guides\/|^section\/^|^seasonal\//.test(page);
    if (wantsLd) r.ok(/application\/ld\+json/.test(doc), "home, guide, section and cluster pages must carry structured data", url);
    if (/^guides\/[^/]+\/index\.html$/.test(page)) {
      r.ok(doc.includes('"@type":"Article"'), "a guide must declare an Article", url);
      r.ok(doc.includes('"@type":"BreadcrumbList"'), "a guide must declare its breadcrumb", url);
    }
  }

  /* ---- links: qualified, tagged, or absent */
  for (const a of tags(doc, "a")) {
    const href = a.href || "";
    if (!/^https?:/.test(href)) continue;
    const host = (() => { try { return new URL(href).hostname; } catch { return ""; } })();
    const productLink = /amazon/.test(host) && /\/dp\/|\/gp\/product|amzn\.(to|eu\.dk)/.test(href);
    if (!productLink) continue;
    outboundChecked++;
    const relAttr = (a.rel || "").toLowerCase();
    r.ok(relAttr.split(/\s+/).includes("sponsored"), "an outbound product link must be qualified with rel=\"sponsored\"", `${url} ${href}`);
    r.ok(cfg.affiliate.linksEnabled, "no product link may exist while links are disabled", url);
    if (cfg.affiliate.linksEnabled) r.ok(new URL(href).searchParams.get("tag") === cfg.affiliate.trackingId, "product link tag does not match config", url);
  }

  /* ---- images carry alt text, and no page hot-links someone else's CDN */
  for (const img of tags(doc, "img")) {
    alts++;
    r.ok(!!img.alt && img.alt.length > 8, "img needs descriptive alt text", `${url} ${img.src || ""}`);
    r.ok(!/^http/.test(img.src || ""), "images must be served from this site", `${url} ${img.src}`);
  }

  /* ---- internal identifiers must stay out of buyer-facing copy */
  if (CONTENT_PAGE.test(page)) {
    // tags (and therefore every attribute, tooltip and data-* hook) are stripped: this rule is
    // about the words a reader reads, not the strings a template carries.
    const body = doc
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<footer[\s\S]*?<\/footer>/g, " ")
      .replace(/<section class="sourcesblock"[\s\S]*?<\/section>/g, " ")
      .replace(/<section class="notchecked"[\s\S]*?<\/section>/g, " ")
      .replace(/<[^>]+>/g, " ");
    for (const idRe of [/\bSRC-\d+\b/, /\bFLG-\d+\b/, /\bPRD-\d+\b/, /\bSG-\d+\b/, /\bQ-\d+\b/]) {
      const hit = body.match(idRe);
      r.ok(!hit, `internal identifier ${hit ? `"${hit[0]}"` : ""} leaked into reader copy — say it in words and link the page instead`, url);
    }
  }

  /* ---- claim bans on reader-facing copy */
  if (!isOps) {
    // data-quote="example" exempts one block from the claim bans: an article about how reviews
    // mislead must be able to quote the misleading sentence. It is marked at the element, so the
    // exemption is visible in the source and cannot be applied to a whole page by accident.
    const text = doc
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<(table|aside|div|figure|blockquote|p|li)([^>]*data-quote="example"[^>]*)>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " ");
    for (const rule of CLAIM_RULES) {
      const m = text.match(rule.re);
      if (m) {
        claimHits++;
        if (rule.soft) r.warn(false, `${rule.why} (matched "${m[0]}")`, url);
        else r.fail(`forbidden claim pattern: ${rule.why} — matched "${m[0]}"`, url);
      }
    }
  }

  /* ---- JSON-LD must not invent commercial properties */
  for (const m of doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed = null;
    try {
      parsed = JSON.parse(m[1]);
    } catch (e) {
      r.fail(`JSON-LD does not parse: ${e.message}`, url);
      continue;
    }
    const flat = JSON.stringify(parsed);
    for (const banned of ["ratingValue", "reviewCount", "aggregateRating", "\"price\"", "priceSpecification", "availability", "shipRate"])
      r.ok(!flat.includes(banned), `structured data carries ${banned}, which we have no verified source for`, url);
    r.ok(/@type/.test(flat), "JSON-LD block has no @type", url);
  }
}

/* ---- the register itself */
for (const s of sources.sources) {
  const age = (Date.now() - new Date((s.retrieved || sources.retrieved) + "T00:00:00Z").getTime()) / 864e5;
  r.warn(age <= cfg.editorial.reviewIntervalDays, `source ${s.id} was read ${Math.floor(age)} days ago, past the ${cfg.editorial.reviewIntervalDays}-day review interval`);
  r.ok(s.url.startsWith("https://"), "source url must be https", s.id);
}
r.ok(sources.sources.length >= 12, "register is too thin to support the site's claims");

/* ---- feeds and host files */
if (existsSync(join(OUT, "sitemap.xml"))) {
  const sm = readFileSync(join(OUT, "sitemap.xml"), "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  for (const l of locs) r.ok(existsSync(join(OUT, l.replace(cfg.baseUrl, "").replace(/^\//, "").replace(/\/$/, "") + "/index.html")), "sitemap entry has no file", l);
  r.ok(locs.length >= 20, "sitemap thin", String(locs.length));
}
const feedPath = join(OUT, "feed.xml");
if (existsSync(feedPath)) {
  const feed = readFileSync(feedPath, "utf8");
  r.ok(/<lastBuildDate>/.test(feed), "feed needs lastBuildDate");
  const guidePages = html.filter((f) => /^guides\/[^/]+\/index\.html$/.test(f)).length;
  const items = feed.split("<item>").length - 1;
  r.ok(items === guidePages, "feed item count must equal the published guide count", `${items} items vs ${guidePages} guide pages`);
  r.ok(feed.includes(STATEMENT), "the RSS body must disclose, because a subscriber never sees the masthead", "feed.xml");
  r.ok(feed.includes("Disclosure:"), "feed descriptions must state the paid-link relationship", "feed.xml");
}
r.ok(existsSync(join(OUT, ".nojekyll")), "docs/.nojekyll missing");
r.ok(existsSync(join(OUT, "robots.txt")), "robots.txt missing");
r.ok(existsSync(join(OUT, "404.html")), "404.html missing: a marketing site without a 404 leaks traffic");

/* ---- the state we are claiming about links */
const anyLive = products.some((p) => p.link_state === "live");
if (!cfg.affiliate.linksEnabled) r.ok(!anyLive, "config says links are disabled but a product row claims to be live");
if (cfg.affiliate.linksEnabled) {
  for (const p of products.filter((x) => x.link_state === "live"))
    r.ok(!!p.official_listing_url && /\/dp\/[A-Z0-9]{10}/.test(p.official_listing_url), "a live product row needs a well-formed /dp/<10-char ASIN> URL", p.id);
}
r.ok(products.every((p) => p.link_state !== "live" || (p.flags || []).length === 0), "a live row may not carry an unresolved flag");

/* ---- flag integrity: nothing may be quietly dropped */
for (const f of flags) {
  if (f.severity === "blocking") r.ok(cfg.affiliate.linksEnabled === false, `blocking flag ${f.id} is open while links are enabled — the gate refuses this combination`);
  r.ok(!!f.status, "every flag needs a status", f.id);
}


/* ---- optional: re-read the official pages and diff the quotations */
if (args.includes("--refresh-sources")) {
  process.stdout.write("\nre-reading the register against the live pages\n");
  let ok = 0, stale = 0, blocked = 0;
  for (const s of sources.sources) {
    let body = "";
    try {
      const res = await fetch(s.url, { headers: { "user-agent": "compliance-check (owner-run verification)" }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.text();
    } catch (e) {
      blocked++;
      process.stdout.write(`  blocked  ${s.id} ${e.message.slice(0, 60)} — re-check by hand\n`);
      continue;
    }
    const flat = body.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;|&#34;/g, '"').replace(/[“”]/g, '"').replace(/\s+/g, " ");
    const quote = s.quote.replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
    const probe = quote.length > 90 ? quote.slice(0, 90) : quote;
    if (flat.includes(probe)) { ok++; process.stdout.write(`  match    ${s.id}\n`); }
    else { stale++; process.stdout.write(`  DIFFER   ${s.id} — "${probe.slice(0, 60)}…" no longer found on the page\n`); }
  }
  process.stdout.write(`  ${ok} matched, ${stale} differ, ${blocked} unreachable from this environment\n`);
  if (stale) r.fail(`${stale} register quotations no longer match the live page — update data/sources.json with the new wording and date`);
  if (blocked) r.warn(false, `${blocked} pages unreachable; a blocked fetch is not a pass, re-check them where Amazon's bot protection can be satisfied by the account owner`);
}

console.log(`  scope: ${html.length} pages · ${disclosures} disclosure strips · ${alts} images · ${outboundChecked} product links · ${claimHits} claim-pattern hits (0 wanted while unverified)`);
console.log(`  mode: links ${cfg.affiliate.linksEnabled ? "ENABLED" : "locked (correct while Q-01 is unanswered)"} · statement checked verbatim · ops pages exempt from copy bans only`);
process.exit(r.print() ? 0 : 1);
