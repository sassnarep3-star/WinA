// Compliance gate — the checks that are *not* about markup validity.
//
// scripts/check-site.mjs already verifies structure: canonicals, meta, heading order, alt text,
// asset hosts, JSON-LD parseability, internal links, sitemap parity, RSS. This file checks the
// other half, the half that costs money or trust when it slips:
//
//   1. disclosure placement, not just disclosure presence ("clear and conspicuous" is positional)
//   2. every Amazon-bearing href classified — tagged product link, or declared citation, never bare
//   3. a citation that claims to come from source X must link to source X (misattribution)
//   4. cross-reference integrity: data rows may only cite defined sources and defined flags
//   5. claim bans on reader copy: prices, ratings, availability, testing claims, superlatives
//   6. commercial schema we have no licensed feed for
//   7. the scaling-before-testing question, answered with the register's own numbers
//
//   node scripts/compliance-gate.mjs
//   node scripts/compliance-gate.mjs --refresh-sources   # re-read quoted policy, diff the text
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, cfg, htmlFiles, tags, readOut } from "./lib/site.mjs";

const products = { site: cfg.site, products: cfg.products };
const policy = cfg.policy;
const governance = cfg.governance;
const links = cfg.links;
const specialLink = cfg.specialLink;
const SITE = cfg.site;
const STATEMENT = cfg.site.associateStatement;
const TRACK = cfg.site.trackingId;

const fails = [];
const warns = [];
const notes = [];
const fail = (m, ctx) => fails.push({ m, ctx });
const warn = (m, ctx) => warns.push({ m, ctx });
const note = (m, ctx) => notes.push({ m, ctx });
let checks = 0;
const ok = (cond, m, ctx = "") => { checks++; if (!cond) fail(m, ctx); };

/* ---- the built site */
const pages = htmlFiles();
const read = (f) => readFileSync(join(ROOT, f), "utf8");

const isProductHost = (h) => /^www\.amazon\.[a-z.]+$/.test(h) || /^amazon\.[a-z.]+$/.test(h) || h === "link.amazon" || /^amzn\./.test(h);
const PRODUCT_PATH = /\/dp\/|\/gp\/product\/|\/product-links\//;

let disclosurePages = 0, sponsored = 0, citations = 0, shortLinkAnchors = 0;
for (const page of pages) {
  const doc = read(page);
  const url = "/" + page.replace(/index\.html$/, "");

  /* ---- 1. disclosure: present, verbatim, and *before* the first thing it qualifies */
  const hasStrip = doc.includes(STATEMENT);
  ok(hasStrip, `the exact OA §5 statement is missing`, url);
  if (hasStrip) {
    disclosurePages++;
    const at = doc.indexOf(STATEMENT);
    const firstPaid = doc.search(/rel="[^"]*sponsored/);
    if (firstPaid > -1) ok(at < firstPaid, "the disclosure appears only AFTER the first sponsored link — it must precede the action it describes (FTC: conspicuous, near the endorsement)", url);
    ok(doc.lastIndexOf(STATEMENT) > doc.indexOf("</main>") || doc.includes("</main>") === false, "the statement belongs in the footer as well as the top strip", url);
  }

  /* ---- 2/3. every Amazon-bearing anchor is classified, and citations cite the right place */
  for (const a of tags(doc, "a")) {
    const href = a.href || "";
    if (!/^https?:/.test(href)) continue;
    let host = "";
    try { host = new URL(href).hostname; } catch { continue; }
    if (!isProductHost(host)) continue;
    const rel = (a.rel || "").toLowerCase();
    if (host === "link.amazon") {
      shortLinkAnchors++;
      ok(rel.includes("nofollow"), "a submitted short link used as evidence must be a declared citation (rel nofollow), not a bare anchor", `${url} ${href}`);
      ok(!/tag=/.test(href), "a short link cannot carry a tag and stay an honest citation", `${url} ${href}`);
      ok(!rel.includes("sponsored"), "short links carry no tag, so calling one sponsored would misstate what it is", `${url} ${href}`);
      continue;
    }
    const productLink = PRODUCT_PATH.test(href) && /tag=/.test(href);
    const isCitation = a["data-nonaffiliate"] !== undefined || !/tag=/.test(href);
    if (productLink) {
      sponsored++;
      ok(rel.includes("sponsored"), "a tagged product link must be qualified rel=\"sponsored\"", `${url} ${href}`);
      ok(new URL(href).searchParams.get("tag") === TRACK, `tag must equal the configured Tracking ID (${TRACK})`, `${url} ${href}`);
      const asin = (href.match(/\/dp\/([A-Za-z0-9]+)/) || [])[1] || "";
      ok(/^[A-Z0-9]{10}$/.test(asin), `a product link must carry a 10-character ASIN, got "${asin}"`, `${url} ${href}`);
      ok(!href.includes("link.amazon"), "a tagged link must not route through a short link", `${url} ${href}`);
    } else if (isCitation) {
      citations++;
      ok(!/[?&]tag=/.test(href), "a citation must not carry an Associates tag: citing a page is not referring a customer", `${url} ${href}`);
      ok(rel.includes("nofollow") || rel.includes("sponsored"), "outbound citations should be declared", `${url} ${href}`);
    }
  }

  /* ---- 4. claim bans on the pages a buyer reads */
  const OPS = /^\/(register|flagged|dashboard|questions|suggestions|summary|analytics|seo|marketing|concept|compare|disclosure|privacy|about)\b/.test(url) || url.startsWith("/archive/");
  // A claim inside quotation marks is somebody else's sentence, quoted — which is what the
  // marketing plan does when it describes what a review farm writes.
  const body = doc
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<(table|div|p|li|aside|figure)([^>]*)data-quote="example"[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[“"]{1}[^“”"]{6,240}[”"]/g, " (quoted) ");
  // Claim bans. A match is judged with its surrounding sentence, because the same verb is a
  // violation about a product ("we tested it") and good practice about a document ("the listing
  // text we reviewed"). DOCUMENTARY lists the object words that make a verb about evidence.
  const DOCUMENTARY = /\b(listing|manual|text|page|record|document|spec|specification|field|value|row|number|figure|claim|source|term|policy|clause|quote|data|register|blank|figure|result)\w*\b/i;
  const HEDGED = /\b(do not|don't|does not|can't|cannot|never|will not|won't|refus\w*|avoid\w*|prohibit\w*|forbid\w*|without|not )\b/i;
  const CLAIMS = [
    { re: /\$\s?\d+[.,]\d{2}\b/, why: "a price printed on the page (Policies §6(y) forbids price display and tracking)" },
    { re: /\b\d\.\d\s?(out of|\/)\s?5\b|\b\d{2,}(\.\d+)?\s?(customer )?ratings?\b/i, why: "a rating or rating count (Policies §6(t) restricts these to PA-API/Creatives output)" },
    { re: /\b(we|the desk|our team) (have |had )?(tested|tried|used|measured|cooked with|reviewed|compared)\b/i, why: "a hands-on claim about a product; nothing here was tested", contextual: true },
    { re: /\b(lifetime (warranty|guarantee)|money[- ]back|satisfaction guarantee|hassle[- ]free)\b/i, why: "a guarantee that belongs to the listing, not to us" },
    { re: /\bin stock\b|\bonly \d+ left\b|\b(sale|offer) ends\b/i, why: "availability or urgency we cannot verify" },
    { re: /\bamazon('s)? (choice|recommends|endors\w+|approved|picked)\b/i, why: "implying Amazon endorsement, prohibited by the agreement", contextual: true },
    { re: /\bexpected (traffic|income|earnings)\b|\byou could earn\b|\bpassive income\b/i, why: "an income or traffic expectation; Amazon disclaims any representation about both" }
  ];
  for (const c of CLAIMS) {
    for (const m of body.matchAll(new RegExp(c.re.source, "gi"))) {
      const around = body.slice(Math.max(0, m.index - 90), m.index + 110).replace(/\s+/g, " ");
      if (c.contextual && DOCUMENTARY.test(around)) continue;   // about evidence, not about the product
      if (c.contextual && HEDGED.test(around)) continue;        // quoting or refusing the claim
      if (OPS) warn(`${c.why} — "${around.trim()}" (ops page: confirm this is the rule being stated, not a claim being made)`, url);
      else fail(`forbidden on reader copy: ${c.why} — "${around.trim()}"`, url);
    }
  }

  /* ---- 5. schema we cannot license */
  for (const m of doc.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch (e) { fail(`JSON-LD does not parse: ${e.message}`, url); continue; }
    const flat = JSON.stringify(parsed);
    for (const banned of ["aggregateRating", "reviewCount", "ratingValue", "priceSpecification", "availability", "offerCount"])
      ok(!flat.includes(banned), `structured data carries ${banned} with no licensed feed behind it`, url);
    if (flat.includes('"@type":"Offer"') || flat.includes('"@type": "Offer"'))
      ok(false, "an Offer node asserts a price we are not licensed to display", url);
  }
}
ok(disclosurePages === pages.length, "every built page must carry the disclosure", `${disclosurePages}/${pages.length}`);

/* ---- 6. cross-reference integrity across the data files */
const sourceIds = new Set(policy.sources.map((s) => s.id));
const flagIds = new Set(governance.flagged.map((f) => f.id));
let specRows = 0, cited = 0;
for (const p of products.products) {
  ok(/^[A-Z0-9]{10}$/.test(p.asin || ""), `${p.slug}: asin must be 10 upper-case alphanumeric characters`, p.asin);
  ok(p.asin === undefined || !/ /.test(p.asin), "an ASIN may not contain spaces or slashes", p.slug);
  const seen = new Set();
  for (const s of p.specs || []) {
    specRows++;
    ok(!seen.has(s.label), `duplicate spec label "${s.label}" on ${p.slug} — a second row for the same field is how a contradiction hides`, p.slug);
    seen.add(s.label);
    ok(["verified", "unverified", "withheld", "claim"].includes(s.status), `unknown spec status "${s.status}"`, `${p.slug}/${s.label}`);
    const hasValue = s.value !== null && s.value !== undefined && String(s.value).trim() !== "";
    if (s.status === "unverified" || s.status === "withheld")
      ok(!hasValue, `a ${s.status} row must not carry a value — that is the difference between blank and invented`, `${p.slug}/${s.label}`);
    if (hasValue) {
      cited++;
      ok(!!s.source, "a row with a value must name its source", `${p.slug}/${s.label}`);
      if (s.source) ok(sourceIds.has(s.source), `spec source "${s.source}" is not defined in data/policy.json — the row is untraceable`, `${p.slug}/${s.label}`);
    }
  }
}
for (const t of specialLink.tests) {
  ok(t.source === null || sourceIds.has(t.source), `special-link test ${t.product_id} cites source "${t.source}", which data/policy.json does not define`, t.product_id);
  ok(flagIds.has("FLG-003"), "the test register names FLG-003; it must exist", "");
  ok(["blocked: owner login required", "passed", "failed"].includes(t.test_status) || /passed|failed|blocked/.test(t.test_status), `unexpected test_status "${t.test_status}"`, t.product_id);
  if (/passed/.test(t.test_status)) {
    ok(!!t.tested_on && !!t.destination_seen && !!t.tracking_report_line_seen && !!t.tested_by, "a test may not be marked passed without date, destination, report line and tester", t.product_id);
  }
}
for (const l of links.links) {
  ok(l.intendedAsin !== l.observedAsin || l.intendedAsin === null, "intended and observed ASINs must remain separate fields; if they are equal, say so in the note, do not merge them", l.shortCode);
  ok(!!l.flag && flagIds.has(l.flag), `link row cites ${l.flag}, which is not in the flag register`, l.shortCode);
  ok(/^[A-Za-z0-9]{10}$/.test(l.observedAsin || ""), "observed ASIN must be 10 characters", l.shortCode);
  // Product-intent confirmation record (T29): four named fields per link, plus observations kept apart.
  ok(l.officialListingUrl === `https://www.amazon.com/dp/${l.observedAsin}`, "officialListingUrl must be the Amazon ASIN page for the observed ASIN", l.shortCode);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(l.confirmedOn || ""), "confirmedOn must be an ISO date", l.shortCode);
  ok(Array.isArray(l.confirmationSourceIds) && l.confirmationSourceIds.length > 0 && l.confirmationSourceIds.every((id) => sourceIds.has(id)), "confirmationSourceIds must name sources defined in data/policy.json", l.shortCode);
  ok(l.intendedAsin === null || /^[A-Za-z0-9]{10}$/.test(l.intendedAsin), "intendedAsin must be null or a 10-character ASIN", l.shortCode);
  ok(l.intendedAsin !== null || !!l.intendedAsinNote, "a blank intendedAsin must say why it is blank", l.shortCode);
  const obs = Array.isArray(l.observedRedirectTargets) ? l.observedRedirectTargets : [];
  ok(obs.length > 0, "observedRedirectTargets must be a non-empty dated list, kept apart from officialListingUrl", l.shortCode);
  const kindOf = (u) => (/^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}/.test(u || "") ? "product-page" : u === "https://www.amazon.com/" ? "homepage" : u ? "other" : "no-result");
  for (const o of obs) {
    ok(/^\d{4}-\d{2}-\d{2}$/.test(o.observedOn || ""), "each observed redirect needs an ISO date", l.shortCode);
    ok(!o.finalUrl || /^https:\/\/www\.amazon\.com\//.test(o.finalUrl), "an observed final URL must be an amazon.com https URL", l.shortCode);
    ok(o.result === kindOf(o.finalUrl), `observed result "${o.result}" does not match its URL (${kindOf(o.finalUrl)})`, l.shortCode);
  }
  ok(l.observationsAgree === (new Set(obs.map((o) => o.result)).size === 1), "observationsAgree must match the recorded observations", l.shortCode);
}
for (const f of governance.flagged) {
  ok(!!f.severity && !!f.title && !!f.detail, "every flag needs severity, title and detail", f.id);
  ok(!!f.action, `flag ${f.id} states a problem but no next action`, f.id);
  if (f.sourceUrl) ok(/^https:\/\//.test(f.sourceUrl), "flag source must be https", f.id);
}
const dupFlags = governance.flagged.map((f) => f.id).filter((id, i, a) => a.indexOf(id) !== i);
ok(dupFlags.length === 0, "duplicate flag ids in the register", dupFlags.join(", "));

// A flag that exists in data/ but never reaches /flagged/ is invisible to the reader — exactly
// the failure mode a silent ID collision produces. Count occurrences of each id in the built
// page and require one row per registered flag.
const flaggedPage = join(ROOT, "flagged", "index.html");
if (existsSync(flaggedPage)) {
  const html = readFileSync(flaggedPage, "utf8");
  const rendered = [...html.matchAll(/<code>((?:FLG|SG)-\d+)<\/code>/g)].map((m) => m[1]);
  const counts = new Map();
  for (const id of rendered) counts.set(id, (counts.get(id) || 0) + 1);
  const missing = governance.flagged.map((f) => f.id).filter((id) => !counts.get(id));
  const doubled = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  ok(missing.length === 0, "every registered flag is rendered on /flagged/", missing.join(", "));
  ok(doubled.length === 0, "a flag id is rendered more than once on /flagged/", doubled.join(", "));
}

/* ---- 7. the one question the register can answer but nobody asks */
const passing = specialLink.tests.filter((t) => /passed/.test(t.test_status)).length;
const linksOnSite = sponsored;
if (linksOnSite > 0 && passing === 0) {
  // The state itself is allowed to ship (it is the site's reality and it is disclosed) — what is not
  // allowed is it being *unrecorded*. So the gate fails when the count contradicts an empty register
  // with no open flag saying so.
  const recorded = governance.flagged.some((f) => /Special Link test/i.test(f.title + f.detail) && f.severity !== "resolved");
  ok(recorded, `${linksOnSite} tagged product links are live while 0 of ${specialLink.tests.length} Special Link tests are recorded — that is allowed only while an open flag says so out loud`, "data/governance.json");
  warn(`${linksOnSite} tagged links live · ${passing}/${specialLink.tests.length} tests recorded. Owner: build one link per product in Associates Central, click it logged out, confirm the destination and the reporting line next day, then record it in data/special_link_tests.json.`, "FLG-024");
} else if (passing) note(`${passing}/${specialLink.tests.length} Special Link tests recorded as passed`, "register");

/* ---- the analytics pair must agree: enabled with no endpoint is a silent failure */
const endpoint = (SITE.analyticsEndpoint || "").trim();
const enabledFlag = governance.analytics.enabled;
ok(!(enabledFlag && !endpoint), "governance.analytics.enabled is true while site.analyticsEndpoint is empty — the client would be switched on against nothing", "data/products.json");
if (!endpoint) {
  for (const page of pages) {
    const doc = read(page);
    if (!/CS_CONFIG/.test(doc)) continue;
    ok(!/analyticsEnabled:true/.test(doc), "a page ships analyticsEnabled:true with no endpoint configured", page);
    ok(/analyticsEndpoint:""/.test(doc), "the endpoint must be empty in the emitted config when nothing is deployed", page);
  }
}

/* ---- 8. the ledger may only hold measured rows */
const ledger = existsSync(join(ROOT, "dashboard", "ledger.csv")) ? readFileSync(join(ROOT, "dashboard", "ledger.csv"), "utf8").trim().split("\n").slice(1).filter(Boolean) : [];
let withSource = 0;
for (const [i, row] of ledger.entries()) {
  const cells = row.split(",");
  const line = cells.join(",");
  if (/unknown|manual|unverified|estimate/i.test(line) && !/reported_orders=\d|clicks=\d/.test(line)) { withSource++; continue; }
  if (/\d/.test(line)) { withSource++; ok(/SRC-|policy\.json|Associates|export|\.csv/i.test(line), `ledger row ${i + 2} reports a number with no provenance string`, line.slice(0, 70)); }
}
note(`ledger: ${ledger.length} row(s), ${withSource} carrying a figure`, "dashboard/ledger.csv");

/* ---- 9. marketplace reality */
ok(/^https:\/\//.test(SITE.origin), "site.origin must be https", SITE.origin);
ok(SITE.baseurl === "/WinA" || SITE.baseurl === "", "canonical base path — a sub-path build must declare it or canonicals 404", SITE.baseurl);
ok(TRACK.endsWith("-20"), "a US Store ID ends in -20; if the account is not US this must be re-derived", TRACK);
ok(products.site.marketplace === "amazon.com", "marketplace must match the store suffix", products.site.marketplace);
// site.origin already contains the base path while site.baseurl repeats it. Nothing may compose
// the two — doing so yields /WinA/WinA/, which is a canonical that points at a 404.
const doubled = htmlFiles().filter((f) => /WinA\/WinA\//.test(readOut(f)));
ok(doubled.length === 0, "a doubled base path in a page — origin already includes baseurl, do not join them", doubled.slice(0, 3).join(", "));
for (const f of htmlFiles().slice(0, 40)) {
  const doc = readOut(f);
  const rel = "/" + f.replace(/index\.html$/, "");
  const canon = (doc.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "";
  const want = (cfg.site.origin.replace(/\/$/, "") + (rel === "/" ? "/" : rel)).replace(/\/index\.html$/, "/");
  ok(canon === want, `canonical must be origin + path`, `${rel} got ${canon}`);
}

/* ---- optional: --refresh-sources */
if (process.argv.includes("--refresh-sources")) {
  console.log("\nre-reading the policy sources and diffing what we quote");
  let matched = 0, differ = 0, blocked = 0;
  const rows = [...policy.sources, ...policy.policy].filter((x) => x.url);
  for (const s of rows) {
    let text = "";
    try {
      const res = await fetch(s.url, { headers: { "user-agent": "compliance-refresh (owner-run)" }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (e) {
      blocked++;
      console.log(`  blocked  ${s.id} — ${e.message.slice(0, 60)}; a blocked fetch is not a pass`);
      continue;
    }
    const flat = text.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;|&#34;|“|”/g, '"').replace(/\s+/g, " ");
    const q = (s.quote || s.note || "").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
    if (!q) { console.log(`  skipped  ${s.id} — no quoted text to diff`); continue; }
    const probe = q.slice(0, Math.min(q.length, 90));
    if (flat.includes(probe)) { matched++; console.log(`  match    ${s.id}`); }
    else { differ++; console.log(`  DIFFER   ${s.id} — "${probe.slice(0, 60)}…" is no longer on the page`); }
  }
  const stale = policy.sources.filter((s) => Date.now() - new Date(s.accessed + "T00:00:00Z").getTime() > 90 * 864e5);
  if (stale.length) warn(`${stale.length} source row(s) last read more than 90 days ago: ${stale.map((s) => s.id).join(", ")}`, "data/policy.json");
  if (differ) fail(`${differ} quotation(s) no longer match the live page — update data/policy.json with the current wording and date`, "data/policy.json");
  console.log(`  ${matched} matched · ${differ} differ · ${blocked} unreachable · ${stale.length} past the 90-day review window`);
}

console.log(`
compliance gate
===============
  scope: ${pages.length} pages · ${disclosurePages} disclosures · ${sponsored} tagged product links · ${citations} citations · ${shortLinkAnchors} short-link anchors
  register: ${specRows} spec rows (${cited} with values) · ${governance.flagged.length} flags · ${specialLink.tests.length} link tests · ${ledger.length} ledger rows
`);
for (const f of fails) console.log(`  FAIL  ${f.m}${f.ctx ? " — " + f.ctx : ""}`);
for (const w of warns) console.log(`  warn  ${w.m}${w.ctx ? " — " + w.ctx : ""}`);
for (const n of notes) console.log(`  note  ${n.m}${n.ctx ? " — " + n.ctx : ""}`);
console.log(`  ${checks} checks, ${fails.length} failing, ${warns.length} warning(s)`);
console.log(fails.length ? "\n  the gate is a floor, not a ceiling: it cannot tell you a sentence is persuasive, only that a rule was broken." : "");
process.exitCode = fails.length ? 1 : 0;
