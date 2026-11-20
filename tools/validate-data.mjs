// Data-layer checks: the rules that keep a blank cell blank and a quote dated.
// Run on every build (npm run check:data). This is what makes "we never guess" a property
// of the pipeline rather than a promise in a document.
import { load, cfg, sources, flags, products, seasons, categories, Report } from "./lib/site.mjs";

const r = new Report("data validation");
const intents = load("data/product-intent.json");
const sugg = load("data/suggestions.json");
const questions = load("data/questions.json").questions;
const ledger = load("data/campaign-ledger.json");
const events = load("data/events.json");
const flagIds = new Set(flags.map((f) => f.id));
const srcIds = new Set(sources.sources.map((s) => s.id));
const PRODUCT_FIELDS = ["title", "brand", "category", "price", "star_rating", "rating_count", "availability", "commission_category", "official_listing_url"];
const OFFICIAL_HOSTS = JSON.parse(await (await import("node:fs")).promises.readFile("config/link-policy.json", "utf8")).citationHosts;

// ---- sources register
for (const s of sources.sources) {
  r.ok(!!s.id && /^SRC-\d\d$/.test(s.id), "source id must look like SRC-01", s.id);
  r.ok(/^https:\/\//.test(s.url), "source url must be https", s.id);
  const host = (() => { try { return new URL(s.url).hostname; } catch { return ""; } })();
  r.ok(OFFICIAL_HOSTS.includes(host), "source host is not on the official-source allow-list", `${s.id} ${host}`);
  r.ok(typeof s.quote === "string" && s.quote.length >= 30, "quotation too short to be checkable", s.id);
  r.ok(!!s.read_level, "read_level required: a full page read and an official excerpt are different claims", s.id);
  r.ok(!!(s.retrieved || sources.retrieved), "retrieval date required", s.id);
  r.ok(Array.isArray(s.supports) && s.supports.length > 0, "every source must say what it supports", s.id);
}
r.ok(new Set(sources.sources.map((s) => s.id)).size === sources.sources.length, "duplicate source ids");
const stale = sources.sources.filter((s) => (s.retrieved || sources.retrieved) < isoDaysAgo(90));
r.warn(stale.length === 0, `${stale.length} source rows are older than the ${cfg.editorial.reviewIntervalDays}-day review interval and should be re-read (${stale.map((s) => s.id).join(", ")})`);

// ---- product register: blanks must be declared, values must be sourced
for (const p of products) {
  for (const f of PRODUCT_FIELDS) {
    const blank = p[f] === null || p[f] === undefined || p[f] === "" || (typeof p[f] === "object" && !p[f]);
    const declaredBlank = (p.unverified_fields || []).includes(f);
    const declaredVerified = (p.verified_fields || []).includes(f);
    r.ok(!(blank && !declaredBlank), `field ${f} is empty but not listed in unverified_fields`, p.id);
    r.ok(!(blank && declaredVerified), `field ${f} is empty yet claimed verified`, p.id);
    if (!blank) {
      r.ok(declaredVerified, `field ${f} has a value but no verified_fields entry`, p.id);
      r.ok((p.source_ids || []).length > 0, `field ${f} has a value but the row cites no source`, p.id);
    }
  }
    const len = String(p.submitted_ref || "").length;
    r.ok(p.asin_length === len, "asin_length must be the literal character count, not an assumption", p.id);
    const shapeOk = /^[A-Z0-9]{10}$/.test(String(p.submitted_ref || ""));
    r.ok(p.matches_asin_format === shapeOk, "matches_asin_format must equal the /^[A-Z0-9]{10}$/ test result", p.id);
  for (const f of p.flags || []) r.ok(flagIds.has(f), "product row references an unknown flag", `${p.id} ${f}`);
  r.ok(p.link_state === "gated" || p.link_state === "tested" || p.link_state === "live", "link_state must be gated|tested|live", p.id);
  if (p.link_state === "live") {
    r.ok(!!p.official_listing_url, "a live row must carry the official listing URL", p.id);
    r.ok(!!(p.verified_fields || []).includes("official_listing_url"), "a live row must mark its listing URL verified", p.id);
  }
}
function blank(v) { return v === null || v === undefined || v === ""; }
function isoDaysAgo(n) { return new Date(Date.now() - n * 864e5).toISOString().slice(0, 10); }

// ---- intent records stay separated from observations
for (const rec of intents.records) {
  r.ok(!!rec.intent && !!rec.observation && !!rec.gate, "record needs intent + observation + gate blocks", rec.id);
  r.ok(!("observed_redirect_targets" in rec.intent), "observed redirect targets must never live inside the intent block", rec.id);
  r.ok(!("intended_asin" in rec.observation), "intent must never live inside the observation block", rec.id);
  r.ok(Array.isArray(rec.observation.observed_redirect_targets), "observed_redirect_targets must be an array", rec.id);
  if (rec.observation.outcome === "not observed") r.ok(rec.observation.observed_redirect_targets.length === 0, "an unobserved outcome cannot carry redirect targets", rec.id);
  const linked = products.find((p) => p.id === rec.product_id);
  r.ok(!!linked, "intent record points at a product that does not exist", rec.id);
  if (linked) r.ok(rec.intent.intended_asin === linked.submitted_ref, "intent ASIN must equal the submitted string", rec.id);
  if (rec.gate.status === "cleared") {
    for (const f of ["official_listing_url", "confirmation_date", "confirmed_by", "confirmation_source"])
      r.ok(!!rec.intent[f], `gate cleared with ${f} still empty`, rec.id);
  }
}

// ---- flags
const SEV = ["blocking", "high", "medium", "informational", "open question"];
for (const f of flags) {
  r.ok(SEV.includes(f.severity), "severity must be one of " + SEV.join("|"), f.id);
  r.ok(!!f.what_we_found && !!f.consequence && !!f.how_to_clear, "a flag must state what was found, why it matters, and how to clear it", f.id);
  for (const s of f.sources || []) {
    r.ok(/^https:\/\//.test(s.url) && !!s.label, "flag source needs an https url and a label", f.id);
    try { r.ok(OFFICIAL_HOSTS.includes(new URL(s.url).hostname), "flag source host not on the official allow-list", `${f.id} ${s.url}`); } catch {}
  }
}
r.ok(new Set(flags.map((f) => f.id)).size === flags.length, "duplicate flag ids");
// an unreferenced flag is a finding nobody can reach from a page: report it
{
  const { readFileSync: rf, readdirSync: rd, statSync: st } = await import("node:fs");
  const { join: jj } = await import("node:path");
  const scan = [];
  const crawl = (d) => { for (const n of rd(d)) { const f = jj(d, n); if (st(f).isDirectory()) { if (n !== "docs" && n !== ".git") crawl(f); } else if (/\.(mjs|json|html|xml)$/.test(n)) scan.push(rf(f, "utf8")); } };
  try { crawl("."); } catch {}
  const corpus = scan.join("\n");
  for (const f of flags) r.ok(corpus.includes(f.id), `flag ${f.id} is never referenced from any page or data file — it would be invisible in review`, f.id);
}

// ---- suggestions + paths + questions cross-reference
const suggIds = new Set(sugg.suggestions.map((s) => s.id));
for (const s of sugg.suggestions) {
  r.ok(s.status_values === undefined && sugg.status_values.includes(s.status), `status must be one of ${sugg.status_values.join("|")}`, s.id);
  r.ok(["S", "M", "L"].includes(s.effort), "effort must be S, M or L", s.id);
  for (const field of ["problem", "change", "why_now", "risk", "unlocks", "title", "track"]) r.ok(!!s[field], `missing ${field}`, s.id);
  for (const e of s.evidence || []) r.ok(srcIds.has(e), "evidence cites an unknown source", `${s.id} ${e}`);
}
r.ok(new Set([...suggIds]).size === sugg.suggestions.length, "duplicate suggestion ids");
for (const p of sugg.paths) {
  for (const step of p.sequence) {
    const ok = suggIds.has(step) || questions.some((q) => q.id === step);
    r.ok(ok, `path ${p.id} sequences an id that does not exist: ${step}`);
  }
  r.ok(!!p.exit_criteria && !!p.what_you_get_measured && !!p.risk, "a path needs exit criteria, a measurement note and a risk", p.id);
}
for (const q of questions) {
  r.ok(!!cfg && Object.keys(load("data/questions.json").answer_format_key).includes(q.answer_format), "answer_format must be a key of answer_format_key", q.id);
  for (const f of ["question", "why_it_matters", "what_we_have", "missing", "where_to_get_it", "who", "default_if_unanswered"]) r.ok(!!q[f], `missing ${f}`, q.id);
  for (const b of q.blocks || []) {
    const known = suggIds.has(b) || flagIds.has(b) || questions.some((o) => o.id === b) || /^T-\d\d$/.test(b) || /^PATH-[A-Z]$/.test(b) || /^FLG-\d\d\d$/.test(b);
    r.ok(known, `blocks references an unknown id: ${b}`, q.id);
  }
}

// ---- ledger: a row without authorized provenance is refused
const colKeys = ledger.columns.map((c) => c.key);
for (const row of ledger.rows) {
  r.ok(!!row.provenance, "ledger row has no provenance and is rejected", row.date);
  r.ok(ledger.policy.allowed_sources.some((a) => (row.source || "").toLowerCase().includes(a.split(">")[0].toLowerCase().trim())), "ledger row source is not on the allowed list", `${row.date} ${row.source}`);
  for (const k of colKeys) r.ok(k in row, `ledger row is missing the ${k} column`, row.date);
  for (const k of ["eligible_sessions", "clicks", "items_added", "orders", "units"]) {
    if (row[k] !== null && row[k] !== undefined) r.ok(Number.isInteger(row[k]), `${k} must be an integer or null`, row.date);
  }
}
r.ok(new Set(colKeys).size === colKeys.length, "ledger columns must be unique");

// ---- events: exactly the five defined in config, no silent extras
const defined = new Set(cfg.measurement.events);
const spec = new Set(events.events.map((e) => e.name));
r.ok(defined.size === 5, "config must define exactly five events", String(defined.size));
r.ok([...spec].every((n) => defined.has(n)) && [...defined].every((n) => spec.has(n)), "data/events.json and config.measurement.events must name the same five events");
for (const e of events.events) {
  r.ok(!!e.fires && !!e.informs, "event needs a trigger and what it informs", e.name);
  for (const k of Object.keys(e.properties)) r.ok(["p", "l", "slot", "reason", "t", "ref"].includes(k), `event property "${k}" is outside the allowed field set`, e.name);
}

// ---- taxonomy integrity
const catSlugs = new Set(categories.map((c) => c.slug));
const seasonKeys = new Set(Object.keys(seasons));
for (const c of categories) r.ok(Array.isArray(c.compare_on) && c.compare_on.length >= 4, "a section needs a compare-on list", c.slug);
const guideDir = "site/content/guides";
const { readdirSync } = await import("node:fs");
for (const f of readdirSync(guideDir)) {
  if (!f.endsWith(".mjs")) continue;
  const m = (await import("../" + guideDir + "/" + f)).meta;
  r.ok(catSlugs.has(m.section), `guide ${m.slug} filed under an unknown section ${m.section}`, m.slug);
  for (const s of m.seasons || []) r.ok(seasonKeys.has(s), `guide ${m.slug} tagged with unknown season ${s}`, m.slug);
  for (const s of m.sourceIds || []) r.ok(srcIds.has(s), `guide ${m.slug} cites unknown source ${s}`, m.slug);
  r.ok(m.faq.length >= 3, "a guide needs at least three short answers", m.slug);
  r.ok(!!m.hypotheses, "a guide must state why it exists (hypotheses note)", m.slug);
}
r.ok(sources.sources.length >= 12, "the register looks too thin to carry this site's claims", String(sources.sources.length));

process.exit(r.print() ? 0 : 1);
